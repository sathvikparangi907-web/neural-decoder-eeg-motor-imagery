"""Leave-one-subject-out evaluation - section 12.7 of the solution design.

Experiment E2: every baseline under one identical cross-subject protocol. This is
the comparison the published literature does not provide, since those papers each
evaluated under different settings.

Nine folds. In each, one subject is the test subject, the next in order is the
validation subject, and the remaining seven are training subjects. Seeds are reset
and a fresh model is built per fold, because carrying weights across folds would
mean the model had already seen the subject it is about to be tested on.

    py phase3/loso.py                     # every model, 3 seeds
    py phase3/loso.py EEGNet FBCSP        # named models
    py phase3/loso.py EEGNet --seeds 1    # quicker pass

Results are written to results/e2_loso.csv, one row per fold per seed.
"""
import sys
import time
from pathlib import Path

import numpy as np
from sklearn.metrics import cohen_kappa_score, confusion_matrix, precision_recall_fscore_support

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import load_subject  # noqa: E402
from fbcsp import FBCSP  # noqa: E402
from models import MODELS  # noqa: E402
from preprocess import align_subject, loso_folds  # noqa: E402
from train import train  # noqa: E402

RESULTS = Path(__file__).resolve().parent.parent / "results"
SEEDS = 3


def fold_data(fold, cache={}):
    """Assemble one LOSO fold into arrays plus the index sets train() expects.

    Artefact-rejected trials are dropped from the TRAINING subjects only. The
    validation and test subjects keep every trial, for two reasons: a deployed
    decoder does not get to discard the new user's bad trials, and the rejection
    rate varies from 0% to 25% across subjects, so rejecting on the test side
    would score the nine folds on test sets of different composition. A09 is the
    case that forces the issue - half its tongue trials fail the threshold, so
    rejecting there would mean scoring one fold on a test set missing half a
    class. See FINDINGS.md, finding 1.
    """
    train_subjects, val_subject, test_subject = fold
    X, y, session, keep, subject = [], [], [], [], []
    for s in [*train_subjects, val_subject, test_subject]:
        if s not in cache:
            cache[s] = load_subject(s)
        Xs, ys, sess, rejected = cache[s]
        # Alignment is per subject and per session, and is unsupervised, so the
        # held-out subjects take part in their own alignment and nothing else.
        X.append(align_subject(Xs, sess))
        y.append(ys)
        session.append(sess)
        keep.append(~rejected if s in train_subjects else np.ones(len(ys), bool))
        subject.append(np.full(len(ys), s))

    X, y = np.concatenate(X), np.concatenate(y)
    session, keep, subject = (np.concatenate(a) for a in (session, keep, subject))

    idx = np.arange(len(y))
    return (X, y, session,
            idx[np.isin(subject, train_subjects) & keep],
            idx[(subject == val_subject)],
            idx[(subject == test_subject)])


def metrics(y_true, y_pred):
    p, r, f1, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    return {"accuracy": float((y_true == y_pred).mean()),
            "kappa": cohen_kappa_score(y_true, y_pred),
            "precision": p, "recall": r, "f1": f1,
            "confusion": confusion_matrix(y_true, y_pred, labels=[0, 1, 2, 3]).tolist()}


def predict_fbcsp(X, y, train_idx, val_idx, test_idx):
    """The classical baseline has no epochs to stop early on, so it ignores val."""
    return FBCSP().fit(X[train_idx], y[train_idx]).predict(X[test_idx])


def run(names=("FBCSP", *MODELS), seeds=SEEDS):
    folds = loso_folds()
    rows = []
    print(f"E2 leave-one-subject-out: {len(names)} model(s) x {len(folds)} folds x {seeds} seed(s)")
    print("Alignment on. Artefact rejection applied to training subjects only.\n")

    for name in names:
        accs = []
        for train_subjects, val_subject, test_subject in folds:
            X, y, session, tr, va, te = fold_data((train_subjects, val_subject, test_subject))
            for seed in range(seeds):
                t0 = time.time()
                if name == "FBCSP":
                    if seed:
                        continue                     # deterministic, one seed is the answer
                    pred = predict_fbcsp(X, y, tr, va, te)
                    acc = float((pred == y[te]).mean())
                    m = metrics(y[te], pred)
                else:
                    acc, _, pred = train(name, X, y, session, tr, va, te,
                                         align=False, seed=seed, return_pred=True)
                    m = metrics(y[te], pred)
                accs.append(m["accuracy"])
                rows.append({"model": name, "test_subject": test_subject, "seed": seed,
                             "seconds": round(time.time() - t0, 1), **m})
                print(f"  {name:14s} fold A{test_subject:02d}  seed {seed}  "
                      f"acc {m['accuracy']:6.1%}  kappa {m['kappa']:+.3f}  "
                      f"({time.time() - t0:.0f}s)")
        print(f"  {name:14s} mean {np.mean(accs):6.1%} +/- {np.std(accs):.1%} over "
              f"{len(accs)} run(s)\n")

    write(rows)
    return rows


def write(rows):
    RESULTS.mkdir(exist_ok=True)
    path = RESULTS / "e2_loso.csv"
    keys = [k for k in rows[0] if k != "confusion"]
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(",".join(keys) + ",confusion\n")
        for r in rows:
            fh.write(",".join(str(r[k]) for k in keys) +
                     ',"' + str(r["confusion"]) + '"\n')
    print(f"wrote {len(rows)} rows to {path}")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    seeds = SEEDS
    if "--seeds" in sys.argv:
        seeds = int(sys.argv[sys.argv.index("--seeds") + 1])
        args = [a for a in args if a != str(seeds)]
    run(tuple(args) or ("FBCSP", *MODELS), seeds)
