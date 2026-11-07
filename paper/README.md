# paper/ — the analyses the paper reports beyond the main study

The paper states that the intervals, the power analysis, the chance levels and the
Riemannian baselines have scripts of their own here. These are those scripts.

```bash
py paper/riemannian.py       # the two Riemannian baselines, ~4 min on CPU
py paper/extra_analyses.py   # every statistic, from the logs in results/, ~20 s
```

`riemannian.py` needs `pyriemann` (0.12) and the cache built by
`phase3/1_environment_setup_and_data_collection/data.py`. `extra_analyses.py` needs
neither a GPU nor the raw recordings for anything but the session-shift distances.

## What each produces

| Script | Output |
|---|---|
| `riemannian.py` | `results/paper/riemannian.csv`, one row per method per test subject |
| `extra_analyses.py` | prints the seven analyses; reads `results/` only |

## Verification against the submitted manuscript

Run on 7 November 2026. Figures reproduced exactly unless noted.

| Quantity | Manuscript | This code |
|---|---|---|
| HCT-Net A − EEGNet, paired | −0.7, 95% CI [−4.3, 2.9] | −0.7, [−4.3, 2.9] |
| 80% power needs | 5.4 points | 5.4 points |
| Within vs cross, six models | r = 0.08, CI [−0.78, 0.84], p = 0.88 | identical |
| Spearman ρ | −0.14 | −0.14 |
| Within vs the drop (circular) | r = 0.86, p = 0.03 | identical |
| Session shift, A01 / A02 / A05 | 1.03 / 3.38 / 3.01 | identical |
| Shift vs difficulty | r = −0.89, CI [−0.98, −0.55] | r = −0.89, CI [−0.98, **−0.54**] |
| Bits per trial, unseen | 0.33, range 0.01–0.85 | 0.33, range 0.01–0.85 |
| Nested re-check | selection holds | A over D, 9 of 9 |
| MDM, no re-centring | 30.2% | 30.2% |
| MDM + re-centring | 47.4% (Δ +17.1) | **47.1%** (Δ +16.9) |
| TS-LR + re-centring | 49.9% | **50.5%** |

The three bold rows differ because the original Riemannian run was not kept and this
is a re-implementation from the manuscript's description; the covariance shrinkage and
the logistic-regression solver are the likely causes. **The manuscript should be
updated to the numbers this released code reproduces**, which also changes the
Conclusion's margin over the best Riemannian baseline from 3.7 to 3.1 points.

Bits per trial is the mean over subjects of each subject's Wolpaw rate, not the rate of
the mean accuracy (0.27). The manuscript should say which it means.
