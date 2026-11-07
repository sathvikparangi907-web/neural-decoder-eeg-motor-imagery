"""The paper's additional analyses, all computed from the per-fold logs in results/.

Confidence intervals, the power analysis, the theoretical and empirical chance level,
the within- versus cross-subject correlation, information transfer in bits, the
session-shift correlation and the nested re-check of the final selection. Nothing here
retrains a model; every number comes from a CSV already in the repository, except the
session-shift distances, which are read from the cache.

    py paper/statistics.py
"""
import csv
import statistics as st
import sys
from pathlib import Path

import numpy as np
from scipy import stats

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "phase3"))
from _paths import ROOT  # noqa: E402
from data import load_subject  # noqa: E402

V1, V2 = ROOT / "results", ROOT / "results" / "v2"
SEEDS = (0, 1, 2)
SUBJECTS = range(1, 10)


def per_subject(name, step, variant="bn", col="test_acc"):
    """Three-seed mean per test subject, in %."""
    out = {}
    for seed in SEEDS:
        for r in csv.DictReader((V2 / f"{step}_{name}_seed{seed}.csv").open(encoding="utf-8")):
            if r["variant"] == variant:
                out.setdefault(int(r["test_subject"]), []).append(100 * float(r[col]))
    return np.array([st.mean(out[s]) for s in sorted(out)])


def v1_per_subject(file, model, col="accuracy"):
    rows = {int(r["test_subject"]): 100 * float(r[col]) for r in
            csv.DictReader((V1 / file).open(encoding="utf-8")) if r["model"] == model}
    return np.array([rows[s] for s in sorted(rows)])


def ci_paired(a, b, conf=0.95):
    """Mean paired difference a - b with a t interval over subjects."""
    d = a - b
    n = len(d)
    se = d.std(ddof=1) / np.sqrt(n)
    t = stats.t.ppf(0.5 + conf / 2, n - 1)
    return d.mean(), d.mean() - t * se, d.mean() + t * se


def ci_pearson(x, y, conf=0.95):
    """Pearson r with a Fisher z interval."""
    r, p = stats.pearsonr(x, y)
    n = len(x)
    z, se = np.arctanh(r), 1 / np.sqrt(n - 3)
    c = stats.norm.ppf(0.5 + conf / 2)
    return r, p, np.tanh(z - c * se), np.tanh(z + c * se)


def bits(acc, n_classes=4):
    """Wolpaw information transfer per trial."""
    if acc <= 1 / n_classes:
        return 0.0
    if acc >= 1:
        return np.log2(n_classes)
    return (np.log2(n_classes) + acc * np.log2(acc)
            + (1 - acc) * np.log2((1 - acc) / (n_classes - 1)))


def session_shift():
    """Log-Euclidean distance between the two sessions' mean covariances, per subject."""
    out = {}
    for s in SUBJECTS:
        X, _y, session, rejected = load_subject(s)
        logs = []
        for sess in (0, 1):
            m = (session == sess) & (~rejected)
            C = np.cov(X[m].transpose(1, 0, 2).reshape(X.shape[1], -1).astype(np.float64))
            w, V = np.linalg.eigh(C)
            logs.append(V @ np.diag(np.log(w.clip(min=1e-12))) @ V.T)
        out[s] = float(np.linalg.norm(logs[0] - logs[1], "fro"))
    return out


def main():
    print("=" * 74)
    print("  THE PAPER'S ADDITIONAL ANALYSES, FROM THE LOGS IN results/")
    print("=" * 74)

    a = per_subject("sizea", "step10")
    e = per_subject("eegnet", "step8")
    d, lo, hi = ci_paired(a, e)
    print("\n1. HCT-Net A against EEGNet, cross subject, protocol v2, three seeds")
    print(f"   HCT-Net A {a.mean():.1f}%   EEGNet {e.mean():.1f}%")
    print(f"   paired difference {d:+.1f} points, 95% CI [{lo:.1f}, {hi:.1f}]")
    w = stats.wilcoxon(a, e)
    print(f"   Wilcoxon p = {w.pvalue:.4f}, {int((a > e).sum())} of 9 subjects favour HCT-Net")

    print("\n2. Power of the exact signed-rank test with nine pairs")
    sd = (a - e).std(ddof=1)
    detect = 1.15 * sd
    print(f"   sd of the paired differences {sd:.2f} points")
    print(f"   80% power needs about 1.15 sd = {detect:.1f} points")

    print("\n3. Chance level, four classes")
    n = 576
    upper = stats.binom.ppf(0.95, n, 0.25) / n
    print(f"   theoretical 25.0%; 95th percentile of the null for {n} trials "
          f"= {100 * upper:.1f}%")

    print("\n4. Within subject against cross subject, six models (protocol v1)")
    models = ["EEGConformer", "ATCNet", "CTNet", "EEGNet", "FBCSP", "HCT-Net"]
    win = np.array([v1_per_subject("e1_within_subject.csv", m).mean() for m in models])
    cro = np.array([v1_per_subject("e2_loso.csv", m).mean() for m in models])
    r, p, rlo, rhi = ci_pearson(win, cro)
    print(f"   within {np.round(win, 1)}")
    print(f"   cross  {np.round(cro, 1)}")
    print(f"   Pearson r = {r:.2f}, p = {p:.2f}, 95% CI [{rlo:.2f}, {rhi:.2f}]")
    rho = stats.spearmanr(win, cro)
    print(f"   Spearman rho = {rho.statistic:.2f}")
    rd, pd_, dlo, dhi = ci_pearson(win, win - cro)
    print(f"   within against the DROP: r = {rd:.2f}, p = {pd_:.2f} "
          f"- circular, the drop contains the within-subject term")

    print("\n5. Information transfer, configuration A (Wolpaw bits per trial)")
    per = np.array([bits(x / 100) for x in a])
    print(f"   mean over subjects of the per-subject bits   {per.mean():.2f}")
    print(f"   bits of the mean accuracy ({a.mean():.1f}%)          {bits(a.mean() / 100):.2f}")
    print(f"   per subject  {per.min():.2f} to {per.max():.2f} bits")
    print("   The paper quotes the first of these; the two differ because the bit rate")
    print("   is convex in accuracy. State which definition is meant.")

    print("\n6. Session shift against cross-subject difficulty")
    shift = session_shift()
    x = np.array([shift[s] for s in SUBJECTS])
    r2, p2, lo2, hi2 = ci_pearson(x, a)
    print("   distance per subject: " + ", ".join(f"A{s:02d} {shift[s]:.2f}" for s in SUBJECTS))
    print(f"   r = {r2:.2f}, p = {p2:.4f}, 95% CI [{lo2:.2f}, {hi2:.2f}]")

    print("\n7. Nested re-check of the final selection")
    kept = 0
    for held in SUBJECTS:
        others = [s for s in SUBJECTS if s != held]
        va = per_subject("sizea", "step10", col="val_acc")
        vd = per_subject("base", "step9", col="val_acc")
        idx = [s - 1 for s in others]
        if va[idx].mean() >= vd[idx].mean():
            kept += 1
    print(f"   configuration A still chosen over D with each subject left out: {kept} of 9")
    print()


if __name__ == "__main__":
    main()
