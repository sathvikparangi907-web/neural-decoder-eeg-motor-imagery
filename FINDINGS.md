# Phase 3 findings

Running record of what the implementation actually showed, including results that
contradicted the plan. M8 requires findings written up including negative results, and
they are easier to write down when they happen than to reconstruct in October.

Milestone definitions are in §19.3 of `review2/Phase2_Solution_Design.docx`.

---

## M1 — dataset prepared and verified

**Status: passed.** `py phase3/data.py`

All nine subjects load. 576 trials each, exactly 144 per class, 22 channels, 875 samples
(0.5–4.0 s after the cue at 250 Hz), 5,184 trials in total. Matches Table 8.2 on every
property it states.

Source: the BNCI Horizon mirror of the Graz data (`lampx.tugraz.at/~bci/database/001-2014/`),
as `.mat` rather than the competition `.gdf`. The `.mat` release carries the evaluation
session labels in the file, so no separate true-labels download and no GDF parser is
needed — scipy reads it directly. 744 MB for all 18 files.

### Artefact rejection rates, 100 µV peak-to-peak (Table 9.1 step 4)

| A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 |
|---|---|---|---|---|---|---|---|---|
| 0.0% | 2.4% | 1.0% | 0.3% | 0.0% | 6.1% | 0.0% | 4.0% | **25.0%** |

Table 10.1 expects "under roughly 15 per cent for most subjects". Eight of nine are under
6%, so the expectation holds as written, but both ends of this distribution are worth
recording.

---

## Finding 1 — the artefact threshold is class-selective on A09

A09 rejects 25.0% of its trials. Investigated rather than accepted:

- **Not a data fault.** A09T and A09E contain zero NaN samples. The rejections are genuine
  amplitude.
- **The whole subject is high-amplitude.** A09's median peak-to-peak is 87.9 µV against a
  100 µV threshold (A01's median is 44.9 µV). The threshold is not catching outlier trials,
  it is catching the top quarter of a distribution that sits close to the line.
- **The loss is concentrated in one class.** Rejections per class are left 22, right 22,
  feet 27, **tongue 73**. Half of A09's tongue trials are removed. The worst channel is POz
  in 79 of 144 rejected trials, then CP4, CP3, P1, Pz — all posterior.

So a fixed µV threshold applied per trial removes classes unevenly for a high-amplitude
subject, and the class it removes is the one whose imagery produces the largest posterior
signal.

**Decision: keep the threshold at 100 µV as Table 9.1 specifies.** It is in the submitted
design, and changing it to a per-subject percentile would be a silent deviation. Instead:

- `data.py` flags rejected trials and **keeps** them in the cache, so the policy is a
  downstream choice rather than a destructive one.
- A09's fold must be reported with its rejection rate and class skew stated. A09 is the
  test subject in one LOSO fold, and a test set missing half of one class is not comparable
  to the other eight folds.

**Open for M2:** decide whether A09's fold uses the rejected trials, and say which in the
report. Not decided yet.

## Finding 2 — and on clean subjects the same threshold does nothing

A01 rejects 0.0%: its single worst trial peaks at 87.4 µV. After the 4–38 Hz band-pass has
removed drift and most EOG, a 100 µV peak-to-peak criterion is close to inert on a clean
recording. Step 4 of Table 9.1 is therefore doing real work on exactly one subject and
nothing on four others. Worth one sentence in the report; not worth changing.

## Finding 3 — the analysis window cannot show an ERD, and the obvious baseline is worse

Table 10.1 expects "power reduction in the mu band from roughly 0.5 s after the cue".

The cached epochs **begin** 0.5 s after the cue, so they contain no pre-cue baseline at all.
Normalising against the window mean — the only option inside the cache — cancels any change
common to the window, which is precisely the effect being looked for. The analysis window is
correct as a *model input* (§8.3 excludes the visual evoked response deliberately); it is
simply not a time-frequency baseline.

Fixed by making the window overridable: `load_session(subject, session, window=...)`
re-epochs from the raw files, and only the default window is cached.

The first replacement baseline was also wrong, and measuring it is what showed it:
normalising against the fixation period (−1.5 to −0.5 s before the cue) made post-cue mu
power appear to *increase* at C3, Cz and C4. Absolute mu power on A01 bottoms out at
t = −1.36 s — inside that baseline. The warning tone at trial onset desynchronises mu, so
the fixation period is the most desynchronised part of the trial, not a rest reference.

Baseline moved to the inter-trial break (−3.0 to −2.5 s relative to the cue, i.e. 1.0 to
0.5 s before trial onset), which sits after the previous trial's imagery and before this
trial's warning tone. A bounds guard in `load_session` drops any trial whose window runs off
the recording rather than letting a negative index wrap silently.

Second cause: pooling all four classes at C3/Cz/C4 cancels a lateralised effect. Analysis 4
now splits by class and tests the contralateral pairing.

**Resolved.** Against the inter-trial rest baseline, with classes split, the expectation
holds: right-hand imagery at C3 reaches −2.62 dB mean after 0.5 s (trough −4.36 dB), left
hand at C4 −2.58 dB (trough −3.38 dB). Onset, measured as the first drop 1 dB below each
condition's own pre-cue level, is **0.33 s and 0.46 s after the cue** — "roughly 0.5 s", as
Table 10.1 predicted. On the old fixation baseline the same analysis reported +0.84 dB, the
wrong sign entirely.

One caveat on reading those figures: mu is still 1.3–2.3 dB below the rest baseline in the
last 0.5 s *before* the cue, because the warning-tone desynchronisation has not finished. So
absolute crossings of a fixed threshold fire before the cue appears and are meaningless as
latency. Only the cue-locked measure is quoted above.

## Finding 4 — the ipsilateral control works for one hand and not the other

Right-hand imagery at C4 (ipsilateral) never drops 1 dB below its own pre-cue level — the
negative control behaves. Left-hand imagery at C3 (ipsilateral) reaches −3.02 dB, *stronger*
than left hand at its own contralateral C4 (−2.58 dB). C3 desynchronises for both hands.

This is the expected left-hemisphere bias in a mostly right-handed cohort: absolute ERD is
dominated by a bilateral component plus a C3 bias, and the lateralised part shows cleanly
only as a class *contrast*. It is why analysis 5 passes on both hands while analysis 4's
absolute levels do not, and it is an argument for the model seeing spatial *patterns* rather
than single-channel power.

---

## M3 — baselines

### FBCSP + LDA reproduced: 64.6% against 67.8% published

Per subject, against Ang et al. (2012) on the same train-on-T, test-on-E split:

| | A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | mean |
|---|---|---|---|---|---|---|---|---|---|---|
| Published | 76.0 | 56.5 | 81.2 | 61.0 | 55.0 | 45.2 | 82.8 | 81.2 | 70.8 | **67.8** |
| Ours | 76.4 | 46.0 | 86.7 | 59.8 | 50.7 | 41.5 | 75.3 | 74.1 | 71.4 | **64.6** |

A 3.2-point gap, at M3's "within ~3 points" criterion. The per-subject pattern matches the
literature — A02 and A06 are the known poor performers in every published table.

**Finding 5 — the cause was the feature budget, and the two obvious explanations were both
wrong.** The first implementation scored 61.6% and three candidate causes were measured
rather than argued:

| Candidate | Result | Verdict |
|---|---|---|
| Analysis window too long (0.5–4.0 s vs the paper's 0.5–2.5 s) | 59.0% at 0.5–2.5 s | **Refuted** — shorter is *worse* |
| Artefact rejection removing training trials | 61.2% with all trials kept | **Refuted** — makes almost no difference |
| Mutual-information feature budget too small | k=4: 56.3%, k=8: 61.2%, k=16: 65.0% | **Confirmed** |

k is now 16, which is not a tuned number: Ang et al. run four one-vs-rest classifiers and let
each select 4 features, so 16 is the reference algorithm's own budget, reached by a different
route because this implementation pools the one-vs-rest features into a single LDA. The
sensitivity is recorded above so the choice can be audited.

Worth noting that the window result cuts against an intuition the project relies on: the
2.5–4.0 s tail is *not* dead weight for a variance-based classifier, even though the ERD
analysis shows mu rebounding from about 1.3 s.

## Finding 6 — silhouette is the wrong statistic for subject clustering

Analysis 7 expects "clustering by subject before alignment". Silhouette score came out
**negative before alignment** (−0.076 in 2-D, −0.040 in the full 22-D), which reads as "no
subject structure" — the opposite of the premise the whole project rests on.

Silhouette measures cluster *separation* and goes negative whenever clusters overlap, which
nine real subjects do heavily. The measure that answers the actual question is
nearest-subject-centroid recovery: **46.8% before alignment against 11.1% chance, falling to
22.9% after**. Strong subject structure, substantially removed by Euclidean alignment.

Both numbers are now reported. The silhouette is kept because it is what a reader would
expect to see, and the recovery rate is kept because it is the one that is true.

---

## Environment note — the Kaggle assumption may not be needed

The development machine has an RTX 4050 (6 GB) with a working CUDA build
(`torch 2.14.0+cu126`, `torch.cuda.is_available()` True). The plan assumed ~24 GPU-hours on
Kaggle's ~30 hours/week allowance. Local training is worth benchmarking against that before
committing to the Kaggle workflow, since a local GPU removes the session limits and the
re-upload of cached tensors. To be measured during M3, not assumed.
