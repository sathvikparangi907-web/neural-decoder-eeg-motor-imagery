# HANDOFF — Phase 2 Solution Design

**Project:** Cross-Subject Motor Imagery EEG Classification using Deep Learning
**Course:** Deep Learning Theory–Based Practical Work
**Phase:** 2 — Solution Design (1st Review, 15 September 2026)
**Next:** Phase 3 — Implementation (16 September – 3 October 2026), 2nd Review 3 October
**Final submission:** 10 October 2026

---

## 1. What this folder is

Everything produced for the Phase 2 review: the two submitted deliverables, the scripts that
generate them, and the figure set. The documents are **generated from code**, not hand-edited —
so if you need to change something, edit the script and rebuild rather than editing the .docx
directly, otherwise your change is lost the next time anything is rebuilt.

### The two deliverables

| File | What it is |
|---|---|
| `Phase2_Solution_Design.docx` | 39 pages, 24 sections, 13 figures, ~28 tables |
| `Phase2_Presentation.pptx` | 12 slides, designed for a 5–10 minute talk, speaker notes on every slide |

PDF renders of both sit alongside them for quick viewing.

---

## 2. How to rebuild everything

Requires Python (with `numpy`, `matplotlib`) and Node (with the `docx` and `pptxgenjs` packages).
Run from inside this folder, **in this order**:

```bash
python3 figs2.py        # generates 10 figures into fig/
python3 figs3.py        # generates 3 more figures into fig/
node doc3_part4.js      # builds Phase2_Solution_Design.docx
node deck2.js           # builds Phase2_Presentation.pptx
```

Figures must be generated before the documents, because both documents embed the PNGs from `fig/`.

### Optional — render to PDF and page images for visual checking

```bash
python /mnt/skills/public/docx/scripts/office/soffice.py --headless --convert-to pdf Phase2_Solution_Design.docx
pdftoppm -jpeg -r 85 Phase2_Solution_Design.pdf p2       # one JPG per page

python /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf Phase2_Presentation.pptx
pdftoppm -jpeg -r 110 Phase2_Presentation.pdf s2         # one JPG per slide
```

Outside this sandbox, plain `soffice --headless --convert-to pdf <file>` does the same job.

---

## 3. Which script builds which file

### The document — four files that must run as a chain

`doc3_part4.js` is the **only one you execute.** It pulls in the other three and writes the .docx
at the end. They are split purely because the content is long; together they form one document.

| File | Role | Contains |
|---|---|---|
| `doc3_part1.js` | Shared helpers | Heading, paragraph, table, figure, callout builders; colour palette; page geometry. Exports everything the other parts use. **No content.** |
| `doc3.js` | Content, first part | Title page, Sections 1–9 |
| `doc3_part2.js` | Content, second part | Sections 10–13 |
| `doc3_part3.js` | Content, third part | Sections 14–18 |
| `doc3_part4.js` | Content + build | Sections 19–24, then assembles and writes the .docx |

The chain works by each part `require`-ing the one before it and pushing into a shared array `C`.
So if you add a section to `doc3_part2.js`, it appears in the right place automatically — but
**you must run `doc3_part4.js`**, not the file you edited.

### The deck

| File | Builds |
|---|---|
| `deck2.js` | `Phase2_Presentation.pptx` — self-contained, run it directly |

### The figures

| File | Generates |
|---|---|
| `figs2.py` | `f_gap`, `f_erd`, `f_classes`, `f_evolution`, `f_sysarch`, `f_model`, `f_method`, `f_loso_concept`, `f_loso_folds`, `f_timeline` |
| `figs3.py` | `f_trial`, `f_modules`, `f_selection` |

All land in `fig/` as PNGs at 200 dpi. Both scripts define their own palette constants at the top
(navy `#1B3A6B`, purple `#5B3E96`) — change them there if the colour scheme needs to shift.

### Where each figure is used

| Figure | Document | Deck |
|---|---|---|
| `f_erd.png` | Fig 2.1 | Slide 2 |
| `f_evolution.png` | Fig 4.1 | Slide 3 |
| `f_gap.png` | Fig 4.2 | Slide 4 |
| `f_selection.png` | Fig 6.1 | — |
| `f_sysarch.png` | Fig 7.1 | Slide 7 |
| `f_modules.png` | Fig 7.2 | — |
| `f_trial.png` | Fig 8.1 | — |
| `f_classes.png` | Fig 8.2 | Slide 6 |
| `f_model.png` | Fig 11.1 | — |
| `f_method.png` | Fig 12.1 | Slide 8 |
| `f_loso_concept.png` | Fig 14.1 | Slide 10 |
| `f_loso_folds.png` | Fig 14.2 | — |
| `f_timeline.png` | Fig 19.1 | Slide 12 |

---

## 4. Folder map

```
review2/
├── HANDOFF.md                      this file
├── Phase2_Solution_Design.docx     DELIVERABLE — the document
├── Phase2_Presentation.pptx        DELIVERABLE — the deck
├── Phase2_Solution_Design.pdf      PDF render
├── Phase2_Presentation.pdf         PDF render
│
├── doc3_part1.js                   document helpers (no content)
├── doc3.js                         document sections 1–9
├── doc3_part2.js                   document sections 10–13
├── doc3_part3.js                   document sections 14–18
├── doc3_part4.js                   document sections 19–24 + BUILD ENTRY POINT
├── deck2.js                        deck build script
├── figs2.py                        10 figures
├── figs3.py                        3 figures
│
├── fig/                            13 generated PNGs
├── _qa-renders/                    80 page/slide JPGs used for visual checking — pure scratch,
│                                   regenerable with the pdftoppm commands in section 2
└── _superseded/                    earlier drafts, kept for reference only:
                                    doc2.js, make_doc.js, make_deck.js, figs.py,
                                    Phase2_Methodology_Implementation_Plan.docx/.pdf,
                                    Phase2_Review_Presentation.pptx/.pdf
```

Nothing in `_superseded/` is used by the current build. `make_doc.js`, `make_deck.js` and `figs.py`
belong to an earlier version with a different (teal) colour scheme and a different document
structure — don't run them expecting the current output.

---

## 5. What the project actually is — the short version

Read this before touching anything, so edits stay consistent with the argument.

**The problem.** Motor imagery EEG decoders work well on people they were trained on and badly on
anyone new. CTNet reports **82.52%** within-subject and **58.64%** cross-subject on BCI IV-2a —
a drop of **23.88 points**. That gap is the whole reason the project exists.

**Why it happens.** Models learn structure specific to the training subjects — skull shape,
electrode placement, individual strategy. Bigger models learn more of it. So the field's usual
fix (add capacity) makes the deployment problem worse, since a heavy model is also harder to
run on assistive hardware.

**What we propose.** `HCT-Net` — Hybrid Convolution–Transformer Network. It borrows one
justified component from each of the four surveyed papers, keeps the model deliberately small
(**20,996 parameters**, 18.5% of ATCNet), and attacks subject variability in *preprocessing*
via Euclidean alignment, which costs zero parameters and needs no labels from the new user.

**How we test it.** Leave-one-subject-out on all nine subjects, with **every model under the
same protocol** — which the published literature does not provide, since those papers each
used different evaluation settings.

**The honest claim.** No component is new. What's contributed is (i) the first comparison of all
four architectures under one identical LOSO protocol, (ii) a specific lightweight combination
with attention depth reduced for the dataset size, (iii) a component study attributing
cross-subject accuracy to each part, and (iv) accuracy measured against parameter count under a
single protocol. **No performance claim is made before the experiments run.**

---

## 6. Document conventions — things deliberately excluded

These were removed on request. **Do not reinstate them** when revising:

- No "Phase 2 deliverables coverage" front page.
- **No pseudocode or algorithm listings anywhere.** Every mechanism is explained in prose instead:
  Euclidean alignment (§9.2), augmentation (§9.3), the forward pass (§11.7), training (§12.6),
  the LOSO loop (§12.7), the method summary (§12.10).
  The environment-setup commands (§18.2) and the repository tree (§18.3) were kept — they are
  reference material, not algorithms.
- No "If the expectation fails" column in the exploratory analysis table (§10).
- No "Check before proceeding" column in the §12 stage tables.
- No §18.5 hardware and compute budget section.
- **No calendar dates in the milestone table.** The Gantt uses relative day numbers.
- No §19.4 dependencies, §19.5 day-by-day schedule, §19.6 deliverables checklist,
  §19.7 contingency plan. Section 19 is now 19.1 sequencing logic, 19.2 timeline,
  19.3 milestone specification only.

---

## 7. What's left to do

### Immediately, before submitting

- [ ] Fill the `[ ]` placeholders on the title page of **both** files: team members and
      registration numbers, guide name and designation, course code and title, department.
      These live in `doc3.js` (title page block) and `deck2.js` (slide 1 `meta` array).
- [ ] If presenting from the Review 0 material, **correct the EEG Conformer figures**. Review 0
      quoted 86.25% / 92.07% / 86.57%. The authors' own repository states **78.66%** (IV-2a),
      **84.63%** (IV-2b), **95.30%** (SEED). Review 0 also claimed Conformer beat CTNet on
      IV-2b; the reverse is true (CTNet 88.49% vs Conformer 84.63%).

### Phase 3 — the actual implementation (16 September – 3 October)

Eight milestones, defined in §19.3 of the document. Summarised:

| ID | Milestone | Done when |
|---|---|---|
| M1 | Dataset prepared and verified | All 9 subjects load; counts and class balance match; exploratory figures reviewed |
| M2 | Preprocessing pipeline complete | Alignment check passes (mean covariance ≈ identity); rejection rate recorded; tensors cached |
| M3 | Baselines implemented and reproduced | All 5 baselines within ~3 points of published within-subject accuracy |
| M4 | Proposed model implemented | Shapes match §11.3; parameter count within 5% of 20,996; overfits one batch |
| M5 | Training configuration fixed | Hyperparameters chosen on validation subject only; smoke test on 2 folds passes |
| M6 | Cross-subject experiments complete | E2 and E3 done, all 9 folds, 3 seeds each |
| M7 | Component study and analysis complete | E4 and E5 done; metrics, confusion matrices, Wilcoxon tests computed |
| M8 | Report ready for the 2nd Review | Tables and figures produced; findings written including negative results |

**153 training runs total**, roughly 24 GPU-hours. Kaggle gives ~30 GPU-hours/week, so it fits —
provided preprocessed tensors are cached and every run is checkpointed. (This estimate was
removed from the document at your request but is kept here because Phase 3 needs it.)

| Experiment | What | Runs |
|---|---|---|
| E1 | Baseline reproduction, within subject | 45 |
| E2 | Cross-subject baselines, LOSO | 45 |
| E3 | HCT-Net, LOSO | 9 |
| E4 | Component study, V0–V5 | 45 |
| E5 | Attention depth, 2 layers vs 6 | 9 |
| E6 | Complexity comparison | measured during E2/E3 |

**Three ordering rules that are not negotiable** (§19.1):

1. No model trains on cached data until the alignment check passes and the exploratory
   analyses match their expectations.
2. The proposed model is not written until at least two baselines reproduce their published
   within-subject accuracy.
3. No LOSO experiment begins until the fold definitions have been checked.

**If time runs short, cut in this order** (kept here, not in the document): E4 component study,
then E5 attention depth, then three-seed averaging (drop to one seed and say so), then the
optional adversarial variant, then inference timing. **Never cut E2/E3 or the statistics.**

### Known open decisions

- The **≥70% LOSO accuracy target** was in an earlier draft and is no longer stated in the
  document. Context if anyone asks: independent LOSO studies place EEGNet and EEG Conformer
  around 68–70% on IV-2a, and SATrans-Net reports 72.33%.
- The **Gantt chart uses relative day numbers**, not calendar dates, to stay consistent with the
  dateless milestone table. If you want dates back, edit `f_timeline()` in `figs2.py` — the
  original labels were `["16 Sep", "19", "21", "25", "28", "30", "2 Oct", "3 Oct"]`.
- The **optional adversarial variant** (§13.2) — a subject classifier behind a gradient reversal
  layer — is described as an extension, not part of the main model. Decide during Phase 3
  whether there is time for it.

---

## 8. Key numbers, for quick reference

**Dataset — BCI Competition IV Dataset 2a**
9 subjects · 22 EEG channels (+3 EOG, discarded) · 4 classes · 250 Hz · 2 sessions ·
288 trials/session · **576 trials/subject** · **5,184 total** · exactly class-balanced
Analysis window: 0.5–4.0 s after cue = 2.5–6.0 s absolute = 3.5 s = **875 samples**

**HCT-Net parameter budget**

| Block | Parameters |
|---|---|
| Convolutional (EEGNet-style) | 3,424 |
| Encoder, 2 layers × 8,544 | 17,088 |
| Learned positional encoding (11 × 32) | 352 |
| Classifier (32 → 4) | 132 |
| **Total** | **20,996** |

**Size in context:** EEGNet 2,548 · EEG-TCNet 4,096 · **HCT-Net 20,996** ·
ShallowConvNet 47,364 · ATCNet 113,732 · DeepConvNet 553,654

Six encoder layers (CTNet's depth) would take the attention block to **51,264** — exceeding the
whole 50,000 budget before the convolutional block is counted. That is the budgetary half of the
argument in §11.6; the substantive half is that extra capacity fits subject-specific detail.

**Published accuracies on BCI IV-2a** (different protocols — not directly comparable)

| Model | Parameters | Reported |
|---|---|---|
| EEGNet | 2,548 | 68.67% / 71.50% (two papers, same model) |
| ShallowConvNet | 47,364 | 66.41% / 67.48% |
| ATCNet | 113,732 | 81.10% |
| EEG Conformer | not stated | 78.66% |
| CTNet | not stated | 82.52% within / **58.64% cross** |

**Protocol:** LOSO, 9 folds — 7 train / 1 validation **subject** / 1 test subject.
Validation is a held-out subject, not a trial split, so hyperparameters are never selected in a
way that favours within-subject fit.

**Metrics:** accuracy (mean ± std over 9 folds), Cohen's kappa, macro precision / recall / F1,
confusion matrix, parameter count, training and inference time, Wilcoxon signed-rank paired
across the 9 subjects with Holm–Bonferroni correction. Results reported **per subject**, not
only averaged.

---

## 9. Sources for the verified figures

- CTNet — Zhao et al., *Scientific Reports* 14:20237 (2024)
- EEG Conformer — Song et al., *IEEE TNSRE* 31:710–719 (2023); figures from the authors' repository
- ATCNet — Altaheri et al., *IEEE TII* 19(2):2249–2258 (2023); parameter counts from the reference implementation
- EEGNet — Lawhern et al., *Journal of Neural Engineering* 15(5):056013 (2018)
- Euclidean alignment — He & Wu, *IEEE TBME* 67(2):399–410 (2020)
- Dataset — Brunner et al., BCI Competition 2008, Graz Data Set A
