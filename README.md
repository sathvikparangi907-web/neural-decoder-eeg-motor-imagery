# Neural Decoder using EEG & Motor Imagery

Cross-subject motor imagery classification with deep learning.

Deep learning decoder for four-class motor imagery EEG, evaluated on subjects it was never
trained on. BCI Competition IV Dataset 2a, nine subjects, leave-one-subject-out.

The problem in one line: motor imagery decoders work on the people they were trained on and
badly on anyone new — CTNet reports 82.52% within-subject and 58.64% cross-subject, a
23.88-point drop. Full argument in `Neural Decoder using EEG & Motor Imagery/HANDOFF.md` §5.

| Phase | What | Where |
|---|---|---|
| 2 — Solution design | Submitted 15 Sep 2026 | `Neural Decoder using EEG & Motor Imagery/` |
| 3 — Implementation | 16 Sep – 3 Oct 2026 | `phase3/` |

Results and negative results as they are found: **`FINDINGS.md`**.

## Seeing the results

Everything already measured, in one command — no GPU, no dataset needed, a second to run:

```bash
py phase3/report.py
```

It prints every experiment's per-subject accuracy, the means, and the Wilcoxon
significance tests, and regenerates the figures into `phase3/results_fig/`.

Accuracy is the share of trials whose imagined movement was identified correctly.
Four classes, so **25% is chance**. The two protocols answer different questions:

- **within subject** — trained on your session 1, tested on your session 2. What a
  decoder does for a user it was calibrated on.
- **cross subject** — trained on seven other people, tested on someone it has never
  seen. What a new user gets when they put the cap on. This is the number the
  project is about, and it is far lower.

For one experiment on its own, with a chosen reference model for the statistics:

```bash
py phase3/report.py results/e2_loso.csv HCT-Net
```

## Running the experiments yourself

Python 3.14, with `numpy scipy scikit-learn matplotlib torch braindecode`. A CUDA GPU is
used if present. Everything is run from the repository root.

Only needed to reproduce the numbers from scratch. The first command downloads
744 MB and the training commands need a GPU; each takes minutes to hours.

```bash
py phase3/data.py        # download, preprocess, cache, verify against Table 8.2   (~15 min)
py phase3/preprocess.py  # M2 alignment check: mean covariance must equal identity  (~1 min)
py phase3/explore.py     # the seven Table 10.1 analyses -> phase3/eda/            (~10 min)

py phase3/fbcsp.py                    # classical baseline, within subject          (~2 min)
py phase3/train.py HCT-Net 1 2 3      # any model, any subjects, within subject
py phase3/loso.py EEGNet --seeds 1    # one model, cross subject, nine folds        (~30 min)
py phase3/components.py               # component study V0-V5                        (~3 h)
py phase3/adversarial.py              # adversarial variant, section 13.2            (~2 h)
py phase3/improve.py                  # Stage 2, each change chosen on validation     (~2 h)
```

Long runs write after every fold and skip work already recorded, so if one is
interrupted, re-running the same command continues from where it stopped.

Model names accepted anywhere: `FBCSP`, `EEGNet`, `ATCNet`, `EEGConformer`,
`CTNet`, `HCT-Net`, and the variants `HCT-Net-L1`, `HCT-Net-L6`, `HCT-Net-V1`,
`HCT-Net-V2`, `HCT-Net-V5`.

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
  models.py       the four braindecode baselines, plus the variant registry   (M3)
  hctnet.py       HCT-Net, the proposed model - 20,996 parameters             (M4)
  train.py        training loop and the within-subject experiment E1          (M5)
  loso.py         leave-one-subject-out, experiments E2 and E3                (M6)
  components.py   component study V0-V5, experiment E4                        (M7)
  adversarial.py  subject-invariant variant, section 13.2
  improve.py      Stage 2: one change at a time, chosen on validation      (E9)
  stats.py        Wilcoxon signed-rank with Holm-Bonferroni correction        (M7)
  report.py       every result table, the significance tests, the figures     (M8)
  eda/            exploratory figures
  results_fig/    result figures
results/          per-fold metrics as CSV, one row per fold per seed
FINDINGS.md       every result, including the negative ones
"Neural Decoder using EEG & Motor Imagery/"   the Phase 2 deliverables
```

The proposed model was written only after §19.1's second ordering rule was satisfied — two
baselines reproducing their published within-subject accuracy — which happened once the E1
protocol was corrected. What it found first is in `FINDINGS.md`: **HCT-Net as submitted loses.** It is second
best within subject and worst at transferring to an unseen subject, and the component study
attributes that to the attention block rather than to size or depth.

Stage 2 (`phase3/improve.py`) then improved it one change at a time, keeping a change
only if it helped on each fold's separate validation person. The final model reads the
whole time series instead of an average, attends over the whole trial instead of in
windows, and averages three trained copies. It reaches **51.9% cross-subject, 3rd of six
and statistically level with ATCNet (52.4%) and EEG Conformer (52.1%)**, at 74,508
parameters.

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
