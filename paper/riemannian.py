"""Riemannian baselines for the paper: MDM, MDM + re-centring, and TS-LR + re-centring.

Two classical references that work directly on trial covariance matrices, run under
exactly the protocol the deep models use: the same cache, the same 4-38 Hz band and
0.5-4.0 s window, artefact rejection on the training subjects only, and the same nine
leave-one-subject-out folds with seven training subjects each.

They are deterministic and have no setting chosen on validation data, so they need
neither seeds nor a selection subject.

    py paper/riemannian.py

Writes results/paper/riemannian.csv - one row per method per test subject.
"""
import csv
import sys
from pathlib import Path

import numpy as np
from pyriemann.classification import MDM
from pyriemann.estimation import Covariances
from pyriemann.tangentspace import TangentSpace
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import cohen_kappa_score
from sklearn.pipeline import make_pipeline

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "phase3"))
from _paths import ROOT  # noqa: E402
from data import load_subject  # noqa: E402
from preprocess import loso_folds  # noqa: E402

OUT = ROOT / "results" / "paper"


def covariances(X):
    """22 x 22 trial covariances, oracle-approximating shrinkage."""
    return Covariances(estimator="oas").transform(X)


def recentre(C, session):
    """Per-session Riemannian re-centring: whiten by the Riemannian mean of the session.

    The Riemannian counterpart of Euclidean alignment. Unsupervised, so it may be
    applied to a new subject's unlabelled trials.
    """
    from pyriemann.utils.mean import mean_riemann

    out = np.empty_like(C)
    for s in np.unique(session):
        m = session == s
        M = mean_riemann(C[m])
        w, V = np.linalg.eigh(M)
        inv_sqrt = V @ np.diag(w.clip(min=1e-12) ** -0.5) @ V.T
        out[m] = inv_sqrt @ C[m] @ inv_sqrt.T
    return out


def subject_cov(subject, rc):
    X, y, session, rejected = load_subject(subject)
    C = covariances(X.astype(np.float64))
    if rc:
        C = recentre(C, session)
    return C, y, rejected


def run(method, rc):
    rows = []
    for train, _val, test in loso_folds():
        Ctr, ytr = [], []
        for s in train:
            C, y, rejected = subject_cov(s, rc)
            Ctr.append(C[~rejected])          # artefact rule: training subjects only
            ytr.append(y[~rejected])
        Ctr, ytr = np.concatenate(Ctr), np.concatenate(ytr)
        Cte, yte, _ = subject_cov(test, rc)   # the test subject keeps all 576 trials

        clf = MDM() if method == "mdm" else make_pipeline(
            TangentSpace(metric="riemann"), LogisticRegression(C=1.0, max_iter=2000))
        clf.fit(Ctr, ytr)
        pred = clf.predict(Cte)
        acc = float((pred == yte).mean())
        rows.append({"method": method, "recentre": int(rc), "test_subject": test,
                     "accuracy": round(acc, 4),
                     "kappa": round(float(cohen_kappa_score(yte, pred)), 4)})
        print(f"  {method}{' + RC' if rc else '':6} A{test:02d}  {100 * acc:5.1f}%", flush=True)
    return rows


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for method, rc in (("mdm", False), ("mdm", True), ("ts-lr", True)):
        print(f"{method}, re-centring {'on' if rc else 'off'}")
        rows += run(method, rc)

    path = OUT / "riemannian.csv"
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)

    print(f"\n{'method':12} {'mean':>7} {'sd':>6} {'kappa':>7}")
    for method, rc in (("mdm", False), ("mdm", True), ("ts-lr", True)):
        sel = [r for r in rows if r["method"] == method and r["recentre"] == int(rc)]
        assert len(sel) == 9, sel
        a = np.array([r["accuracy"] for r in sel]) * 100
        k = np.mean([r["kappa"] for r in sel])
        label = f"{method}{' + RC' if rc else ''}"
        print(f"{label:12} {a.mean():6.1f}% {a.std(ddof=1):5.1f} {k:7.3f}")
    print(f"\nwrote {path}")


if __name__ == "__main__":
    main()
