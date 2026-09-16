"""Result tables and figures - section 17 of the solution design.

Reads what the experiments recorded and produces what the review needs, so that
what is presented is exactly what was measured and never a separate calculation.

    py phase3/report.py                      # results/e2_loso.csv
    py phase3/report.py results/e2_loso.csv HCT-Net

Naming a reference model adds the Wilcoxon comparison of every other model
against it, Holm-corrected across the family.
"""
import csv
import sys
from ast import literal_eval
from collections import defaultdict
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from stats import report as significance  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
FIGURES = Path(__file__).resolve().parent / "results_fig"
CLASSES = ("left", "right", "feet", "tongue")

# Measured at 22 channels x 875 samples by models.py, plus the design's own figure
# for HCT-Net. Imported lazily so this module runs without torch installed.
PARAMS = {"FBCSP": None, "EEGNet": 3188, "ATCNet": 113732,
          "EEGConformer": 697412, "CTNet": 152364, "HCT-Net": 20996}


def load(path):
    with open(path, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        r["test_subject"] = int(r["test_subject"])
        for k in ("accuracy", "kappa", "precision", "recall", "f1"):
            r[k] = float(r[k])
        r["confusion"] = np.array(literal_eval(r["confusion"]))
    return rows


def by_subject(rows, field="accuracy"):
    """model -> {subject: mean over seeds}. Seeds are averaged per section 12.7."""
    acc = defaultdict(lambda: defaultdict(list))
    for r in rows:
        acc[r["model"]][r["test_subject"]].append(r[field])
    return {m: {s: float(np.mean(v)) for s, v in subs.items()} for m, subs in acc.items()}


def table(rows):
    """Per-subject accuracy, then mean and standard deviation over the nine folds."""
    acc = by_subject(rows)
    kappa = by_subject(rows, "kappa")
    subjects = sorted({r["test_subject"] for r in rows})

    print(f"{'model':<14}" + "".join(f"{f'A{s:02d}':>8}" for s in subjects)
          + f"{'mean':>9}{'std':>7}{'kappa':>8}")
    for m in acc:
        v = np.array([acc[m][s] for s in subjects])
        print(f"  {m:<12}" + "".join(f"{x:7.1%}" for x in v)
              + f"{v.mean():9.1%}{v.std():7.1%}"
              + f"{np.mean(list(kappa[m].values())):8.3f}")
    print(f"\n  {len(subjects)} folds, seeds averaged. Chance is 25.0% over four classes.")
    return acc


def confusions(rows):
    """One row-normalised confusion matrix per model, summed over folds and seeds."""
    totals = defaultdict(lambda: np.zeros((4, 4), dtype=int))
    for r in rows:
        totals[r["model"]] += r["confusion"]

    models = list(totals)
    fig, axes = plt.subplots(1, len(models), figsize=(3.4 * len(models), 3.6), squeeze=False)
    for ax, m in zip(axes[0], models):
        c = totals[m]
        norm = c / c.sum(axis=1, keepdims=True).clip(min=1)
        ax.imshow(norm, cmap="Blues", vmin=0, vmax=1)
        for i in range(4):
            for j in range(4):
                ax.text(j, i, f"{norm[i, j]:.0%}", ha="center", va="center", fontsize=8,
                        color="white" if norm[i, j] > 0.5 else "black")
        ax.set(xticks=range(4), yticks=range(4), xticklabels=CLASSES, yticklabels=CLASSES,
               title=m, xlabel="predicted", ylabel="true" if m == models[0] else "")
        ax.tick_params(labelsize=8)
        plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
    fig.suptitle("Confusion by class, pooled over folds (row-normalised)")
    save(fig, "confusion")
    return totals


def complexity(acc):
    """Accuracy against parameter count - experiment E6.

    The project's argument is that accuracy need not be bought with capacity, so
    the axis that matters is this one and not accuracy alone.
    """
    pts = [(PARAMS[m], np.mean(list(v.values())), m) for m, v in acc.items()
           if PARAMS.get(m)]
    if len(pts) < 2:
        print("  (complexity figure needs at least two models with a parameter count)")
        return

    fig, ax = plt.subplots(figsize=(6.4, 4.2))
    for p, a, m in pts:
        ax.scatter(p, a, s=70, zorder=3, color="#5B3E96" if m == "HCT-Net" else "#1B3A6B")
        ax.annotate(m, (p, a), textcoords="offset points", xytext=(7, 4), fontsize=9)
    ax.set(xscale="log", xlabel="trainable parameters (log scale)",
           ylabel="cross-subject accuracy",
           title="Accuracy against model size, one identical LOSO protocol")
    ax.yaxis.set_major_formatter(lambda v, _: f"{v:.0%}")
    ax.grid(alpha=0.3, zorder=0)
    save(fig, "complexity")


def save(fig, name):
    FIGURES.mkdir(exist_ok=True)
    fig.savefig(FIGURES / f"{name}.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  wrote {FIGURES.name}/{name}.png")


def main(path, reference=None):
    rows = load(path)
    print(f"{path}: {len(rows)} runs\n")
    acc = table(rows)
    print()
    confusions(rows)
    complexity(acc)

    if reference:
        subjects = sorted({r["test_subject"] for r in rows})
        print()
        significance({m: [v[s] for s in subjects] for m, v in acc.items()}, reference)
    elif len(acc) > 1:
        print("\n  (pass a reference model name for the Wilcoxon comparison)")


if __name__ == "__main__":
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "results" / "e2_loso.csv"
    if not path.exists():
        sys.exit(f"no results at {path} -- run phase3/loso.py first")
    main(path, sys.argv[2] if len(sys.argv) > 2 else None)
