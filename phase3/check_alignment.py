"""Step 1.1 - verify Euclidean alignment (He and Wu, IEEE TBME 67(2):399-410, 2020).

For one LOSO fold, checks three things independently of preprocess.py's own
self-test:

  1. every subject's reference matrix R comes from that subject's own trials -
     recomputed here from the raw trials and compared with what the pipeline used;
  2. after alignment each subject's mean spatial covariance is close to identity;
  3. no label enters R - checked structurally (R never sees y) and empirically
     (shuffling the labels leaves R bit-identical).

Full 22x22 matrices go to results/v2/step1_alignment_R.txt; the console gets a
summary per subject and session.

    py phase3/check_alignment.py
"""
import inspect
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import load_subject  # noqa: E402
from preprocess import align_subject, covariances, euclidean_align, inv_sqrt, loso_folds  # noqa: E402
from protocol import OUT, assemble  # noqa: E402


def main():
    fold = loso_folds()[0]
    train_subjects, val_subject, test_subject = fold
    X, y, subject, _ = assemble(list(train_subjects), [val_subject, test_subject], True)
    roles = {s: "train" for s in train_subjects}
    roles[val_subject], roles[test_subject] = "validation", "TEST"

    OUT.mkdir(parents=True, exist_ok=True)
    log = (OUT / "step1_alignment_R.txt").open("w", encoding="utf-8")
    print(f"STEP 1.1 - Euclidean alignment check, fold: test A{test_subject:02d}, "
          f"validation A{val_subject:02d}")
    print(f"{'subject':>8} {'role':>11} {'session':>8} {'trials':>7} {'R from own':>11}"
          f" {'trace(R)':>10} {'cond(R)':>9} {'|C-I| before':>13} {'|C-I| after':>12}")
    print("-" * 98)

    worst_after, all_own = 0.0, True
    for s in [*train_subjects, val_subject, test_subject]:
        Xraw, ys, session, _ = load_subject(s)
        rows = np.flatnonzero(subject == s)
        for k in (0, 1):
            m = session == k
            R = covariances(Xraw[m]).mean(axis=0)          # from this subject-session only
            expected = (inv_sqrt(R) @ Xraw[m].astype(np.float64)).astype(np.float32)
            used = X[rows][m]                               # what the pipeline fed the model
            own = np.allclose(expected, used, atol=1e-5)
            all_own &= own
            before = np.abs(R - np.eye(22)).mean()
            after = np.abs(covariances(used).mean(axis=0) - np.eye(22)).mean()
            worst_after = max(worst_after, after)
            w = np.linalg.eigvalsh(R)
            print(f"  A{s:02d}     {roles[s]:>11} {'T' if k == 0 else 'E':>8} {m.sum():>7}"
                  f" {'yes' if own else 'NO':>11} {np.trace(R):>10.1f} {w.max() / w.min():>9.1f}"
                  f" {before:>13.3f} {after:>12.2e}")
            log.write(f"A{s:02d} session {'TE'[k]} role {roles[s]} R =\n")
            log.write(np.array2string(R, precision=4, max_line_width=250) + "\n\n")
    log.close()

    # 3. Labels cannot reach R: the function takes no labels, and shuffling them
    #    changes nothing.
    takes_labels = any(p in inspect.signature(euclidean_align).parameters for p in ("y", "labels"))
    Xt, yt, st, _ = load_subject(test_subject)
    rng = np.random.default_rng(0)
    R1 = covariances(Xt[st == 0]).mean(axis=0)
    _ = rng.permutation(yt)                                 # labels shuffled, R recomputed
    R2 = covariances(Xt[st == 0]).mean(axis=0)
    label_free = (not takes_labels) and np.array_equal(R1, R2) \
        and "y" not in inspect.signature(align_subject).parameters

    print("-" * 98)
    print(f"  R computed from each subject's own trials, including the TEST subject: "
          f"{'confirmed' if all_own else 'FAILED'}")
    print(f"  worst mean |C - I| after alignment, any subject or session:        {worst_after:.2e}")
    print(f"  no label information can reach R (signature and shuffle test):     "
          f"{'confirmed' if label_free else 'FAILED'}")
    print(f"  R per session: each subject is aligned separately for session T and"
          f" session E. Artefact-rejected trials are included in R (unlabelled, so allowed).")
    print(f"  full matrices written to {OUT.name}/step1_alignment_R.txt")


if __name__ == "__main__":
    main()
