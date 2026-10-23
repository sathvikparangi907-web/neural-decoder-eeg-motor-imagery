# Phase 3 · Activity 1 — Environment setup & data collection

**Status: complete.** The recordings are in this repository and every number in the
project traces back to bytes with a published checksum.

| File | What it does |
|---|---|
| [`data.py`](data.py) | Downloads the 18 `.mat` files, selects the 22 EEG channels, band-passes 4–38 Hz, cuts the 0.5–4.0 s analysis window, marks artefacts, caches the result, then checks itself against Table 8.2 of the solution design |
| [`peek.py`](peek.py) | Prints the real numbers — one trial in raw microvolts and after the band-pass, the class counts, the artefact counts |

```bash
py phase3/1_environment_setup_and_data_collection/data.py   # download, cache, verify  (~15 min)
py phase3/1_environment_setup_and_data_collection/peek.py   # see the actual numbers   (instant)
```

**What it produced**

- BCI Competition IV Dataset 2a: 9 subjects × 2 sessions × 288 trials = **5,184 trials**,
  22 channels, 250 Hz, 744 MB, in [`../../data/`](../../data/).
- Cached tensors `X(576, 22, 875) float32` per subject.
- 18 SHA-256 checksums in [`../../data/SHA256SUMS`](../../data/SHA256SUMS), all 18 verified.

Environment: Python 3.14, PyTorch 2.14 + CUDA 12.6, braindecode 1.8.1, scipy, scikit-learn,
matplotlib. Trained on an RTX 4050 (6 GB). Full dataset card: [`../../DATA.md`](../../DATA.md).
