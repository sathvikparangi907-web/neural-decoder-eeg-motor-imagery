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
from textwrap import fill

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
K3, KZ, K4 = 0, 1, 2          # the same three channels, as positions within MOTOR
LEFT, RIGHT = 0, 1            # class indices into CLASSES
MU = (8.0, 13.0)
ERD_WINDOW = (-3.0, 4.0)      # seconds relative to the cue; -3.0 s is 1.0 s BEFORE trial onset
ERD_BASE = (-3.0, -2.5)       # inter-trial break: the only genuine rest in the paradigm
# The cue sits 2.0 s after the trial index, trials are 7.67-8.5 s apart (min 1917 samples),
# and the previous trial's imagery ends 6.0 s after ITS index. So -3.0 s relative to our cue
# lands at least 0.67 s after the previous trial's imagery ended and 1.0 s before our own
# warning tone. The obvious-looking -1.5..-0.5 s fixation window is NOT rest: measured on A01,
# mu bottoms out at about -1.36 s because the warning tone at trial onset desynchronises it,
# so baselining there turns the whole post-cue period into an apparent power increase.

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
        # Wrapped, because bbox_inches="tight" widens the whole figure to fit a long
        # single-line caption and squeezes the plots into the middle of it.
        fig.text(0.5, -0.02, fill(caption, 120), ha="center", va="top", fontsize=8,
                 style="italic")
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
    kept = {s: np.bincount(d[1][~d[3]], minlength=4) for s, d in D.items()}
    x = np.arange(len(D))
    fig, ax = plt.subplots(figsize=(max(6, 1.1 * len(D) + 3), 4))
    for c in range(4):
        pos = x + (c - 1.5) * 0.2
        ax.bar(pos, [counts[s][c] for s in D], 0.2, color=f"C{c}", alpha=0.35)
        ax.bar(pos, [kept[s][c] for s in D], 0.2, color=f"C{c}", label=CLASSES[c])
    ax.axhline(144, color="k", ls="--", lw=1, label="expected 144")
    ax.set_xticks(x, [f"A{s:02d}" for s in D])
    ax.set(ylabel="trials", title="1 — Trial counts and class balance per subject "
                                  "(faded = all trials, solid = surviving artefact rejection)")
    ax.legend(fontsize=8, ncol=5)
    save(fig, "01_counts")

    bad = [f"A{s:02d}={list(c)}" for s, c in counts.items() if not (c == 144).all()]
    lo_s = min(kept, key=lambda s: kept[s].min())
    verdict(not bad, f"1 counts/balance: {len(D)} subject(s), "
                     f"{'all 576 trials and 144 per class' if not bad else 'OFF: ' + ', '.join(bad)}"
                     f"; after rejection the thinnest class-subject cell is A{lo_s:02d} "
                     f"{CLASSES[kept[lo_s].argmin()]} {kept[lo_s].min()}/144")


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

    worst = max(rate, key=rate.get)
    bad = [f"A{s:02d} {rate[s]:.1f}% (rejected per class "
           f"{np.bincount(D[s][1][D[s][3]], minlength=4).tolist()} of 144 each)"
           for s in D if rate[s] >= 15]
    verdict(not bad, f"2 rejection rate: mean {np.mean(list(rate.values())):.1f}%, worst "
                     f"A{worst:02d} {rate[worst]:.1f}% "
                     f"({'all under 15%' if not bad else 'OVER 15%: ' + '; '.join(bad)})")


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
    """ERD per class at C3/Cz/C4 against the inter-trial rest baseline.

    Re-epoched from the raw .mat over ERD_WINDOW, because the cached epochs start
    0.5 s after the cue and so carry no baseline to normalise against. Split by
    class: ERD is lateralised, so pooling the four classes cancels most of it.
    """
    S, f, t = 0.0, None, None
    for s in D:
        parts = [load_session(s, k, window=ERD_WINDOW) for k in SESSIONS]
        X = np.concatenate([p[0][~p[2]][:, MOTOR] for p in parts]).astype(np.float64)
        y = np.concatenate([p[1][~p[2]] for p in parts])
        f, t, Sxx = spectrogram(X, FS, nperseg=128, noverlap=96, axis=-1)
        S = S + np.stack([Sxx[y == c].mean(0) for c in range(4)])   # (4, 3, nf, nt)
    S /= len(D)
    t = t + ERD_WINDOW[0]                                     # seconds relative to the cue
    base = (t >= ERD_BASE[0]) & (t <= ERD_BASE[1])
    db = 10 * np.log10(S / S[..., base].mean(-1, keepdims=True))
    band = (f >= 4) & (f <= 38)
    vlim = np.abs(db[:2, :, band]).max()

    fig, axes = plt.subplots(2, 3, figsize=(12, 6.5), sharex=True, sharey=True)
    for row, c in enumerate((LEFT, RIGHT)):
        for k, ax in enumerate(axes[row]):
            m = ax.pcolormesh(t, f[band], db[c, k][band], cmap="RdBu_r", vmin=-vlim, vmax=vlim,
                              shading="gouraud")
            ax.axvspan(*ERD_BASE, color="k", alpha=0.10, lw=0)
            ax.axhspan(*MU, color="k", alpha=0.08)
            ax.axvline(0, color="k", lw=1.2)
            ax.set_title(f"{CLASSES[c]} at {CHANNELS[MOTOR[k]]}", fontsize=9)
    for ax in axes[1]:
        ax.set_xlabel("s relative to cue")
    for ax in axes[:, 0]:
        ax.set_ylabel("Hz")
    fig.colorbar(m, ax=axes, label="dB vs inter-trial rest")
    fig.suptitle("4 — Event-related desynchronisation by class (mu band 8–13 Hz shaded)")
    save(fig, "04_timefreq",
         f"The contralateral contrast is the diagonal: right-hand imagery should desynchronise "
         f"C3 and left-hand imagery C4. Cue at t = 0 (vertical line); baseline is the "
         f"{ERD_BASE[0]} to {ERD_BASE[1]} s inter-trial rest (shaded column), which falls after "
         f"the previous trial's imagery and before this trial's warning tone. Blue inside the "
         f"shaded mu band after the cue is ERD. Re-epoched from the raw .mat over "
         f"{ERD_WINDOW[0]} to {ERD_WINDOW[1]} s relative to the cue; the cached 0.5–4.0 s "
         f"analysis window has no baseline of its own.")

    mu = db[:, :, (f >= MU[0]) & (f <= MU[1])].mean(2)        # (4, 3, nt)
    post, pre = t >= 0.5, (t >= -0.5) & (t < 0)

    def summary(c, k):
        # Two latencies: against the rest baseline, and against this channel's own pre-cue
        # level. The first fires immediately whenever the warning-tone ERD has already taken
        # mu past -1 dB before the cue, so only the second is a cue-locked onset.
        hit = t[(t >= 0) & (mu[c, k] <= -1.0)]
        cue = t[(t >= 0) & (mu[c, k] <= mu[c, k, pre].mean() - 1.0)]
        return (f"{CLASSES[c]} at {CHANNELS[MOTOR[k]]} {mu[c, k, post].mean():+.2f} dB "
                f"(trough {mu[c, k, post].min():+.2f}, first below -1 dB at "
                f"{f'{hit[0]:.2f} s' if len(hit) else 'never'}, first 1 dB below its own "
                f"pre-cue level at {f'{cue[0]:.2f} s' if len(cue) else 'never'})")

    contra = [(RIGHT, K3), (LEFT, K4)]                        # right hand at C3, left hand at C4
    ipsi = [(RIGHT, K4), (LEFT, K3)]
    ok = all(mu[c, k, post].mean() < 0 for c, k in contra)
    verdict(ok, f"4 ERD vs the {ERD_BASE[0]}..{ERD_BASE[1]} s inter-trial rest baseline, mean mu "
                f"power after 0.5 s - CONTRALATERAL: {'; '.join(summary(*p) for p in contra)} "
                f"| IPSILATERAL: {'; '.join(summary(*p) for p in ipsi)} "
                f"| feet {mu[2, :, post].mean():+.2f} dB and tongue {mu[3, :, post].mean():+.2f} dB "
                f"pooled over C3/Cz/C4 "
                f"| the last 0.5 s BEFORE the cue is {mu[:, K3, pre].mean():+.2f}/"
                f"{mu[:, KZ, pre].mean():+.2f}/{mu[:, K4, pre].mean():+.2f} dB at C3/Cz/C4 "
                f"(all classes) vs the same baseline, so residual baseline contamination stays "
                f"visible - {'both contralateral cases below baseline' if ok else 'NOT both contralateral cases below baseline'}")


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
    ids = np.array(list(D))

    def recovery(F):
        """Percent of trials assigned to their own subject's centroid, chance = 100/len(D)."""
        centroid = np.stack([F[subject == s].mean(0) for s in ids])
        return 100 * (ids[np.argmin(((F[:, None] - centroid) ** 2).sum(-1), 1)] == subject).mean()

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.8))
    scores, acc = [], []
    for ax, feats, name in zip(axes, (raw, aligned),
                               ("before alignment", "after Euclidean alignment")):
        F = np.concatenate(feats)
        Z = PCA(2).fit_transform(F)
        scores.append(silhouette_score(Z, subject))
        acc.append(recovery(F))
        for s in D:
            ax.scatter(*Z[subject == s].T, s=3, alpha=0.4, label=f"A{s:02d}")
        ax.set(xlabel="PC1", ylabel="PC2",
               title=f"{name}\nsilhouette {scores[-1]:+.3f}, subject recoverable {acc[-1]:.1f}%")
    axes[1].legend(fontsize=7, markerscale=3, ncol=2)
    fig.suptitle("7 — PCA of per-channel log-variance, coloured by subject")
    save(fig, "07_projection",
         f"Two measures of the same thing, both over subject labels. Silhouette (on the 2-D "
         f"projection shown) measures separation and goes negative whenever clusters overlap, "
         f"which nine real subjects do. Nearest-subject-centroid recovery (on the full 22-D "
         f"features, chance {100 / len(D):.1f}%) measures how identifiable the subject still is, "
         f"which is what Table 10.1 means by clustering by subject.")

    ok = scores[1] < scores[0] and acc[1] < acc[0]
    verdict(ok, f"7 projection: silhouette by subject {scores[0]:+.3f} before vs {scores[1]:+.3f} "
                f"after alignment; nearest-subject-centroid recovery {acc[0]:.1f}% -> "
                f"{acc[1]:.1f}% (chance {100 / len(D):.1f}%) - "
                f"{'less subject clustering on both' if ok else 'NOT reduced on both'}. "
                f"Silhouette stays negative because the subjects overlap heavily, so the "
                f"recovery rate is the measure that matches Table 10.1's expectation")


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
