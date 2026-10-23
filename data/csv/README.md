# The recordings, as tables you can open

GitHub will not preview a 42 MB `.mat` file — click one and it says *"Sorry about that,
but we can't show files that are this big right now."* The files are fine; the viewer has a
size limit. These CSVs are the same recordings in a format the viewer does render, so the
data can be read on this page without downloading anything.

Two files per subject, eighteen in all.

## The waveforms — what the EEG actually looks like

[`A01_trial000_tongue.csv`](A01_trial000_tongue.csv) ·
[`A02_trial000_left-hand.csv`](A02_trial000_left-hand.csv) ·
[`A03_trial000_left-hand.csv`](A03_trial000_left-hand.csv) ·
[`A04_trial000_tongue.csv`](A04_trial000_tongue.csv) ·
[`A05_trial000_left-hand.csv`](A05_trial000_left-hand.csv) ·
[`A06_trial000_tongue.csv`](A06_trial000_tongue.csv) ·
[`A07_trial000_left-hand.csv`](A07_trial000_left-hand.csv) ·
[`A08_trial000_left-hand.csv`](A08_trial000_left-hand.csv) ·
[`A09_trial000_tongue.csv`](A09_trial000_tongue.csv)

One trial per subject — the first motor-imagery trial of session T, with the imagined
movement in the filename. **875 rows × 22 columns**: one row per sample at 250 Hz, one column
per electrode, values in microvolts. The first few cells of A01:

| second | Fz | FC3 | FC1 | FCz | FC2 | FC4 | … |
|---|---|---|---|---|---|---|---|
| 0.000 | 20.51 | 15.28 | 18.36 | 25.20 | 22.07 | 22.46 | … |
| 0.004 | 12.35 | 9.13 | 11.08 | 17.24 | 14.60 | 16.21 | … |
| 0.008 | 10.11 | 7.76 | 8.94 | 13.13 | 11.52 | 13.48 | … |

That is the whole dataset in miniature: a few tens of microvolts, wobbling, with the
difference between *left hand* and *right hand* buried somewhere in it. Nothing in those
numbers looks like an intention, which is the reason the project needs a decoder at all.

These are the **raw** values, straight out of the `.mat` file with no filtering — a change of
format, not a change of content. Row 0 is 0.5 s after the cue, row 874 is 4.0 s after it.

## The trial tables — all 576 trials of one subject

[`A01_trials.csv`](A01_trials.csv) · [`A02_trials.csv`](A02_trials.csv) ·
[`A03_trials.csv`](A03_trials.csv) · [`A04_trials.csv`](A04_trials.csv) ·
[`A05_trials.csv`](A05_trials.csv) · [`A06_trials.csv`](A06_trials.csv) ·
[`A07_trials.csv`](A07_trials.csv) · [`A08_trials.csv`](A08_trials.csv) ·
[`A09_trials.csv`](A09_trials.csv)

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
