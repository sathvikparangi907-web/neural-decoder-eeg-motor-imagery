"""Write the dataset out as CSV that GitHub renders as a table.

GitHub will not preview a 42 MB .mat file, so the recordings are invisible on the
repository page. This writes two small CSVs per subject into data/csv/:

    A0n_trials.csv                  one row per trial, all 576
    A0n_trial000_<class>.csv        one trial's raw microvolts, 875 x 22

Both stay under GitHub's ~512 KB rendering limit. The waveform CSV carries the
RAW values straight out of the .mat file - a format change, not a modification,
which is what the CC BY-ND licence allows. The band-passed version is a
derivative and stays out of the repository; phase3/.../data.py rebuilds it.

    py phase3/1_environment_setup_and_data_collection/to_csv.py
"""
import csv
import sys
from pathlib import Path

import numpy as np
import scipy.io as sio

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from _paths import ROOT  # noqa: E402
from data import CLASSES, DATA, FS, N_EEG, START, STOP, SUBJECTS, fetch  # noqa: E402

OUT = DATA / "csv"
CHANNELS = ["Fz", "FC3", "FC1", "FCz", "FC2", "FC4", "C5", "C3", "C1", "Cz", "C2",
            "C4", "C6", "CP3", "CP1", "CPz", "CP2", "CP4", "P1", "Pz", "P2", "POz"]


def first_trial_raw(subject):
    """The first motor-imagery trial of session T, unfiltered, in microvolts."""
    mat = sio.loadmat(fetch(f"A{subject:02d}T"), struct_as_record=False, squeeze_me=True)
    for run in mat["data"]:
        if np.size(run.trial) == 0:
            continue
        onset = int(np.atleast_1d(run.trial)[0])
        label = int(np.atleast_1d(run.y)[0]) - 1
        x = np.asarray(run.X, dtype=float)[onset + START:onset + STOP, :N_EEG]
        return x, label
    raise RuntimeError(f"A{subject:02d}T has no motor-imagery run")


def write_waveform(subject):
    x, label = first_trial_raw(subject)
    assert x.shape == (STOP - START, N_EEG), x.shape
    path = OUT / f"A{subject:02d}_trial000_{CLASSES[label].replace(' ', '-')}.csv"
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["second"] + CHANNELS)
        for i, row in enumerate(x):
            w.writerow([f"{i / FS:.3f}"] + [f"{v:.2f}" for v in row])
    return path


def write_trials(subject, rows, header):
    path = OUT / f"A{subject:02d}_trials.csv"
    mine = [r for r in rows if int(r["subject"]) == subject]
    assert len(mine) == 576, f"A{subject:02d}: {len(mine)} rows"
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writeheader()
        w.writerows(mine)
    return path


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with (DATA / "trials.csv").open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows, header = list(reader), reader.fieldnames

    for s in SUBJECTS:
        for path in (write_trials(s, rows, header), write_waveform(s)):
            kb = path.stat().st_size / 1024
            assert kb < 512, f"{path.name} is {kb:.0f} KB, over GitHub's render limit"
            print(f"  {path.name:38s} {kb:6.0f} KB")
    print(f"{2 * len(SUBJECTS)} files in {OUT}")


if __name__ == "__main__":
    main()
