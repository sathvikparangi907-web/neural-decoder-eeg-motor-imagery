"""Look at the actual numbers - the raw file, one trial, and what gets cached.

Nothing here is part of an experiment. It exists so that "what does the data
actually look like" can be answered by running something rather than by
describing it.

    py phase3/peek.py            # subject 1, first trial
    py phase3/peek.py 5 100      # subject 5, trial 100
"""
import sys
from pathlib import Path

import numpy as np
import scipy.io as sio

sys.path.insert(0, str(Path(__file__).resolve().parent))
from data import CACHE, CLASSES, CUE, DATA, FS, N_EEG, N_SAMP, START, STOP, WINDOW  # noqa: E402


def main(subject=1, trial=0):
    np.set_printoptions(precision=2, suppress=True, linewidth=150)
    path = DATA / f"A{subject:02d}T.mat"
    runs = sio.loadmat(path, struct_as_record=False, squeeze_me=True)["data"]
    imagery = [r for r in runs if np.size(r.trial)]        # runs 0-2 are calibration

    print(f"{path.name}: {len(runs)} runs, {len(imagery)} of them motor imagery")
    r = imagery[0]
    print(f"  one run is X{r.X.shape} float64 - {r.X.shape[0] / r.fs:.0f} s of continuous "
          f"recording at {r.fs} Hz, {N_EEG} EEG channels plus 3 EOG")
    print(f"  r.trial gives where each of the {np.size(r.trial)} trials starts, "
          f"r.y gives its class: {list(r.classes)}")

    run, k = divmod(trial, np.size(r.trial))
    r = imagery[run]
    start = int(np.asarray(r.trial)[k])
    cue = start + int(CUE * FS)
    raw = r.X[cue + START - int(CUE * FS):cue + STOP - int(CUE * FS), :N_EEG].T
    label = int(np.asarray(r.y)[k])
    print(f"\nTRIAL {trial}  (run {run}, trial {k} within it)  class {label} "
          f"= {r.classes[label - 1]}")
    print(f"  cut {WINDOW[0]}-{WINDOW[1]} s after the cue -> {raw.shape[0]} channels "
          f"x {raw.shape[1]} samples = {N_SAMP / FS:.1f} s")
    assert raw.shape == (N_EEG, N_SAMP), raw.shape
    print(f"\n  raw microvolts, channels 0-5, samples 0-9:\n{raw[:6, :10]}")
    print(f"  over the whole trial: min {raw.min():7.1f}  max {raw.max():6.1f}  "
          f"sd {raw.std():5.2f}")

    cache = CACHE / f"A{subject:02d}.npz"
    if not cache.exists():
        return print(f"\n{cache.name} not built yet - run py phase3/data.py")
    z = np.load(cache)
    X, y = z["X"], z["y"]
    print(f"\nwhat phase3/data.py caches: X{X.shape} {X.dtype}, y{y.shape}, "
          f"session{z['session'].shape}, rejected{z['rejected'].shape}")
    print(f"  the same trial after the 4-38 Hz band-pass, channels 0-5, samples 0-9:"
          f"\n{X[trial, :6, :10]}")
    print(f"  over the whole trial: min {X[trial].min():7.1f}  max {X[trial].max():6.1f}  "
          f"sd {X[trial].std():5.2f}")
    print(f"  label {y[trial]} = {CLASSES[y[trial]]}, and the filter removed "
          f"{100 * (1 - X[trial].std() / raw.std()):.0f}% of the amplitude")
    counts = dict(zip(*np.unique(y, return_counts=True)))
    print(f"\n  all {len(y)} trials of this subject, {dict((CLASSES[k], int(v)) for k, v in counts.items())}")
    print(f"  {int(z['rejected'].sum())} marked as artefact-contaminated, "
          f"{int((z['session'] == 1).sum())} from session 2")


if __name__ == "__main__":
    a = [int(v) for v in sys.argv[1:]]
    sys.exit(main(*a) if a else main())
