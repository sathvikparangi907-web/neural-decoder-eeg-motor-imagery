"""One row per trial - the dataset as a table that can be browsed.

The recordings are a 5,184 x 22 x 875 tensor, which no table can show. This
reduces each trial to the things that are one number per trial: who it came
from, what they imagined, and a few summary measures of the signal. It is a
description of the data, not a substitute for it.

Everything is computed from the band-passed cache, so the numbers match what
the models are fed.

    py phase3/2_data_preprocessing_and_eda/trials_table.py        ->  data/trials.csv
"""
import csv
import sys
from pathlib import Path

import numpy as np
from scipy.signal import welch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from _paths import ROOT  # noqa: E402
from data import CACHE, CLASSES, DATA, FS, SUBJECTS, TRIALS_PER_SESSION  # noqa: E402
from explore import C3, C4, CHANNELS  # noqa: E402

MU, BETA = (8.0, 13.0), (13.0, 30.0)
FIELDS = ["trial", "subject", "session", "trial_in_session", "class", "class_id",
          "artefact", "mean_uv", "sd_uv", "peak_to_peak_uv",
          "mu_c3", "mu_c4", "beta_c3", "beta_c4", "laterality_db"]


def band_power(x, lo, hi):
    """Welch power in a band, microvolts squared, for one channel of one trial."""
    f, p = welch(x, FS, nperseg=min(256, len(x)))
    return float(np.trapezoid(p[(f >= lo) & (f < hi)], f[(f >= lo) & (f < hi)]))


def rows():
    n = 0
    for s in SUBJECTS:
        z = np.load(CACHE / f"A{s:02d}.npz")
        X, y, session, rejected = z["X"], z["y"], z["session"], z["rejected"]
        for i in range(len(X)):
            t = X[i]
            mu3, mu4 = band_power(t[C3], *MU), band_power(t[C4], *MU)
            yield {
                "trial": n, "subject": s, "session": int(session[i]) + 1,
                "trial_in_session": i % TRIALS_PER_SESSION,
                "class": CLASSES[y[i]], "class_id": int(y[i]),
                "artefact": int(rejected[i]),
                "mean_uv": round(float(t.mean()), 3),
                "sd_uv": round(float(t.std()), 2),
                "peak_to_peak_uv": round(float(t.max() - t.min()), 1),
                "mu_c3": round(mu3, 2), "mu_c4": round(mu4, 2),
                "beta_c3": round(band_power(t[C3], *BETA), 2),
                "beta_c4": round(band_power(t[C4], *BETA), 2),
                "laterality_db": round(10 * np.log10(mu4 / mu3), 2),
            }
            n += 1


def main():
    out = DATA / "trials.csv"
    data = list(rows())
    with out.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=FIELDS)
        w.writeheader()
        w.writerows(data)

    assert len(data) == 5184, len(data)
    assert {r["subject"] for r in data} == set(SUBJECTS)
    assert len({r["class"] for r in data}) == 4
    counts = {c: sum(r["class"] == c for r in data) for c in CLASSES}
    assert set(counts.values()) == {1296}, counts
    print(f"wrote {out.relative_to(Path.cwd())}  {len(data):,} rows x {len(FIELDS)} columns"
          f"  ({out.stat().st_size / 1024:.0f} KB)")
    print(f"  {CHANNELS[C3]} and {CHANNELS[C4]} are the sensorimotor channels; "
          f"laterality_db is 10*log10(mu at {CHANNELS[C4]} / mu at {CHANNELS[C3]})")
    print(f"  classes {counts}, {sum(r['artefact'] for r in data)} trials marked artefact")


if __name__ == "__main__":
    sys.exit(main())
