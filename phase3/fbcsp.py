"""FBCSP + LDA - the classical baseline (Ang et al., 2008).

One of the five baselines in section 15 of the solution design. Its role in
Table 15.2 is to check that the deep models justify their additional complexity,
so nothing here is allowed to be cleverer than the 2008 paper.

Run directly for the E1 within-subject check - fit on session T, test on E:

    py phase3/fbcsp.py
"""
import sys
from pathlib import Path

import numpy as np
from scipy.linalg import eigh
from scipy.signal import butter, filtfilt
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.feature_selection import mutual_info_classif

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import DATA, FS, SUBJECTS, load_subject  # noqa: E402
from preprocess import covariances  # noqa: E402

# 4 Hz sub-bands spanning the 4-38 Hz pass-band data.py has already applied. The
# top band is the 2 Hz remainder: there is nothing above 38 Hz left to filter.
BANDS = [(lo, min(lo + 4, 38)) for lo in range(4, 38, 4)]
M = 2           # CSP filters taken from each end of the spectrum, per class per band


class FBCSP:
    """Filter-bank one-vs-rest CSP, mutual-information selection, shrinkage LDA.

    Everything - spatial filters, the selected features and the classifier - is
    learned in fit() from the training trials alone.
    """

    def __init__(self, k=8):
        self.k = k                      # features kept by the MI ranking

    def _cov(self, X, lo, hi):
        """Trace-normalised per-trial covariance inside one sub-band: (n, ch, ch)."""
        b, a = butter(4, [lo / (FS / 2), hi / (FS / 2)], btype="band")
        C = covariances(filtfilt(b, a, np.asarray(X, dtype=np.float64), axis=-1))
        return C / np.trace(C, axis1=1, axis2=2)[:, None, None]

    def _features(self, X):
        """Log normalised variance of each projected component.

        Shape (n, bands * classes * 2M) = (n, 9 * 4 * 4) = (n, 144). The variance
        of a projection is w'Cw, so the band covariance serves for both fitting
        the filters and applying them; normalising within each class's 2M
        components is the usual CSP feature and makes the trace scaling cancel.
        """
        out = []
        for (lo, hi), W in zip(BANDS, self.filters_):
            C = self._cov(X, lo, hi)
            v = np.einsum("nij,ik,jk->nk", C, W, W).reshape(len(X), -1, 2 * M)
            out.append(np.log(v / v.sum(axis=2, keepdims=True)).reshape(len(X), -1))
        return np.hstack(out)

    def fit(self, X, y):
        self.classes_ = np.unique(y)
        self.filters_ = []
        for lo, hi in BANDS:
            C = self._cov(X, lo, hi)
            cols = []
            for c in self.classes_:
                A, B = C[y == c].mean(axis=0), C[y != c].mean(axis=0)
                # Generalised eigenvectors of (class, class + rest), ascending:
                # the largest eigenvalues maximise this class's variance, the
                # smallest maximise the rest's. Both ends discriminate.
                V = eigh(A, A + B + 1e-10 * np.eye(len(A)))[1]
                cols.append(V[:, list(range(M)) + list(range(-M, 0))])
            self.filters_.append(np.hstack(cols))

        F = self._features(X)
        self.selected_ = np.argsort(mutual_info_classif(F, y, random_state=0))[::-1][:self.k]
        self.lda_ = LinearDiscriminantAnalysis(solver="eigen", shrinkage="auto")
        self.lda_.fit(F[:, self.selected_], y)
        return self

    def predict(self, X):
        return self.lda_.predict(self._features(X)[:, self.selected_])

    def score(self, X, y):
        return float((self.predict(X) == y).mean())


def _check():
    """E1, within-subject: train on session 0 (T), test on session 1 (E)."""
    print("FBCSP + LDA, within-subject (train session T, test session E), "
          f"{len(BANDS)} bands, k=8 features\n")
    accs = {}
    for s in SUBJECTS:
        if not all((DATA / f"A{s:02d}{k}.mat").exists() for k in "TE"):
            print(f"  A{s:02d}  skipped - data/A{s:02d}T.mat / A{s:02d}E.mat not downloaded yet")
            continue
        try:
            X, y, session, rejected = load_subject(s)
        except Exception as e:        # a part-downloaded .mat is unreadable, not fatal
            print(f"  A{s:02d}  skipped - {type(e).__name__}: {e}")
            continue
        tr, te = ~rejected & (session == 0), ~rejected & (session == 1)
        accs[s] = FBCSP().fit(X[tr], y[tr]).score(X[te], y[te])
        print(f"  A{s:02d}  {accs[s]:6.1%}   ({tr.sum():3d} train / {te.sum():3d} test trials)")

    assert accs, "no subject had both sessions available"
    mean = float(np.mean(list(accs.values())))
    verdict = "PASS " if mean >= 0.63 else "CHECK"
    print(f"\n  mean {mean:.1%} over {len(accs)}/{len(SUBJECTS)} subjects "
          f"(chance 25%, 4 classes)")
    print(f"{verdict} published FBCSP expectation on BCI IV-2a is ~68% within-subject"
          + ("" if len(accs) == len(SUBJECTS) else "; partial subject set, indicative only"))


if __name__ == "__main__":
    sys.exit(_check())
