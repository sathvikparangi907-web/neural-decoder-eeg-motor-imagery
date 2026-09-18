"""Protocol v2 - early stopping and model selection on separate data.

Step 0 of the final-year brief. Under protocol v1 the validation subject did two
jobs: it picked the early-stopping epoch AND it judged which configuration to
keep. A model stopped on a subject is already fitted to that subject, so an
un-adapted model looked artificially good there. That is the likely reason
test-time adaptation read -0.4 on validation and +4.1 on test.

Protocol v2 separates the jobs:

  early stopping   a stratified 10% of the TRAINING subjects' trials, stratified
                   by subject and class, held out from gradient updates
  selection        the validation subject, which is now never used in training
                   or stopping

Results go to results/v2/, so the v1 results stay untouched for comparison.

    py phase3/protocol.py step0      # re-run C2 under protocol v2
"""
import csv
import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import cohen_kappa_score
from sklearn.model_selection import train_test_split

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hctnet import HCTNet  # noqa: E402
from loso import fold_data  # noqa: E402
from preprocess import augment, loso_folds, standardise  # noqa: E402
from train import BATCH, DEVICE, LR, MAX_EPOCHS, PATIENCE, SMOOTHING, WEIGHT_DECAY  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "results" / "v2"
STOP_FRACTION = 0.10
TRIALS_PER_SUBJECT = 576

CONFIGS = {
    # The best single-seed configuration from Stage 2: C1 + C2.
    "step0": {"model": {"flatten_head": True, "global_attention": True}, "seed": 0},
}


def commit():
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT,
                              capture_output=True, text=True).stdout.strip()
    except OSError:
        return "unknown"


def subjects_of(fold):
    """Subject id for every row fold_data returns, in the order it stacks them."""
    train_subjects, val_subject, test_subject = fold
    return np.concatenate([np.full(TRIALS_PER_SUBJECT, s)
                           for s in [*train_subjects, val_subject, test_subject]])


def split_for_stopping(tr, y, subject, seed):
    """Hold out 10% of the training trials for early stopping only.

    Stratified by subject and class together, so every training subject and
    every class is represented in the stopping set in proportion.
    """
    strata = subject[tr] * 4 + y[tr]
    fit, stop = train_test_split(tr, test_size=STOP_FRACTION, stratify=strata,
                                 random_state=seed)
    return np.sort(fit), np.sort(stop)


def run_fold(fold, model_kwargs, seed):
    X, y, _, tr, va, te = fold_data(fold)
    subject = subjects_of(fold)
    fit, stop = split_for_stopping(tr, y, subject, seed)

    # Statistics from the gradient-update trials only; the stopping split, the
    # validation subject and the test subject are all transformed with them.
    Xfit, Xstop, Xva, Xte = standardise(X[fit], X[stop], X[va], X[te])
    Xfit, yfit = augment(Xfit, y[fit], rng=np.random.default_rng(seed))

    torch.manual_seed(seed)
    f = lambda a: torch.as_tensor(a, dtype=torch.float32, device=DEVICE)
    Xfit, Xstop, Xva, Xte = f(Xfit), f(Xstop), f(Xva), f(Xte)
    yfit = torch.as_tensor(yfit, dtype=torch.int64, device=DEVICE)
    ystop = torch.as_tensor(y[stop], dtype=torch.int64, device=DEVICE)

    model = HCTNet(**model_kwargs).to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=MAX_EPOCHS)
    loss_fn = torch.nn.CrossEntropyLoss(label_smoothing=SMOOTHING)

    best, best_epoch, best_state, stale, epoch = -1.0, 0, None, 0, 0
    for epoch in range(1, MAX_EPOCHS + 1):
        model.train()
        for b in torch.randperm(len(Xfit), device=DEVICE).split(BATCH):
            if len(b) < 2:
                continue
            opt.zero_grad(set_to_none=True)
            loss_fn(model(Xfit[b]), yfit[b]).backward()
            opt.step()
        sched.step()

        model.eval()
        with torch.no_grad():
            acc = (model(Xstop).argmax(1) == ystop).float().mean().item()
        if acc > best:
            best, best_epoch, stale = acc, epoch, 0
            best_state = {k: v.detach().clone() for k, v in model.state_dict().items()}
        else:
            stale += 1
            if stale >= PATIENCE:
                break

    model.load_state_dict(best_state)
    model.eval()
    with torch.no_grad():
        pv = torch.cat([model(Xva[b]).argmax(1) for b in
                        torch.arange(len(Xva), device=DEVICE).split(BATCH)]).cpu().numpy()
        pt = torch.cat([model(Xte[b]).argmax(1) for b in
                        torch.arange(len(Xte), device=DEVICE).split(BATCH)]).cpu().numpy()
    return {"stop_set_acc": round(best, 4), "best_epoch": best_epoch, "stopped_at": epoch,
            "n_fit": len(fit), "n_stop": len(stop),
            "val_acc": round(float((pv == y[va]).mean()), 4),
            "val_kappa": round(float(cohen_kappa_score(y[va], pv)), 4),
            "test_acc": round(float((pt == y[te]).mean()), 4),
            "test_kappa": round(float(cohen_kappa_score(y[te], pt)), 4)}


def run(step):
    cfg = CONFIGS[step]
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{step}.csv"
    done = set()
    if path.exists():
        done = {int(r["test_subject"]) for r in csv.DictReader(path.open(encoding="utf-8"))}
    (OUT / f"{step}_config.json").write_text(json.dumps(
        {"step": step, "protocol": "v2", "window_samples": 875, **cfg,
         "stop_fraction": STOP_FRACTION, "max_epochs": MAX_EPOCHS, "patience": PATIENCE,
         "lr": LR, "weight_decay": WEIGHT_DECAY, "batch": BATCH}, indent=2), encoding="utf-8")

    fields = ["step", "commit", "seed", "test_subject", "val_subject", "val_acc", "val_kappa",
              "test_acc", "test_kappa", "stop_set_acc", "best_epoch", "stopped_at",
              "n_fit", "n_stop", "seconds"]
    new_file = not path.exists()
    with path.open("a", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields)
        if new_file:
            w.writeheader()
        for fold in loso_folds():
            if fold[2] in done:
                continue
            t0 = time.time()
            r = run_fold(fold, cfg["model"], cfg["seed"])
            row = {"step": step, "commit": commit(), "seed": cfg["seed"],
                   "test_subject": fold[2], "val_subject": fold[1], **r,
                   "seconds": round(time.time() - t0, 1)}
            w.writerow(row)
            fh.flush()
            print(f"  A{fold[2]:02d}  val A{fold[1]:02d} {r['val_acc']:6.1%}  "
                  f"stopped at epoch {r['stopped_at']:>3} (best {r['best_epoch']:>3})  "
                  f"{row['seconds']:.0f}s", flush=True)


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "step0")
