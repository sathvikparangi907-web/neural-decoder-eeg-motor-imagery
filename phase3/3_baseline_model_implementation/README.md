# Phase 3 · Activity 3 — Baseline model implementation

**Status: complete.** Five baselines, all run under one identical protocol — one classical
method written from scratch and four published deep models taken from braindecode as
reference implementations, so a shortfall is a real difference and not a bug of ours.

| File | What it does |
|---|---|
| [`fbcsp.py`](fbcsp.py) | FBCSP + LDA, the classical baseline, reimplemented from Ang et al. 2008 |
| [`models.py`](models.py) | EEGNet, ATCNet, EEG Conformer and CTNet from braindecode, plus the variant registry |

```bash
py phase3/3_baseline_model_implementation/fbcsp.py            # classical baseline  (~2 min)
py phase3/6_experiments_and_result_generation/loso.py EEGNet  # one model, 9 folds  (~30 min)
```

**What it produced** — within subject, all nine subjects, ours against each paper's figure:

| Model | Ours | Published | Gap |
|---|---|---|---|
| EEG Conformer | 77.3% | 78.66% | −1.4 |
| FBCSP | 64.6% | 67.8% | −3.2 |
| EEGNet | 65.9% | 71.50% | −5.6 |
| CTNet | 64.2% | 82.52% | −18.3 |
| ATCNet | 62.8% | 81.10% | −18.3 |

Two of five reproduce their published accuracy, which was the gate set in §19.1 before the
proposed model could be written. The other two are 18 points short; their reference
implementations train twice as long as this protocol allows. That is reported rather than
averaged away.
