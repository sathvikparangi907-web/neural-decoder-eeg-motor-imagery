"""Stage 2 - improving HCT-Net one change at a time.

Each change is applied on top of the previous one and evaluated over all nine
LOSO folds. Both the validation-subject accuracy and the test-subject accuracy
are recorded, but **only validation decides whether a change is kept**. Every
fold already holds out a separate validation subject, so there is a clean signal
available that does not touch the test fold; choosing by test accuracy would make
the final number a selection artefact rather than an estimate.

    py phase3/improve.py            # every step in order, resumes if interrupted
    py phase3/improve.py C1 C2      # named steps only

Results go to results/e9_improve.csv, one row per step per fold.
"""
import sys
import time
from pathlib import Path

import numpy as np
import torch

sys.path.insert(0, str(Path(__file__).resolve().parent))
from hctnet import HCTNet  # noqa: E402
from loso import done_already, fold_data, metrics, write  # noqa: E402
from preprocess import augment, loso_folds, standardise  # noqa: E402
from train import (BATCH, DEVICE, LR, MAX_EPOCHS, PATIENCE, SMOOTHING,  # noqa: E402
                   WEIGHT_DECAY)

OUT = "e9_improve.csv"

# Each step is the previous configuration plus one change, so a gain is
# attributable to the change on its row. C6 is applied last and kept only if
# validation says it helps, since it roughly triples the attention parameters.
STEPS = [
    ("base", "the model as submitted", {}, {}),
    ("C1", "flatten head instead of average pooling",
     {"flatten_head": True}, {}),
    ("C2", "global attention instead of windowed",
     {"flatten_head": True, "global_attention": True}, {}),
    ("C3", "test-time batch-norm adaptation on the unlabelled test subject",
     {"flatten_head": True, "global_attention": True}, {"bn_adapt": True}),
    ("C4a", "dropout 0.25 -> 0.40",
     {"flatten_head": True, "global_attention": True, "dropout": 0.40}, {"bn_adapt": True}),
    ("C4b", "dropout 0.40 -> 0.50",
     {"flatten_head": True, "global_attention": True, "dropout": 0.50}, {"bn_adapt": True}),
    ("C5", "average the softmax over three seeds",
     {"flatten_head": True, "global_attention": True}, {"bn_adapt": True, "seeds": 3}),
    ("C6", "six encoder layers instead of two",
     {"flatten_head": True, "global_attention": True, "layers": 6},
     {"bn_adapt": True, "seeds": 3}),
]


@torch.no_grad()
def adapt_batchnorm(model, X, batch=BATCH, passes=2):
    """Recompute batch-norm running statistics on the test subject's own trials.

    Labels are never touched and no weight is updated - only the running mean and
    variance that batch norm already keeps. This is the same argument section 9.2
    makes for Euclidean alignment: a new user can supply unlabelled recordings
    before anyone has labelled anything, so using them is not leakage.
    """
    model.train()
    for _ in range(passes):
        for b in torch.arange(len(X), device=X.device).split(batch):
            if len(b) > 1:
                model(X[b])
    model.eval()


def train_one(model_kwargs, X, y, tr, va, te, seed, bn_adapt):
    """One model on one fold. Returns validation accuracy and test softmax."""
    torch.manual_seed(seed)
    Xtr, Xva, Xte = standardise(X[tr], X[va], X[te])
    Xtr, ytr = augment(Xtr, y[tr], rng=np.random.default_rng(seed))

    f = lambda a: torch.as_tensor(a, dtype=torch.float32, device=DEVICE)
    i = lambda a: torch.as_tensor(a, dtype=torch.int64, device=DEVICE)
    Xtr, ytr, Xva, Xte = f(Xtr), i(ytr), f(Xva), f(Xte)
    yva = i(y[va])

    model = HCTNet(**model_kwargs).to(DEVICE)
    opt = torch.optim.Adam(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=MAX_EPOCHS)
    loss_fn = torch.nn.CrossEntropyLoss(label_smoothing=SMOOTHING)

    best, best_state, stale = -1.0, None, 0
    for _ in range(MAX_EPOCHS):
        model.train()
        for b in torch.randperm(len(Xtr), device=DEVICE).split(BATCH):
            if len(b) < 2:
                continue
            opt.zero_grad(set_to_none=True)
            loss_fn(model(Xtr[b]), ytr[b]).backward()
            opt.step()
        sched.step()

        model.eval()
        with torch.no_grad():
            acc = (model(Xva).argmax(1) == yva).float().mean().item()
        if acc > best:
            best, stale, best_state = acc, 0, {k: v.detach().clone()
                                               for k, v in model.state_dict().items()}
        else:
            stale += 1
            if stale >= PATIENCE:
                break

    model.load_state_dict(best_state)
    model.eval()
    if bn_adapt:
        adapt_batchnorm(model, Xte)
    with torch.no_grad():
        probs = torch.cat([torch.softmax(model(Xte[b]), dim=1)
                           for b in torch.arange(len(Xte), device=DEVICE).split(BATCH)])
    return best, probs.cpu().numpy()


def run(names=None):
    steps = [s for s in STEPS if names is None or s[0] in names]
    folds = loso_folds()
    finished = done_already(OUT)
    print("Stage 2 - one change at a time. Validation decides; test is recorded but")
    print("not consulted until the end.\n")

    for step, description, model_kwargs, opts in steps:
        seeds = opts.get("seeds", 1)
        bn_adapt = opts.get("bn_adapt", False)
        vals, tests, rows = [], [], []
        for train_subjects, val_subject, test_subject in folds:
            if (step, test_subject, 0) in finished:
                continue
            X, y, session, tr, va, te = fold_data(
                (train_subjects, val_subject, test_subject))
            t0 = time.time()

            # C5 averages the softmax across seeds, which is not the same as
            # averaging their accuracies: a trial two seeds get right and one gets
            # wrong is recovered here and lost by the other arrangement.
            val, probs = 0.0, 0.0
            for seed in range(seeds):
                v, p = train_one(model_kwargs, X, y, tr, va, te, seed, bn_adapt)
                val, probs = val + v / seeds, probs + p / seeds
            pred = probs.argmax(1)

            m = metrics(y[te], pred)
            vals.append(val)
            tests.append(m["accuracy"])
            rows.append({"model": step, "test_subject": test_subject, "seed": 0,
                         "seconds": round(time.time() - t0, 1), **m,
                         "validation": round(val, 4)})
            print(f"  {step:<5} A{test_subject:02d}  validation {val:6.1%}"
                  f"   ({time.time() - t0:.0f}s)", flush=True)
            write(rows, OUT, quiet=True)
        if vals:
            print(f"  {step:<5} {description}")
            print(f"        validation mean {np.mean(vals):.1%}"
                  f"   over {len(vals)} fold(s)\n")
    print("Done. Compare steps on VALIDATION with:  py phase3/improve.py --table")


def table():
    """Validation first, because that is what the decisions were made on."""
    import csv
    path = Path(__file__).resolve().parent.parent / "results" / OUT
    if not path.exists():
        sys.exit("nothing run yet")
    rows = list(csv.DictReader(path.open(encoding="utf-8")))
    by = {}
    for r in rows:
        by.setdefault(r["model"], []).append(
            (float(r.get("validation", "nan") or "nan"), float(r["accuracy"])))
    described = {s[0]: s[1] for s in STEPS}

    print(f"{'step':<6}{'change':<52}{'validation':>12}{'test':>9}")
    print("-" * 79)
    prev = None
    for step, _, _, _ in STEPS:
        if step not in by:
            continue
        v = float(np.nanmean([x[0] for x in by[step]]))
        t = float(np.mean([x[1] for x in by[step]]))
        gain = "" if prev is None else f"  ({v - prev:+.1%} val)"
        print(f"{step:<6}{described[step]:<52}{v:>12.1%}{t:>9.1%}{gain}")
        prev = v


if __name__ == "__main__":
    if "--table" in sys.argv:
        table()
    else:
        run([a for a in sys.argv[1:] if not a.startswith("--")] or None)
