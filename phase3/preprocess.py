"""Fold-dependent preprocessing — Euclidean alignment, standardisation, augmentation, LOSO folds.

Milestone M2. Steps 5-7 of Table 9.1 in the solution design, plus the fold
definitions of section 12. These are separate from data.py because they depend
on which subject is being held out, so they cannot be baked into the cache.

Leakage rules (section 9.4) are enforced by the signatures here: standardise()
takes the training split first and derives its statistics from that alone, and
augment() is never applied to validation or test data.

Run directly for the M2 alignment check:

    py phase3/preprocess.py
"""
import sys
from pathlib import Path

import numpy as np
from scipy.linalg import eigh

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import SUBJECTS, load_subject  # noqa: E402

N_SEGMENTS = 8          # segmentation and reconstruction, section 9.3
EIG_FLOOR = 1e-10       # eigenvalue clamp, section 9.2


def covariances(X):
    """Spatial covariance of every trial: (trials, ch, samples) -> (trials, ch, ch).

    In float64 regardless of the input: accumulating 875 products per entry in
    float32 leaves an error around 1e-4 in the mean covariance, which is large
    enough to fail the alignment check for a reason that has nothing to do with
    the alignment.
    """
    X = X.astype(np.float64)
    return X @ X.transpose(0, 2, 1) / X.shape[2]


def inv_sqrt(R):
    """R^(-1/2) via symmetric eigendecomposition, with small eigenvalues clamped."""
    w, V = eigh(R)
    return V @ np.diag(1.0 / np.sqrt(np.maximum(w, EIG_FLOOR))) @ V.T


def euclidean_align(X):
    """Whiten a recording by its own mean spatial covariance (He & Wu, 2020).

    Unsupervised — labels are never used, so this may be applied to the test
    subject's unlabelled trials. Afterwards the mean covariance is the identity.
    """
    return (inv_sqrt(covariances(X).mean(axis=0)) @ X).astype(np.float32)


def align_subject(X, session):
    """Alignment applied per session, since the two were recorded on different days."""
    out = np.empty_like(X)
    for s in np.unique(session):
        m = session == s
        out[m] = euclidean_align(X[m])
    return out


def standardise(train, *rest):
    """Per-channel z-scoring with statistics taken from the training split only."""
    mean = train.mean(axis=(0, 2), keepdims=True)
    std = train.std(axis=(0, 2), keepdims=True) + 1e-7
    return tuple(((x - mean) / std).astype(np.float32) for x in (train, *rest))


def augment(X, y, n_new=None, n_seg=N_SEGMENTS, rng=None):
    """Segmentation and reconstruction, section 9.3 — training split only.

    Each synthetic trial takes its k-th time segment from a randomly chosen real
    trial of the same class, so it is built entirely from genuine EEG.
    """
    rng = rng or np.random.default_rng(0)
    n_new = len(X) if n_new is None else n_new
    edges = np.linspace(0, X.shape[2], n_seg + 1).astype(int)

    by_class = {c: np.flatnonzero(y == c) for c in np.unique(y)}
    labels = rng.permutation(np.resize(y, n_new))   # keeps the classes exactly balanced
    synth = np.empty((n_new, X.shape[1], X.shape[2]), dtype=np.float32)
    for i, c in enumerate(labels):
        donors = rng.choice(by_class[c], size=n_seg)
        for k, d in enumerate(donors):
            synth[i, :, edges[k]:edges[k + 1]] = X[d, :, edges[k]:edges[k + 1]]

    return np.concatenate([X, synth]), np.concatenate([y, labels])


def loso_folds(subjects=SUBJECTS):
    """Nine folds of 7 train / 1 validation / 1 test subject (section 12).

    The validation subject is the next one cyclically, so the split is fixed and
    reproducible, and no subject is ever in two roles at once.
    """
    subjects = list(subjects)
    folds = []
    for i, test in enumerate(subjects):
        val = subjects[(i + 1) % len(subjects)]
        folds.append(([s for s in subjects if s not in (test, val)], val, test))
    return folds


def _check():
    folds = loso_folds()
    assert len(folds) == 9
    for train, val, test in folds:
        assert len(train) == 7 and val != test and val not in train and test not in train
    print(f"folds        OK  9 folds, 7 train / 1 val / 1 test, e.g. {folds[0]}")

    X, y, session, rejected = load_subject(1)
    X, y, session = X[~rejected], y[~rejected], session[~rejected]

    # M2 completion criterion: mean covariance must be the identity after alignment.
    aligned = align_subject(X, session)
    worst = max(np.abs(covariances(aligned[session == s]).mean(axis=0) - np.eye(X.shape[1])).max()
                for s in np.unique(session))
    assert worst < 1e-4, f"mean covariance is not the identity after alignment (max error {worst:.2e})"
    print(f"alignment    OK  mean covariance = identity within {worst:.2e}")

    before = np.abs(covariances(X).mean(axis=0) - np.eye(X.shape[1])).max()
    print(f"             (before alignment the same error was {before:.1f})")

    a, b = standardise(aligned[session == 0], aligned[session == 1])
    assert abs(a.mean()) < 1e-5 and abs(a.std() - 1) < 1e-2, "training split is not standardised"
    print(f"standardise  OK  train mean {a.mean():+.1e}, std {a.std():.3f}; "
          f"held-out split untouched by its own statistics (mean {b.mean():+.3f})")

    Xa, ya = augment(aligned[session == 0], y[session == 0], rng=np.random.default_rng(0))
    assert len(Xa) == 2 * (session == 0).sum() and Xa.shape[1:] == X.shape[1:]
    assert (np.bincount(ya, minlength=4) >= np.bincount(y[session == 0], minlength=4)).all()
    print(f"augment      OK  {(session == 0).sum()} -> {len(Xa)} trials, "
          f"{N_SEGMENTS} segments, class counts {np.bincount(ya, minlength=4)}")


if __name__ == "__main__":
    sys.exit(_check())
