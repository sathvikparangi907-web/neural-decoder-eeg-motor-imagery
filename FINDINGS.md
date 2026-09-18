# Phase 3 findings

Running record of what the implementation actually showed, including results that
contradicted the plan. M8 requires findings written up including negative results, and
they are easier to write down when they happen than to reconstruct in October.

Milestone definitions are in §19.3 of `Neural Decoder using EEG & Motor Imagery/Phase2_Solution_Design.docx`.

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

---

## M6/E3 — the proposed model, and it loses

**HCT-Net under LOSO: 46.9% ± 16.5%.** Below both deep baselines, and the gap is
statistically significant.

| | A01 | A02 | A03 | A04 | A05 | A06 | A07 | A08 | A09 | mean | κ | params |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ATCNet | 75.3 | 30.9 | 78.8 | 42.5 | 37.8 | 38.7 | 43.4 | 62.7 | 61.5 | **52.4%** | 0.365 | 113,732 |
| EEGNet | 70.8 | 28.3 | 73.8 | 35.9 | 37.8 | 44.6 | 40.8 | 65.5 | 63.0 | **51.2%** | 0.349 | 3,188 |
| **HCT-Net** | 72.7 | 28.3 | 70.1 | 34.7 | 34.4 | 33.0 | 34.9 | 62.0 | 52.1 | **46.9%** | 0.292 | 20,996 |
| FBCSP | 54.3 | 29.2 | 60.9 | 35.2 | 29.3 | 32.3 | 43.2 | 55.9 | 57.3 | **44.2%** | 0.256 | — |

Wilcoxon signed-rank paired across the nine subjects, Holm-corrected across **all five
baselines** as §17 rule 3 requires. (An earlier version of this section corrected across only
three, because CTNet and EEGConformer had not yet run cross-subject. The larger family is
stricter and changes two verdicts — the corrected figures below are the ones that stand.)

| against | mean difference | p | p (Holm over 5) | |
|---|---|---|---|---|
| ATCNet | **−5.5** | 0.0039 | **0.0195** | significantly worse |
| EEGConformer | −5.2 | 0.0195 | 0.0781 | worse, not significant after correction |
| EEGNet | −4.3 | 0.0234 | 0.0781 | worse, not significant after correction |
| CTNet | −3.3 | 0.2109 | 0.4219 | not significant |
| FBCSP | +2.7 | 0.4961 | 0.4961 | not significant |

**The proposed model is significantly worse than ATCNet, worse than EEGConformer and EEGNet
at uncorrected p < 0.05 but not after correction, and not better than the classical baseline
— while carrying 6.6× EEGNet's parameters.** It is last but one of six. Both corrected and
uncorrected values are reported, per §17 rule 3. §1's claim that no
performance claim would be made before the experiments ran is the reason this is reportable
rather than embarrassing — but it has to be stated exactly this plainly in the report.

Where it loses is specific. HCT-Net is competitive on the strong subjects (A01 72.7% against
EEGNet's 70.8%, A08 62.0% against 65.5%) and collapses on the middle of the distribution:
A07 34.9% against EEGNet's 40.8% and ATCNet's 43.4%, A09 52.1% against 63.0%, A06 33.0%
against 44.6%. It is not uniformly weaker — it fails to generalise on the subjects where the
baselines still manage something.

**Established below (finding 12): it is neither — it is transfer.** Superseded text follows.

**Not yet established: whether this is the architecture or the training.** The obvious next
test is E1 for HCT-Net — if it also underperforms within subject, the architecture is simply
weaker than its parts; if it performs well within subject and poorly across, the problem is
transfer, which is what the design was meant to address and would be the more interesting
failure. That test is running.

Related open question, and the reason §19.1 listed E5: the encoder depth of 2 was chosen on a
budget argument (§11.6), not measured. It is possible that 2 layers underfits and that the
budget reasoning, while sound about parameter count, picked the wrong side of the trade.

---

## Finding 12 — HCT-Net is the *best-transferring-worst* model: 2nd within subject, largest drop

The discriminating test came back and it is not the architecture being weak. HCT-Net within
subject scores **73.2%** — second of six, beating EEGNet by 7.3 points, CTNet by 9.0 and
ATCNet by 10.4, behind only EEGConformer.

| model | within subject | cross subject | drop | parameters |
|---|---|---|---|---|
| EEGConformer | 77.3% | *pending* | — | 697,412 |
| **HCT-Net** | **73.2%** | **46.9%** | **−26.3** | 20,996 |
| EEGNet | 65.9% | 51.2% | −14.8 | 3,188 |
| FBCSP | 64.7% | 44.2% | −20.5 | — |
| CTNet | 64.2% | *pending* | — | 152,364 |
| ATCNet | 62.8% | 52.4% | −10.4 | 113,732 |

**The model built to close the cross-subject gap has the largest cross-subject gap of
anything tested — 26.3 points, exceeding even the 23.88 that CTNet reports and that this
project was written to attack.**

So the proposed architecture works. It is a good within-subject decoder. What it does *not*
do is the one thing it was designed for, and it fails at it harder than the baselines it was
meant to improve on.

### The pattern across all four models is the project's own thesis, turned on itself

Rank the models by within-subject accuracy and by their drop, and the two orderings are close
to inverse: HCT-Net (73.2%, −26.3), FBCSP (64.7%, −20.5), EEGNet (65.9%, −14.8), ATCNet
(62.8%, −10.4). **The better a model decodes a subject it has seen, the worse it transfers to
one it has not.**

§4 argues exactly this — that models learn structure specific to the training subjects, and
that more capable models learn more of it. The project advanced that as the explanation for
*other* people's results. It now holds for our own proposed model, measured under a single
protocol, which is stronger evidence for §4's mechanism than anything quoted from the
literature.

Note it is not simply parameter count: ATCNet has 5.4× HCT-Net's parameters and the smallest
drop. It tracks *within-subject skill*, not size. Whatever capacity ATCNet spends, it is not
spending it on the individual.

### What this does to the contribution

The claim "a lightweight hybrid improves cross-subject accuracy" is dead — the experiment
says the opposite and says it at p < 0.05. What survives is worth more than a small win would
have been:

1. **The first comparison of these architectures under one identical LOSO protocol** — the
   stated contribution (i) in §1, unaffected by which model won.
2. **A measured demonstration that within-subject skill and cross-subject transfer trade off
   against each other**, on five models under one protocol. That is a result about the
   problem, not about one architecture.
3. **A negative result on a plausible design.** Euclidean alignment plus a small windowed
   encoder is an obvious thing to try; it does not work, and the reason it does not work is
   visible in the numbers.
4. Euclidean alignment helps (+5.5 cross-subject, finding 11) but not enough to overcome what
   the encoder learns about individuals.

### What would be worth testing next, in order

- **E5, attention depth**: the encoder depth of 2 was chosen on a budget argument, never
  measured. If depth drives the within-subject gain that causes the transfer loss, 1 layer
  may transfer better than 2. This is now the most informative single experiment left.
- **E4, component study**: which part causes the drop — the encoder, the positional encoding,
  or the windowing. V0–V5 as specified in §13.
- The adversarial variant of §13.2, a subject classifier behind a gradient reversal layer,
  moves from "optional extension" to the most promising remaining idea, because it attacks
  precisely the failure these numbers identify.

---

## Finding 13 — the trade-off held out of sample, and capacity buys almost nothing

Finding 12 was written before EEGConformer had been run cross-subject, and it predicted that
the best within-subject model should transfer worst. EEGConformer is the best within-subject
model at 77.3%. It came back at **52.1% cross-subject — a 25.2-point drop, the second
largest**, behind only HCT-Net.

| model | within | cross | drop | parameters |
|---|---|---|---|---|
| EEGConformer | 77.3% | 52.1% | **−25.2** | 697,412 |
| HCT-Net | 73.2% | 46.9% | **−26.3** | 20,996 |
| EEGNet | 65.9% | 51.2% | −14.7 | 3,188 |
| FBCSP | 64.7% | 44.2% | −20.5 | — |
| ATCNet | 62.8% | 52.4% | −10.4 | 113,732 |

Across all six models — E2 is now complete — within-subject accuracy against transfer drop
gives **Pearson r = −0.864 (p = 0.026)** and **Spearman r = −0.886 (p = 0.019)**. With the
fifth and sixth models added the relationship is **significant at 0.05**, and it was a
prediction registered before EEGConformer and CTNet ran, not a pattern fitted afterwards.

| model | within | cross | drop | parameters |
|---|---|---|---|---|
| ATCNet | 62.8% | **52.4%** | −10.4 | 113,732 |
| EEGConformer | 77.3% | 52.1% | −25.2 | 697,412 |
| EEGNet | 65.9% | 51.2% | −14.7 | 3,188 |
| CTNet | 64.2% | 50.2% | −14.0 | 152,364 |
| HCT-Net | 73.2% | 46.9% | −26.3 | 20,996 |
| FBCSP | 64.7% | 44.2% | −20.5 | — |

### Capacity buys almost nothing cross-subject

The three best cross-subject models are within **1.2 points** of each other:

| | cross-subject | parameters | |
|---|---|---|---|
| ATCNet | 52.4% | 113,732 | 36× EEGNet |
| EEGConformer | 52.1% | 697,412 | **219× EEGNet** |
| EEGNet | **51.2%** | **3,188** | — |

**EEGConformer spends 219 times EEGNet's parameters to gain 0.9 points.** With E2 complete,
the top four cross-subject models fall within **2.2 points** of each other (52.4% to 50.2%)
while spanning 3,188 to 697,412 parameters. Correlation between
log parameter count and cross-subject accuracy across the four deep models is +0.397 — weak,
and driven entirely by EEGNet being unusually good for its size.

This is contribution (iv) from §1 — accuracy measured against parameter count under a single
protocol — and it lands more sharply than the proposed model winning would have. On this
dataset, under this protocol, cross-subject accuracy is essentially flat in model size across
two orders of magnitude, while within-subject accuracy is not. Whatever the extra capacity
buys, it is subject-specific.

It also reframes the §11.1 design constraint. Keeping the model under 50,000 parameters was
justified on the grounds that a smaller model can memorise less about individuals. The size
argument turns out to be right about transfer and irrelevant to cross-subject accuracy:
EEGNet at 3,188 is within 1.2 points of models 36× and 219× its size, and HCT-Net at 20,996
is worse than both. Size was never the binding constraint.

---

## E5 / Finding 14 — attention depth is not the lever; the encoder itself is

Depth 2 was chosen on §11.6's budget argument and never measured. Measured now, cross-subject
under LOSO:

| variant | parameters | cross-subject |
|---|---|---|
| HCT-Net-L1 | 12,452 | 46.0% |
| HCT-Net (L2) | 20,996 | 46.9% |
| HCT-Net-L6 | 55,172 | 47.7% |

Paired across the nine subjects: L1→L2 +0.9 (p = 0.250), L2→L6 +0.8 (p = 0.496), L1→L6 +1.7
(p = 0.156). **No comparison is significant.** Depth 1 to 6 spans 1.7 points for 4.4× the
parameters.

Two things follow. §11.6's choice of 2 layers is vindicated, though not for the reason given
— it is not that 2 is the right depth, it is that depth barely matters here, so the cheapest
defensible choice was as good as any. And the hypothesis at the end of finding 12, that depth
drives the within-subject skill that costs transfer, is **refuted**.

### The encoder is what costs the transfer

EEGNet is close to HCT-Net's convolutional front end with no attention on top. It beats
HCT-Net by **4.3 points cross-subject (p = 0.023)** with 6.6× fewer parameters, and the gap
does not close at any encoder depth.

So the windowed Transformer encoder — the component the design is named for, adapted from
ATCNet and CTNet on the argument that local attention suits short EEG trials — appears to be
the part that hurts. It buys within-subject accuracy (HCT-Net is 7.3 points ahead of EEGNet
within subject) and loses more than that in transfer.

### V0 — the encoder accounts for about half the gap, and neither half is significant alone

Variant V0 is HCT-Net with `use_encoder=False`: the front end, windowing and fusion exactly
as they are, attention removed.

| | cross-subject | |
|---|---|---|
| HCT-Net (L2) | 46.9% | |
| **HCT-Net-V0** | **48.8%** | +1.9 removing the encoder, p = 0.098, helps on 8 of 9 folds |
| EEGNet | 51.2% | +2.4 further, p = 0.164 |

So the 4.3-point gap to EEGNet splits roughly in half. The encoder costs about 1.9 points,
consistently — 8 of 9 folds move the same way — and the remaining 2.4 comes from the several
small ways this front end differs from EEGNet's, which the design never intended as changes.

Neither half reaches significance on its own at n = 9; only the combined gap does (p = 0.023).
That is the honest statement: **removing the attention improves cross-subject accuracy, the
direction is consistent, and nine subjects are not enough to establish either half
separately.** It is the same n = 9 ceiling as finding 11 — an effect of this size simply
cannot be proven on this dataset, which is an argument about the dataset rather than about
the effect.

What it means for the design: the windowed encoder is not merely failing to help, it is
costing accuracy on unseen subjects while buying it on seen ones. The component the model is
named for is the component to remove.

---

## M7 / E4 — component study: only alignment earns its place

Six configurations, same nine folds, Table 17.3. Differences are V0 minus the variant, so a
negative number means the variant **beat** the full model.

| variant | cross-subject | vs V0 | p | p (Holm over 5) |
|---|---|---|---|---|
| V0 full model | 46.9% | — | — | — |
| V1 no attention | **48.8%** | −1.9 | 0.098 | 0.293 |
| V2 global attention | **49.8%** | −2.9 | 0.164 | 0.328 |
| V3 no alignment | 41.8% | **+5.1** | 0.027 | 0.137 |
| V4 no augmentation | 48.1% | −1.2 | 0.910 | 0.910 |
| V5 convolution only | 39.1% | **+7.8** | 0.027 | 0.137 |

**Of the three things added to the convolutional core, one helps, one hurts and one does
nothing.**

- **Euclidean alignment earns its place.** Removing it costs 5.1 points (uncorrected
  p = 0.027) — the largest single effect in the study, and close to the +5.5 it gave FBCSP
  in finding 11. It is the one component that works on both a classical and a deep model.
- **Attention costs accuracy.** Removing it entirely gains 1.9 points, and it is not that the
  windowing is wrong in some fixable way: V2, with global attention over all 27 steps,
  gains 2.9 — beating both the full model and the no-attention variant.
- **Augmentation does nothing measurable.** V4 gains 1.2 points at p = 0.910, which is as
  close to no effect as this study can report. §9.3 argued segmentation-and-reconstruction
  was "a necessity rather than a refinement" on a dataset this small. Cross-subject, it is
  neither.

### Two design constraints fixed in advance turn out to be wrong

Table 11.1 fixed three constraints before the design. The parameter budget was vindicated
(finding 13: size barely matters cross-subject). The other two did not survive:

- **"Windowed attention, not global"**, justified by a locality prior suiting short EEG
  trials. V2 says global attention is *better* by 2.9 points. The prior is wrong, or at least
  not worth what it costs.
- **"Encoder depth 2"** — finding 14 showed depth makes no significant difference at all, so
  the constraint was harmless but also uninformative.

### The multiple-comparison ceiling, again

Nothing in the table survives Holm correction across the five comparisons, though V3 and V5
are significant uncorrected. This is the third time the same ceiling has been hit (findings
11 and the V0/V1 comparison). With nine subjects and a family of five, an effect needs to be
very large to clear correction — V3's 5.1 points does not. Both values are reported, per §17
rule 3, and the honest summary is: **the direction of every component effect is consistent
and the magnitudes are plausible, but this dataset cannot establish them individually.**

### What the study says to build next

The best configuration measured here is **V2 at 49.8%** — convolutional front end, global
attention, alignment, augmentation. That is still below EEGNet's 51.2%. The evidence points
at a model that keeps alignment, drops the windowing, and does not obviously need the
encoder at all: which is to say, it points back at EEGNet plus Euclidean alignment.

---

## Finding 15 — ATCNet and CTNet are not broken, and every fixable cause was refuted

M3 recorded both models 18.3 points below their published within-subject accuracy.
A focused diagnostic tested each plausible cause. All came back negative, which is
itself the result.

| hypothesis | test | outcome |
|---|---|---|
| wrong architecture, or our own re-implementation | inspected braindecode 1.8.1 against both papers | **refuted** — reference implementations, paper defaults (`n_windows=5`, `tcn_depth=2`, `num_layers=6`) |
| undertrained: heaviest dropout in the field on a uniform 500-epoch budget | re-ran both at 1500 epochs | **refuted** — ATCNet 80.0% → 77.6%, CTNet 80.8% → 80.4%, slightly *worse* |
| input window: 875 samples against the 1125 both papers used | ran ATCNet on the weak subjects at both lengths | **refuted** — 43.9% at ours, 41.1% at the paper's; longer is worse |

**The deficit is entirely in the weak subjects.** On A01/A03/A08, ATCNet reaches
80.0% against its published mean of 81.1%, and CTNet 80.8% against 82.5% — both
reproduce. On A04/A05/A06, ATCNet scores 49.3 / 43.4 / 38.9.

So the correct statement is not "our implementation of ATCNet is wrong" but
**"ATCNet reproduces on decodable subjects and collapses on hard ones under this
pipeline."** The published means average over a cohort whose weak subjects did not
collapse as far as ours did.

**Untested, and the next thing to check:** the shared preprocessing. Euclidean
alignment whitens each session's covariance, which is exactly the spatial structure
a CSP-like spatial convolution exploits, and the weak subjects have the least signal
to spare. Testing it means changing the pipeline for one model, which is outside a
diagnostic's remit; it is recorded here as the open question.

**What this does to the leaderboard: nothing.** The numbers survived every test, so
ATCNet stays at 62.8% within subject and 52.4% cross subject. The interpretation
changes, not the values.

## Finding 16 — the V1-to-EEGNet gap has two causes, and only one was suspected

V1 is our model with attention removed, and was described as "essentially EEGNet plus
alignment". It is not.

| | EEGNet | our V1 |
|---|---|---|
| classifier input | **432 numbers** (27 time steps x 16 filters) | **32 numbers** |
| classifier weights | 1,732 | 132 |
| temporal filters F1 | 8 | **16** |
| separable filters F2 | 16 | **32** |
| kernel lengths, pooling, dropout | — | identical |

1. **The classifier head.** Global average pooling collapses the temporal profile
   before the classifier; EEGNet's final convolution reads every time step. The
   classifier sees 13 times less information.
2. **Width.** V1's convolutional block is twice EEGNet's in both filter counts — a
   difference that was never intended as a design choice and was not noticed until
   the two were compared layer by layer.

The first is the larger effect and is the change C1 addresses. The second means any
claim that V1 "isolates the attention block against EEGNet" was overstated: V1 and
EEGNet differ in three ways, not one.

## Correction to finding 13's noise estimate

An earlier note here said single-seed differences below about 1.4 points should be
read as noise, generalising from one observation: HCT-Net scored 71.5% and then
72.9% on A01 under the adversarial variant with the same seed. These diagnostics
show ATCNet reproducing its E1 numbers **exactly** (49.3%, 43.4%) on re-runs of the
same configuration. So run-to-run variation is not a property of the pipeline in
general; it appeared in the adversarial training path specifically. The broad claim
was wrong and should not be repeated in the report. Where a genuine noise floor is
needed, it has to be measured with repeated seeds rather than inferred from one pair
of runs.

---

## Stage 2 — improving HCT-Net, one change at a time

Each change was stacked on the last one kept and run over all nine LOSO folds. Only the
**validation subject** decided whether a change stayed. Test accuracy was recorded but
not read until the final configuration had been fixed.

| step | change | validation | test | decision |
|---|---|---|---|---|
| base | model as submitted | 53.8% | 47.1% | reference |
| C1 | flatten head instead of average pooling | 55.0% | 48.5% | kept |
| C2 | global attention instead of windowed | 56.0% | 49.1% | kept |
| C3 | test-time batch-norm adaptation | 55.6% | 53.2% | **rejected** |
| C5 | softmax averaged over three seeds | 58.6% | **51.9%** | kept, final |

**Final: 51.9% cross-subject**, up 4.9 points on the model as submitted (47.1% in this
re-run; 46.9% in the original E2).

| rank | model | cross-subject |
|---|---|---|
| 1 | ATCNet | 52.4% |
| 2 | EEG Conformer | 52.1% |
| **3** | **HCT-Net, final** | **51.9%** |
| 4 | EEGNet | 51.2% |
| 5 | CTNet | 50.2% |
| 6 | FBCSP | 44.2% |

Against every baseline the difference is not statistically reliable after Holm
correction over five comparisons (ATCNet −0.5, p = 0.82; EEG Conformer −0.2,
p = 0.84; EEGNet +0.8, p = 0.57; CTNet +1.7, p = 0.64; FBCSP +7.8, p = 0.020
uncorrected, 0.098 corrected). The final model is statistically level with the top four:
**it ties with them, it does not beat them.**

**Size.** One C2 network has 24,836 parameters. The final model runs three of them, so
74,508 at inference: 65% of ATCNet's 113,732, and 3.5 times the 20,996 in the submitted
design. The ensemble buys its accuracy by giving up some of the lightweight argument, and
the report has to say so.

**Within-to-cross drop.** Not measured for the final configuration. That would need an E1
within-subject run of C5, which was not done. The submitted model's 26.3-point drop
therefore cannot be compared with a final figure yet.

### The honesty disclosures this result depends on

1. **The validation-selected configuration is not the test-best one.** C3, rejected on
   validation (55.6% against C2's 56.0%), scores **53.2% on test**. That is higher than
   the final model and higher than ATCNet. Choosing by test accuracy would have put it
   first. It was not chosen, because the rule was set before the run and switching now
   would be selection on the test set. So the reported 51.9% is the honest number, and a
   higher figure was left on the table on purpose.
2. **C2 was not chosen blind.** It was put forward because the E4 component study showed
   global attention at 49.8% against 46.9%, and those were **test-fold** figures. C2 was
   then confirmed on validation (+1.0 over C1), but it was on the list partly because its
   test result had already been seen. C1 came from the Stage 1 architecture comparison and
   C5 is a standard technique, so neither was prompted by test results.
3. **An earlier version of this stage could not see C3 or C5.** Batch-norm adaptation and
   seed averaging were applied only to the test subject, while validation was scored
   before either happened. That was fixed, and both were re-run, before any decision was
   made.

### Six E1 rows were overwritten by a diagnostic, and restored

The Stage 1 epoch diagnostic ran ATCNet and CTNet at 1500 epochs through `train.py`,
whose within-subject run writes to `results/e1_within_subject.csv`. It replaced the
500-epoch protocol values for A01, A03 and A08 of both models, and that version was
committed. It showed up as ATCNet reading 62.0% within subject instead of 62.8%. The six
rows were restored from the first committed version of the file, and `train.py` now
writes any run at a non-protocol epoch budget to a separate file.

### What changes in the design document

- **§11.6 is falsified.** The final model uses global attention, and the argument that
  windowed attention suits short EEG trials did not survive two separate measurements.
  The section needs rewriting to say that, not to defend the original reasoning.
- **The model is no longer 20,996 parameters** once it is deployed as a three-member
  ensemble. Table 11.3's figure describes one member only.

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
