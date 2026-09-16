"""BCI Competition IV-2a — loading and preprocessing.

Milestone M1. Implements steps 1-4 and 8 of Table 9.1 in the solution design:
channel selection, 4-38 Hz band-pass, epoching to the analysis window, artefact
marking, and caching. Euclidean alignment (step 5), standardisation (6) and
augmentation (7) are fold-dependent and belong to M2.

Run directly to download, build the cache and check it against Table 8.2:

    py phase3/data.py
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
import scipy.io as sio
from scipy.signal import butter, filtfilt

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / "cache"
MIRROR = "https://lampx.tugraz.at/~bci/database/001-2014/{}.mat"

FS = 250                       # Hz
N_EEG = 22                     # EEG channels; the file also carries 3 EOG channels
CUE = 2.0                      # cue onset, seconds after the trial index in the file
WINDOW = (0.5, 4.0)            # analysis window, seconds after the cue (section 8.3)
BAND = (4.0, 38.0)             # band-pass, Hz (Table 9.1 step 2)
P2P_UV = 100.0                 # artefact threshold, peak-to-peak microvolts (step 4)
SUBJECTS = tuple(range(1, 10))
SESSIONS = ("T", "E")
CLASSES = ("left hand", "right hand", "feet", "tongue")

START = int((CUE + WINDOW[0]) * FS)          # 625
STOP = int((CUE + WINDOW[1]) * FS)           # 1500
N_SAMP = STOP - START                        # 875
TRIALS_PER_SESSION = 288


def fetch(name):
    """Return the local path to A0nT.mat / A0nE.mat, downloading it if absent."""
    path = DATA / f"{name}.mat"
    if not path.exists():
        DATA.mkdir(exist_ok=True)
        # curl, not urllib: the mirror serves an incomplete certificate chain that
        # Python's CA store rejects. -C - resumes a part-finished file.
        subprocess.run(
            ["curl", "-sS", "--fail", "-L", "-C", "-", "-o", str(path), MIRROR.format(name)],
            check=True,
        )
    return path


def load_session(subject, session):
    """One session of one subject.

    Returns X (trials, 22, 875) in microvolts, y in 0..3, and a boolean mask
    marking trials that fail the artefact check.
    """
    mat = sio.loadmat(fetch(f"A{subject:02d}{session}"), struct_as_record=False, squeeze_me=True)
    b, a = butter(4, [BAND[0] / (FS / 2), BAND[1] / (FS / 2)], btype="band")

    trials, labels, dirty = [], [], []
    for run in mat["data"]:
        if np.size(run.trial) == 0:
            continue                                  # first three runs are eye-movement recordings
        raw = np.asarray(run.X, dtype=float)[:, :N_EEG]
        bad = np.isnan(raw).any(axis=1)               # a few sessions carry short NaN stretches
        # filtfilt propagates a NaN across the whole run, so zero them and mark the
        # trials they land in as artefacts rather than silently keeping them.
        signal = filtfilt(b, a, np.nan_to_num(raw), axis=0)
        for onset, label in zip(np.atleast_1d(run.trial).astype(int), np.atleast_1d(run.y).astype(int)):
            trials.append(signal[onset + START:onset + STOP].T)
            labels.append(label - 1)
            dirty.append(bad[onset + START:onset + STOP].any())

    X = np.asarray(trials, dtype=np.float32)
    y = np.asarray(labels, dtype=np.int64)
    rejected = np.asarray(dirty) | (np.ptp(X, axis=2).max(axis=1) > P2P_UV)
    return X, y, rejected


def load_subject(subject, rebuild=False):
    """Both sessions of one subject, cached to cache/A0n.npz.

    Returns X, y, session (0 for T, 1 for E) and the artefact mask. Rejected
    trials are kept and flagged, not dropped, so the rejection rate stays
    reportable and every caller can decide for itself.
    """
    path = CACHE / f"A{subject:02d}.npz"
    if path.exists() and not rebuild:
        z = np.load(path)
        return z["X"], z["y"], z["session"], z["rejected"]

    parts = [load_session(subject, s) for s in SESSIONS]
    X = np.concatenate([p[0] for p in parts])
    y = np.concatenate([p[1] for p in parts])
    rejected = np.concatenate([p[2] for p in parts])
    session = np.concatenate([np.full(len(p[1]), i, dtype=np.int64) for i, p in enumerate(parts)])

    CACHE.mkdir(exist_ok=True)
    np.savez_compressed(path, X=X, y=y, session=session, rejected=rejected)
    return X, y, session, rejected


def verify():
    """M1: every subject loads and matches Table 8.2. Prints the rejection rates."""
    print(f"{'subj':>5} {'trials':>7} {'shape':>16}  per class          rejected")
    total = 0
    for subject in SUBJECTS:
        X, y, session, rejected = load_subject(subject)
        counts = np.bincount(y, minlength=4)

        assert X.shape == (2 * TRIALS_PER_SESSION, N_EEG, N_SAMP), f"A{subject:02d}: {X.shape}"
        assert (counts == 144).all(), f"A{subject:02d}: class counts {counts}"
        assert (np.bincount(session) == TRIALS_PER_SESSION).all(), f"A{subject:02d}: session split"
        assert np.isfinite(X).all(), f"A{subject:02d}: non-finite samples survived"
        total += len(y)

        rate = 100 * rejected.mean()
        flag = "" if rate < 15 else "   <- above the 15% expectation"
        print(f"  A{subject:02d} {len(y):>7} {str(X.shape):>16}  {counts}  {rate:5.1f}%{flag}")

    assert total == 5184, f"expected 5,184 trials in total, got {total:,}"
    print(f"\nOK  9 subjects, {total:,} trials, {N_EEG} channels, {N_SAMP} samples "
          f"({WINDOW[0]}-{WINDOW[1]} s after cue at {FS} Hz), exactly class balanced.")


if __name__ == "__main__":
    sys.exit(verify())
