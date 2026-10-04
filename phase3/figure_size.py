"""Step 10 - accuracy against parameter count, the figure Phase 2 section 17 promises.

Our four size configurations, measured identically (protocol v2, LOSO, three seeds,
875 samples, bn adaptation), with EEGNet on the same protocol and ATCNet from the
v1 run marked as references. Protocols are distinguished in the legend rather than
mixed silently.

    py phase3/figure_size.py
"""
import csv
import sys
from pathlib import Path

import matplotlib
import numpy as np

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from protocol import OUT  # noqa: E402

FIGURES = Path(__file__).resolve().parent / "results_fig"
SEEDS = (0, 1, 2)
# config -> (run name, file prefix, parameters)
CFG = {"A": ("sizea", "step10", 3_924), "B": ("sizeb", "step10", 6_148),
       "C": ("sizec", "step10", 12_452), "D": ("base", "step9", 20_996)}
PURPLE, GREY, TEAL = "#5B3E96", "#8C96AC", "#1B7F79"


def seed_means(name, step, variant, split="test"):
    """One mean per seed, each over the nine folds."""
    out = []
    for seed in SEEDS:
        rows = [100 * float(r[f"{split}_acc"]) for r in
                csv.DictReader((OUT / f"{step}_{name}_seed{seed}.csv").open(encoding="utf-8"))
                if r["variant"] == variant]
        out.append(np.mean(rows))
    return np.array(out)


def v1_loso(model):
    rows = [100 * float(r["accuracy"]) for r in
            csv.DictReader((OUT.parent / "e2_loso.csv").open(encoding="utf-8"))
            if r["model"] == model]
    return float(np.mean(rows))


def main():
    params = np.array([CFG[k][2] for k in "ABCD"])
    adapted = np.array([seed_means(*CFG[k][:2], "bn").mean() for k in "ABCD"])
    err = np.array([seed_means(*CFG[k][:2], "bn").std(ddof=1) for k in "ABCD"])
    plain = np.array([seed_means(*CFG[k][:2], "none").mean() for k in "ABCD"])

    fig, ax = plt.subplots(figsize=(7.4, 4.8))
    ax.errorbar(params, adapted, yerr=err, color=PURPLE, marker="D", ms=7, lw=1.8,
                capsize=3, zorder=3, label="HCT-Net, with adaptation (3 seeds)")
    ax.plot(params, plain, color=PURPLE, marker="o", ms=5, lw=1.2, ls="--", alpha=0.55,
            zorder=2, label="HCT-Net, no adaptation")
    for k, x, y in zip("ABCD", params, adapted):
        ax.annotate(f"{k}\n{x:,}", (x, y), textcoords="offset points", xytext=(0, 12),
                    ha="center", fontsize=8.5, color=PURPLE)

    eegnet = seed_means("eegnet", "step8", "bn").mean()
    ax.scatter(3_188, eegnet, s=90, marker="s", color=TEAL, zorder=4,
               label=f"EEGNet, same protocol ({eegnet:.1f}%)")
    atcnet = v1_loso("ATCNet")
    ax.scatter(113_732, atcnet, s=90, marker="^", facecolor="white", edgecolor=GREY,
               linewidth=1.5, zorder=4,
               label=f"ATCNet, v1 protocol, no adaptation ({atcnet:.1f}%)")
    ax.axhline(25, color=GREY, lw=0.8, ls=":", zorder=1)
    ax.annotate("chance, 4 classes", (3_100, 25.6), fontsize=8, color=GREY)

    ax.set(xscale="log", xlabel="trainable parameters (log scale)",
           ylabel="cross-subject accuracy (%)", ylim=(22, 60),
           title="Accuracy does not grow with model size\n"
                 "BCI IV-2a, leave-one-subject-out, 875-sample window")
    ax.grid(alpha=0.3, zorder=0)
    ax.legend(loc="lower left", fontsize=8.5, frameon=True, framealpha=0.95)
    FIGURES.mkdir(exist_ok=True)
    out = FIGURES / "accuracy_vs_parameters.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    print(f"  wrote {out.relative_to(Path.cwd()) if out.is_relative_to(Path.cwd()) else out}")

    print(f"\n{'cfg':4}{'params':>9}{'no adapt':>10}{'adapted':>9}{'sd':>6}")
    for k, p, n, a, e in zip("ABCD", params, plain, adapted, err):
        print(f"{k:4}{p:>9,}{n:>10.1f}{a:>9.1f}{e:>6.2f}")
    print(f"{'EEGNet':4}{3188:>9,}{seed_means('eegnet', 'step8', 'none').mean():>10.1f}"
          f"{eegnet:>9.1f}")
    print(f"{'ATCNet':4}{113732:>9,}{atcnet:>10.1f}{'-':>9}  (v1 protocol, one seed)")


if __name__ == "__main__":
    main()
