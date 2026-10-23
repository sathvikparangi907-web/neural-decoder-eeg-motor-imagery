# Phase 3 — Implementation & Experimentation

One directory per Phase 3 activity. Open any of them and its own page explains what was
done, which file does it, the command that runs it, and the result it produced.

| # | Activity | Code | Status |
|---|---|---|---|
| 1 | [Environment setup & data collection](1_environment_setup_and_data_collection/) | `data.py`, `peek.py` | complete |
| 2 | [Data preprocessing & EDA](2_data_preprocessing_and_eda/) | `preprocess.py`, `explore.py`, `trials_table.py`, 2 self-checks | complete |
| 3 | [Baseline model implementation](3_baseline_model_implementation/) | `fbcsp.py`, `models.py` | complete |
| 4 | [Proposed model implementation](4_proposed_model_implementation/) | `hctnet.py` | complete |
| 5 | [Training, tuning & optimisation](5_training_tuning_and_optimisation/) | `train.py`, `protocol.py`, `tta.py`, `improve.py` | queue still running |
| 6 | [Experiments & result generation](6_experiments_and_result_generation/) | `loso.py`, `within.py`, `components.py`, `adversarial.py` | complete |
| 7 | [Performance evaluation & analysis](7_performance_evaluation_and_analysis/) | `report.py`, `stats.py`, `step8_summary.py`, `figure_size.py` | complete |

Also here: [`_paths.py`](_paths.py) — one definition of the repository root and the import
path, so a module in one activity directory can still import one from another;
[`eda/`](eda/) — the exploratory figures; [`results_fig/`](results_fig/) — the result figures.

## The result, in one table

Cross subject, protocol v2, 875-sample window, three seeds, test-time adaptation on.
Four classes, so **chance is 25%**.

| Model | Parameters | Validation | Test | κ |
|---|---|---|---|---|
| **HCT-Net config A (ours)** | **3,924** | **54.3%** | **53.6%** | **0.381** |
| EEGNet | 3,188 | 55.0% | 54.3% | 0.391 |
| HCT-Net config D (as submitted in Phase 2) | 20,996 | 53.3% | 52.7% | 0.369 |

## Seeing all of it in one command

```bash
py phase3/7_performance_evaluation_and_analysis/report.py
```

No GPU, no dataset, about a second. It prints every experiment's per-subject accuracy, the
means, and the Wilcoxon significance tests, and regenerates the figures.

## How the code is run

Every script is run from the repository root and is runnable on its own, and each ends in a
self-check that fails loudly rather than printing a number nobody verified.

```bash
py phase3/<activity directory>/<script>.py
```

Full write-up of every result, including the negative ones: [`../FINDINGS.md`](../FINDINGS.md).
The dataset: [`../DATA.md`](../DATA.md). The papers: [`../references/REFERENCES.md`](../references/REFERENCES.md).
