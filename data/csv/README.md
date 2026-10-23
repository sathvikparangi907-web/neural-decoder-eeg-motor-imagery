# The recordings, as tables you can open

GitHub will not preview a 42 MB `.mat` file — click one and it says *"Sorry about that,
but we can't show files that are this big right now."* The files are fine; the viewer has a
size limit. These CSVs are the same recordings in a format the viewer does render, so the
data can be read on this page without downloading anything.

Two files per subject, eighteen in all.

## The trial waveforms — what the EEG actually looks like

[`A01_trial-waveform.csv`](A01_trial-waveform.csv) ·
[`A02_trial-waveform.csv`](A02_trial-waveform.csv) ·
[`A03_trial-waveform.csv`](A03_trial-waveform.csv) ·
[`A04_trial-waveform.csv`](A04_trial-waveform.csv) ·
[`A05_trial-waveform.csv`](A05_trial-waveform.csv) ·
[`A06_trial-waveform.csv`](A06_trial-waveform.csv) ·
[`A07_trial-waveform.csv`](A07_trial-waveform.csv) ·
[`A08_trial-waveform.csv`](A08_trial-waveform.csv) ·
[`A09_trial-waveform.csv`](A09_trial-waveform.csv)

One trial per participant, **the same imagined movement in every file** — each person's first
left-hand trial of session T. That is what makes the nine comparable: open two of them side by
side and you are looking at the same instruction in two different brains.

**875 rows × 22 columns.** One row per sample at 250 Hz, one column per electrode, values in
microvolts. Row 0 is 0.5 s after the cue, row 874 is 3.5 s later. The first few cells of A01:

| second | Fz | FC3 | FC1 | FCz | FC2 | FC4 | … |
|---|---|---|---|---|---|---|---|
| 0.000 | -19.48 | -16.60 | -21.53 | -18.70 | -21.34 | -20.36 | … |
| 0.004 | -16.65 | -14.99 | -18.31 | -15.04 | -17.48 | -18.21 | … |
| 0.008 | -10.79 | -16.11 | -14.94 | -14.75 | -11.91 | -15.48 | … |

These are the **raw** values, straight out of the `.mat` file with no filtering — a change of
format, not a change of content. The band-passed version the models are fed is rebuilt from
the `.mat` files by `data.py` and is not kept in the repository.

Each participant's first left-hand trial sits at a different place in their recording (A02's
was the very first trial, A01's the fourth), because the cue order was randomised so nobody
could anticipate the next instruction. Every participant performed all four movements 144
times.

## The trial tables — all 576 trials of one subject

[`A01_all-trials.csv`](A01_all-trials.csv) · [`A02_all-trials.csv`](A02_all-trials.csv) · [`A03_all-trials.csv`](A03_all-trials.csv) · [`A04_all-trials.csv`](A04_all-trials.csv) · [`A05_all-trials.csv`](A05_all-trials.csv) · [`A06_all-trials.csv`](A06_all-trials.csv) · [`A07_all-trials.csv`](A07_all-trials.csv) · [`A08_all-trials.csv`](A08_all-trials.csv) · [`A09_all-trials.csv`](A09_all-trials.csv)

576 rows each — every trial that subject contributed, 288 per session. Fifteen columns:

| Column | What it is |
|---|---|
| `trial`, `subject`, `session`, `trial_in_session` | where the trial sits |
| `class`, `class_id` | the imagined movement, and its 0–3 code |
| `artefact` | 1 if the trial exceeds 100 µV peak to peak |
| `mean_uv`, `sd_uv`, `peak_to_peak_uv` | the amplitude of the trial |
| `mu_c3`, `mu_c4`, `beta_c3`, `beta_c4` | band power at the two hand electrodes |
| `laterality_db` | `10·log10(mu_c4 / mu_c3)` — which hemisphere is quieter |

`laterality_db` is where the physiology shows up. Averaged over all trials: right-hand
imagery **+1.649 dB**, left hand **+1.043**, feet +1.078, tongue +0.976. Left versus right is
significant at p = 9.27e-13, and it is still only a fraction of a standard deviation
(sd ≈ 1.9), which is why single trials cannot be read off this column by eye.

All 5,184 trials in one file: [`../trials.csv`](../trials.csv).

## Where these come from

```bash
py phase3/1_environment_setup_and_data_collection/to_csv.py
```

Rebuilt from the `.mat` files in [`../`](../) in a few seconds. Every file is kept under
512 KB, which is where GitHub stops rendering a CSV as a table — the script asserts it.

The full recordings, the licence and the checksums: [`../README.md`](../README.md) and
[`../../DATA.md`](../../DATA.md).
