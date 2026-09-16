"""BCI Competition IV-2a — exploratory data analysis (Table 10.1, milestone M1).

Runs the seven planned analyses against the cache built by phase3/data.py, saves
one PNG per analysis into phase3/eda/ at 150 dpi, and prints a PASS/CHECK verdict
for each against its stated expectation. A CHECK is a mismatch to investigate, not
a result to accept.

    py phase3/explore.py

Analysis 4 is the exception to the cache: event-related desynchronisation needs a
pre-cue baseline, and the cached analysis window deliberately starts 0.5 s after
the cue, so it re-epochs from the raw .mat over a wider window.

Subjects whose raw files are not downloaded yet are skipped with a message.
"""
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from scipy.linalg import eigh
from scipy.signal import find_peaks, spectrogram, welch
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from data import CACHE, CLASSES, DATA, FS, SESSIONS, SUBJECTS, load_session, load_subject  # noqa: E402
from preprocess import covariances, euclidean_align  # noqa: E402

EDA = HERE / "eda"
plt.rcParams["figure.constrained_layout.use"] = True   # colourbars span axes; tight_layout cannot

# Standard BCI IV-2a montage, in file order.
CHANNELS = ("Fz", "FC3", "FC1", "FCz", "FC2", "FC4", "C5", "C3", "C1", "Cz", "C2",
            "C4", "C6", "CP3", "CP1", "CPz", "CP2", "CP4", "P1", "Pz", "P2", "POz")
C3, CZ, C4 = 7, 9, 11
MOTOR = [C3, CZ, C4]
MU = (8.0, 13.0)
ERD_WINDOW = (-2.0, 4.0)      # seconds relative to the cue; -2.0 s is the trial onset
ERD_BASE = (-1.5, -0.5)       # fixation period, before the cue appears
# Measured on A01: mu power bottoms out at about -1.36 s, i.e. inside ERD_BASE. The
# warning tone at trial onset (-2.0 s) desynchronises mu, so this window is not a true
# rest reference and analysis 4 reports how far off it is rather than hiding it.

# ponytail: flat 10-10 grid, not a real spherical projection — good enough to read
# left/right lateralisation off. Swap for mne.channels montage positions if a
# publication figure ever needs true head geometry.
POS = np.array([
    (0, 2), (-2, 1), (-1, 1), (0, 1), (1, 1), (2, 1),
    (-3, 0), (-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), (3, 0),
    (-2, -1), (-1, -1), (0, -1), (1, -1), (2, -1),
    (-1, -2), (0, -2), (1, -2), (0, -3),
], dtype=float) / 3.5


def verdict(ok, line):
    print(f"{'PASS ' if ok else 'CHECK'}  {line}")


def save(fig, name, caption=""):
    EDA.mkdir(exist_ok=True)
    if caption:
        fig.text(0.5, -0.02, caption, ha="center", va="top", fontsize=8, style="italic")
    fig.savefig(EDA / f"{name}.png", dpi=150, bbox_inches="tight")
    plt.close(fig)


def clean(d):
    """Artefact-free trials of one subject: X (n, 22, 875) float64, y (n,)."""
    X, y, _, rejected = d
    return X[~rejected].astype(np.float64), y[~rejected]


def cov(X):
    """Mean covariance over trials, (22, 22)."""
    return covariances(X).mean(axis=0)


align = euclidean_align       # Euclidean alignment (He & Wu 2020), from preprocess.py


def logm(C):
    w, V = eigh(C)
    return (V * np.log(np.maximum(w, 1e-12))) @ V.T


def available():
    """Load every subject with a cache or both raw sessions present; skip the rest."""
    loaded = {}
    for s in SUBJECTS:
        have = (CACHE / f"A{s:02d}.npz").exists() or all(
            (DATA / f"A{s:02d}{k}.mat").exists() for k in "TE")
        if not have:
            print(f"  skip A{s:02d} - no cache/A{s:02d}.npz and data/A{s:02d}[TE].mat "
                  f"not downloaded yet")
            continue
        try:
            loaded[s] = load_subject(s)
        except Exception as e:                      # truncated .mat while curl is running
            print(f"  skip A{s:02d} - {type(e).__name__}: {e}")
    return loaded


def a1_counts(D):
    """Trial counts and class balance per subject. Expect 576/subject, 144/class."""
    counts = {s: np.bincount(d[1], minlength=4) for s, d in D.items()}
    x = np.arange(len(D))
    fig, ax = plt.subplots(figsize=(max(6, 1.1 * len(D) + 3), 4))
    for c in range(4):
        ax.bar(x + (c - 1.5) * 0.2, [counts[s][c] for s in D], 0.2, label=CLASSES[c])
    ax.axhline(144, color="k", ls="--", lw=1, label="expected 144")
    ax.set_xticks(x, [f"A{s:02d}" for s in D])
    ax.set(ylabel="trials", title="1 — Trial counts and class balance per subject "
                                  "(all trials, before artefact rejection)")
    ax.legend(fontsize=8, ncol=5)
    save(fig, "01_counts")

    bad = [f"A{s:02d}={list(c)}" for s, c in counts.items() if not (c == 144).all()]
    verdict(not bad, f"1 counts/balance: {len(D)} subject(s), "
                     f"{'all 576 trials and 144 per class' if not bad else 'OFF: ' + ', '.join(bad)}")


def a2_rejection(D):
    """Artefact rejection rate per subject. Expect under roughly 15%."""
    rate = {s: 100 * d[3].mean() for s, d in D.items()}
    fig, ax = plt.subplots(figsize=(max(6, 1.1 * len(D) + 3), 4))
    ax.bar([f"A{s:02d}" for s in D], list(rate.values()), 0.6, color="#1B3A6B")
    ax.axhline(15, color="crimson", ls="--", lw=1.2, label="15% expectation")
    ax.set(ylabel="rejected trials (%)", ylim=(0, max(16, 1.1 * max(rate.values()))),
           title="2 — Artefact rejection rate per subject (100 µV peak-to-peak, or NaN in the run)")
    ax.legend(fontsize=8)
    save(fig, "02_rejection")

    bad = [f"A{s:02d} {r:.1f}%" for s, r in rate.items() if r >= 15]
    verdict(not bad, f"2 rejection rate: mean {np.mean(list(rate.values())):.1f}%, "
                     f"max {max(rate.values()):.1f}% "
                     f"({'all under 15%' if not bad else 'OVER 15%: ' + ', '.join(bad)})")


def a3_psd(D):
    """PSD per channel and class. Expect peaks near 10 Hz and 20 Hz over sensorimotor."""
    per_class = {c: [] for c in range(4)}
    f = None
    for d in D.values():
        X, y = clean(d)
        f, P = welch(X[:, MOTOR], FS, nperseg=500, axis=-1)
        for c in range(4):
            per_class[c].append(P[y == c].mean(0))            # (3, nf)
    band = (f >= 4) & (f <= 38)
    mean = {c: np.mean(per_class[c], 0) for c in range(4)}     # subject-averaged, (3, nf)

    fig, axes = plt.subplots(1, 3, figsize=(12, 4), sharey=True)
    for k, (ax, ch) in enumerate(zip(axes, MOTOR)):
        for c in range(4):
            ax.semilogy(f[band], mean[c][k][band], lw=1.2, label=CLASSES[c])
        for ref in (10, 20):
            ax.axvline(ref, color="grey", ls=":", lw=1)
        ax.set(xlabel="Hz", title=CHANNELS[ch])
    axes[0].set_ylabel("PSD (µV²/Hz)")
    axes[0].legend(fontsize=8)
    fig.suptitle("3 — Welch PSD at C3/Cz/C4, averaged over trials and subjects")
    save(fig, "03_psd", "Only 4–38 Hz is shown: the 4–38 Hz band-pass in data.py has "
                        "already removed everything outside that band, so the roll-off "
                        "at the edges is the filter, not the brain.")

    grand = np.mean([mean[c] for c in range(4)], axis=(0, 1))[band]
    peaks = f[band][find_peaks(np.log(grand))[0]]
    mu = peaks[(peaks >= 7) & (peaks <= 14)]
    beta = peaks[(peaks >= 15) & (peaks <= 30)]
    verdict(len(mu) and len(beta),
            f"3 PSD: spectral peaks over C3/Cz/C4 at {np.round(peaks, 1).tolist()} Hz - "
            f"mu 7-14 Hz {np.round(mu, 1).tolist() or 'NONE'}, "
            f"beta 15-30 Hz {np.round(beta, 1).tolist() or 'NONE'} (4-38 Hz shown only; "
            f"the band-pass already removed the rest)")


def a4_erd(D):
    """ERD at C3/Cz/C4 against a pre-cue baseline. Expect mu-band power reduction.

    Re-epoched from the raw .mat over ERD_WINDOW, because the cached epochs start
    0.5 s after the cue and so carry no baseline to normalise against.
    """
    S, f, t = 0.0, None, None
    for s in D:
        parts = [load_session(s, k, window=ERD_WINDOW) for k in SESSIONS]
        X = np.concatenate([p[0][~p[2]] for p in parts]).astype(np.float64)
        f, t, Sxx = spectrogram(X[:, MOTOR], FS, nperseg=128, noverlap=96, axis=-1)
        S = S + Sxx.mean(0)                                   # (3, nf, nt)
    S /= len(D)
    t = t + ERD_WINDOW[0]                                     # seconds relative to the cue
    base = (t >= ERD_BASE[0]) & (t <= ERD_BASE[1])
    db = 10 * np.log10(S / S[..., base].mean(-1, keepdims=True))
    band = (f >= 4) & (f <= 38)
    vlim = np.abs(db[:, band]).max()

    fig, axes = plt.subplots(1, 3, figsize=(12, 4), sharey=True)
    for k, (ax, ch) in enumerate(zip(axes, MOTOR)):
        m = ax.pcolormesh(t, f[band], db[k][band], cmap="RdBu_r", vmin=-vlim, vmax=vlim,
                          shading="gouraud")
        ax.axvspan(*ERD_BASE, color="k", alpha=0.10, lw=0)
        ax.axhspan(*MU, color="k", alpha=0.08)
        ax.axvline(0, color="k", lw=1.2)
        ax.set(xlabel="s relative to cue", title=CHANNELS[ch])
    axes[0].set_ylabel("Hz")
    fig.colorbar(m, ax=axes, label="dB vs pre-cue baseline")
    fig.suptitle("4 — Event-related desynchronisation at C3/Cz/C4 (mu band 8–13 Hz shaded)")
    save(fig, "04_timefreq",
         f"Cue at t = 0 (vertical line); baseline is the {ERD_BASE[0]} to {ERD_BASE[1]} s "
         f"fixation period (shaded column). Blue inside the shaded mu band after the cue is "
         f"event-related desynchronisation. Re-epoched from the raw .mat over "
         f"{ERD_WINDOW[0]} to {ERD_WINDOW[1]} s relative to the cue — the cached 0.5–4.0 s "
         f"analysis window has no pre-cue baseline of its own.")

    mu = db[:, (f >= MU[0]) & (f <= MU[1])].mean(1)           # (3, nt)
    post, pre = t >= 0.5, (t >= -0.5) & (t < 0)
    level, trough = mu[:, post].mean(1), mu[:, post].min(1)
    hits = [t[(t >= 0) & (mu[k] <= -1.0)] for k in range(3)]
    first = [f"{h[0]:.2f} s" if len(h) else "never" for h in hits]
    ok = (level < 0).all()
    verdict(ok, f"4 ERD vs the {ERD_BASE[0]}..{ERD_BASE[1]} s pre-cue baseline: mean mu power "
                f"after 0.5 s is C3 {level[0]:+.2f} dB, Cz {level[1]:+.2f}, C4 {level[2]:+.2f} "
                f"(troughs {trough[0]:+.2f}/{trough[1]:+.2f}/{trough[2]:+.2f} dB); first below "
                f"-1 dB at {first[0]} / {first[1]} / {first[2]} after the cue - "
                f"{'desynchronisation at all three channels' if ok else 'NOT below baseline at all three'}. "
                f"Reference: the last 0.5 s BEFORE the cue is already "
                f"{mu[0, pre].mean():+.2f}/{mu[1, pre].mean():+.2f}/{mu[2, pre].mean():+.2f} dB "
                f"vs the same baseline - if those are positive the baseline window is itself "
                f"desynchronised by the trial-onset warning tone and is not a rest reference")


def head(ax, z, title, levels):
    tc = ax.tricontourf(POS[:, 0], POS[:, 1], z, levels=levels, cmap="RdBu_r", extend="both")
    ax.add_patch(plt.Circle((0, 0), 1.0, fill=False, lw=1.5, color="k"))
    ax.plot([-0.1, 0, 0.1], [0.99, 1.12, 0.99], color="k", lw=1.5)
    ax.scatter(POS[:, 0], POS[:, 1], s=6, c="k", zorder=3)
    for i in MOTOR:
        ax.annotate(CHANNELS[i], POS[i], fontsize=7, ha="center", va="bottom", zorder=4)
    ax.set(xlim=(-1.2, 1.2), ylim=(-1.25, 1.25), title=title, aspect="equal")
    ax.axis("off")
    return tc


def a5_topo(D):
    """Mu-band topography by class. Expect left hand strongest near C4, right near C3."""
    per_subject = []
    for d in D.values():
        X, y = clean(d)
        f, P = welch(X, FS, nperseg=500, axis=-1)                       # (n, 22, nf)
        mu = 10 * np.log10(P[..., (f >= MU[0]) & (f <= MU[1])].mean(-1))
        per_subject.append(np.stack([mu[y == c].mean(0) for c in range(4)]))
    rel = np.mean(per_subject, 0)
    rel = rel - rel.mean(0)          # per channel, relative to the across-class mean

    levels = np.linspace(-np.abs(rel).max(), np.abs(rel).max(), 15)
    fig, axes = plt.subplots(1, 4, figsize=(13, 3.8))
    for c, ax in enumerate(axes):
        tc = head(ax, rel[c], CLASSES[c], levels)
    fig.colorbar(tc, ax=axes, label="mu power, dB vs class mean")
    fig.suptitle("5 — Mu-band (8–13 Hz) power by class, averaged over trials and subjects")
    save(fig, "05_topography",
         "Blue = less mu power than this channel's across-class mean, i.e. stronger "
         "desynchronisation. Contralateral hand imagery should be the bluest: left hand "
         "at C4, right hand at C3. Electrode positions are an approximate flat 10-10 grid.")

    lh, rh = rel[0], rel[1]
    ok = lh[C4] < lh[C3] and rh[C3] < rh[C4]
    verdict(ok, f"5 topography: left hand C4 {lh[C4]:+.2f} dB vs C3 {lh[C3]:+.2f} dB "
                f"({'contralateral' if lh[C4] < lh[C3] else 'IPSILATERAL'}); right hand "
                f"C3 {rh[C3]:+.2f} dB vs C4 {rh[C4]:+.2f} dB "
                f"({'contralateral' if rh[C3] < rh[C4] else 'IPSILATERAL'}) "
                f"- lower = stronger mu desynchronisation")


def a6_cov(D):
    """Pairwise subject distance before/after alignment. Expect a clear reduction."""
    if len(D) < 2:
        verdict(False, f"6 covariance distance: needs at least 2 subjects, have {len(D)} "
                       f"- re-run once more raw files have downloaded")
        return
    names = [f"A{s:02d}" for s in D]
    pairs = []
    for how in (lambda X: X, align):
        L = [logm(cov(how(clean(d)[0]))) for d in D.values()]
        pairs.append(np.array([[np.linalg.norm(a - b) for b in L] for a in L]))
    off = ~np.eye(len(D), dtype=bool)
    before, after = pairs[0][off].mean(), pairs[1][off].mean()

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.4))
    vmax = pairs[0].max()
    for ax, M, name in zip(axes, pairs, ("before alignment", "after Euclidean alignment")):
        im = ax.imshow(M, cmap="magma_r", vmin=0, vmax=vmax)
        ax.set_xticks(range(len(D)), names, rotation=90)
        ax.set_yticks(range(len(D)), names)
        ax.set_title(f"{name}\nmean pairwise {M[off].mean():.2f}")
    fig.colorbar(im, ax=axes, label="log-Euclidean distance")
    fig.suptitle("6 — Distance between subjects' mean covariance matrices")
    save(fig, "06_covariance",
         "Log-Euclidean distance ||log A - log B||_F between per-subject mean covariances. "
         "Euclidean alignment whitens each subject by its own mean covariance, so every "
         "aligned mean covariance is the identity and the distances collapse.")

    verdict(after < before, f"6 covariance distance: mean pairwise {before:.2f} before vs "
                            f"{after:.2e} after alignment "
                            f"({'reduced' if after < before else 'NOT reduced'}, "
                            f"{len(D)} subjects)")


def a7_proj(D):
    """PCA of log-variance features. Expect subject clustering before, less after."""
    if len(D) < 2:
        verdict(False, f"7 projection: needs at least 2 subjects, have {len(D)} "
                       f"- re-run once more raw files have downloaded")
        return
    raw, aligned, subject = [], [], []
    for s, d in D.items():
        X, _ = clean(d)
        raw.append(np.log(X.var(-1)))
        aligned.append(np.log(align(X).var(-1)))
        subject.append(np.full(len(X), s))
    subject = np.concatenate(subject)

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8))
    scores = []
    for ax, feats, name in zip(axes, (raw, aligned),
                               ("before alignment", "after Euclidean alignment")):
        Z = PCA(2).fit_transform(np.concatenate(feats))
        scores.append(silhouette_score(Z, subject))
        for s in D:
            ax.scatter(*Z[subject == s].T, s=3, alpha=0.4, label=f"A{s:02d}")
        ax.set(xlabel="PC1", ylabel="PC2",
               title=f"{name}\nsilhouette by subject {scores[-1]:+.3f}")
    axes[1].legend(fontsize=7, markerscale=3, ncol=2)
    fig.suptitle("7 — PCA of per-channel log-variance, coloured by subject")
    save(fig, "07_projection",
         "Silhouette is computed on the 2-D projection shown, over subject labels: higher "
         "means trials separate by subject, which is exactly the nuisance structure the "
         "alignment is meant to remove.")

    verdict(scores[1] < scores[0],
            f"7 projection: silhouette by subject {scores[0]:+.3f} before vs "
            f"{scores[1]:+.3f} after alignment "
            f"({'less subject clustering' if scores[1] < scores[0] else 'NOT reduced'})")


def main():
    print(f"Table 10.1 exploratory analyses -> {EDA}\n")
    D = available()
    if not D:
        print("\nno subjects available - run py phase3/data.py once the download finishes")
        return 1
    print(f"\nloaded {len(D)} subject(s): {', '.join(f'A{s:02d}' for s in D)}, "
          f"{sum(len(d[1]) for d in D.values())} trials "
          f"({sum(int((~d[3]).sum()) for d in D.values())} after artefact rejection; "
          f"analyses 3, 5-7 use those, analysis 4 re-epochs from the raw .mat)\n")
    for analysis in (a1_counts, a2_rejection, a3_psd, a4_erd, a5_topo, a6_cov, a7_proj):
        analysis(D)
    print(f"\n{len(list(EDA.glob('*.png')))} figures in {EDA}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
