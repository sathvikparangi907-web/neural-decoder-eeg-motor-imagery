"""Figure set for the Phase 2 methodology document and review deck.

Every figure is either (a) plotted from published numbers that are cited in the
caption, or (b) a labelled schematic / synthetic demonstration.  No figure shows
experimental results from this project, because none exist yet.
"""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle, Ellipse
import matplotlib.patheffects as pe

DARK   = "#14163A"
INDIGO = "#2E3A8C"
TEAL   = "#00BFC9"
TEALD  = "#0E9AA3"
CORAL  = "#FF6B5B"
GREY   = "#5B6478"
LGREY  = "#9AA3BC"
LIGHT  = "#F4F7FC"
CARD   = "#EDF1F9"
WHITE  = "#FFFFFF"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 9,
    "axes.edgecolor": "#C9D2E4",
    "axes.labelcolor": DARK,
    "text.color": DARK,
    "xtick.color": GREY,
    "ytick.color": GREY,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "figure.dpi": 200,
    "savefig.dpi": 200,
    "savefig.bbox": "tight",
    "savefig.facecolor": "white",
})

OUT = "fig/"


def rbox(ax, x, y, w, h, fc, ec=None, lw=1.0, r=0.018, z=2):
    p = FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}",
                       linewidth=lw, edgecolor=ec or fc, facecolor=fc, zorder=z)
    ax.add_patch(p)
    return p


def arrow(ax, x1, y1, x2, y2, c=LGREY, lw=1.6, z=1, style="-|>", ms=9):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style,
                                 mutation_scale=ms, linewidth=lw, color=c, zorder=z))


# ======================================================================
# 1. The generalisation gap  (published numbers, cited)
# ======================================================================
def fig_gap():
    fig, ax = plt.subplots(figsize=(6.4, 3.0))
    labels = ["BCI IV-2a\n(4-class)", "BCI IV-2b\n(2-class)"]
    within = [82.52, 88.49]
    cross = [58.64, 76.27]
    x = np.arange(len(labels)); w = 0.3

    ax.bar(x - w/2, within, w, label="Within-subject", color=INDIGO, zorder=3)
    ax.bar(x + w/2, cross,  w, label="Cross-subject (unseen person)", color=CORAL, zorder=3)

    for xi, (a, b) in enumerate(zip(within, cross)):
        ax.text(xi - w/2, a + 1.2, f"{a:.2f}%", ha="center", fontsize=9.5, fontweight="bold", color=INDIGO)
        ax.text(xi + w/2, b + 1.2, f"{b:.2f}%", ha="center", fontsize=9.5, fontweight="bold", color=CORAL)
        ax.annotate("", xy=(xi + w/2, b), xytext=(xi - w/2, a),
                    arrowprops=dict(arrowstyle="-|>", color=GREY, lw=1.2,
                                    connectionstyle="arc3,rad=-0.35"), zorder=4)
        ax.text(xi, (a + b) / 2 + 4.0, f"−{a-b:.2f} pts", ha="center", fontsize=9,
                style="italic", color=GREY)

    ax.set_xticks(x); ax.set_xticklabels(labels, fontsize=9.5)
    ax.set_ylim(0, 104); ax.set_ylabel("Classification accuracy (%)")
    ax.grid(axis="y", color="#E8EDF7", zorder=0)
    ax.set_axisbelow(True)
    ax.legend(frameon=False, fontsize=8.5, loc="lower left", bbox_to_anchor=(0, -0.02))
    ax.axhline(25, color=LGREY, ls=":", lw=1)
    ax.text(1.48, 26.5, "chance, 4-class", fontsize=7.5, color=LGREY, ha="right")
    fig.savefig(OUT + "fig_gap.png"); plt.close(fig)


# ======================================================================
# 2. Euclidean Alignment — synthetic demonstration of the actual maths
# ======================================================================
def fig_ea():
    """Subject differences modelled as a subject-specific SPD mixing S_s applied to a
    shared source geometry Q.  This is the case Euclidean Alignment is designed for:
    R_s = S_s Q C Q^T S_s, so R_s^{-1/2} recovers the shared representation."""
    rng = np.random.default_rng(11)
    n, T = 200, 300
    th = 0.6
    Q = np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]])   # shared geometry
    Ss = [np.array([[1.00, 0.00], [0.00, 1.00]]),                          # subject-specific
          np.array([[1.90, 0.55], [0.55, 0.75]]),                          # SPD "head" matrices
          np.array([[0.62, -0.38], [-0.38, 1.65]])]

    subjects = []
    for S in Ss:
        trials, lab = [], []
        for i in range(n):
            c = i % 2
            amp = np.array([[1.45], [0.55]]) if c == 0 else np.array([[0.55], [1.45]])
            src = rng.normal(size=(2, T)) * amp
            trials.append(S @ Q @ src)
            lab.append(c)
        subjects.append((np.array(trials), np.array(lab)))

    def feats(tr):
        return np.log(tr.var(axis=2) + 1e-9)

    def align(tr):
        R = np.mean([X @ X.T / X.shape[1] for X in tr], axis=0)
        w, V = np.linalg.eigh(R)
        return np.array([V @ np.diag(w ** -0.5) @ V.T @ X for X in tr])

    fig, axes = plt.subplots(1, 2, figsize=(7.6, 3.3))
    fig.subplots_adjust(bottom=0.30, wspace=0.28)
    cols = [INDIGO, TEALD, CORAL]
    marks = ["o", "^", "s"]
    for k, (tr, lab) in enumerate(subjects):
        for ax, data in zip(axes, [tr, align(tr)]):
            F = feats(data)
            for c, alpha in [(0, 0.95), (1, 0.30)]:
                m = lab == c
                ax.scatter(F[m, 0], F[m, 1], s=13, marker=marks[k], c=cols[k],
                           alpha=alpha, linewidths=0, zorder=3,
                           label=(f"Subject {k+1}" if c == 0 else None))

    axes[0].set_title("Before alignment", fontsize=10.5, fontweight="bold", color=DARK, pad=9)
    axes[1].set_title("After Euclidean Alignment", fontsize=10.5, fontweight="bold", color=TEALD, pad=9)
    for ax in axes:
        ax.set_xlabel("log-variance, channel 1", fontsize=8.5)
        ax.grid(color="#EEF2FA", zorder=0)
        ax.set_axisbelow(True)
    axes[0].set_ylabel("log-variance, channel 2", fontsize=8.5)
    axes[0].legend(frameon=False, fontsize=8, loc="best")
    fig.text(0.5, 0.055,
             "Synthetic two-channel data. All three subjects share the same class structure but each has its own\n"
             "spatial mixing. The transform applied is the real one, X\u0303 = R\u207b\u00b9\u141f\u00b2 X. Solid and faded markers are the two classes.",
             ha="center", fontsize=7.7, color=GREY, style="italic", linespacing=1.6)
    fig.savefig(OUT + "fig_ea.png", bbox_inches=None)
    plt.close(fig)


# ======================================================================
# 3. Preprocessing / methodology pipeline
# ======================================================================
def fig_pipeline():
    fig, ax = plt.subplots(figsize=(9.6, 2.5))
    ax.set_xlim(0, 100); ax.set_ylim(0, 30); ax.axis("off")

    stages = [
        ("1", "Acquisition",    "Load epochs\nSelect 22 EEG channels\nReject > 100 µV", CARD, DARK),
        ("2", "Conditioning",   "Band-pass 4–38 Hz\nEuclidean Alignment\nNormalise", DARK, WHITE),
        ("3", "Encoding",       "Depthwise convolution\nMulti-scale temporal\nWindowed attention", DARK, WHITE),
        ("4", "Objective",      "Cross-entropy\n+ contrastive\n+ adversarial", CARD, DARK),
        ("5", "Interpretation", "Activation topography\nAttention maps", CARD, DARK),
    ]
    w, gap = 17.6, 3.0
    for i, (n, title, body, fc, tc) in enumerate(stages):
        x = i * (w + gap)
        rbox(ax, x, 2.6, w, 23.0, fc, r=0.6)
        ax.add_patch(Circle((x + 2.5, 22.3), 1.55, facecolor=(TEAL if fc == DARK else INDIGO), zorder=4))
        ax.text(x + 2.5, 22.3, n, ha="center", va="center", fontsize=8.6,
                fontweight="bold", color=WHITE, zorder=5)
        ax.text(x + 1.3, 17.6, title, ha="left", va="center", fontsize=10,
                fontweight="bold", color=tc, zorder=5)
        ax.text(x + 1.3, 14.4, body, ha="left", va="top", fontsize=7.7,
                color=("#C7CEE6" if fc == DARK else GREY), zorder=5, linespacing=1.7)
        if i < len(stages) - 1:
            arrow(ax, x + w + 0.35, 14.0, x + w + gap - 0.35, 14.0, c=LGREY, lw=1.5, ms=10)

    ax.text(50, 0.2, "Stages 2 and 3 carry the contribution", ha="center",
            fontsize=8.3, style="italic", color=GREY)
    fig.savefig(OUT + "fig_pipeline.png"); plt.close(fig)


# ======================================================================
# 4. SAND-Net architecture block diagram
# ======================================================================
def fig_arch():
    fig, ax = plt.subplots(figsize=(7.6, 6.6))
    ax.set_xlim(0, 100); ax.set_ylim(0, 132); ax.axis("off")

    def block(y, h, title, sub, shape, fc, tc, badge=None, bc=TEAL):
        rbox(ax, 12, y, 62, h, fc, r=0.8)
        ax.text(15.5, y + h - 4.4, title, fontsize=10, fontweight="bold", color=tc, va="top")
        if sub:
            ax.text(15.5, y + h - 10.2, sub, fontsize=8.1,
                    color=("#C7CEE6" if fc == DARK else GREY), va="top", linespacing=1.5)
        ax.text(78, y + h / 2, shape, fontsize=8.2, color=INDIGO, va="center",
                family="DejaVu Sans Mono")
        if badge:
            rbox(ax, 58.5, y + h - 5.6, 14.2, 4.2, bc, r=0.5, z=4)
            ax.text(65.6, y + h - 3.5, badge, fontsize=6.6, fontweight="bold",
                    color=WHITE, ha="center", va="center", zorder=5)

    rows = [
        (118, 10, "EEG trial", "22 channels × 875 samples, 0.5–4.0 s post-cue", "22 × 875", CARD, DARK, None, INDIGO),
        (104, 11, "Euclidean Alignment", "X̃ = R⁻¹ᐟ² X  ·  unsupervised, per subject", "22 × 875", "#DFF5F6", DARK, "NEW", TEALD),
        (89,  12, "Temporal convolution", "F1 = 16, kernel (1, 64)", "16 × 22 × 875", DARK, WHITE, "EEGNet", INDIGO),
        (74,  12, "Depthwise spatial convolution", "D = 2, kernel (22, 1), max-norm 1.0", "32 × 1 × 875", DARK, WHITE, "EEGNet", INDIGO),
        (61,  10, "BN → ELU → AvgPool(1,4) → Drop", "", "32 × 1 × 218", CARD, DARK, None, INDIGO),
        (48,  10, "Separable convolution", "F2 = 32, kernel (1, 16) → pool(1,8)", "32 × 1 × 27", DARK, WHITE, "EEGNet", INDIGO),
        (33,  12, "Multi-scale temporal branch", "3 dilated convs, k = 4 / 8 / 16 → 1×1 fusion", "32 × 27", DARK, WHITE, "ATCNet", INDIGO),
        (18,  12, "Windowed self-attention", "5 overlapping windows, 2 heads, depth 2", "32 × 27", DARK, WHITE, "Conformer", INDIGO),
        (5,   10, "Global avg pool → FC → softmax", "4 motor imagery classes", "4", CARD, DARK, None, INDIGO),
    ]
    for r in rows:
        block(*r)
    for i in range(len(rows) - 1):
        y_low = rows[i + 1][0] + rows[i + 1][1]
        y_up = rows[i][0]
        arrow(ax, 43, y_low + 0.3, 43, y_up - 0.3, c=LGREY, lw=1.4, ms=8)

    # loss bracket
    ax.plot([76.5, 82, 82, 76.5], [7, 7, 14, 14], color=TEALD, lw=1.2)
    ax.text(83.5, 10.5, "L$_{CE}$ + λ₁L$_{SupCon}$\n+ λ₂L$_{DANN}$", fontsize=7.8,
            color=TEALD, va="center", linespacing=1.6)

    ax.text(12, 129, "SAND-Net  ·  Subject-Agnostic Neural Decoder", fontsize=11.5,
            fontweight="bold", color=DARK)
    ax.text(12, 125.4, "Badges name the paper each component is taken from. Shapes shown for BCI IV-2a.",
            fontsize=8, color=GREY)
    fig.savefig(OUT + "fig_arch.png"); plt.close(fig)


# ======================================================================
# 5. LOSO fold matrix
# ======================================================================
def fig_loso():
    fig, ax = plt.subplots(figsize=(7.0, 3.3))
    n = 9
    M = np.zeros((n, n), dtype=int)     # 0 train, 1 val, 2 test
    for f in range(n):
        test = f
        val = (f + 1) % n
        M[f, test] = 2
        M[f, val] = 1
    cmap = matplotlib.colors.ListedColormap([CARD, TEAL, CORAL])
    ax.imshow(M, cmap=cmap, aspect="auto", vmin=0, vmax=2)

    for f in range(n):
        for s in range(n):
            t = {0: "train", 1: "val", 2: "TEST"}[M[f, s]]
            ax.text(s, f, t, ha="center", va="center", fontsize=7,
                    color=(WHITE if M[f, s] else GREY),
                    fontweight=("bold" if M[f, s] == 2 else "normal"))
    ax.set_xticks(range(n)); ax.set_xticklabels([f"S{i+1}" for i in range(n)], fontsize=9)
    ax.set_yticks(range(n)); ax.set_yticklabels([f"Fold {i+1}" for i in range(n)], fontsize=8.5)
    ax.set_xlabel("Subject", fontsize=9.5, labelpad=8)
    ax.xaxis.set_label_position("top"); ax.xaxis.tick_top()
    for sp in ax.spines.values():
        sp.set_visible(False)
    ax.set_xticks(np.arange(-.5, n, 1), minor=True)
    ax.set_yticks(np.arange(-.5, n, 1), minor=True)
    ax.grid(which="minor", color="white", linewidth=2.2)
    ax.tick_params(which="minor", length=0)
    fig.text(0.5, -0.03,
             "Every subject serves as the test subject exactly once. The validation subject is also held out, "
             "so hyperparameters are never selected on data from a subject seen in training.",
             ha="center", fontsize=7.8, color=GREY, style="italic")
    fig.savefig(OUT + "fig_loso.png"); plt.close(fig)


# ======================================================================
# 6. ERD schematic + expected topography
# ======================================================================
def fig_erd():
    fig = plt.figure(figsize=(8.6, 2.9))
    gs = fig.add_gridspec(1, 3, width_ratios=[2.05, 1.0, 1.0], wspace=0.32)

    # --- left: mu-band envelope showing desynchronisation ---
    ax = fig.add_subplot(gs[0, 0])
    t = np.linspace(-1, 4, 2200)
    rng = np.random.default_rng(3)
    env = np.where(t < 0, 1.0, 1.0 - 0.55 * np.exp(-((t - 1.4) ** 2) / 2.2) * (t > 0))
    sig = env * np.sin(2 * np.pi * 10.5 * t) + rng.normal(0, 0.06, t.size)
    ax.plot(t, sig, color=INDIGO, lw=0.7, alpha=0.85)
    ax.plot(t, env, color=CORAL, lw=1.8, label="mu-band envelope")
    ax.plot(t, -env, color=CORAL, lw=1.8)
    ax.axvline(0, color=DARK, lw=1.1, ls="--")
    ax.text(0.06, 1.42, "cue", fontsize=8, color=DARK)
    ax.axvspan(0.5, 4.0, color=TEAL, alpha=0.10)
    ax.text(2.25, -1.42, "analysis window 0.5–4.0 s", fontsize=7.6, color=TEALD, ha="center")
    ax.annotate("event-related\ndesynchronisation", xy=(1.5, 0.48), xytext=(2.5, 1.15),
                fontsize=8, color=CORAL, ha="center",
                arrowprops=dict(arrowstyle="-|>", color=CORAL, lw=1.1))
    ax.set_xlim(-1, 4); ax.set_ylim(-1.6, 1.6)
    ax.set_xlabel("time from cue (s)", fontsize=8.5)
    ax.set_yticks([])
    ax.set_title("What motor imagery does to the mu rhythm", fontsize=10, fontweight="bold", pad=8)

    # --- right: two schematic scalp maps ---
    def head(ax, strong_side, title):
        ax.set_xlim(-1.35, 1.35); ax.set_ylim(-1.35, 1.45); ax.axis("off")
        gx, gy = np.meshgrid(np.linspace(-1, 1, 160), np.linspace(-1, 1, 160))
        cx = 0.45 * strong_side
        z = -np.exp(-(((gx - cx) ** 2 + (gy - 0.05) ** 2) / 0.10))
        z += 0.30 * np.exp(-(((gx + cx) ** 2 + (gy - 0.05) ** 2) / 0.16))
        z[gx ** 2 + gy ** 2 > 1] = np.nan
        ax.imshow(z, extent=[-1, 1, -1, 1], origin="lower", cmap="RdBu_r",
                  vmin=-1, vmax=1, interpolation="bilinear")
        ax.add_patch(Circle((0, 0), 1, fill=False, lw=1.6, color=DARK))
        ax.plot([0, -0.12, 0, 0.12, 0], [1.28, 1.02, 1.28, 1.02, 1.28], color=DARK, lw=1.4)
        ax.add_patch(Ellipse((-1.04, 0), 0.16, 0.34, fill=False, lw=1.4, color=DARK))
        ax.add_patch(Ellipse((1.04, 0), 0.16, 0.34, fill=False, lw=1.4, color=DARK))
        for px, lbl in [(-0.45, "C3"), (0.0, "Cz"), (0.45, "C4")]:
            ax.plot(px, 0.05, "o", ms=4.2, color=DARK)
            ax.text(px, -0.20, lbl, fontsize=7.6, ha="center", color=DARK, fontweight="bold")
        ax.set_title(title, fontsize=9, fontweight="bold", pad=6)

    head(fig.add_subplot(gs[0, 1]),  1, "Left-hand imagery")
    head(fig.add_subplot(gs[0, 2]), -1, "Right-hand imagery")

    fig.text(0.5, -0.07,
             "Schematic. Blue marks suppressed mu power. Activity appears contralateral to the imagined hand — "
             "this is the pattern the Class Activation Topography must reproduce for the model to be trusted.",
             ha="center", fontsize=7.6, color=GREY, style="italic")
    fig.savefig(OUT + "fig_erd.png"); plt.close(fig)


# ======================================================================
# 7. Baselines: accuracy vs parameters (published numbers)
# ======================================================================
def fig_baselines():
    fig, ax = plt.subplots(figsize=(6.6, 3.2))
    models = [
        ("EEGNet",         2548,   68.67, INDIGO),
        ("EEG-TCNet",      4096,   65.36, INDIGO),
        ("ShallowConvNet", 47364,  67.48, INDIGO),
        ("ATCNet",         113732, 81.10, INDIGO),
        ("DeepConvNet",    553654, 42.78, INDIGO),
    ]
    for name, p, a, c in models:
        ax.scatter(p, a, s=74, color=c, zorder=4, linewidths=0)
        dy = -3.4 if name in ("EEG-TCNet", "ShallowConvNet") else 2.0
        ax.annotate(f"{name}\n{p:,} params", (p, a), textcoords="offset points",
                    xytext=(9, dy), fontsize=7.8, color=DARK, linespacing=1.4)

    ax.axvspan(1000, 50000, color=TEAL, alpha=0.10, zorder=0)
    ax.text(6800, 87.5, "SAND-Net target\n< 50,000 params, ≥ 70% LOSO", fontsize=8,
            color=TEALD, fontweight="bold", ha="center", linespacing=1.5)
    ax.scatter([40000], [72.0], s=150, marker="*", color=TEALD, zorder=5)
    ax.annotate("target", (40000, 72.0), textcoords="offset points", xytext=(11, -4),
                fontsize=8, color=TEALD, fontweight="bold")

    ax.set_xscale("log")
    ax.set_xlabel("Trainable parameters (log scale)")
    ax.set_ylabel("Reported accuracy, BCI IV-2a (%)")
    ax.set_ylim(38, 94); ax.set_xlim(1500, 1.1e6)
    ax.grid(color="#EEF2FA", zorder=0); ax.set_axisbelow(True)
    fig.text(0.5, -0.04,
             "Published within-subject accuracies and parameter counts from the ATCNet reference implementation. "
             "The star is this project's target, not a result.",
             ha="center", fontsize=7.6, color=GREY, style="italic")
    fig.savefig(OUT + "fig_baselines.png"); plt.close(fig)


# ======================================================================
# 8. Ablation logic
# ======================================================================
def fig_ablation():
    fig, ax = plt.subplots(figsize=(8.8, 3.3))
    ax.set_xlim(0, 100); ax.set_ylim(0, 38); ax.axis("off")

    cfgs = [
        ("A1", "baseline", False, False, False, False, False),
        ("A2", "alignment only", True, False, False, False, False),
        ("A3", "capacity only", False, True, True, False, False),
        ("A4", "", True, True, False, False, False),
        ("A5", "architecture", True, True, True, False, False),
        ("A6", "", True, True, True, True, False),
        ("A7", "", True, True, True, False, True),
        ("A8", "full SAND-Net", True, True, True, True, True),
    ]
    cols = ["EA", "Multi-scale", "Attention", "SupCon", "DANN"]
    x0, colw, roww = 6, 8.2, 3.3
    ax.text(x0 - 4.6, 31.6, "config", fontsize=7.6, color=GREY, fontweight="bold")
    for j, c in enumerate(cols):
        ax.text(x0 + j * colw + colw / 2, 31.6, c, fontsize=7.6, color=GREY,
                ha="center", fontweight="bold")

    for i, (name, note, *flags) in enumerate(cfgs):
        y = 28.0 - i * roww
        hi = name in ("A1", "A2", "A3")
        if hi:
            rbox(ax, x0 - 5.6, y - 0.5, 5 * colw + 6.6, roww - 0.4, "#DFF5F6", r=0.4, z=1)
        ax.text(x0 - 4.6, y + 0.9, name, fontsize=8.2, fontweight="bold",
                color=(TEALD if hi else DARK), va="center")
        for j, f in enumerate(flags):
            cx = x0 + j * colw + colw / 2
            if f:
                ax.add_patch(Circle((cx, y + 0.9), 0.85, color=TEALD, zorder=3))
                ax.text(cx, y + 0.9, "✓", fontsize=6.6, color=WHITE, ha="center",
                        va="center", zorder=4)
            else:
                ax.add_patch(Circle((cx, y + 0.9), 0.85, facecolor="#E4E9F4",
                                    edgecolor="none", zorder=3))
        if note:
            ax.text(x0 + 5 * colw + 3.4, y + 0.9, note, fontsize=7.8, color=GREY,
                    va="center", style="italic")

    # the key comparison bracket
    bx = x0 - 8.4
    ax.plot([bx, bx - 1.5, bx - 1.5, bx], [28.0, 28.0, 21.8, 21.8], color=CORAL, lw=1.4)
    ax.text(bx - 2.6, 24.9, "core test\nof H1", fontsize=7.8, color=CORAL, ha="right",
            va="center", fontweight="bold", linespacing=1.5)

    ax.text(50, 1.0, "If  (A2 − A1)  >  (A3 − A1),  alignment beats capacity and H1 is supported.",
            fontsize=9, ha="center", color=DARK, fontweight="bold")
    fig.savefig(OUT + "fig_ablation.png"); plt.close(fig)


# ======================================================================
# 9. Gantt timeline
# ======================================================================
def fig_timeline():
    fig, ax = plt.subplots(figsize=(8.8, 3.1))
    tasks = [
        ("Environment and data",            0,  2, INDIGO),
        ("Preprocessing + alignment",       2,  2, INDIGO),
        ("Baselines, within-subject",       4,  3, INDIGO),
        ("LOSO harness + all baselines",    7,  3, INDIGO),
        ("SAND-Net implementation",        10,  3, TEALD),
        ("Ablation study",                 13,  2, TEALD),
        ("IV-2b, calibration, interpret.", 15,  2, TEALD),
        ("Consolidation → 2nd Review",     17,  1, CORAL),
    ]
    for i, (name, s, d, c) in enumerate(tasks):
        y = len(tasks) - i - 1
        ax.barh(y, d, left=s, height=0.55, color=c, zorder=3)
        ax.text(s + d + 0.25, y, f"{d}d", va="center", fontsize=7.6, color=GREY)

    ax.set_yticks(range(len(tasks)))
    ax.set_yticklabels([t[0] for t in reversed(tasks)], fontsize=8.6)
    ticks = [0, 2, 4, 7, 10, 13, 15, 17, 18]
    labels = ["16 Sep", "18", "20", "23", "26", "29", "1 Oct", "3", ""]
    ax.set_xticks(ticks); ax.set_xticklabels(labels, fontsize=8)
    ax.set_xlim(0, 19.2)
    ax.grid(axis="x", color="#EEF2FA", zorder=0); ax.set_axisbelow(True)
    ax.axvline(18, color=CORAL, ls="--", lw=1.2, zorder=4)
    ax.text(18.15, len(tasks) - 0.35, "2nd Review\n3 Oct", fontsize=7.8,
            color=CORAL, fontweight="bold", linespacing=1.5)
    for sp in ["left", "bottom"]:
        ax.spines[sp].set_color("#D8DEEC")
    fig.text(0.5, -0.04,
             "Front-loaded on purpose: the pipeline and baselines must work before the proposed model is written.",
             ha="center", fontsize=7.8, color=GREY, style="italic")
    fig.savefig(OUT + "fig_timeline.png"); plt.close(fig)


# ======================================================================
# 10. Calibration-efficiency — clearly labelled schematic
# ======================================================================
def fig_calibration():
    fig, ax = plt.subplots(figsize=(6.4, 3.0))
    n = np.linspace(0, 80, 200)
    base = 58 + 26 * (1 - np.exp(-n / 38))
    ours = 68 + 17 * (1 - np.exp(-n / 12))
    ax.plot(n, base, color=INDIGO, lw=2.1, label="Typical baseline")
    ax.plot(n, ours, color=TEALD, lw=2.1, label="What SAND-Net aims for")
    ax.axhline(80, color=LGREY, ls=":", lw=1.2)
    ax.text(79, 80.9, "usable threshold", fontsize=7.6, color=GREY, ha="right")

    for curve, c in [(ours, TEALD), (base, INDIGO)]:
        idx = np.argmax(curve >= 80)
        if curve[idx] >= 80:
            ax.plot([n[idx], n[idx]], [38, 80], color=c, ls="--", lw=1.1)
            ax.plot(n[idx], 80, "o", color=c, ms=6)

    ax.annotate("fewer labelled trials\nto reach the same point", xy=(13, 80),
                xytext=(30, 63), fontsize=8, color=TEALD, linespacing=1.5,
                arrowprops=dict(arrowstyle="-|>", color=TEALD, lw=1.2))
    ax.set_xlabel("Labelled trials supplied by the new user")
    ax.set_ylabel("Accuracy (%)")
    ax.set_ylim(38, 92); ax.set_xlim(0, 84)
    ax.grid(color="#EEF2FA", zorder=0); ax.set_axisbelow(True)
    ax.legend(frameon=False, fontsize=8.2, loc="lower right")
    ax.text(2, 88, "SCHEMATIC — no results yet", fontsize=8, color=CORAL,
            fontweight="bold",
            bbox=dict(boxstyle="round,pad=0.35", facecolor="#FFEFE9", edgecolor="none"))
    fig.text(0.5, -0.04,
             "The shape of the figure this experiment will produce. Curve positions are illustrative, not measured.",
             ha="center", fontsize=7.6, color=GREY, style="italic")
    fig.savefig(OUT + "fig_calibration.png"); plt.close(fig)


if __name__ == "__main__":
    for f in [fig_gap, fig_ea, fig_pipeline, fig_arch, fig_loso, fig_erd,
              fig_baselines, fig_ablation, fig_timeline, fig_calibration]:
        f()
        print("ok:", f.__name__)
