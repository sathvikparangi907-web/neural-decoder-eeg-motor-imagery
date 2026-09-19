"""Step 8 - test-time adaptation, protocol v2, three seeds.

NO LABELS OF THE SUBJECT BEING ADAPTED TO ARE USED AT ANY POINT. Every variant
adapts a trained model using only that subject's unlabelled EEG trials - the
data a new user can supply before anyone has labelled anything. Labels are used
afterwards only to score the predictions: the validation subject's labels to
decide which variant to keep, the test subject's to report the result.

Each fold trains ONE model (protocol v2: early stopping on a held-out 10% of the
training subjects), then every variant starts from a fresh copy of those weights
and is applied separately to the validation subject and to the test subject:

  none   the trained model as it is
  bn     batch-norm running statistics recomputed on the subject's trials
  tent   Wang et al., ICLR 2021: batch-norm statistics from the subject, and the
         batch-norm affine parameters updated to minimise prediction entropy
  pl80   pseudo-label self-training: fine-tune on the subject's own trials whose
  pl90   predicted class probability is at least 0.8 / 0.9, using those predictions
         as targets

Settings are fixed before running and not tuned: TENT one shuffled pass, Adam
lr 1e-3; pseudo-labelling 10 epochs, Adam lr 1e-4, needs at least 16 confident
trials or it falls back to the unadapted prediction.

    py phase3/tta.py c2 --seed 0
    py phase3/tta.py eegnet --seed 1
"""
import copy
import csv
import sys
import time
from pathlib import Path

import numpy as np
import torch
from torch import nn
from sklearn.metrics import cohen_kappa_score

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preprocess import loso_folds  # noqa: E402
from protocol import OUT, RUNS, commit, train_fold  # noqa: E402
from train import BATCH, DEVICE, SMOOTHING  # noqa: E402

MODELS = {"c2": RUNS["step0"], "eegnet": RUNS["step1_eegnet"]}
VARIANTS = ("none", "bn", "tent", "pl80", "pl90")
TENT_LR, TENT_PASSES = 1e-3, 1
PL_EPOCHS, PL_LR, PL_MIN = 10, 1e-4, 16


def batchnorms(model):
    return [m for m in model.modules() if isinstance(m, nn.modules.batchnorm._BatchNorm)]


def bn_train_only(model):
    """Dropout off, batch norm using the incoming batch's statistics."""
    model.eval()
    for m in batchnorms(model):
        m.train()


def reset_bn(model):
    """Forget the source statistics; accumulate a plain average over new data."""
    for m in batchnorms(model):
        m.reset_running_stats()
        m.momentum = None


def batches(n, shuffle=False, seed=0):
    idx = torch.randperm(n, generator=torch.Generator().manual_seed(seed)) if shuffle \
        else torch.arange(n)
    return [b.to(DEVICE) for b in idx.split(BATCH)]


@torch.no_grad()
def probabilities(model, X):
    model.eval()
    return torch.cat([torch.softmax(model(X[b]), 1) for b in batches(len(X))])


@torch.no_grad()
def adapt_bn(model, X):
    reset_bn(model)
    bn_train_only(model)
    for b in batches(len(X)):
        model(X[b])
    model.eval()


def adapt_tent(model, X, seed):
    reset_bn(model)
    for p in model.parameters():
        p.requires_grad_(False)
    params = []
    for m in batchnorms(model):
        for p in (m.weight, m.bias):
            if p is not None:
                p.requires_grad_(True)
                params.append(p)
    opt = torch.optim.Adam(params, lr=TENT_LR)
    bn_train_only(model)
    for _ in range(TENT_PASSES):
        for b in batches(len(X), shuffle=True, seed=seed):
            if len(b) < 2:
                continue
            p = torch.softmax(model(X[b]), 1)
            loss = -(p * torch.log(p + 1e-8)).sum(1).mean()
            opt.zero_grad(set_to_none=True)
            loss.backward()
            opt.step()
    model.eval()


def adapt_pseudo(model, X, threshold, seed):
    conf, target = probabilities(model, X).max(1)
    keep = torch.nonzero(conf >= threshold).flatten()
    if len(keep) < PL_MIN:
        return 0
    Xk, yk = X[keep], target[keep]
    opt = torch.optim.Adam(model.parameters(), lr=PL_LR)
    loss_fn = nn.CrossEntropyLoss(label_smoothing=SMOOTHING)
    model.train()
    for epoch in range(PL_EPOCHS):
        for b in batches(len(Xk), shuffle=True, seed=seed + epoch):
            if len(b) < 2:
                continue
            opt.zero_grad(set_to_none=True)
            loss_fn(model(Xk[b]), yk[b]).backward()
            opt.step()
    model.eval()
    return len(keep)


def adapted_predictions(trained, variant, X, seed):
    """Predictions for one subject after one variant. Uses X only - no labels."""
    model = copy.deepcopy(trained)
    kept = ""
    if variant == "bn":
        adapt_bn(model, X)
    elif variant == "tent":
        adapt_tent(model, X, seed)
    elif variant in ("pl80", "pl90"):
        kept = adapt_pseudo(model, X, 0.8 if variant == "pl80" else 0.9, seed)
    return probabilities(model, X).argmax(1).cpu().numpy(), kept


def run(name, seed):
    spec = MODELS[name]
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"step8_{name}_seed{seed}.csv"
    done = set()
    if path.exists():
        done = {int(r["test_subject"]) for r in csv.DictReader(path.open(encoding="utf-8"))
                if r["variant"] == VARIANTS[-1]}
    fields = ["model", "variant", "commit", "seed", "test_subject", "val_subject",
              "val_acc", "val_kappa", "test_acc", "test_kappa", "pl_kept_val",
              "pl_kept_test", "best_epoch", "train_seconds", "adapt_seconds"]
    new_file = not path.exists()
    print(f"step 8 {name} seed {seed}: no labels of the adapted subject are used", flush=True)
    with path.open("a", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        if new_file:
            w.writeheader()
        for fold in loso_folds():
            if fold[2] in done:
                continue
            t0 = time.time()
            t = train_fold(fold, spec, seed)
            train_s = time.time() - t0
            for v in VARIANTS:
                t1 = time.time()
                pv, kv = adapted_predictions(t["model"], v, t["Xva"], seed)
                pt, kt = adapted_predictions(t["model"], v, t["Xte"], seed)
                w.writerow({"model": name, "variant": v, "commit": commit(), "seed": seed,
                            "test_subject": fold[2], "val_subject": fold[1],
                            "val_acc": round(float((pv == t["yva"]).mean()), 4),
                            "val_kappa": round(float(cohen_kappa_score(t["yva"], pv)), 4),
                            "test_acc": round(float((pt == t["yte"]).mean()), 4),
                            "test_kappa": round(float(cohen_kappa_score(t["yte"], pt)), 4),
                            "pl_kept_val": kv, "pl_kept_test": kt,
                            "best_epoch": t["best_epoch"], "train_seconds": round(train_s, 1),
                            "adapt_seconds": round(time.time() - t1, 1)})
            fh.flush()
            print(f"  A{fold[2]:02d} done  ({time.time() - t0:.0f}s)", flush=True)


if __name__ == "__main__":
    args = sys.argv[1:]
    seed = int(args[args.index("--seed") + 1]) if "--seed" in args else 0
    for name in [a for a in args if a in MODELS] or ["c2"]:
        run(name, seed)
