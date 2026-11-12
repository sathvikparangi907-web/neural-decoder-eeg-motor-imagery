"""Figures for the solution design: the document and the slides.

Every figure is either plotted from published values cited in its caption or is a
labelled schematic. The cover art is a few seconds of real EEG from subject A01 of
BCI Competition IV 2a. No figure shows a result of this project.

    python figs.py          writes every PNG into fig/
"""
import os
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
from matplotlib.colors import LinearSegmentedColormap, to_rgba
from matplotlib.patches import Circle, Ellipse, FancyArrowPatch, FancyBboxPatch, Rectangle

HERE = Path(__file__).resolve().parent
OUT = HERE / "fig"
DATA = Path(os.environ.get("NEURAL_DATA", HERE.parent / "data"))

INK, MUTED, DEEP = "#14212B", "#5B6B78", "#0B2530"
TEAL, TEAL_D, TEAL_L = "#0E9F96", "#0B7C75", "#2EC4B6"
RED, RED_L = "#E34948", "#FF6B5E"
TINT, RULE, CONTEXT, SLATE, AMBER = "#EEF4F5", "#D3DDE1", "#C3CDD3", "#3E5A66", "#EDA100"
CLASSES = [("Left hand", "#2A78D6"), ("Right hand", "#EB6834"), ("Feet", "#1BAF7A"), ("Tongue", "#EDA100")]
PEOPLE = ["#2A78D6", "#EB6834", "#1BAF7A"]          # validated all-pairs for a scatter
SCALP = LinearSegmentedColormap.from_list("scalp", ["#1C5CAB", "#F4F6F7", "#C93A39"])

plt.rcParams.update({
    "font.family": "Calibri", "font.size": 11,
    "text.color": INK, "axes.labelcolor": INK, "axes.edgecolor": RULE,
    "xtick.color": MUTED, "ytick.color": MUTED,
    "axes.spines.top": False, "axes.spines.right": False,
    "figure.dpi": 110, "savefig.dpi": 220, "savefig.facecolor": "white",
})


def save(fig, name, **kw):
    OUT.mkdir(exist_ok=True)
    fig.savefig(OUT / name, **kw)
    plt.close(fig)


def rbox(ax, x, y, w, h, fc, ec=None, lw=0.0, r=0.6, z=2):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle=f"round,pad=0,rounding_size={r}",
                                linewidth=lw, edgecolor=ec or fc, facecolor=fc, zorder=z))


def arrow(ax, x1, y1, x2, y2, c=MUTED, lw=1.4, ms=11, z=1, style="-|>"):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, mutation_scale=ms,
                                 linewidth=lw, color=c, zorder=z, shrinkA=0, shrinkB=0))


def head(ax, cx, cy, r, spots, lw=1.5):
    """A schematic scalp map seen from above, nose up. spots = (dx, dy, weight)."""
    g = 140
    gx, gy = np.meshgrid(np.linspace(-1, 1, g), np.linspace(-1, 1, g))
    z = np.zeros_like(gx)
    for dx, dy, w in spots:
        z += w * np.exp(-(((gx - dx) ** 2 + (gy - dy) ** 2) / 0.10))
    z[gx ** 2 + gy ** 2 > 1] = np.nan
    ax.imshow(z, extent=[cx - r, cx + r, cy - r, cy + r], origin="lower", cmap=SCALP,
              vmin=-1, vmax=1, interpolation="bilinear", zorder=2)
    ax.add_patch(Circle((cx, cy), r, fill=False, lw=lw, color=INK, zorder=3))
    ax.plot([cx - 0.14 * r, cx, cx + 0.14 * r], [cy + 0.99 * r, cy + 1.2 * r, cy + 0.99 * r],
            color=INK, lw=lw, zorder=3, solid_joinstyle="round")
    for s in (-1, 1):
        ax.add_patch(Ellipse((cx + s * 1.05 * r, cy), 0.14 * r, 0.34 * r, fill=False, lw=lw, color=INK, zorder=3))


# ----------------------------------------------------------------------------- cover art
def eeg_segment(seconds):
    import scipy.io as sio
    from scipy.signal import butter, sosfiltfilt
    runs = sio.loadmat(DATA / "A01T.mat", simplify_cells=True)["data"]
    run = runs[3]                                   # runs 0-2 hold only eye-movement recordings
    fs = int(run["fs"])
    start = int(run["trial"][4]) - fs               # one second before the fifth cue period
    seg = run["X"][start:start + int(seconds * fs), :22].astype(float)
    return sosfiltfilt(butter(4, [4, 30], btype="band", fs=fs, output="sos"), seg, axis=0)


def cover(name, w_in, h_in, x0, x1, y0, y1, seconds, dpi, hot_channel=11):
    seg = eeg_segment(seconds)
    chans = [0, 1, 3, 7, 9, 11, 13, 15, 19]         # Fz FC3 FCz C3 Cz C4 CP3 CPz Pz
    fig = plt.figure(figsize=(w_in, h_in), facecolor=DEEP)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor(DEEP); ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis("off")
    x = np.linspace(x0, x1, seg.shape[0])
    fade = np.clip((x - x0) / 0.22, 0, 1) ** 1.6     # traces fade in from the left
    gap = (y1 - y0) / (len(chans) - 1)
    for k, c in enumerate(chans):
        y = y1 - k * gap + seg[:, c] / seg[:, c].std() * gap * 0.16
        hot = c == hot_channel                        # C4 by default, over the right motor cortex
        base = to_rgba(RED_L if hot else TEAL_L)
        cols = np.array([(*base[:3], (0.95 if hot else 0.5) * f) for f in fade[:-1]])
        pts = np.column_stack([x, y]).reshape(-1, 1, 2)
        ax.add_collection(LineCollection(np.concatenate([pts[:-1], pts[1:]], axis=1),
                                         colors=cols, linewidths=1.5 if hot else 1.1))
    save(fig, name, dpi=dpi, facecolor=DEEP)


# ----------------------------------------------------------------------------- figures
def f_drop():
    fig, ax = plt.subplots(figsize=(6.6, 2.6))
    fig.subplots_adjust(left=0.25, right=0.96, top=0.80, bottom=0.21)
    rows = [("BCI IV-2a, 4 classes", 82.52, 58.64), ("BCI IV-2b, 2 classes", 88.49, 76.27)]
    for i, (name, seen, new) in enumerate(rows):
        y = 1 - i
        ax.plot([new, seen], [y, y], color=RULE, lw=7, solid_capstyle="round", zorder=1)
        ax.scatter([seen], [y], s=130, color=TEAL, zorder=3, edgecolor="white", linewidth=2)
        ax.scatter([new], [y], s=130, color=RED, zorder=3, edgecolor="white", linewidth=2)
        ax.text(seen + 1.4, y, f"{seen:.2f}%", va="center", fontsize=11.5)
        ax.text(new - 1.4, y, f"{new:.2f}%", va="center", ha="right", fontsize=11.5)
        ax.text((seen + new) / 2, y + 0.27, f"−{seen - new:.2f} points", ha="center",
                fontsize=11.5, color=RED, fontweight="bold")
    ax.set_yticks([1, 0]); ax.set_yticklabels([r[0] for r in rows], fontsize=11.5, color=INK)
    ax.set_xlim(40, 100); ax.set_ylim(-0.55, 1.7)
    ax.set_xlabel("Accuracy (%)", fontsize=11)
    ax.spines["left"].set_visible(False); ax.tick_params(axis="y", length=0)
    ax.grid(axis="x", color="#EEF2F4", zorder=0); ax.set_axisbelow(True)
    for lab, col, xx in [("Person seen in training", TEAL, 0.25), ("New person", RED, 0.58)]:
        fig.patches.append(Circle((xx, 0.915), 0.012, transform=fig.transFigure, color=col, figure=fig))
        fig.text(xx + 0.022, 0.915, lab, va="center", fontsize=11)
    save(fig, "drop.png")


def f_size_acc():
    models = ["EEGNet+", "ShallowConvNet+", "CTNet", "DeepConvNet+", "EEG Conformer+"]
    params = [3188, 44644, 152364, 282079, 697412]
    acc = [56.85, 56.75, 58.64, 60.15, 53.41]
    fig, (a1, a2) = plt.subplots(1, 2, figsize=(7.4, 3.0), gridspec_kw={"wspace": 0.10})
    fig.subplots_adjust(left=0.19, right=0.97, top=0.84, bottom=0.17)
    y = np.arange(len(models))[::-1]
    a1.barh(y, params, height=0.58, color=SLATE, zorder=2)
    a1.set_xscale("log"); a1.set_xlim(1e3, 6e6)
    for yy, p in zip(y, params):
        a1.text(p * 1.15, yy, f"{p:,}", va="center", fontsize=10.5)
    a1.set_yticks(y); a1.set_yticklabels(models, fontsize=11, color=INK)
    a1.set_title("Parameters, log scale", loc="left", fontsize=11.5, color=INK, pad=8)
    a1.set_xticks([1e3, 1e4, 1e5, 1e6]); a1.set_xticklabels(["1k", "10k", "100k", "1M"])
    a2.barh(y, acc, height=0.58, color=TEAL, zorder=2)
    a2.set_xlim(0, 100); a2.set_yticks([])
    a2.axvline(25, color=MUTED, lw=1, ls=(0, (3, 3)), zorder=3)
    a2.text(26.5, -0.72, "chance, 25%", fontsize=9.5, color=MUTED, va="center")
    for a in (a1, a2):
        a.set_ylim(-1.0, 4.5)
    for yy, a in zip(y, acc):
        a2.text(a + 1.5, yy, f"{a:.2f}", va="center", fontsize=10.5)
    a2.set_title("Accuracy on an unseen person (%)", loc="left", fontsize=11.5, color=INK, pad=8)
    for a in (a1, a2):
        a.spines["left"].set_visible(False); a.tick_params(axis="y", length=0)
        a.grid(axis="x", color="#EEF2F4", zorder=0); a.set_axisbelow(True)
    save(fig, "size_vs_accuracy.png")


def f_erd():
    fig = plt.figure(figsize=(8.2, 2.9))
    fig.subplots_adjust(bottom=0.17, top=0.86, left=0.04, right=0.99, wspace=0.18)
    gs = fig.add_gridspec(1, 3, width_ratios=[2.2, 1, 1])
    ax = fig.add_subplot(gs[0, 0])
    t = np.linspace(-1, 4, 2400)
    rng = np.random.default_rng(3)
    env = np.where(t < 0, 1.0, 1.0 - 0.55 * np.exp(-((t - 1.4) ** 2) / 2.2))
    ax.axvspan(0.5, 4.0, color=TEAL, alpha=0.09, lw=0)
    ax.plot(t, env * np.sin(2 * np.pi * 10.5 * t) + rng.normal(0, 0.05, t.size), color=SLATE, lw=0.6)
    ax.plot(t, env, color=RED, lw=2); ax.plot(t, -env, color=RED, lw=2)
    ax.axvline(0, color=INK, lw=1.1, ls=(0, (4, 3)))
    ax.text(0.07, 1.42, "cue", fontsize=10.5)
    ax.text(2.25, -1.5, "analysis window, 0.5 to 4.0 s", fontsize=10, color=TEAL_D, ha="center")
    ax.annotate("mu power falls while\nthe person imagines", xy=(1.5, 0.47), xytext=(2.75, 1.12),
                fontsize=10.5, color=RED, ha="center", linespacing=1.4,
                arrowprops=dict(arrowstyle="-|>", color=RED, lw=1.1))
    ax.set_xlim(-1, 4); ax.set_ylim(-1.75, 1.7); ax.set_yticks([])
    ax.spines["left"].set_visible(False)
    ax.set_xlabel("time from cue (s)", fontsize=10.5)
    ax.set_title("Mu rhythm (8 to 13 Hz) over the motor cortex", fontsize=12, loc="left", pad=8)
    for k, (side, title) in enumerate([(1, "Imagining the left hand"), (-1, "Imagining the right hand")]):
        a = fig.add_subplot(gs[0, k + 1]); a.set_xlim(-1.45, 1.45); a.set_ylim(-1.35, 1.45); a.axis("off")
        head(a, 0, 0, 1.0, [(0.45 * side, 0.05, -1.0), (-0.45 * side, 0.05, 0.28)])
        for px, lbl in [(-0.45, "C3"), (0, "Cz"), (0.45, "C4")]:
            a.plot(px, 0.05, "o", ms=4.5, color=INK, zorder=5)
            a.text(px, -0.25, lbl, fontsize=10, ha="center", zorder=5, fontweight="bold")
        a.set_title(title, fontsize=11.5, pad=4)
    save(fig, "erd.png")


def f_classes():
    notes = ["right side, near C4", "left side, near C3", "midline, near Cz", "both sides, lower"]
    spots = [[(0.45, 0.05, -1.0), (-0.45, 0.05, 0.25)], [(-0.45, 0.05, -1.0), (0.45, 0.05, 0.25)],
             [(0.0, 0.18, -1.0)], [(-0.5, -0.15, -0.75), (0.5, -0.15, -0.75)]]
    fig = plt.figure(figsize=(8.0, 2.7))
    for i, ((name, col), sp, note) in enumerate(zip(CLASSES, spots, notes)):
        bg = fig.add_axes([0.005 + i * 0.25, 0.02, 0.24, 0.96]); bg.axis("off")
        bg.set_xlim(0, 1); bg.set_ylim(0, 1)
        rbox(bg, 0, 0, 1, 1, TINT, r=0.05, z=0)
        bg.add_patch(Circle((0.13, 0.885), 0.035, color=col, transform=bg.transAxes, zorder=3))
        bg.text(0.2, 0.885, name, va="center", fontsize=13, fontweight="bold")
        bg.text(0.5, 0.07, note, ha="center", fontsize=10.5, color=MUTED)
        a = fig.add_axes([0.03 + i * 0.25, 0.17, 0.19, 0.62]); a.axis("off")
        a.set_xlim(-1.4, 1.4); a.set_ylim(-1.3, 1.4)
        head(a, 0, 0, 1.0, sp)
    save(fig, "classes.png")


def f_trial():
    fig, ax = plt.subplots(figsize=(8.2, 2.8))
    fig.subplots_adjust(bottom=0.08, top=0.98, left=0.02, right=0.98)
    ax.set_xlim(-0.3, 7.8); ax.set_ylim(-1.15, 3.2); ax.axis("off")
    ax.plot([0, 7.5], [0, 0], color=INK, lw=1.3, zorder=3)
    for t in range(0, 8):
        ax.plot([t, t], [-0.1, 0.1], color=INK, lw=1.2, zorder=3)
        ax.text(t, -0.42, f"{t} s", ha="center", fontsize=10.5, color=MUTED)
    phases = [(0.0, 2.0, "Fixation cross\nand beep", TINT), (2.0, 1.25, "Arrow\ncue", "#DCEAF7"),
              (3.25, 2.75, "Imagining the\nmovement", "#D3EFEB"), (6.0, 1.5, "Rest", "#F4F6F7")]
    for x, w, label, fc in phases:
        rbox(ax, x + 0.02, 0.25, w - 0.04, 1.0, fc, r=0.06)
        ax.text(x + w / 2, 0.75, label, ha="center", va="center", fontsize=11, linespacing=1.3, zorder=4)
    for xx in (2.5, 6.0):
        ax.plot([xx, xx], [1.3, 2.25], color=TEAL_D, lw=1.2, ls=(0, (4, 3)), zorder=4)
        ax.plot([xx], [1.27], marker="v", ms=6, color=TEAL_D, zorder=4)
    arrow(ax, 2.5, 1.6, 6.0, 1.6, c=TEAL_D, lw=1.3, ms=11, z=5, style="<|-|>")
    ax.text(4.25, 1.8, "window we analyse: 3.5 s = 875 samples", ha="center", fontsize=11.5,
            color=TEAL_D, fontweight="bold", zorder=5)
    ax.text(4.25, 2.55, "starts 0.5 s after the arrow, so the response to the arrow itself is left out",
            ha="center", fontsize=10.5, color=MUTED)
    ax.text(3.75, -0.9, "time within one trial", ha="center", fontsize=10.5, color=MUTED)
    save(fig, "trial.png")


def f_system():
    fig, ax = plt.subplots(figsize=(8.2, 2.4))
    fig.subplots_adjust(0.01, 0.03, 0.99, 0.97)
    ax.set_xlim(0, 100); ax.set_ylim(0, 26); ax.axis("off")
    stages = [("Raw EEG", "22 electrodes\n250 Hz", TINT, INK), ("Preprocessing", "filter, cut,\nalign, scale", TINT, INK),
              ("CNN front end", "temporal, spatial,\nseparable conv", TEAL, "white"),
              ("Windowed\nattention", "2 encoder layers\nover 5 windows", TEAL_D, "white"),
              ("Pool and\nclassify", "average, then\na linear layer", TINT, INK),
              ("Prediction", "left, right,\nfeet or tongue", "#F4F6F7", INK)]
    w, gap = 14.6, 2.3
    for i, (name, sub, fc, tc) in enumerate(stages):
        x = 0.4 + i * (w + gap)
        rbox(ax, x, 2, w, 22, fc, r=1.0)
        ax.text(x + w / 2, 17.3, name, ha="center", va="center", fontsize=11.5, fontweight="bold", color=tc, linespacing=1.15)
        ax.text(x + w / 2, 7.6, sub, ha="center", va="center", fontsize=9.8, color=tc if tc == "white" else MUTED, linespacing=1.3)
        if i < len(stages) - 1:
            arrow(ax, x + w + 0.25, 13, x + w + gap - 0.25, 13, c=MUTED, lw=1.2, ms=9)
    save(fig, "system.png")


def f_model():
    fig, ax = plt.subplots(figsize=(7.6, 7.0))
    fig.subplots_adjust(0.01, 0.01, 0.99, 0.99)
    ax.set_xlim(0, 100); ax.set_ylim(0, 152); ax.axis("off")
    rows = [  # (title, detail, output shape, fill, text colour, source)
        ("Input trial", "22 electrodes, 0.5 to 4.0 s after the cue", "22 × 875", TINT, INK, None),
        ("Temporal convolution", "16 filters, each 64 samples long", "16 × 22 × 875", TEAL, "white", "EEGNet"),
        ("Depthwise spatial convolution", "2 filters per band across all 22 electrodes", "32 × 1 × 875", TEAL, "white", "EEGNet"),
        ("Batch norm, ELU, average pool ÷4", "", "32 × 1 × 218", TINT, INK, None),
        ("Separable convolution, pool ÷8", "32 filters, kernel 16", "32 × 1 × 27", TEAL, "white", "EEGNet"),
        ("Five overlapping windows", "11 steps each, stride 4, learned positions", "5 × 32 × 11", TINT, INK, "ATCNet"),
        ("Transformer encoder × 2", "2 heads, model width 32, feed-forward 64", "5 × 32 × 11", TEAL_D, "white", "CTNet, Conformer"),
        ("Average over windows and time", "", "32", TINT, INK, None),
        ("Linear layer and softmax", "", "4 classes", "#F4F6F7", INK, None),
    ]
    h, gap, top = 12.6, 3.9, 148
    for i, (title, sub, shape, fc, tc, src) in enumerate(rows):
        y = top - (i + 1) * h - i * gap
        rbox(ax, 2, y, 70, h, fc, r=1.0)
        ax.text(5, y + (h * 0.66 if sub else h / 2), title, va="center", fontsize=12, fontweight="bold", color=tc)
        if sub:
            ax.text(5, y + h * 0.27, sub, va="center", fontsize=10, color=("#E7F6F4" if tc == "white" else MUTED))
        ax.text(76, y + h / 2, shape, va="center", fontsize=11, color=INK, family="Consolas")
        if src:
            bw = 2.4 + 1.25 * len(src)
            rbox(ax, 72 - 2 - bw, y + h - 5.2, bw, 3.9, "white" if tc == "white" else "#DDE7EA", r=0.5, z=4)
            ax.text(72 - 2 - bw / 2, y + h - 3.25, src, ha="center", va="center", fontsize=8.6,
                    color=TEAL_D, fontweight="bold", zorder=5)
        if i < len(rows) - 1:
            arrow(ax, 37, y - 0.2, 37, y - gap + 0.2, c=MUTED, lw=1.2, ms=8)
    ax.text(76, 148.5, "output shape", fontsize=10, color=MUTED, va="top")
    save(fig, "model.png")


def f_loso():
    n = 9
    fig, ax = plt.subplots(figsize=(6.4, 3.6))
    fig.subplots_adjust(left=0.12, right=0.99, top=0.86, bottom=0.04)
    ax.set_xlim(-0.5, n - 0.5); ax.set_ylim(n - 0.5, -0.5); ax.axis("off")
    for f in range(n):
        for s in range(n):
            role = "test" if s == f else ("val" if s == (f + 1) % n else "")
            fc = RED if role == "test" else (TEAL if role == "val" else TINT)
            ax.add_patch(Rectangle((s - 0.46, f - 0.42), 0.92, 0.84, color=fc, lw=0))
            if role:
                ax.text(s, f, role, ha="center", va="center", fontsize=9.5, color="white", fontweight="bold")
        ax.text(-0.62, f, f"Fold {f + 1}", ha="right", va="center", fontsize=10, color=MUTED)
    for s in range(n):
        ax.text(s, -0.75, f"A0{s + 1}", ha="center", va="bottom", fontsize=10, color=INK)
    save(fig, "loso.png")


def f_gantt():
    tasks = [("Dataset preparation and checks", 0, 3, SLATE), ("Preprocessing pipeline", 3, 2, SLATE),
             ("Baselines implemented and reproduced", 5, 4, SLATE), ("HCT-Net implemented", 9, 3, TEAL),
             ("Training set-up and tuning", 12, 2, TEAL), ("Leave-one-subject-out runs", 14, 2, TEAL),
             ("Comparison and statistics", 16, 1, AMBER), ("Report and figures", 17, 1, AMBER)]
    fig, ax = plt.subplots(figsize=(8.6, 3.3))
    fig.subplots_adjust(left=0.33, right=0.97, top=0.97, bottom=0.17)
    for i, (name, s, d, c) in enumerate(tasks):
        y = len(tasks) - 1 - i
        ax.barh(y, d - 0.08, left=s + 0.04, height=0.6, color=c, zorder=3)
        ax.text(s + d + 0.25, y, f"{d} day{'s' if d > 1 else ''}", va="center", fontsize=10, color=MUTED)
    ax.set_yticks(range(len(tasks))); ax.set_yticklabels([t[0] for t in reversed(tasks)], fontsize=11, color=INK)
    ax.set_xticks([0, 3, 5, 9, 12, 14, 16, 17]); ax.set_xticklabels(["1", "4", "6", "10", "13", "15", "17", "18"])
    ax.set_xlim(0, 19.6); ax.set_xlabel("Day of the build (each mark is the start of that day)", fontsize=10.5)
    ax.spines["left"].set_visible(False); ax.tick_params(axis="y", length=0)
    ax.grid(axis="x", color="#EEF2F4", zorder=0); ax.set_axisbelow(True)
    save(fig, "gantt.png")


def f_alignment():
    rng = np.random.default_rng(7)
    centres = [(-2.3, 1.4, 25), (2.1, 1.7, -35), (0.2, -2.2, 70)]
    markers = ["o", "s", "^"]
    fig, axes = plt.subplots(1, 2, figsize=(7.6, 3.2))
    fig.subplots_adjust(left=0.02, right=0.98, top=0.86, bottom=0.04, wspace=0.28)
    for k, ax in enumerate(axes):
        for (cx, cy, ang), col, mk, who in zip(centres, PEOPLE, markers, "ABC"):
            pts = rng.normal(0, 1, (45, 2)) * [0.85, 0.42]
            th = np.radians(ang if k == 0 else 0)
            pts = pts @ np.array([[np.cos(th), np.sin(th)], [-np.sin(th), np.cos(th)]])
            off = (cx, cy) if k == 0 else (0, 0)
            ax.scatter(pts[:, 0] + off[0], pts[:, 1] + off[1], s=22, marker=mk, color=col,
                       alpha=0.8, edgecolor="white", linewidth=0.5, label=f"Person {who}", zorder=3)
        ax.plot(0, 0, marker="*", ms=15, color=INK, zorder=4)
        ax.set_xlim(-4.2, 4.2); ax.set_ylim(-3.8, 3.6); ax.set_aspect("equal")
        ax.set_xticks([]); ax.set_yticks([])
        for sp in ax.spines.values():
            sp.set_visible(True); sp.set_color(RULE)
        ax.set_title(["Before alignment", "After alignment"][k], loc="left", fontsize=12, pad=6)
    axes[0].legend(loc="lower left", frameon=False, fontsize=10, handletextpad=0.2, borderaxespad=0.2)
    save(fig, "alignment.png")


if __name__ == "__main__":
    cover("cover_slide.png", 13.333, 7.5, x0=0.36, x1=1.01, y0=0.16, y1=0.84, seconds=9, dpi=150)
    cover("cover_page.png", 8.27, 4.35, x0=0.52, x1=1.01, y0=0.14, y1=0.88, seconds=7, dpi=220, hot_channel=15)
    for f in (f_drop, f_size_acc, f_erd, f_classes, f_trial, f_system, f_model, f_loso, f_gantt, f_alignment):
        f()
    print("figures written to", OUT)
