# Phase 3 · Activity 5 — Training, tuning & optimisation

**Status: the queue is still running.** Everything listed below is decided and recorded;
window length and cropped training are next. Each step only adds a row — nothing already
measured changes.

| File | What it does |
|---|---|
| [`train.py`](train.py) | The training loop: Adam, label smoothing, annealed schedule, early stopping |
| [`protocol.py`](protocol.py) | Protocol v2 — the rule that makes the numbers trustworthy |
| [`tta.py`](tta.py) | Test-time adaptation on the new subject's **unlabelled** trials |
| [`improve.py`](improve.py) | Stage 2: one change at a time, each kept only if validation improves |

**Protocol v2, in one paragraph.** Each of the nine folds trains on 7 subjects, early-stops on
a stratified 10% slice of those 7, selects every hyperparameter and every design change on a
*separate* validation subject, and touches the test subject exactly once, at the end. A change
is accepted only if the three-seed validation mean improves by at least **0.75 points**. Test
numbers are reported but never allowed to change a decision; the one time an earlier test
result influenced the running order it is disclosed in `FINDINGS.md`.

```bash
py phase3/5_training_tuning_and_optimisation/tta.py       # test-time adaptation
py phase3/5_training_tuning_and_optimisation/improve.py   # Stage 2    (~2 h)
```

**Accepted** — Euclidean alignment; batch-norm statistic re-estimation on the new subject
(**+3.5 points**, no labels used at any point); shrinking to 3,924 parameters.

**Rejected and recorded** — TENT (+0.3, below threshold, and it needs gradient updates on the
new subject); batch norm inside the encoder; two architectural variants C1 and C2;
pseudo-labelling at both confidence levels. A clean negative result is still a result.
