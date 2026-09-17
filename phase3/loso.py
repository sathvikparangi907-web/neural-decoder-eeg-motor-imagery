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


def fold_data(fold, align=True, cache={}):
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
        # Cache the ALIGNED arrays, not the raw ones. Aligning per fold allocated a
        # fresh 400 MB every time on top of the 400 MB cache and the 400 MB
        # concatenation, which is what ran this machine out of memory when two
        # experiments overlapped. Alignment is per subject, so the result is
        # identical across folds and there is no reason to recompute it.
        if (s, align) not in cache:
            Xs, ys, sess, rejected = load_subject(s)
            cache[(s, align)] = (align_subject(Xs, sess) if align else Xs,
                                 ys, sess, rejected)
        Xs, ys, sess, rejected = cache[(s, align)]
        # Alignment is unsupervised, so the held-out subjects take part in their
        # own alignment and contribute nothing else.
        X.append(Xs)
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
            # Per-trial predictions, not just the confusion matrix. A majority vote
            # across models needs to know which trial each model got wrong, and a
            # confusion matrix has already thrown that away.
            "predictions": "".join(str(int(v)) for v in y_pred),
            "confusion": confusion_matrix(y_true, y_pred, labels=[0, 1, 2, 3]).tolist()}


def predict_fbcsp(X, y, train_idx, val_idx, test_idx):
    """The classical baseline has no epochs to stop early on, so it ignores val."""
    return FBCSP().fit(X[train_idx], y[train_idx]).predict(X[test_idx])


def done_already(out):
    """(model, test subject, seed) triples already in the results file.

    A fold takes minutes and a full model takes an hour, so a run that is
    interrupted -- this machine kills background jobs when memory runs short --
    must not start from the beginning. Re-running the same command resumes.
    """
    path = RESULTS / out
    if not path.exists():
        return set()
    import csv
    with open(path, encoding="utf-8") as fh:
        return {(r["model"], int(r["test_subject"]), int(r["seed"]))
                for r in csv.DictReader(fh)}


def run(names=("FBCSP", *MODELS), seeds=SEEDS, align=True, out="e2_loso.csv"):
    folds = loso_folds()
    rows = []
    finished = done_already(out)
    print(f"E2 leave-one-subject-out: {len(names)} model(s) x {len(folds)} folds x {seeds} seed(s)")
    print(f"Euclidean alignment {'on' if align else 'OFF'}. "
          f"Artefact rejection applied to training subjects only.")
    if finished:
        pending = sum((n, f[2], s) not in finished
                      for n in names for f in folds for s in range(seeds))
        print(f"Resuming: {len(finished)} run(s) already recorded, {pending} to go.")
    print()

    for name in names:
        accs = []
        for train_subjects, val_subject, test_subject in folds:
            if all((name, test_subject, s) in finished for s in range(seeds)):
                continue                             # already recorded, see done_already()
            X, y, session, tr, va, te = fold_data(
                (train_subjects, val_subject, test_subject), align=align)
            for seed in range(seeds):
                t0 = time.time()
                if (name, test_subject, seed) in finished:
                    continue
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
                # Written per fold, not at the end. done_already() can only resume
                # from what is on disk, and a run killed at fold 8 of 9 previously
                # lost all eight -- which is exactly what happened to V0.
                write(rows, out, quiet=True)
        if accs:
            print(f"  {name:14s} mean {np.mean(accs):6.1%} +/- {np.std(accs):.1%} over "
                  f"{len(accs)} new run(s)\n")
        else:
            print(f"  {name:14s} nothing to do, all folds already recorded\n")

    if rows:
        write(rows, out)
    return rows


def write(rows, name="e2_loso.csv", quiet=False):
    """Merge this run's rows into the results file, keeping other models' rows.

    Runs happen one model at a time, over hours. Truncating the file would throw
    away every model measured before this one, so rows for the models in this run
    are replaced and everything else is carried through.
    """
    RESULTS.mkdir(exist_ok=True)
    path = RESULTS / name
    keys = [k for k in rows[0] if k != "confusion"]

    kept = []
    if path.exists():
        import csv
        with open(path, encoding="utf-8") as fh:
            # Keyed on the individual run, not the model: a resumed run only
            # carries the folds it actually redid, so replacing every row for
            # that model would delete the folds completed before the interruption.
            replacing = {(r["model"], r["test_subject"], r["seed"]) for r in rows}
            kept = [r for r in csv.DictReader(fh)
                    if (r["model"], int(r["test_subject"]), int(r["seed"])) not in replacing]

    with open(path, "w", encoding="utf-8") as fh:
        fh.write(",".join(keys) + ",confusion\n")
        for r in kept + rows:
            fh.write(",".join(str(r[k]) for k in keys) +
                     ',"' + str(r["confusion"]) + '"\n')
    if not quiet:
        print(f"wrote {len(rows)} rows to {path}"
              + (f", keeping {len(kept)} from earlier runs" if kept else ""))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    seeds = SEEDS
    if "--seeds" in sys.argv:
        seeds = int(sys.argv[sys.argv.index("--seeds") + 1])
        args = [a for a in args if a != str(seeds)]
    align = "--no-align" not in sys.argv
    run(tuple(args) or ("FBCSP", *MODELS), seeds, align,
        "e2_loso.csv" if align else "e2_loso_noalign.csv")
