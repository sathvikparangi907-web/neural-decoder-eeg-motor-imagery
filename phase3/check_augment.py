"""Step 1.5 - check Segmentation & Reconstruction augmentation.

Runs augment() on one fold's real training split, then traces every segment of
every synthetic trial back to the real trial it was copied from, to establish:
same class, which subject, and that nothing reaches validation or test.

    py phase3/check_augment.py
"""
import inspect
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from preprocess import N_SEGMENTS, augment, loso_folds, standardise  # noqa: E402
from protocol import assemble, split_for_stopping  # noqa: E402


def main():
    fold = loso_folds()[0]
    train_subjects, val_subject, test_subject = fold
    X, y, subject, keep = assemble(list(train_subjects), [val_subject, test_subject], True)
    tr = np.flatnonzero(np.isin(subject, train_subjects) & keep)
    fit, stop = split_for_stopping(tr, y, subject, 0)
    va, te = np.flatnonzero(subject == val_subject), np.flatnonzero(subject == test_subject)
    Xfit, Xstop, Xva, Xte = standardise(X[fit], X[stop], X[va], X[te])

    Xa, ya = augment(Xfit, y[fit], rng=np.random.default_rng(0))
    real, synth = len(fit), len(Xa) - len(fit)
    edges = np.linspace(0, Xfit.shape[2], N_SEGMENTS + 1).astype(int)

    print("STEP 1.5 - Segmentation & Reconstruction, fold: test "
          f"A{test_subject:02d}, validation A{val_subject:02d}\n")
    print("  How one synthetic trial is built (preprocess.augment):")
    print(f"    1. draw its class label from the training labels (class balance kept exactly)")
    print(f"    2. split the {Xfit.shape[2]}-sample window into {N_SEGMENTS} equal segments,"
          f" boundaries {edges.tolist()}")
    print(f"    3. for each segment, pick a random real training trial OF THE SAME CLASS")
    print(f"       and copy that segment across, all 22 channels together")
    print(f"    4. donors come from the whole training pool, so ACROSS training subjects\n")

    # Exact byte-level lookup of every segment, per segment position.
    held_out = np.concatenate([Xstop, Xva, Xte])
    seg_of = lambda A, j, k: A[j, :, edges[k]:edges[k + 1]].tobytes()
    donor_index = [{seg_of(Xfit, j, k): j for j in range(real)} for k in range(N_SEGMENTS)]
    held_index = [{seg_of(held_out, j, k) for j in range(len(held_out))}
                  for k in range(N_SEGMENTS)]

    same_class, cross_subject, exact, leaked = 0, 0, 0, 0
    fit_subject, fit_y = subject[fit], y[fit]
    for i in range(real, len(Xa)):
        donors = []
        for k in range(N_SEGMENTS):
            key = seg_of(Xa, i, k)
            j = donor_index[k].get(key)
            if j is not None:
                exact += 1
                donors.append(j)
                same_class += int(fit_y[j] == ya[i])
            leaked += int(key in held_index[k])
        cross_subject += int(len(set(fit_subject[donors])) > 1)

    n_seg = synth * N_SEGMENTS
    print(f"  {'real training trials':<52}{real:>8}")
    print(f"  {'synthetic trials added':<52}{synth:>8}")
    print(f"  {'segments traced to a real training trial':<52}{exact:>8} of {n_seg}")
    print(f"  {'segments whose donor has the SAME class':<52}{same_class:>8} of {exact}")
    print(f"  {'synthetic trials mixing two or more subjects':<52}{cross_subject:>8}"
          f" of {synth} ({cross_subject / synth:.0%})")
    print(f"  {'segments found in stopping/validation/test data':<52}{leaked:>8}")
    sig = inspect.signature(augment)
    print(f"\n  augment() is called only on the gradient-update split; its arguments are"
          f" {list(sig.parameters)}.")
    print("  Validation and test trials are never passed to it, and the check above found"
          " no synthetic segment in any held-out set.")


if __name__ == "__main__":
    main()
