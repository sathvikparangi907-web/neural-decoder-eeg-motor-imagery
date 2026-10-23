# Neural Decoder using EEG & Motor Imagery

A deep-learning decoder that reads four imagined movements — left hand, right hand, feet,
tongue — from scalp EEG, and is tested on **people it was never trained on**.

## The problem

Motor imagery decoders work well on the person they were calibrated for and badly on
anyone new. CTNet, one of the models compared here, reports 82.52% on a user it has seen
and 58.64% on one it has not: a **23.88-point drop**. That gap is why a brain-computer
interface needs a calibration session before it is useful to a new user, and closing it is
what this project is about.

The measurement protocol follows from that. Nine participants, **leave one out**: train on
seven, select on an eighth, and test on the ninth, whose data the model has never seen.
Four classes, so **25% is chance**.

## The result

Cross subject, 875-sample window. Full tables and every negative result in
[`FINDINGS.md`](FINDINGS.md).

| Model | Parameters | Validation | Test | κ | Protocol |
|---|---|---|---|---|---|
| **HCT-Net config A — proposed** | **3,924** | **54.3%** | **53.6%** | **0.381** | v2, 3 seeds, adaptation on |
| EEGNet | 3,188 | 55.0% | 54.3% | 0.391 | v2, 3 seeds, adaptation on |
| ATCNet | 113,732 | — | 52.4% | 0.365 | v1, 1 seed, no adaptation |
| FBCSP (classical) | — | — | 44.2% | 0.256 | v1, 1 seed, no adaptation |

The last two rows are from the earlier protocol and have not been re-run under v2, so they
are not directly comparable with the first two. They are here for scale, not for ranking.

EEGNet is 0.7 points ahead on validation, inside this project's own 0.75-point decision
threshold, so it is reported as a tie and not as a win.

The finding the project turns on: **above 3,924 parameters, accuracy stops improving.** A
second encoder layer adds nothing, doubling the width adds nothing, and ATCNet buys 1.2
points over EEGNet with 36 times the parameters. The ~18-point gap that survives at every
size tested is not a capacity problem, so a bigger model was never going to close it.

## Where everything is

| What you want | Where |
|---|---|
| Every result, including the ones that failed | [`FINDINGS.md`](FINDINGS.md) |
| The code, one directory per Phase 3 activity | [`phase3/`](phase3/) |
| The recordings, and CSV views that GitHub renders | [`data/`](data/) · [`data/csv/`](data/csv/) |
| The dataset: source, licence, checksums | [`DATA.md`](DATA.md) |
| Which part of the model came from which paper | [`model_provenance/`](model_provenance/) |
| Every paper, with DOIs and the PDFs we may republish | [`references/`](references/) |
| Per-fold metrics, one row per fold per seed | [`results/`](results/) |
| Phase 2 solution design and presentation | [`Neural Decoder using EEG & Motor Imagery/`](Neural%20Decoder%20using%20EEG%20&%20Motor%20Imagery/) |

`phase3/` is split by the seven Phase 3 activities, and each directory has its own page
explaining what was done, which file does it, and the result:

```
phase3/
  1_environment_setup_and_data_collection/     download, filter, epoch, cache
  2_data_preprocessing_and_eda/                alignment, augmentation, the seven analyses
  3_baseline_model_implementation/             FBCSP, EEGNet, ATCNet, EEG Conformer, CTNet
  4_proposed_model_implementation/             HCT-Net
  5_training_tuning_and_optimisation/          training loop, protocol v2, adaptation
  6_experiments_and_result_generation/         leave-one-subject-out, component study
  7_performance_evaluation_and_analysis/       tables, significance tests, figures
```

## Seeing the results

Every number, in one command. No GPU, no dataset, about a second:

```bash
py results.py        # the summary, about 25 lines
py results.py full   # every table from every run
```

The summary gives the three models side by side, the nine people one by one, the size
sweep, and what adaptation is worth. `full` adds the per-seed tables, the rejected
variants, the Wilcoxon significance tests and the first-protocol history, and regenerates
the figures into `phase3/results_fig/`.

## Reproducing them

Python 3.14 with `numpy scipy scikit-learn matplotlib torch braindecode`. A CUDA GPU is
used if present. Everything runs from the repository root.

```bash
py phase3/1_environment_setup_and_data_collection/data.py     # preprocess and cache   (~15 min)
py phase3/6_experiments_and_result_generation/loso.py EEGNet  # one model, nine folds  (~30 min)
```

The recordings are already in `data/`, so `data.py` only has to preprocess them; it
verifies the cache against the solution design's Table 8.2 before finishing. Long runs
write after every fold and skip work already recorded, so an interrupted run continues
where it stopped. Every script ends in a self-check that fails loudly rather than printing
a number nobody verified.

The commands for each stage are on that stage's own page under `phase3/`.

## Status

| Phase | What | When |
|---|---|---|
| 2 — Solution design | Submitted | 15 September 2026 |
| 3 — Implementation and experimentation | All seven activities built and producing results | from 16 September 2026 |

The optimisation queue is the one thing still running: window length and cropped training
are next, and each step adds a row rather than changing what is already measured.

## How results are decided

Four rules the project holds to, which is why the table above reports a tie rather than a
win:

1. Every keep-or-reject decision is made on the **validation** subject. Test folds are run
   once, at the end, and reported without being allowed to change the decision.
2. A change is accepted only if it improves the three-seed validation mean by at least
   **0.75 points**.
3. One change at a time, each stacked on the last accepted one.
4. Negative results are kept and written down. Several of the ideas in the Phase 2 design
   were measured and rejected; they are in `FINDINGS.md` with the date and the numbers.
