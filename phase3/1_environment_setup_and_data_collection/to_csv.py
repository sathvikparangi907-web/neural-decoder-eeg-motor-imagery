"""Write the dataset out as CSV that GitHub renders as a table.

GitHub will not preview a 42 MB .mat file, so the recordings are invisible on the
repository page. This writes two small CSVs per subject into data/csv/:

    A0n_all-trials.csv              one row per trial, all 576
    A0n_one-trial-left-hand.csv     one trial's raw microvolts, 875 x 22

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
SHOWN_CLASS = 0         # left hand - the same class for every subject, so they compare
CHANNELS = ["Fz", "FC3", "FC1", "FCz", "FC2", "FC4", "C5", "C3", "C1", "Cz", "C2",
            "C4", "C6", "CP3", "CP1", "CPz", "CP2", "CP4", "P1", "Pz", "P2", "POz"]


def first_trial_of_class(subject, want=SHOWN_CLASS):
    """That subject's first trial of one class in session T, unfiltered, in microvolts.

    The same class for every subject, so the nine files can be compared with each
    other. Picking trial 0 instead would give whatever the randomised cue order
    happened to start with, which differs from subject to subject and compares
    nothing.
    """
    mat = sio.loadmat(fetch(f"A{subject:02d}T"), struct_as_record=False, squeeze_me=True)
    for run in mat["data"]:
        if np.size(run.trial) == 0:
            continue
        for onset, label in zip(np.atleast_1d(run.trial).astype(int),
                                np.atleast_1d(run.y).astype(int)):
            if label - 1 == want:
                return np.asarray(run.X, dtype=float)[onset + START:onset + STOP, :N_EEG]
    raise RuntimeError(f"A{subject:02d}T has no {CLASSES[want]} trial")


def write_waveform(subject):
    x = first_trial_of_class(subject)
    assert x.shape == (STOP - START, N_EEG), x.shape
    path = OUT / f"A{subject:02d}_one-trial-{CLASSES[SHOWN_CLASS].replace(' ', '-')}.csv"
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["second"] + CHANNELS)
        for i, row in enumerate(x):
            w.writerow([f"{i / FS:.3f}"] + [f"{v:.2f}" for v in row])
    return path


def write_trials(subject, rows, header):
    path = OUT / f"A{subject:02d}_all-trials.csv"
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
