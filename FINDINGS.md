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

## Finding 5 — silhouette is the wrong statistic for subject clustering

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

## M3 — baselines

### FBCSP + LDA reproduced: 64.6% against 67.8% published

Per subject, against Ang et al. (2012) on the same train-on-T, test-on-E split:

| | A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | mean |
|---|---|---|---|---|---|---|---|---|---|---|
| Published | 76.0 | 56.5 | 81.2 | 61.0 | 55.0 | 45.2 | 82.8 | 81.2 | 70.8 | **67.8** |
| Ours | 76.4 | 46.0 | 86.7 | 59.8 | 50.7 | 41.5 | 75.3 | 74.1 | 71.4 | **64.6** |

A 3.2-point gap, at M3's "within ~3 points" criterion. The per-subject pattern matches the
literature — A02 and A06 are the known poor performers in every published table.

**Finding 6 — the cause was the feature budget, and the two obvious explanations were both
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

### M3 result: two of five baselines reproduce, two miss badly

Final E1, all nine subjects, corrected protocol (all of session T, fixed annealed schedule).
Full log in `results/e1_within_subject.txt`.

| | ours | published | gap | M3 (~3 points) |
|---|---|---|---|---|
| EEGConformer | **77.3%** | 78.66% | **−1.4** | passes |
| FBCSP | 64.6% | ~67.8% | −3.2 | at the boundary |
| EEGNet | 65.9% | 71.50% | −5.6 | misses |
| CTNet | 64.2% | 82.52% | −18.3 | misses badly |
| ATCNet | 62.8% | 81.10% | −18.3 | misses badly |

**M3 is partially met.** Ordering rule 2 requires "at least two baselines reproduce their
published within-subject accuracy" before the proposed model may be written. EEGConformer at
−1.4 and FBCSP at −3.2 satisfy that, so HCT-Net is unblocked — but ATCNet and CTNet are 18
points short and that has to be stated in the report rather than averaged away.

Why the two failures are not fatal to the project: the contribution is a comparison under
**one identical protocol**, and every model here is under it. A model that underperforms its
published figure under a common protocol is a legitimate data point about that protocol — it
is only a problem if it is presented as the authors' number. Both are quoted with their gap.

The likely cause for ATCNet and CTNet, not yet tested: both reference implementations train
far longer than §13 allows. ATCNet's uses 1,000 epochs; §13 caps at 500. CTNet also uses
heavier dropout, which needs longer to converge. Testing that costs about 4 GPU-hours and is
worth doing only if the schedule is a suspect for the cross-subject numbers too.

### Progress against the broken protocol

The protocol fix in finding 9 was worth a great deal, confirming the diagnosis:

| | EEGNet | ATCNet | EEGConformer | CTNet |
|---|---|---|---|---|
| 80/20 holdout, best checkpoint | 55.5% | 60.1% | 74.4% | 52.9% |
| all of session T, annealed | **65.9%** | **62.8%** | **77.3%** | **64.2%** |
| gain | +10.4 | +2.7 | +2.9 | +11.3 |

### Superseded: the deep baselines under the broken protocol

E1, within-subject, train on session T and test on session E, all nine subjects, alignment
on, §13 hyperparameters:

| | EEGNet | ATCNet | EEGConformer | CTNet |
|---|---|---|---|---|
| Ours | 55.5% | 60.1% | **74.4%** | 52.9% |
| Published | 71.50% | 81.10% | 78.66% | 82.52% |
| Gap | −16.0 | −21.0 | −4.3 | −29.6 |

Only EEGConformer is close. **M3's criterion — all five baselines within ~3 points — is not
met, and ordering rule 2 therefore blocks writing HCT-Net.** That rule is being respected:
the proposed model has not been written.

The failure is not uniform across subjects. On the strong subjects the gap is small (A01
70.5%, A03 82.5% for EEGNet); on the weak ones it collapses (A05 26.7%, barely above the
25% chance level). FBCSP scores 50.7% on that same subject and split, so the subject is
decodable and the deep pipeline is what fails on it.

## Finding 7 — three plausible causes for that, all refuted by measurement

Recorded because each was convincing enough to act on, and acting on any of them would have
been wasted work.

| Hypothesis | Test | Result |
|---|---|---|
| Early stopping fires too soon — A05's run ended at epoch 65 of 500 | 200-epoch floor before stopping may fire | **Refuted.** Byte-identical accuracy. Training longer does not help because the restored checkpoint is still the early one, and validation accuracy never beats it even by epoch 200 |
| Augmentation is injecting bad trials — synthetic trials are discontinuous at segment joins | `augment_train=False` | **Refuted.** Worse or unchanged on 5 of 6 cases. A01 EEGNet drops 70.5% → 61.5% |
| Euclidean alignment is harmful within subject, since published pipelines do not use it | `align=False` | **Refuted.** Alignment is worth +5.2 to +7.2 points on three of four models. Removing it *and* augmentation is worst of all |

That last row is worth keeping for its own sake: it is the first direct evidence for the
project's central claim, measured under our own pipeline rather than quoted.

The pattern that survives all three: the gap tracks subject difficulty, and the runs that
score worst are the ones that trained for the fewest epochs. With 58 validation trials,
accuracy is quantised to 1.7% steps, so checkpoint selection has very little signal to work
with — and because training halts around epoch 65 of a 500-epoch cosine schedule, the
selected weights are also weights whose learning rate never annealed.

Note this is specific to E1. E1 validates against session T, which is all that is available
when session E is the test set. E2 and E3 validate against a **whole held-out subject** —
576 trials, roughly ten times the signal — so the headline cross-subject experiments do not
inherit this weakness.

## Finding 8 — the E1 failure tracks session shift, and alignment does not fix it

E1 asks a model trained on session T to work on session E, recorded on a different day. How
far apart those two days are varies a lot by subject, and it predicts the result:

| | A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 |
|---|---|---|---|---|---|---|---|---|---|
| Session T↔E distance | 1.03 | 3.38 | 1.53 | 2.07 | **3.01** | 2.22 | 1.84 | 1.65 | 1.33 |
| EEGNet E1 | 70.5% | 47.4% | 82.5% | 45.5% | **26.7%** | 35.6% | 57.3% | 64.5% | 69.5% |

Log-Euclidean distance between the two sessions' mean covariances. **Correlation −0.77.**
A01 has the closest pair of sessions and the best score; A05 and A02 the furthest and the
worst.

The part that matters: Euclidean alignment drives that distance from ~2 to about 3e-9 — the
two sessions become second-order identical — **and the models still fail on exactly the
subjects whose raw sessions were furthest apart.** So what separates two recording days for
these subjects is not captured by the mean spatial covariance, which is the only thing EA
normalises.

This has a direct bearing on the project's thesis. Section 9.2 argues that EA removes the
subject-specific mixing that blocks transfer. That is true of the second-order statistics by
construction, and the cross-subject ablation shows it is worth +5 to +7 points — but this
result says there is a residual, non-second-order component of recording-session identity
that survives alignment intact. The same component is very likely present between subjects,
not only between sessions, and it sets a ceiling on what alignment alone can deliver.

Worth stating in the report as a limitation of the approach rather than discovering it in
the cross-subject numbers and explaining it away afterwards.

## Finding 9 — the validation holdout was the cause, and it was worth up to 30 points

Resolution of the M3 blocker. E1 held back a stratified 20% of session T to early-stop on,
leaving ~230 training trials. Removing that holdout and training on all 288 for a fixed,
fully annealed 500-epoch run:

| EEGNet, E1 | A05 | A06 | A01 | A08 |
|---|---|---|---|---|
| 80/20 split, best checkpoint (§13 as written) | 26.7% | 35.6% | 70.5% | 65.2% |
| 80/20 split, final annealed model | 31.6% | 33.7% | 68.4% | 69.5% |
| **All 288 trials, final annealed model** | **56.6%** | **42.2%** | **74.3%** | **77.0%** |

The middle row isolates the cause: taking the annealed model instead of the best checkpoint
is worth almost nothing on its own. It is the **20% of training data** that mattered, and it
mattered most on the subjects that were already weakest — A05 gains 29.9 points.

Two conditions had to coincide. Session T is only 288 trials, so a fifth of it is expensive;
and 58 validation trials quantise accuracy to 1.7% steps, which is too coarse for checkpoint
selection to do better than latch onto an early noise peak. Finding 7 showed the second
condition on its own is not fixable by training longer.

**E1 now trains on all of session T with a fixed schedule.** Nothing is selected on test
data: the epoch budget is fixed in advance and session E is touched once, to score. This is
also what the reference implementations effectively do.

**Section 13's early stopping is unchanged for E2 and E3**, where validation is a whole
held-out subject — 576 trials rather than 58, and no training data is sacrificed to get it,
since the validation subject is not one of the seven training subjects. The weakness was
specific to the within-subject protocol.

---

## M6 — cross-subject evaluation (E2, in progress)

### FBCSP under LOSO: 44.2% ± 12.3%

First cross-subject result, classical baseline, nine folds, alignment on, rejection applied
to training subjects only.

| A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | mean | κ |
|---|---|---|---|---|---|---|---|---|---|---|
| 54.3% | 29.2% | 60.9% | 35.2% | 29.3% | 32.3% | 43.2% | 55.9% | 57.3% | **44.2%** | 0.256 |

**Against 64.6% within-subject, that is a 20.4-point drop.** The project is built on CTNet's
reported 23.88-point drop for a deep model; this shows the same phenomenon, at a similar
magnitude, for a classical method on our own pipeline under one protocol. It is evidence
that the gap is a property of the problem rather than of any one architecture.

The spread matters as much as the mean: 29.2% to 60.9% across folds, standard deviation
12.3. Three subjects (A02, A05, A06) land within 5 points of the 25% chance level. These are
the same subjects that are weakest within subject and that have the largest session shift
(finding 8) — subject difficulty is consistent across every protocol tried so far.

## Finding 10 — cross-subject, left/right is as hard as feet/tongue

Pooled confusion over all nine folds, row-normalised:

| true \ predicted | left | right | feet | tongue | recall |
|---|---|---|---|---|---|
| **left** | 50.0% | 27.2% | 13.3% | 9.6% | 50.0% |
| **right** | 24.7% | 45.0% | 19.3% | 11.0% | 45.0% |
| **feet** | 19.0% | 18.8% | 37.3% | 24.9% | 37.3% |
| **tongue** | 18.8% | 14.4% | 22.2% | 44.5% | 44.5% |

No collapse onto one class — predictions are near-uniform at 28.1 / 26.4 / 23.0 / 22.5%, so
the classifier is not simply guessing a favourite.

§8.5 predicts that feet and tongue are the hard pair, because both produce midline activity,
while left and right hand are separated by hemisphere. Feet does have the worst recall at
37.3%, and its largest confusion is indeed tongue — so far as predicted.

But **left↔right confusion is 51.9% against feet↔tongue's 47.1%**: cross-subject, the hand
pair is no easier than the midline pair. The lateralisation that makes left-versus-right the
easy discrimination within a subject does not survive the move to an unseen subject. That is
consistent with finding 4, where the ERD lateralisation was visible only as a class contrast
and not in absolute per-channel power, and it suggests the transferable signal is a spatial
*pattern* across electrodes rather than which hemisphere is more active.

Worth re-checking once the deep models have run: if they recover the left/right advantage
where FBCSP does not, that is an argument for learned spatial filters over fixed CSP, and it
belongs in the report.

### EEGNet under LOSO: 51.2% ± 16.1%, beating FBCSP by 7.0 points (p = 0.039)

| | A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | mean | κ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FBCSP | 54.3 | 29.2 | 60.9 | 35.2 | 29.3 | 32.3 | 43.2 | 55.9 | 57.3 | 44.2% | 0.256 |
| EEGNet | 70.8 | 28.3 | 73.8 | 35.9 | 37.8 | 44.6 | 40.8 | 65.5 | 63.0 | **51.2%** | 0.349 |

Wilcoxon signed-rank paired across the nine subjects: **p = 0.0391, significant at 0.05.**
The first significant result in the project, and it is the comparison §15 says the literature
does not provide — a deep model against a classical one under one identical protocol.

Note EEGNet's cross-subject scores exceed its own within-subject E1 scores on several
subjects (A01 70.8% cross against 70.5% within). That looks wrong until you count trials: a
LOSO fold trains on seven subjects, roughly 4,000 trials, against session T's 288. The extra
data outweighs the handicap of never having seen the test subject. It is further evidence for
finding 9 — E1's difficulty was always about data volume.

EEGNet does not beat FBCSP everywhere: it loses on A02 (−0.9) and A07 (−2.4). The two methods
disagree most on the subjects where both are near chance.

### ATCNet under LOSO: 52.4% ± 16.5% — 36× the parameters for 1.2 points

| | mean | std | κ | parameters |
|---|---|---|---|---|
| FBCSP | 44.2% | 12.3 | 0.256 | — |
| EEGNet | 51.2% | 16.1 | 0.349 | 3,188 |
| ATCNet | 52.4% | 16.5 | 0.365 | 113,732 |

ATCNet is the largest baseline and beats EEGNet cross-subject by **1.2 points while carrying
36 times as many parameters**. Under the within-subject protocol ATCNet was *behind* EEGNet
(62.8% against 65.9%).

This is the project's thesis appearing in its own measurements before the proposed model has
run: on a 5,184-trial dataset, capacity is close to free of return cross-subject. §4 argues
that extra capacity is spent fitting subject-specific structure that does not transfer, and
a 36× parameter increase buying 1.2 points is what that looks like. It also sets the bar
HCT-Net has to clear — at 20,996 parameters it sits between the two, so the interesting
question is not whether it wins outright but where it lands on accuracy per parameter.

## Finding 11 — alignment helps cross-subject by 5.5 points, and nine subjects cannot prove it

The project's central mechanism, measured cross-subject for the first time. FBCSP under LOSO
with and without Euclidean alignment, everything else identical:

| fold | A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | mean |
|---|---|---|---|---|---|---|---|---|---|---|
| aligned | 54.3% | 29.2% | 60.9% | 35.2% | 29.3% | 32.3% | 43.2% | 55.9% | 57.3% | **44.2%** |
| no alignment | 45.7% | 27.8% | 60.6% | 37.8% | 28.0% | 33.0% | 27.6% | 35.8% | 52.4% | **38.7%** |
| delta | +8.7 | +1.4 | +0.3 | **−2.6** | +1.4 | **−0.7** | +15.6 | +20.1 | +4.9 | **+5.5** |

Alignment helps in seven of nine folds, and where it helps it can help a lot: +20.1 on A08,
+15.6 on A07. But it is **not uniform** — it costs 2.6 points on A04 and 0.7 on A06.

**Wilcoxon signed-rank, paired across the nine subjects: W = 7.0, p = 0.0742. Not
significant at 0.05.**

This needs stating plainly rather than being buried. A 5.5-point mean improvement is a large
effect for this problem, and the direction is consistent in 7 of 9 subjects — but with n = 9
and two reversals, the test the project committed to in §12.8 does not clear its own
threshold. §17's rule 3 requires reporting the uncorrected value, and this is it.

Two things follow:

1. **Nine subjects is a weak instrument, and that is a property of the dataset, not a
   mistake.** With n = 9 the smallest p the Wilcoxon test can return is 0.0039, and that
   requires all nine to move the same way. Any effect with two reversals is capped near 0.07
   no matter how large it is. §8.6 anticipated that nine folds would support a mean and a
   standard deviation but not strong per-fold claims; this is what that looks like in
   practice. It is an argument for the future-scope multi-dataset evaluation, and against
   over-claiming from IV-2a alone.
2. **The claim has to be phrased as it was measured.** "Euclidean alignment improved
   cross-subject accuracy by 5.5 points on average, in 7 of 9 subjects, p = 0.074" is
   defensible. "Euclidean alignment significantly improves cross-subject accuracy" is not,
   on this evidence.

The same test will be run for each deep baseline and for the proposed model. If the deep
models show the same direction, the combined picture is stronger than any single test — but
each must still be reported with its own p-value.

---

## Environment note — the Kaggle assumption may not be needed

The development machine has an RTX 4050 (6 GB) with a working CUDA build
(`torch 2.14.0+cu126`, `torch.cuda.is_available()` True). The plan assumed ~24 GPU-hours on
Kaggle's ~30 hours/week allowance. Local training is worth benchmarking against that before
committing to the Kaggle workflow, since a local GPU removes the session limits and the
re-upload of cached tensors. To be measured during M3, not assumed.
