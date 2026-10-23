# Phase 3 · Activity 2 — Data preprocessing & EDA

**Status: complete.** Seven exploratory analyses, each ending in a verdict rather than a
picture, and the preprocessing every later experiment runs on.

| File | What it does |
|---|---|
| [`preprocess.py`](preprocess.py) | Euclidean alignment, per-channel standardisation, segmentation-and-reconstruction augmentation, and the leave-one-subject-out fold builder |
| [`explore.py`](explore.py) | The seven Table 10.1 analyses → figures in [`../eda/`](../eda/) |
| [`trials_table.py`](trials_table.py) | Builds [`../../data/trials.csv`](../../data/trials.csv): one row per trial, 5,184 rows with band powers |
| [`check_alignment.py`](check_alignment.py) | Self-check: the mean covariance after alignment must equal the identity |
| [`check_augment.py`](check_augment.py) | Self-check: augmentation must not leak across the fold boundary |

```bash
py phase3/2_data_preprocessing_and_eda/explore.py       # the seven analyses   (~10 min)
py phase3/2_data_preprocessing_and_eda/check_alignment.py
```

**What it produced**

- **Motor lateralisation is real in this data.** Right-hand imagery raises the C4/C3 mu-band
  ratio by 1.649 dB against left hand's 1.043; Mann-Whitney left vs right **p = 9.27e-13**.
- **The subject problem is measurable.** A trial's own participant can be recovered from its
  channel variances **46.8% of the time against 11.1% chance**, falling to **22.9%** once
  Euclidean alignment is applied. The clusters overlap, so the silhouette score is negative —
  which is why silhouette is the wrong statistic here (Finding 5 in `FINDINGS.md`).
- Seven figures: counts, rejection, PSD, time–frequency, topography, covariance, projection.
