"""Protocol v2 - early stopping and model selection on separate data.

Step 0 of the final-year brief. Under protocol v1 the validation subject did two
jobs: it picked the early-stopping epoch AND it judged which configuration to
keep. A model stopped on a subject is already fitted to that subject, so an
un-adapted model looked artificially good there.

Protocol v2 separates the jobs:

  early stopping   a stratified 10% of the TRAINING subjects' trials, stratified
                   by subject and class, held out from gradient updates
  selection        the validation subject, now never used in training or stopping

Step 1 adds the diagnostic runs, all under v2: alignment off, a fixed epoch
budget instead of early stopping, and eight training subjects with no
validation subject. Every run is one entry in RUNS and writes its own CSV in
results/v2/, so v1 results stay untouched.

    py phase3/protocol.py step0
    py phase3/protocol.py step1_eegnet step1_eegnet_noalign
    py phase3/protocol.py step1_eegnet_fixed7 step1_eegnet_fixed8
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
from data import load_subject  # noqa: E402
from hctnet import HCTNet  # noqa: E402
from models import build  # noqa: E402
from preprocess import align_subject, augment, loso_folds, standardise  # noqa: E402
from train import BATCH, DEVICE, LR, MAX_EPOCHS, PATIENCE, SMOOTHING, WEIGHT_DECAY  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "results" / "v2"
STOP_FRACTION = 0.10

C2 = {"flatten_head": True, "global_attention": True}

# One entry per run. mode "stop" = early stopping on the held-out training split;
# "fixed" = a fixed epoch budget on all training trials, no stopping split.
# train_on_val puts the validation subject into training (eight subjects), so
# that run has no validation score.
RUNS = {
    "step0": dict(model="HCT-Net", kwargs=C2, align=True, mode="stop"),
    # Three-seed re-measurement of Stage 2's C1 and C2 under protocol v2. C2 is
    # step0 itself; these supply the two configurations it is compared against.
    "v2_base": dict(model="HCT-Net", kwargs={}, align=True, mode="stop"),
    "v2_c1": dict(model="HCT-Net", kwargs={"flatten_head": True}, align=True, mode="stop"),
    # Step 9: batch normalisation in place of the encoder's LayerNorm, so that
    # test-time adaptation reaches the attention path as well as the convolutions.
    "step9_bnorm": dict(model="HCT-Net", kwargs={**C2, "encoder_norm": "batch"},
                        align=True, mode="stop"),
    "step1_eegnet": dict(model="EEGNet", align=True, mode="stop"),
    "step1_eegnet_noalign": dict(model="EEGNet", align=False, mode="stop"),
    "step1_eegnet_lw": dict(model="EEGNet", align="lw", mode="stop"),
    # epochs=None: filled in from step1_eegnet's mean best epoch, per 1.3.
    "step1_eegnet_fixed7": dict(model="EEGNet", align=True, mode="fixed", epochs=None),
    "step1_eegnet_fixed8": dict(model="EEGNet", align=True, mode="fixed", epochs=None,
                                train_on_val=True),
}


def commit():
    try:
        return subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT,
                              capture_output=True, text=True).stdout.strip()
    except OSError:
        return "unknown"


_cache = {}


def align_ledoit_wolf(X, session):
    """Euclidean alignment with R estimated by Ledoit-Wolf shrinkage (Step 1, item 3).

    Each session's time samples are the observations, as for the plain estimate,
    so the only difference is the shrinkage toward a scaled identity.
    """
    from sklearn.covariance import LedoitWolf
    from preprocess import inv_sqrt
    out = np.empty_like(X)
    for k in np.unique(session):
        m = session == k
        Z = X[m].astype(np.float64).transpose(1, 0, 2).reshape(X.shape[1], -1).T
        R = LedoitWolf(assume_centered=True).fit(Z).covariance_
        out[m] = (inv_sqrt(R) @ X[m].astype(np.float64)).astype(np.float32)
    return out


def subject_data(s, align):
    """One subject, aligned per session from its own trials.

    align is False, True (plain mean covariance, He and Wu 2020), or "lw"
    (Ledoit-Wolf shrinkage estimate of R).
    """
    if (s, align) not in _cache:
        X, y, session, rejected = load_subject(s)
        if align == "lw":
            X = align_ledoit_wolf(X, session)
        elif align:
            X = align_subject(X, session)
        _cache[(s, align)] = (X, y, rejected)
    return _cache[(s, align)]


def assemble(train_subjects, eval_subjects, align):
    """Stack subjects in order. Artefact rejection applies to training subjects only.

    Returns X, y, the subject of every row, and a mask of rows usable for
    training. The order - training subjects, then the evaluated ones - matches
    loso.fold_data, so Step 0's folds are row-for-row the same.
    """
    X, y, subject, keep = [], [], [], []
    for s in [*train_subjects, *eval_subjects]:
        Xs, ys, rej = subject_data(s, align)
        X.append(Xs); y.append(ys); subject.append(np.full(len(ys), s))
        keep.append(~rej if s in train_subjects else np.ones(len(ys), bool))
    return (np.concatenate(X), np.concatenate(y), np.concatenate(subject),
            np.concatenate(keep))


def split_for_stopping(tr, y, subject, seed):
    """Hold out 10% of training trials, stratified by subject and class together."""
    fit, stop = train_test_split(tr, test_size=STOP_FRACTION,
                                 stratify=subject[tr] * 4 + y[tr], random_state=seed)
    return np.sort(fit), np.sort(stop)


def make_model(spec):
    if spec["model"] == "HCT-Net":
        return HCTNet(**spec.get("kwargs", {}))
    return build(spec["model"])


@torch.no_grad()
def predict(model, X):
    model.eval()
    return torch.cat([model(X[b]).argmax(1) for b in
                      torch.arange(len(X), device=DEVICE).split(BATCH)]).cpu().numpy()


def train_fold(fold, spec, seed=0):
    """Train one model on one fold; return it with the evaluation tensors.

    Split out of run_fold so test-time adaptation (Step 8) can start several
    adaptation variants from the same trained weights.
    """
    train_subjects, val_subject, test_subject = fold
    train_on_val = spec.get("train_on_val", False)
    trainers = [*train_subjects, val_subject] if train_on_val else list(train_subjects)
    evals = [test_subject] if train_on_val else [val_subject, test_subject]
    X, y, subject, keep = assemble(trainers, evals, spec["align"])

    tr = np.flatnonzero(np.isin(subject, trainers) & keep)
    va = np.flatnonzero(subject == val_subject) if not train_on_val else None
    te = np.flatnonzero(subject == test_subject)

    fixed = spec["mode"] == "fixed"
    epochs = spec["epochs"] if fixed else MAX_EPOCHS
    if fixed:
        fit, stop = tr, None
    else:
        fit, stop = split_for_stopping(tr, y, subject, seed)

    # Statistics from the gradient-update trials only.
    parts = [X[fit]] + ([X[stop]] if stop is not None else []) + \
            ([X[va]] if va is not None else []) + [X[te]]
    parts = list(standardise(*parts))
    Xfit = parts.pop(0)
    Xstop = parts.pop(0) if stop is not None else None
    Xva = parts.pop(0) if va is not None else None
    Xte = parts.pop(0)
    Xfit, yfit = augment(Xfit, y[fit], rng=np.random.default_rng(seed))

    torch.manual_seed(seed)
    f = lambda a: torch.as_tensor(a, dtype=torch.float32, device=DEVICE)
    Xfit = f(Xfit)
    yfit = torch.as_tensor(yfit, dtype=torch.int64, device=DEVICE)
    Xte = f(Xte)
    if Xstop is not None:
        Xstop = f(Xstop)
        ystop = torch.as_tensor(y[stop], dtype=torch.int64, device=DEVICE)
    if Xva is not None:
        Xva = f(Xva)

    model = make_model(spec).to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=epochs)
    loss_fn = torch.nn.CrossEntropyLoss(label_smoothing=SMOOTHING)

    best, best_epoch, best_state, stale, epoch = -1.0, epochs, None, 0, 0
    for epoch in range(1, epochs + 1):
        model.train()
        for b in torch.randperm(len(Xfit), device=DEVICE).split(BATCH):
            if len(b) < 2:
                continue
            opt.zero_grad(set_to_none=True)
            loss_fn(model(Xfit[b]), yfit[b]).backward()
            opt.step()
        sched.step()
        if fixed:
            continue
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
    if best_state is not None:
        model.load_state_dict(best_state)
    return {"model": model, "Xva": Xva, "yva": y[va] if va is not None else None,
            "Xte": Xte, "yte": y[te], "best": best, "best_epoch": best_epoch,
            "stopped_at": epoch, "n_fit": len(fit),
            "n_stop": len(stop) if stop is not None else 0, "fixed": fixed}


def run_fold(fold, spec, seed=0):
    t = train_fold(fold, spec, seed)
    model, yte, yva = t["model"], t["yte"], t["yva"]
    pt = predict(model, t["Xte"])
    row = {"stop_set_acc": round(t["best"], 4) if not t["fixed"] else "",
           "best_epoch": t["best_epoch"], "stopped_at": t["stopped_at"],
           "n_fit": t["n_fit"], "n_stop": t["n_stop"],
           "test_acc": round(float((pt == yte).mean()), 4),
           "test_kappa": round(float(cohen_kappa_score(yte, pt)), 4),
           "val_acc": "", "val_kappa": ""}
    if t["Xva"] is not None:
        pv = predict(model, t["Xva"])
        row["val_acc"] = round(float((pv == yva).mean()), 4)
        row["val_kappa"] = round(float(cohen_kappa_score(yva, pv)), 4)
    return row


def mean_best_epoch(run_name):
    path = OUT / f"{run_name}.csv"
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    if len(rows) < 9:
        sys.exit(f"{run_name} has {len(rows)}/9 folds; its mean stopping epoch is needed first")
    return int(round(np.mean([int(r["best_epoch"]) for r in rows])))


def run(name, seed=0):
    spec = dict(RUNS[name])
    if spec["mode"] == "fixed" and spec.get("epochs") is None:
        spec["epochs"] = mean_best_epoch("step1_eegnet")
    OUT.mkdir(parents=True, exist_ok=True)
    # Seed 0 keeps the original file name; other seeds get their own file so a
    # multi-seed run never mixes with, or skips because of, another seed's folds.
    stem = name if seed == 0 else f"{name}_seed{seed}"
    path = OUT / f"{stem}.csv"
    done = set()
    if path.exists():
        done = {int(r["test_subject"]) for r in csv.DictReader(path.open(encoding="utf-8"))}
    (OUT / f"{stem}_config.json").write_text(json.dumps(
        {"run": name, "protocol": "v2", "window_samples": 875, "seed": seed, **spec,
         "stop_fraction": STOP_FRACTION, "max_epochs": MAX_EPOCHS, "patience": PATIENCE,
         "lr": LR, "weight_decay": WEIGHT_DECAY, "batch": BATCH}, indent=2),
        encoding="utf-8")

    fields = ["run", "commit", "seed", "test_subject", "val_subject", "val_acc", "val_kappa",
              "test_acc", "test_kappa", "stop_set_acc", "best_epoch", "stopped_at",
              "n_fit", "n_stop", "seconds"]
    new_file = not path.exists()
    print(f"{name}: {spec}", flush=True)
    with path.open("a", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        if new_file:
            w.writeheader()
        for fold in loso_folds():
            if fold[2] in done:
                continue
            t0 = time.time()
            r = run_fold(fold, spec, seed)
            row = {"run": name, "commit": commit(), "seed": seed, "test_subject": fold[2],
                   "val_subject": "" if spec.get("train_on_val") else fold[1], **r,
                   "seconds": round(time.time() - t0, 1)}
            w.writerow(row)
            fh.flush()
            print(f"  A{fold[2]:02d}  test {r['test_acc']:.1%}  best epoch {r['best_epoch']}"
                  f"  stopped at {r['stopped_at']}  {row['seconds']:.0f}s", flush=True)


if __name__ == "__main__":
    args = sys.argv[1:]
    seed = 0
    if "--seed" in args:
        i = args.index("--seed")
        seed = int(args[i + 1])
        args = args[:i] + args[i + 2:]
    for name in args or ["step0"]:
        run(name, seed)
