"""Figures for the Phase 2 Solution Design document and presentation.

Cross-Subject Motor Imagery EEG Classification using Deep Learning.

Every figure is either plotted from published values that are cited in its caption,
or is an explicitly labelled schematic. No figure reports results from this project,
because no experiments have been run yet.
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Ellipse

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
WHITE  = "#FFFFFF"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 9,
    "axes.edgecolor": "#C5CEDE",
    "axes.labelcolor": NAVYD,
    "text.color": NAVYD,
    "xtick.color": GREY,
    "ytick.color": GREY,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "figure.dpi": 200,
    "savefig.dpi": 200,
    "savefig.facecolor": "white",
})

OUT = "fig/"


def rbox(ax, x, y, w, h, fc, ec=None, lw=1.0, r=0.6, z=2):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
                 boxstyle=f"round,pad=0,rounding_size={r}",
                 linewidth=lw, edgecolor=(ec or fc), facecolor=fc, zorder=z))


def arrow(ax, x1, y1, x2, y2, c=LGREY, lw=1.5, ms=10, z=1):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle="-|>",
                 mutation_scale=ms, linewidth=lw, color=c, zorder=z))


def head(ax, cx, cy, r, hotspots, label, fs=7.4):
    """Draw a simple scalp map. hotspots = list of (dx, dy, weight)."""
    g = 90
    gx, gy = np.meshgrid(np.linspace(-1, 1, g), np.linspace(-1, 1, g))
    z = np.zeros_like(gx)
    for dx, dy, w in hotspots:
        z += w * np.exp(-(((gx - dx) ** 2 + (gy - dy) ** 2) / 0.10))
    z[gx ** 2 + gy ** 2 > 1] = np.nan
    ax.imshow(z, extent=[cx - r, cx + r, cy - r, cy + r], origin="lower",
              cmap="RdBu_r", vmin=-1, vmax=1, interpolation="bilinear", zorder=2)
    ax.add_patch(Circle((cx, cy), r, fill=False, lw=1.3, color=NAVYD, zorder=3))
    ax.plot([cx, cx - 0.12 * r, cx, cx + 0.12 * r, cx],
            [cy + r * 1.28, cy + r * 1.02, cy + r * 1.28, cy + r * 1.02, cy + r * 1.28],
            color=NAVYD, lw=1.2, zorder=3)
    ax.add_patch(Ellipse((cx - r * 1.04, cy), r * 0.15, r * 0.34, fill=False, lw=1.2, color=NAVYD, zorder=3))
    ax.add_patch(Ellipse((cx + r * 1.04, cy), r * 0.15, r * 0.34, fill=False, lw=1.2, color=NAVYD, zorder=3))
    if label:
        ax.text(cx, cy - r * 1.45, label, ha="center", fontsize=fs,
                fontweight="bold", color=NAVYD, zorder=4)


# ======================================================================
# 1. Cross-subject performance drop (published values)
# ======================================================================
def f_gap():
    fig, ax = plt.subplots(figsize=(6.2, 3.0))
    fig.subplots_adjust(bottom=0.24, left=0.12, right=0.97, top=0.86)
    labels = ["CTNet\nBCI IV-2a (4-class)", "CTNet\nBCI IV-2b (2-class)"]
    within, cross = [82.52, 88.49], [58.64, 76.27]
    x = np.arange(2); w = 0.28

    ax.bar(x - w / 2, within, w, label="Same subjects in training and test", color=NAVY, zorder=3)
    ax.bar(x + w / 2, cross, w, label="Test subject unseen during training", color=PURPLL, zorder=3)
    for xi, (a, b) in enumerate(zip(within, cross)):
        ax.text(xi - w / 2, a + 1.5, f"{a:.2f}%", ha="center", fontsize=9, color=NAVY)
        ax.text(xi + w / 2, b + 1.5, f"{b:.2f}%", ha="center", fontsize=9, color=PURPLE)
        top = max(a, b) + 9.5
        ax.plot([xi - w / 2, xi - w / 2, xi + w / 2, xi + w / 2],
                [a + 3.5, top, top, b + 3.5], color=RED, lw=0.9, zorder=5)
        ax.text(xi, top + 2.0, f"\u2212{a - b:.2f} points", ha="center",
                fontsize=8.6, color=RED, fontweight="bold", zorder=6)
    ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=8.8)
    ax.set_ylim(0, 118); ax.set_ylabel("Classification accuracy (%)", fontsize=9)
    ax.grid(axis="y", color="#E9EEF6", zorder=0); ax.set_axisbelow(True)
    ax.legend(frameon=False, fontsize=8, loc="upper center",
              bbox_to_anchor=(0.5, 1.16), ncol=2, handlelength=1.4, columnspacing=1.6)
    fig.text(0.5, 0.03, "Values reported by Zhao et al., Scientific Reports 14:20237 (2024).",
             ha="center", fontsize=7.5, color=GREY, style="italic")
    fig.savefig(OUT + "f_gap.png"); plt.close(fig)


# ======================================================================
# 2. Motor imagery physiology
# ======================================================================
def f_erd():
    fig = plt.figure(figsize=(8.8, 2.9))
    fig.subplots_adjust(bottom=0.26, top=0.86, left=0.06, right=0.98, wspace=0.30)
    gs = fig.add_gridspec(1, 3, width_ratios=[2.1, 1, 1])

    ax = fig.add_subplot(gs[0, 0])
    t = np.linspace(-1, 4, 2400)
    rng = np.random.default_rng(3)
    env = np.where(t < 0, 1.0, 1.0 - 0.55 * np.exp(-((t - 1.4) ** 2) / 2.2))
    ax.plot(t, env * np.sin(2 * np.pi * 10.5 * t) + rng.normal(0, 0.05, t.size),
            color=STEEL, lw=0.6, alpha=0.9)
    ax.plot(t, env, color=RED, lw=1.7); ax.plot(t, -env, color=RED, lw=1.7)
    ax.axvline(0, color=NAVYD, lw=1.0, ls="--")
    ax.text(0.07, 1.40, "cue", fontsize=8, color=NAVYD)
    ax.axvspan(0.5, 4.0, color=PURPLE, alpha=0.08)
    ax.text(2.25, -1.44, "analysis window, 0.5 to 4.0 s", fontsize=7.6, color=PURPLE, ha="center")
    ax.annotate("mu power falls during\nmotor imagery", xy=(1.5, 0.47), xytext=(2.65, 1.10),
                fontsize=8, color=RED, ha="center", linespacing=1.5,
                arrowprops=dict(arrowstyle="-|>", color=RED, lw=1.0))
    ax.set_xlim(-1, 4); ax.set_ylim(-1.65, 1.65); ax.set_yticks([])
    ax.set_xlabel("time from cue (s)", fontsize=8.5)
    ax.set_title("Event-related desynchronisation in the mu band (8–13 Hz)",
                 fontsize=9.5, fontweight="bold", pad=8)

    for k, (side, title) in enumerate([(1, "Left-hand imagery"), (-1, "Right-hand imagery")]):
        a = fig.add_subplot(gs[0, k + 1]); a.set_xlim(-1.5, 1.5); a.set_ylim(-1.6, 1.5); a.axis("off")
        head(a, 0, 0, 1.0, [(0.45 * side, 0.05, -1.0), (-0.45 * side, 0.05, 0.28)], "")
        for px, lbl in [(-0.45, "C3"), (0, "Cz"), (0.45, "C4")]:
            a.plot(px, 0.05, "o", ms=3.8, color=NAVYD, zorder=5)
            a.text(px, -0.22, lbl, fontsize=7.2, ha="center", color=NAVYD, fontweight="bold", zorder=5)
        a.set_title(title, fontsize=8.8, fontweight="bold", pad=6)

    fig.text(0.5, 0.045,
             "Schematic. Blue indicates suppressed mu power. Activity appears on the side of the head opposite "
             "the imagined hand, which is the\npattern a correctly trained decoder is expected to rely on.",
             ha="center", fontsize=7.5, color=GREY, style="italic", linespacing=1.6)
    fig.savefig(OUT + "f_erd.png"); plt.close(fig)


# ======================================================================
# 3. Four motor imagery classes
# ======================================================================
def f_classes():
    fig, ax = plt.subplots(figsize=(8.6, 2.5))
    fig.subplots_adjust(bottom=0.10, top=0.97, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 30); ax.axis("off")
    classes = [
        ("Left hand",  [(0.45, 0.05, -1.0), (-0.45, 0.05, 0.25)], "right hemisphere, near C4"),
        ("Right hand", [(-0.45, 0.05, -1.0), (0.45, 0.05, 0.25)], "left hemisphere, near C3"),
        ("Feet",       [(0.0, 0.18, -1.0)],                        "central midline, near Cz"),
        ("Tongue",     [(-0.5, -0.15, -0.75), (0.5, -0.15, -0.75)], "bilateral, lower lateral"),
    ]
    w, gap = 22.0, 4.0
    for i, (name, spots, note) in enumerate(classes):
        x = i * (w + gap)
        rbox(ax, x, 1.0, w, 28.0, CARD, r=0.6)
        ax.text(x + w / 2, 26.6, name, ha="center", fontsize=10,
                fontweight="bold", color=NAVYD, zorder=5)
        sub = fig.add_axes([0.02 + i * (w + gap) / 100 + 0.055, 0.22, 0.125, 0.52])
        sub.set_xlim(-1.45, 1.45); sub.set_ylim(-1.45, 1.45); sub.axis("off")
        head(sub, 0, 0, 1.0, spots, "")
        ax.text(x + w / 2, 4.2, note, ha="center", fontsize=7.4, color=GREY, zorder=5)
    fig.savefig(OUT + "f_classes.png"); plt.close(fig)


# ======================================================================
# 4. Evolution of architectures across the four surveyed papers
# ======================================================================
def f_evolution():
    fig, ax = plt.subplots(figsize=(9.4, 3.0))
    fig.subplots_adjust(bottom=0.06, top=0.94, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 36); ax.axis("off")

    items = [
        ("EEGNet", "2018", "Compact CNN",
         "Depthwise and separable\nconvolution", "2,548 parameters", CARD, NAVYD),
        ("ATCNet", "2023", "CNN + attention + TCN",
         "Sliding-window attention\nover temporal features", "113,732 parameters", CARD, NAVYD),
        ("EEG Conformer", "2023", "CNN + Transformer",
         "Convolution then global\nself-attention", "78.66% within-subject", CARD, NAVYD),
        ("CTNet", "2024", "CNN + Transformer",
         "EEGNet front end,\n6-layer Transformer encoder", "82.52% within-subject", CARD, NAVYD),
    ]
    w, gap = 21.0, 5.3
    for i, (name, yr, kind, desc, stat, fc, tc) in enumerate(items):
        x = i * (w + gap)
        rbox(ax, x, 5.0, w, 26.0, fc, r=0.6)
        ax.text(x + 1.6, 27.4, yr, fontsize=7.6, color=PURPLE, fontweight="bold")
        ax.text(x + 1.6, 23.2, name, fontsize=10.5, fontweight="bold", color=tc)
        ax.text(x + 1.6, 19.4, kind, fontsize=8.0, color=STEEL)
        ax.text(x + 1.6, 15.8, desc, fontsize=7.6, color=GREY, va="top", linespacing=1.6)
        ax.text(x + 1.6, 7.2, stat, fontsize=7.4, color=NAVY, style="italic")
        if i < len(items) - 1:
            arrow(ax, x + w + 0.7, 18.0, x + w + gap - 0.7, 18.0, c=LGREY, lw=1.4, ms=10)

    ax.text(0, 1.2, "Increasing capacity to model long-range temporal structure",
            fontsize=8.2, color=GREY, style="italic")
    ax.text(100, 1.2, "Increasing parameter count and data requirement",
            fontsize=8.2, color=GREY, style="italic", ha="right")
    ax.annotate("", xy=(99, 3.4), xytext=(1, 3.4),
                arrowprops=dict(arrowstyle="-|>", color=PURPLL, lw=1.6))
    fig.savefig(OUT + "f_evolution.png"); plt.close(fig)


# ======================================================================
# 5. High-level system architecture
# ======================================================================
def f_sysarch():
    fig, ax = plt.subplots(figsize=(9.8, 2.8))
    fig.subplots_adjust(bottom=0.04, top=0.96, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 33); ax.axis("off")

    stages = [
        ("Raw EEG", "22 channels\n250 Hz\n4-second trial", CARD, NAVYD),
        ("Preprocessing", "Band-pass filter\nEpoch and align\nNormalise", CARD, NAVYD),
        ("CNN feature\nextraction", "Temporal conv\nDepthwise spatial\nSeparable conv", NAVY, WHITE),
        ("Temporal\nattention", "Windowed\nmulti-head\nself-attention", PURPLE, WHITE),
        ("Feature\nrepresentation", "Fusion and\nglobal pooling", CARD, NAVYD),
        ("Classification\nlayer", "Fully connected\nand softmax", CARD, NAVYD),
        ("Predicted\nclass", "Left hand, right\nhand, feet\nor tongue", TINT, NAVYD),
    ]
    w, gap = 12.4, 1.95
    for i, (title, body, fc, tc) in enumerate(stages):
        x = i * (w + gap)
        rbox(ax, x, 3.4, w, 26.0, fc, r=0.55)
        ax.text(x + w / 2, 27.0, title, ha="center", va="top", fontsize=8.2,
                fontweight="bold", color=tc, linespacing=1.45, zorder=5)
        ax.text(x + w / 2, 15.0, body, ha="center", va="top", fontsize=6.9,
                color=("#CBD6E8" if fc in (NAVY, PURPLE) else GREY),
                linespacing=1.65, zorder=5)
        if i < len(stages) - 1:
            arrow(ax, x + w + 0.25, 16.4, x + w + gap - 0.25, 16.4, c=LGREY, lw=1.4, ms=9)

    ax.text(50, 0.5, "The two shaded blocks are the learned stages that together form the proposed hybrid model.",
            ha="center", fontsize=7.8, color=GREY, style="italic")
    fig.savefig(OUT + "f_sysarch.png"); plt.close(fig)


# ======================================================================
# 6. Proposed model, block level
# ======================================================================
def f_model():
    fig, ax = plt.subplots(figsize=(8.2, 7.4))
    fig.subplots_adjust(bottom=0.02, top=0.98, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 174); ax.axis("off")

    BOX_X, BOX_W = 9, 61
    rows = [
        (140, 13, "Input EEG trial", "22 channels x 875 samples, 0.5 to 4.0 s after cue",
         "22 x 875", CARD, NAVYD, None),
        (123, 13, "Preprocessing", "Band-pass 4–38 Hz, alignment, normalisation",
         "22 x 875", CARD, NAVYD, None),
        (106, 13, "Temporal convolution", "F1 = 16 filters, kernel (1, 64)",
         "16 x 22 x 875", NAVY, WHITE, "EEGNet"),
        (89, 13, "Depthwise spatial convolution", "D = 2, kernel (22, 1), max-norm 1.0",
         "32 x 1 x 875", NAVY, WHITE, "EEGNet"),
        (75, 10, "Batch norm, ELU, pool (1,4), dropout", "",
         "32 x 1 x 218", CARD, NAVYD, None),
        (58, 13, "Separable convolution, pool (1,8)", "F2 = 32 filters, kernel (1, 16)",
         "32 x 1 x 27", NAVY, WHITE, "EEGNet"),
        (41, 13, "Windowed self-attention", "5 overlapping windows, 2 heads, 2 layers",
         "32 x 27", PURPLE, WHITE, "ATCNet / Conformer"),
        (27, 10, "Fusion and global average pooling", "",
         "32", CARD, NAVYD, None),
        (13, 10, "Fully connected layer, softmax", "",
         "4", TINT, NAVYD, None),
    ]
    for y, h, title, sub, shape, fc, tc, badge in rows:
        rbox(ax, BOX_X, y, BOX_W, h, fc, r=0.8)
        ty = y + h - 4.8 if sub else y + h / 2
        ax.text(BOX_X + 3.0, ty, title, fontsize=11.0, fontweight="bold", color=tc, va="center")
        if sub:
            ax.text(BOX_X + 3.0, y + 3.9, sub, fontsize=8.8,
                    color=("#C6D2E6" if fc in (NAVY, PURPLE) else GREY), va="center")
        ax.text(BOX_X + BOX_W + 3.5, y + h / 2, shape, fontsize=9.0, color=NAVY,
                va="center", family="DejaVu Sans Mono")
        if badge:
            bw = 4.0 + 0.92 * len(badge)
            bx = BOX_X + BOX_W - 2.2 - bw
            rbox(ax, bx, y + h - 6.6, bw, 4.2, ("#3A5D94" if fc == NAVY else "#7A5CB5"), r=0.5, z=4)
            ax.text(bx + bw / 2, y + h - 4.5, badge, fontsize=7.4, color=WHITE,
                    ha="center", va="center", zorder=5, fontweight="bold")

    for i in range(len(rows) - 1):
        top_of_lower = rows[i + 1][0] + rows[i + 1][1]
        arrow(ax, BOX_X + BOX_W / 2, rows[i][0] - 0.5, BOX_X + BOX_W / 2, top_of_lower + 0.5,
              c=LGREY, lw=1.3, ms=8)

    ax.text(BOX_X, 170, "Proposed model: HCT-Net", fontsize=14.0, fontweight="bold", color=NAVYD)
    ax.text(BOX_X, 165.8, "Hybrid Convolution–Transformer Network", fontsize=10.5, color=PURPLE)
    ax.text(BOX_X, 161.0, "Right-hand labels give tensor shapes for BCI IV-2a. Badges name the surveyed",
            fontsize=8.8, color=GREY)
    ax.text(BOX_X, 157.6, "paper each component is adapted from.", fontsize=8.8, color=GREY)
    fig.savefig(OUT + "f_model.png"); plt.close(fig)


# ======================================================================
# 7. Methodology pipeline
# ======================================================================
def f_method():
    fig, ax = plt.subplots(figsize=(9.6, 2.9))
    fig.subplots_adjust(bottom=0.04, top=0.96, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 34); ax.axis("off")
    steps = ["Data\ncollection", "Preprocessing", "Exploratory\ndata analysis",
             "Feature\nextraction", "Model\ntraining", "LOSO\nevaluation",
             "Performance\nanalysis"]
    w, gap = 12.5, 1.9
    for i, s in enumerate(steps):
        x = i * (w + gap)
        fc = NAVY if i in (3, 4, 5) else CARD
        tc = WHITE if i in (3, 4, 5) else NAVYD
        rbox(ax, x, 5.0, w, 24.0, fc, r=0.55)
        ax.add_patch(Circle((x + w / 2, 24.6), 1.75,
                            facecolor=(PURPLL if fc == NAVY else NAVY), zorder=4))
        ax.text(x + w / 2, 24.6, str(i + 1), ha="center", va="center", fontsize=9.6,
                color=WHITE, fontweight="bold", zorder=5)
        ax.text(x + w / 2, 14.0, s, ha="center", va="center", fontsize=10.4,
                color=tc, linespacing=1.6, zorder=5)
        if i < len(steps) - 1:
            arrow(ax, x + w + 0.25, 17.0, x + w + gap - 0.25, 17.0, c=LGREY, lw=1.5, ms=11)
    fig.savefig(OUT + "f_method.png"); plt.close(fig)


# ======================================================================
# 8. LOSO concept
# ======================================================================
def f_loso_concept():
    fig, ax = plt.subplots(figsize=(9.4, 3.0))
    fig.subplots_adjust(bottom=0.06, top=0.94, left=0.02, right=0.98)
    ax.set_xlim(0, 100); ax.set_ylim(0, 34); ax.axis("off")

    # eight training subjects
    rbox(ax, 0, 4.0, 20.5, 26.0, CARD, r=0.6)
    ax.text(10.2, 26.6, "Training subjects", ha="center", fontsize=8.8,
            fontweight="bold", color=NAVYD)
    for i in range(8):
        cx = 3.4 + (i % 4) * 4.6
        cy = 19.0 - (i // 4) * 7.4
        ax.add_patch(Circle((cx, cy), 1.65, facecolor=NAVY, zorder=4))
        ax.text(cx, cy, f"S{i+1}", ha="center", va="center", fontsize=6.0,
                color=WHITE, zorder=5)
    ax.text(10.2, 6.2, "7 train + 1 validation", ha="center", fontsize=7.4,
            color=GREY, style="italic")

    blocks = [
        (25.5, 18.5, "Model training", "Proposed model learns\npatterns shared across\nthese subjects", NAVY, WHITE),
        (48.0, 17.5, "Unseen test subject", "Never seen during\ntraining; supplies only\nunlabelled trials", PURPLE, WHITE),
        (69.5, 14.5, "Prediction", "Four-class motor\nimagery output", CARD, NAVYD),
        (86.5, 13.5, "Evaluation", "Accuracy, kappa,\nprecision, recall, F1", TINT, NAVYD),
    ]
    for x, w, title, body, fc, tc in blocks:
        rbox(ax, x, 4.0, w, 26.0, fc, r=0.6)
        ax.text(x + w / 2, 25.0, title, ha="center", fontsize=8.8,
                fontweight="bold", color=tc, zorder=5)
        ax.text(x + w / 2, 18.4, body, ha="center", va="center", fontsize=7.2,
                color=("#CBD6E8" if fc in (NAVY, PURPLE) else GREY),
                linespacing=1.7, zorder=5)

    for x1, x2 in [(20.5, 25.5), (44.0, 48.0), (65.5, 69.5), (84.0, 86.5)]:
        arrow(ax, x1 + 0.4, 17.0, x2 - 0.4, 17.0, c=LGREY, lw=1.5, ms=10)

    ax.text(50, 0.8, "This rotates nine times so that every subject serves as the unseen test subject exactly once.",
            ha="center", fontsize=8.0, color=GREY, style="italic")
    fig.savefig(OUT + "f_loso_concept.png"); plt.close(fig)


# ======================================================================
# 9. LOSO fold matrix
# ======================================================================
def f_loso_folds():
    fig, ax = plt.subplots(figsize=(6.6, 3.2))
    fig.subplots_adjust(bottom=0.16, top=0.86, left=0.13, right=0.98)
    n = 9
    M = np.zeros((n, n), dtype=int)
    for f in range(n):
        M[f, f] = 2
        M[f, (f + 1) % n] = 1
    cmap = matplotlib.colors.ListedColormap([CARD, "#8A6FC4", NAVY])
    ax.imshow(M, cmap=cmap, aspect="auto", vmin=0, vmax=2)
    for f in range(n):
        for s in range(n):
            t = {0: "train", 1: "val", 2: "TEST"}[M[f, s]]
            ax.text(s, f, t, ha="center", va="center", fontsize=6.6,
                    color=(WHITE if M[f, s] else GREY))
    ax.set_xticks(range(n)); ax.set_xticklabels([f"S{i+1}" for i in range(n)], fontsize=8.5)
    ax.set_yticks(range(n)); ax.set_yticklabels([f"Fold {i+1}" for i in range(n)], fontsize=8)
    ax.xaxis.set_label_position("top"); ax.xaxis.tick_top()
    ax.set_xlabel("Subject", fontsize=9, labelpad=7)
    for sp in ax.spines.values():
        sp.set_visible(False)
    ax.set_xticks(np.arange(-.5, n, 1), minor=True)
    ax.set_yticks(np.arange(-.5, n, 1), minor=True)
    ax.grid(which="minor", color="white", linewidth=2.0)
    ax.tick_params(which="minor", length=0)
    fig.text(0.5, 0.035,
             "One subject is held out for testing and a second for validation, so model selection never uses the test subject.",
             ha="center", fontsize=7.4, color=GREY, style="italic")
    fig.savefig(OUT + "f_loso_folds.png"); plt.close(fig)


# ======================================================================
# 10. Implementation timeline
# ======================================================================
def f_timeline():
    fig, ax = plt.subplots(figsize=(8.8, 3.6))
    fig.subplots_adjust(bottom=0.24, top=0.96, left=0.33, right=0.97)
    tasks = [
        ("Dataset preparation and EDA",     0, 3, NAVY),
        ("Preprocessing pipeline",          3, 2, NAVY),
        ("Baseline implementation",         5, 4, NAVY),
        ("Proposed model implementation",   9, 3, PURPLE),
        ("Training and tuning",            12, 2, PURPLE),
        ("LOSO experiments",               14, 2, PURPLE),
        ("Comparison and analysis",        16, 1, STEEL),
        ("Report and figures",             17, 1, RED),
    ]
    for i, (name, s, d, c) in enumerate(tasks):
        y = len(tasks) - i - 1
        ax.barh(y, d, left=s, height=0.56, color=c, zorder=3)
        ax.text(s + d + 0.25, y, f"{d}d", va="center", fontsize=9.6, color=GREY)
    ax.set_yticks(range(len(tasks)))
    ax.set_yticklabels([t[0] for t in reversed(tasks)], fontsize=11.0)
    ax.set_xticks([0, 3, 5, 9, 12, 14, 16, 18])
    ax.set_xticklabels(["1", "4", "6", "10", "13", "15", "17", "18"], fontsize=9.8)
    ax.set_xlabel("Day of the implementation window", fontsize=10, labelpad=7)
    ax.set_xlim(0, 19.4)
    ax.grid(axis="x", color="#EDF1F8", zorder=0); ax.set_axisbelow(True)
    ax.axvline(18, color=RED, ls="--", lw=1.1, zorder=4)
    for sp in ["left", "bottom"]:
        ax.spines[sp].set_color("#D5DCEA")
    fig.text(0.65, 0.03, "Durations shown in days; the sequence matters more than the calendar",
             ha="center", fontsize=9.0, color=GREY, style="italic")
    fig.savefig(OUT + "f_timeline.png"); plt.close(fig)


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    for f in [f_gap, f_erd, f_classes, f_evolution, f_sysarch, f_model,
              f_method, f_loso_concept, f_loso_folds, f_timeline]:
        f(); print("ok:", f.__name__)
