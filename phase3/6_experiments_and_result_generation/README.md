# Phase 3 · Activity 6 — Experiments & result generation

**Status: complete.** Every run writes one CSV row per fold per seed, with its configuration
saved beside it as JSON.

| File | What it does |
|---|---|
| [`loso.py`](loso.py) | Leave-one-subject-out: 9 folds of 7 train / 1 validation / 1 test. Experiments E2 and E3 |
| [`within.py`](within.py) | The within-subject runs used by the size sweep |
| [`components.py`](components.py) | Component study V0–V5: which block of the model earns its place. Experiment E4 |
| [`adversarial.py`](adversarial.py) | The subject-invariant (gradient-reversal) variant of §13.2 |

```bash
py phase3/6_experiments_and_result_generation/loso.py EEGNet --seeds 1   # 9 folds  (~30 min)
py phase3/6_experiments_and_result_generation/components.py             # V0-V5    (~3 h)
```

**What is logged, per fold** — accuracy, Cohen's kappa, the epoch early stopping fired,
wall-clock time, the seed, and the code version. Written to:

- [`../../results/`](../../results/) — the first protocol, experiments E1–E9
- [`../../results/v2/`](../../results/v2/) — protocol v2, Steps 0 through 10, three seeds each

Long runs write after every fold and skip work already recorded, so an interrupted run
continues from where it stopped rather than starting over.
