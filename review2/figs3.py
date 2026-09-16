"""Additional figures for the expanded Phase 2 Solution Design document."""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle

NAVY   = "#1B3A6B"
NAVYD  = "#122847"
PURPLE = "#5B3E96"
PURPLL = "#8A6FC4"
STEEL  = "#4A6FA5"
GREY   = "#5A6478"
LGREY  = "#98A2B8"
CARD   = "#EFF3F9"
TINT   = "#E7E1F3"
RED    = "#B23A48"
GREEN  = "#2E7D5B"
AMBER  = "#B8860B"
WHITE  = "#FFFFFF"

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 9,
    "axes.edgecolor": "#C5CEDE", "axes.labelcolor": NAVYD, "text.color": NAVYD,
    "xtick.color": GREY, "ytick.color": GREY,
    "axes.spines.top": False, "axes.spines.right": False,
    "figure.dpi": 200, "savefig.dpi": 200, "savefig.facecolor": "white",
})
OUT = "fig/"


def rbox(ax, x, y, w, h, fc, ec=None, lw=1.0, r=0.6, z=2, ls="solid"):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
                 boxstyle=f"round,pad=0,rounding_size={r}",
                 linewidth=lw, edgecolor=(ec or fc), facecolor=fc, zorder=z, linestyle=ls))


def arrow(ax, x1, y1, x2, y2, c=LGREY, lw=1.4, ms=9, z=1, style="-|>"):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style,
                 mutation_scale=ms, linewidth=lw, color=c, zorder=z))


# ======================================================================
# A. BCI IV-2a trial timing
# ======================================================================
def f_trial():
    fig, ax = plt.subplots(figsize=(9.2, 3.4))
    fig.subplots_adjust(bottom=0.20, top=0.94, left=0.04, right=0.97)
    ax.set_xlim(-0.4, 8.4); ax.set_ylim(-1.3, 4.5); ax.axis("off")

    ax.plot([0, 8], [0, 0], color=NAVYD, lw=1.4, zorder=3)
    for t in range(0, 9):
        ax.plot([t, t], [-0.11, 0.11], color=NAVYD, lw=1.2, zorder=3)
        ax.text(t, -0.46, f"{t}", ha="center", fontsize=8.6, color=GREY)
    ax.text(4.0, -1.02, "time within trial (seconds)", ha="center", fontsize=9, color=NAVYD)

    phases = [
        (0.0, 2.0, "Fixation cross\nand warning tone", CARD, NAVYD),
        (2.0, 1.25, "Visual cue\n(arrow)", TINT, NAVYD),
        (3.25, 2.75, "Motor imagery\nperformed", "#D7E3F4", NAVYD),
        (6.0, 1.5, "Break", "#F4F5F8", GREY),
    ]
    for x, w, label, fc, tc in phases:
        rbox(ax, x, 0.28, w, 1.15, fc, r=0.05, z=2)
        ax.text(x + w / 2, 0.855, label, ha="center", va="center",
                fontsize=7.8, color=tc, linespacing=1.5, zorder=4)

    # analysis window, drawn entirely above the phase band
    ax.plot([2.5, 2.5], [0.28, 3.05], color=PURPLE, lw=1.1, ls="--", zorder=4)
    ax.plot([6.0, 6.0], [0.28, 3.05], color=PURPLE, lw=1.1, ls="--", zorder=4)
    ax.add_patch(Rectangle((2.5, 2.42), 3.5, 0.66, facecolor=PURPLE,
                           edgecolor="none", alpha=0.18, zorder=2))
    ax.text(4.25, 2.75, "Analysis window used in this project",
            ha="center", va="center", fontsize=8.8, fontweight="bold",
            color=PURPLE, zorder=5)
    ax.annotate("", xy=(2.5, 1.95), xytext=(6.0, 1.95),
                arrowprops=dict(arrowstyle="<|-|>", color=PURPLE, lw=1.1), zorder=5)
    ax.text(4.25, 2.12, "3.5 s  =  875 samples at 250 Hz", ha="center",
            fontsize=8.2, color=PURPLE, zorder=5)

    ax.annotate("cue onset\nt = 2.0 s", xy=(2.0, 0.28), xytext=(0.85, 2.05),
                fontsize=8.0, color=RED, ha="center", linespacing=1.5,
                arrowprops=dict(arrowstyle="-|>", color=RED, lw=1.1))

    ax.text(4.25, 4.02, "The window opens 0.5 s after the cue, so the visual response to the arrow is excluded,",
            ha="center", fontsize=8.1, color=GREY, style="italic")
    ax.text(4.25, 3.66, "and closes as the imagery period ends.",
            ha="center", fontsize=8.1, color=GREY, style="italic")
    fig.savefig(OUT + "f_trial.png"); plt.close(fig)


# ======================================================================
# B. Software module structure and data flow
# ======================================================================
def f_modules():
    fig, ax = plt.subplots(figsize=(9.2, 5.0))
    fig.subplots_adjust(bottom=0.03, top=0.97, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 116); ax.axis("off")

    mods = [
        (6, 92, 26, 19, "data/", "loaders.py\nsplits.py", CARD, NAVYD),
        (37, 92, 26, 19, "preprocessing/", "filters.py\nalign.py\naugment.py", CARD, NAVYD),
        (68, 92, 26, 19, "models/", "eegnet.py   atcnet.py\nctnet.py    conformer.py\nhctnet.py", NAVY, WHITE),
        (6, 60, 26, 19, "training/", "trainer.py\nloop.py\nschedules.py", NAVY, WHITE),
        (37, 60, 26, 19, "evaluation/", "loso.py\nmetrics.py\nstats.py", PURPLE, WHITE),
        (68, 60, 26, 19, "analysis/", "figures.py\ntables.py", CARD, NAVYD),
        (21, 30, 26, 16, "configs/", "*.yaml experiment\ndefinitions", TINT, NAVYD),
        (52, 30, 26, 16, "results/", "per-fold metrics\ncheckpoints, logs", TINT, NAVYD),
    ]
    for x, y, w, h, name, files, fc, tc in mods:
        rbox(ax, x, y, w, h, fc, r=0.7)
        ax.text(x + 1.8, y + h - 4.6, name, fontsize=9.4, fontweight="bold",
                color=tc, va="center")
        ax.text(x + 1.8, y + h - 9.0, files, fontsize=6.8,
                color=("#C6D2E6" if fc in (NAVY, PURPLE) else GREY),
                va="top", linespacing=1.55, family="DejaVu Sans Mono")

    def label(x, y, t, rot=0, c=STEEL):
        ax.text(x, y, t, fontsize=6.8, color=c, ha="center", va="center",
                rotation=rot, zorder=6,
                bbox=dict(boxstyle="round,pad=0.22", facecolor="white", edgecolor="none"))

    arrow(ax, 32, 101, 37, 101); label(34.5, 106.5, "raw\nepochs")
    arrow(ax, 63, 101, 68, 101); label(65.5, 106.5, "cached\ntensors")
    ax.plot([81, 81, 28], [92, 86, 86], color=LGREY, lw=1.4, zorder=1,
            solid_capstyle="round")
    arrow(ax, 28, 86, 28, 79)
    label(55, 86, "model definitions")
    arrow(ax, 19, 92, 19, 79); label(19, 85.5, "fold splits", 90)
    arrow(ax, 32, 69, 37, 69); label(34.5, 74.0, "trained\nmodel")
    arrow(ax, 63, 69, 68, 69); label(65.5, 74.0, "per-fold\nmetrics")
    arrow(ax, 34, 44, 19, 60); label(25, 51, "hyperparameters")
    arrow(ax, 47, 38, 52, 38)
    arrow(ax, 65, 44, 50, 60, c=LGREY, style="<|-"); label(60, 51, "metrics written")
    arrow(ax, 72, 44, 80, 60, c=LGREY, style="<|-"); label(79, 51, "read for figures")

    ax.text(50, 19, "Each module has one responsibility and one interface.",
            ha="center", fontsize=8.6, color=NAVYD, fontweight="bold")
    ax.text(50, 13.5,
            "Preprocessing writes cached tensors once; training reads them. Evaluation never touches raw data.",
            ha="center", fontsize=7.8, color=GREY, style="italic")
    ax.text(50, 8.4,
            "Every experiment is defined by a YAML file in configs/, so any reported number can be regenerated from its config.",
            ha="center", fontsize=7.8, color=GREY, style="italic")
    fig.savefig(OUT + "f_modules.png"); plt.close(fig)


# ======================================================================
# C. Qualitative assessment of candidate model families
# ======================================================================
def f_selection():
    fig, ax = plt.subplots(figsize=(8.8, 3.9))
    fig.subplots_adjust(bottom=0.11, top=0.97, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 74); ax.axis("off")

    crit = ["Parameter\nefficiency", "Long-range\ntemporal", "Data\nefficiency", "Cross-subject\nevidence"]
    rows = [
        ("FBCSP + LDA", "classical", [3, 1, 3, 2], False),
        ("Compact CNN (EEGNet)", "convolutional", [3, 1, 3, 2], False),
        ("Deep CNN (DeepConvNet)", "convolutional", [1, 2, 1, 1], False),
        ("Recurrent (LSTM / GRU)", "sequential", [2, 3, 1, 1], False),
        ("Pure Transformer", "attention", [1, 3, 1, 1], False),
        ("CNN + windowed attention", "hybrid", [2, 3, 2, 2], True),
    ]
    X0, CW, RH = 32, 15.5, 7.4
    for j, c in enumerate(crit):
        ax.text(X0 + j * CW + CW / 2, 59.0, c, ha="center", va="center",
                fontsize=7.6, color=GREY, fontweight="bold", linespacing=1.5)

    cols = {3: GREEN, 2: AMBER, 1: RED}
    names = {3: "High", 2: "Medium", 1: "Low"}
    for i, (name, kind, scores, chosen) in enumerate(rows):
        y = 52 - i * RH
        if chosen:
            rbox(ax, 0.5, y - 1.0, X0 + 4 * CW - 0.5, RH - 0.6, TINT, r=0.5, z=1)
        ax.text(2.5, y + 2.4, name, fontsize=8.6,
                fontweight=("bold" if chosen else "normal"),
                color=(PURPLE if chosen else NAVYD), va="center")
        ax.text(2.5, y - 0.4, kind, fontsize=6.8, color=GREY, va="center", style="italic")
        for j, sc in enumerate(scores):
            cx = X0 + j * CW + CW / 2
            rbox(ax, cx - 5.4, y - 0.6, 10.8, 4.6, cols[sc], r=0.45, z=3)
            ax.text(cx, y + 1.7, names[sc], ha="center", va="center",
                    fontsize=6.9, color=WHITE, fontweight="bold", zorder=4)
        if chosen:
            ax.text(X0 + 4 * CW + 1.5, y + 1.7, "selected", fontsize=7.6,
                    color=PURPLE, fontweight="bold", va="center")

    ax.text(0.5, 69.5, "Qualitative assessment of candidate model families",
            fontsize=10.2, fontweight="bold", color=NAVYD)
    ax.text(0.5, 3.0,
            "Ratings summarise the behaviour reported in the surveyed literature; they are a qualitative reading, not a measurement.",
            fontsize=7.4, color=GREY, style="italic")
    ax.text(0.5, -0.5,
            "No family scores well on all four criteria, which is why a hybrid was chosen rather than any single published architecture.",
            fontsize=7.4, color=GREY, style="italic")
    fig.savefig(OUT + "f_selection.png"); plt.close(fig)


if __name__ == "__main__":
    for f in [f_trial, f_modules, f_selection]:
        f(); print("ok:", f.__name__)
