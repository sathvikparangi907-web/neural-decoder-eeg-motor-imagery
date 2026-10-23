# Phase 3 · Activity 7 — Performance evaluation & analysis

**Status: complete.** Every table regenerates from the per-fold CSVs in one command, in
about a second, with no GPU and no dataset.

| File | What it does |
|---|---|
| [`report.py`](report.py) | Every result table, every significance test, every figure |
| [`stats.py`](stats.py) | Wilcoxon signed-rank paired across the nine subjects, Holm-Bonferroni corrected |
| [`step8_summary.py`](step8_summary.py) | The test-time adaptation table |
| [`figure_size.py`](figure_size.py) | Cross-subject accuracy against parameter count |

```bash
py phase3/7_performance_evaluation_and_analysis/report.py     # everything, ~1 second
```

**The headline** — cross subject, protocol v2, 875-sample window, three seeds, adaptation on.
Chance is 25%:

| Model | Parameters | Validation | Test | κ |
|---|---|---|---|---|
| **HCT-Net config A (ours)** | **3,924** | **54.3%** | **53.6%** | **0.381** |
| EEGNet | 3,188 | 55.0% | 54.3% | 0.391 |
| HCT-Net config D | 20,996 | 53.3% | 52.7% | 0.369 |

EEGNet is 0.7 points ahead on validation, which is inside the project's own 0.75-point
decision threshold — a tie, and it is reported that way.

**The finding the project turns on.** Above 3,924 parameters, cross-subject accuracy is flat:
a second encoder layer adds nothing, doubling the width adds nothing, and ATCNet buys 1.2
points over EEGNet with 36 times the parameters. The ~18-point drop that survives at every
size tested is therefore not a capacity problem, and no amount of making the model bigger was
ever going to close it. Figure: [`../results_fig/accuracy_vs_parameters.png`](../results_fig/accuracy_vs_parameters.png).

Full write-up including every negative result: [`../../FINDINGS.md`](../../FINDINGS.md).
