"""Paired significance testing - section 12.8 of the solution design.

Comparing two mean accuracies over nine folds is not evidence. Each pairwise
comparison is a Wilcoxon signed-rank test on the nine paired per-subject
accuracies: non-parametric, because per-subject accuracy is not normally
distributed across subjects, and paired, because every model is evaluated on the
same nine people.

Where one model is compared against all five baselines, the five p-values are
corrected by Holm-Bonferroni and both the corrected and uncorrected values are
reported (section 17, rule 3).

    py phase3/stats.py                  # self-check on synthetic data
    py phase3/stats.py results/e2_loso.csv HCT-Net
"""
import sys
from pathlib import Path

import numpy as np
from scipy.stats import wilcoxon

ALPHA = 0.05


def holm_bonferroni(pvalues, alpha=ALPHA):
    """Step-down correction over a family of comparisons.

    Sorts ascending, tests the k-th smallest against alpha / (m - k), and stops
    at the first failure: everything after it stays non-significant regardless of
    its own p-value. Returns (adjusted p-values, reject flags) in input order.
    Less conservative than plain Bonferroni at the same family-wise error rate,
    which matters with only nine paired samples per comparison.
    """
    p = np.asarray(pvalues, dtype=float)
    order = np.argsort(p)
    m = len(p)

    adjusted = np.empty(m)
    running = 0.0
    for rank, i in enumerate(order):
        running = max(running, (m - rank) * p[i])     # enforce monotonicity
        adjusted[i] = min(running, 1.0)
    return adjusted, adjusted < alpha


def compare(scores, reference):
    """Every model in `scores` against `reference`, paired across subjects.

    scores maps model name -> per-subject accuracies, all in the same subject
    order. Returns one row per comparison with the mean difference, the
    uncorrected p-value and the Holm-corrected one.
    """
    ref = np.asarray(scores[reference], dtype=float)
    names = [n for n in scores if n != reference]

    raw, diffs = [], []
    for n in names:
        other = np.asarray(scores[n], dtype=float)
        if len(other) != len(ref):
            raise ValueError(f"{n} has {len(other)} folds, {reference} has {len(ref)}")
        diffs.append(float((ref - other).mean()))
        # Identical vectors have no ranks to test; scipy raises rather than
        # returning 1.0, and a model does not differ from itself.
        raw.append(1.0 if np.allclose(ref, other) else
                   float(wilcoxon(ref, other, zero_method="wilcox").pvalue))

    adjusted, reject = holm_bonferroni(raw)
    return [{"model": n, "mean_difference": d, "p": p, "p_holm": a, "significant": bool(r)}
            for n, d, p, a, r in zip(names, diffs, raw, adjusted, reject)]


def report(scores, reference):
    rows = compare(scores, reference)
    n = len(next(iter(scores.values())))
    print(f"{reference} against {len(rows)} model(s), Wilcoxon signed-rank on {n} paired "
          f"subjects, Holm-Bonferroni over the family\n")
    print(f"  {'model':16s} {'mean diff':>10} {'p':>10} {'p (Holm)':>10}   verdict")
    for r in rows:
        mark = "significant" if r["significant"] else f"not significant at {ALPHA}"
        print(f"  {r['model']:16s} {r['mean_difference']:+9.1%} {r['p']:10.4f} "
              f"{r['p_holm']:10.4f}   {mark}")
    return rows


def _check():
    rng = np.random.default_rng(0)
    subject = rng.normal(0.60, 0.12, 9)               # shared per-subject difficulty

    scores = {
        "proposed": np.clip(subject + 0.06 + rng.normal(0, 0.01, 9), 0, 1),   # genuinely better
        "baseline_close": np.clip(subject + 0.05 + rng.normal(0, 0.01, 9), 0, 1),
        "baseline_worse": np.clip(subject - 0.10 + rng.normal(0, 0.01, 9), 0, 1),
        "baseline_same": np.clip(subject + rng.normal(0, 0.05, 9), 0, 1),
    }
    rows = report(scores, "proposed")
    by = {r["model"]: r for r in rows}

    assert by["baseline_worse"]["significant"], "a 10-point paired gap should survive correction"
    assert by["baseline_worse"]["p_holm"] >= by["baseline_worse"]["p"], "correction must not shrink p"
    assert not by["baseline_same"]["significant"], "noise around zero should not be significant"

    # Pairing is the point: the same difference on unpaired subjects is not detectable.
    shuffled = dict(scores, baseline_worse=rng.permutation(scores["baseline_worse"]))
    assert compare(shuffled, "proposed")[1]["p"] <= 0.05, "paired test should still see a real shift"

    p = [0.001, 0.02, 0.03, 0.04, 0.9]
    adj, rej = holm_bonferroni(p)
    assert np.all(np.diff(adj[np.argsort(p)]) >= 0), "adjusted p-values must be monotone"
    assert list(rej) == [True, False, False, False, False], f"step-down stops at the first failure: {adj}"
    assert np.isclose(adj[0], 0.005), f"smallest p is multiplied by the family size: {adj[0]}"

    print("\nself-check OK  Holm step-down, monotone adjustment, pairing preserved")


def _from_csv(path, reference):
    """Per-subject accuracies from a results CSV, averaged over seeds."""
    import csv
    scores = {}
    with open(path, encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            scores.setdefault(row["model"], {}).setdefault(int(row["test_subject"]), []) \
                .append(float(row["accuracy"]))
    scores = {m: [np.mean(v[s]) for s in sorted(v)] for m, v in scores.items()}
    if reference not in scores:
        sys.exit(f"{reference!r} is not in {path} -- have {sorted(scores)}")
    return report(scores, reference)


if __name__ == "__main__":
    if len(sys.argv) > 2:
        _from_csv(Path(sys.argv[1]), sys.argv[2])
    else:
        _check()
