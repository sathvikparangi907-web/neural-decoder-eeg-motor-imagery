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


def tradeoff(cross, within_path=ROOT / "results" / "e1_within_subject.csv"):
    """Within-subject accuracy against cross-subject accuracy, one point per model.

    The project's central measured claim: the better a model decodes a subject it
    has seen, the worse it does on one it has not. The diagonal is where a model
    would transfer perfectly; distance below it is the transfer loss.
    """
    if not Path(within_path).exists():
        print("  (trade-off figure needs results/e1_within_subject.csv)")
        return
    within = by_subject(load_simple(within_path))
    shared = [m for m in cross if m in within]
    if len(shared) < 3:
        print("  (trade-off figure needs at least three models measured both ways)")
        return

    fig, ax = plt.subplots(figsize=(6.6, 5.4))
    lo, hi = 0.35, 0.85
    ax.plot([lo, hi], [lo, hi], color="#8C96AC", lw=1, ls="--", zorder=1)
    ax.text(hi - 0.01, hi - 0.005, "perfect transfer", ha="right", va="top",
            fontsize=8, color="#5A6478", rotation=45, rotation_mode="anchor")
    # Four of the six models sit within three points of each other on both axes.
    # Inline labels collide or detach at that density whatever the offsets, so the
    # names and drops go in the legend and the drop line is left unannotated.
    ordered = sorted(shared, key=lambda m: -np.mean(list(within[m].values())))
    palette = ["#1B3A6B", "#4A6FA5", "#8A6FC4", "#5A6478", "#2E7D6E", "#A15C3E"]
    for i, m in enumerate(ordered):
        w = float(np.mean(list(within[m].values())))
        c = float(np.mean(list(cross[m].values())))
        proposed = m == "HCT-Net"
        ax.plot([w, w], [c, w], color="#8C96AC", lw=0.8, zorder=2)   # the drop
        ax.scatter(w, c, s=130 if proposed else 70, zorder=3,
                   color="#5B3E96" if proposed else palette[i % len(palette)],
                   marker="D" if proposed else "o", edgecolor="white", linewidth=0.8,
                   label=f"{m}  ({100 * (c - w):+.1f} pts)")
    ax.legend(loc="upper left", fontsize=8.5, frameon=True, framealpha=0.95,
              title="model (transfer loss)", title_fontsize=8.5)
    ax.set(xlim=(lo, hi), ylim=(lo, hi),
           xlabel="within-subject accuracy (train session T, test session E)",
           ylabel="cross-subject accuracy (leave-one-subject-out)",
           title="Within-subject skill costs cross-subject transfer")
    for axis in (ax.xaxis, ax.yaxis):
        axis.set_major_formatter(lambda v, _: f"{v:.0%}")
    ax.grid(alpha=0.3, zorder=0)
    save(fig, "tradeoff")


def load_simple(path):
    """The E1 CSV: model, test_subject, accuracy -- no per-fold metrics."""
    with open(path, encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        r["test_subject"] = int(r["test_subject"])
        r["accuracy"] = float(r["accuracy"])
    return rows


PREFIX = ""


def save(fig, name):
    FIGURES.mkdir(exist_ok=True)
    out = FIGURES / f"{PREFIX}{name}.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  wrote {FIGURES.name}/{out.name}")


BASELINES = ("FBCSP", "EEGNet", "ATCNet", "EEGConformer", "CTNet")

# (file, heading, reference model, family for the Holm correction). Section 17
# rule 3 fixes the family as the five baselines; the depth and component variants
# share the E2 file but are not part of that family, and including them would
# over-correct every baseline comparison.
EXPERIMENTS = [
    ("e1_within_subject.csv", "E1 - within subject: train session 1, test session 2 (same person)",
     None, None),
    ("e2_loso.csv", "E2/E3 - cross subject: trained on 7 others, tested on an unseen person",
     "HCT-Net", BASELINES),
    ("e4_components.csv", "E4 - component study: which part of the proposed model earns its place",
     "V0", None),
    ("e7_adversarial.csv", "E7 - adversarial subject invariance (section 13.2)", None, None),
]


def summarise(path, title, reference, family=None):
    """One experiment's table, tolerant of both result schemas and of absence."""
    path = Path(path)
    if not path.exists():
        print(f"\n{title}\n  not run yet ({path.name} missing)")
        return None
    simple = "kappa" not in open(path, encoding="utf-8").readline()
    rows = load_simple(path) if simple else load(path)
    acc = by_subject(rows)
    subjects = sorted({r["test_subject"] for r in rows})

    print(f"\n{title}")
    print(f"  {'model':<14}" + "".join(f"{f'A{s:02d}':>7}" for s in subjects)
          + f"{'mean':>8}{'std':>7}")
    for m in sorted(acc, key=lambda k: -np.mean(list(acc[k].values()))):
        v = np.array([acc[m].get(s, np.nan) for s in subjects])
        print(f"  {m:<14}" + "".join("      -" if np.isnan(x) else f"{x:6.1%} " for x in v)
              + f"{np.nanmean(v):8.1%}{np.nanstd(v):7.1%}")
    if reference and reference in acc and len(acc) > 1:
        complete = {m: [v[s] for s in subjects] for m, v in acc.items()
                    if len(v) == len(subjects)
                    and (family is None or m == reference or m in family)}
        if reference in complete and len(complete) > 1:
            print()
            significance(complete, reference)
    return acc


def show_all():
    """Every experiment's results in one pass - the whole project's findings."""
    print("=" * 78)
    print("  Cross-Subject Motor Imagery EEG Classification - all results")
    print("  Accuracy = share of trials whose imagined movement was identified")
    print("  correctly. Four classes, so 25.0% is chance.")
    print("=" * 78)
    for name, title, ref, family in EXPERIMENTS:
        summarise(ROOT / "results" / name, title, ref, family)
    print(f"\n{'=' * 78}\n  Figures: phase3/results_fig/ and phase3/eda/")
    print("  Full write-up including negative results: FINDINGS.md")
    print("=" * 78)


def main(path, reference=None):
    global PREFIX
    PREFIX = "" if Path(path).stem.startswith("e2") else Path(path).stem.split("_")[0] + "_"
    rows = load(path)
    print(f"{path}: {len(rows)} runs\n")
    acc = table(rows)
    print()
    confusions(rows)
    complexity(acc)
    tradeoff(acc)

    if reference:
        subjects = sorted({r["test_subject"] for r in rows})
        print()
        significance({m: [v[s] for s in subjects] for m, v in acc.items()}, reference)
    elif len(acc) > 1:
        print("\n  (pass a reference model name for the Wilcoxon comparison)")


if __name__ == "__main__":
    if "--all" in sys.argv or len(sys.argv) == 1:
        show_all()
        sys.exit()
    path = Path(sys.argv[1])
    if not path.exists():
        sys.exit(f"no results at {path} -- run phase3/loso.py first")
    main(path, sys.argv[2] if len(sys.argv) > 2 else None)
