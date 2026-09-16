# Cross-Subject Motor Imagery EEG Classification

Deep learning decoder for four-class motor imagery EEG, evaluated on subjects it was never
trained on. BCI Competition IV Dataset 2a, nine subjects, leave-one-subject-out.

The problem in one line: motor imagery decoders work on the people they were trained on and
badly on anyone new — CTNet reports 82.52% within-subject and 58.64% cross-subject, a
23.88-point drop. Full argument in `review2/HANDOFF.md` §5.

| Phase | What | Where |
|---|---|---|
| 2 — Solution design | Submitted 15 Sep 2026 | `review2/` |
| 3 — Implementation | 16 Sep – 3 Oct 2026 | `phase3/` |

Results and negative results as they are found: **`FINDINGS.md`**.

## Running it

Python 3.14, with `numpy scipy scikit-learn matplotlib torch braindecode`. A CUDA GPU is
used if present. Everything is run from the repository root.

```bash
py phase3/data.py        # download (744 MB), preprocess, cache, verify against Table 8.2
py phase3/preprocess.py  # M2 alignment check: mean covariance must equal the identity
py phase3/explore.py     # the seven exploratory analyses of Table 10.1 -> phase3/eda/
py phase3/fbcsp.py       # classical baseline, within subject
py phase3/train.py 1 2 3 4 5 6 7 8 9    # deep baselines, within subject (E1)
```

`data.py` downloads the dataset on first run, from the Graz mirror at
`lampx.tugraz.at/~bci/database/001-2014/`. It fetches the `.mat` release rather than the
competition `.gdf`, because the `.mat` files carry the evaluation-session labels inline —
no separate true-labels archive and no GDF parser. `data/` and `cache/` are not tracked.

Every script is runnable on its own and ends in a self-check that fails loudly rather than
printing a number nobody verified.

## Layout

```
phase3/
  data.py         loading, band-pass, epoching, artefact marking, caching     (M1)
  preprocess.py   Euclidean alignment, standardisation, augmentation, folds   (M2)
  explore.py      the seven Table 10.1 analyses, each with a verdict          (M1)
  fbcsp.py        FBCSP + LDA, the classical baseline                         (M3)
  models.py       EEGNet, ATCNet, EEGConformer, CTNet via braindecode         (M3)
  train.py        training loop and the within-subject experiment E1          (M3)
  loso.py         leave-one-subject-out, experiment E2                        (M6)
  stats.py        Wilcoxon signed-rank with Holm-Bonferroni correction        (M7)
  report.py       result tables, confusion matrices, accuracy against size    (M8)
  eda/            exploratory figures
results/          per-fold metrics as CSV, one row per fold per seed
review2/          the Phase 2 deliverables and the scripts that build them
```

The proposed model is deliberately absent. §19.1 fixes three ordering rules, and the second
says it is not written until at least two baselines reproduce their published within-subject
accuracy. That has not happened yet, so it has not been written.

Two deliberate departures from §18 of the solution design, both open to reversal:

**Flat `phase3/` instead of the seven directories of §18.3.** The layout in the document
allocates `data/`, `preprocessing/`, `models/`, `training/`, `evaluation/`, `analysis/` and
`tests/` across roughly 25 files. The same content fits in six here, each independently
runnable. `git mv` restores the specified tree if the code is going to be read against the
document.

**No MNE, MOABB or PyYAML.** §18.1 lists them; scipy reads the `.mat` files directly, so
MOABB's download layer and MNE's epoching are not needed, and there is nothing yet whose
configuration justifies a YAML file. braindecode *is* used, and for the reason §18.1 gives:
the baselines are reference implementations, so a shortfall is a real difference rather than
an implementation bug of ours.
