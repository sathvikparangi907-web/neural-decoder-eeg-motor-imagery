# Review 3 10/10 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the final review into a concise, defensible presentation and article package whose contribution is instantly clear to a faculty panel.

**Architecture:** Keep the final article as the evidence source and create a new Review 3 presentation rather than altering historical Review 1/2 material. The revised deck must foreground the controlled cross-subject finding, use only comparable numbers in headline charts, and move dense evidence to backup slides.

**Tech Stack:** Existing final article PDF, recorded Phase 3 result CSVs, PowerPoint/PPTX generation, final submission-folder PDF exports.

**Spec:** `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\README.txt`

## Global Constraints

- Preserve every measured result; never rewrite a number or claim a win over EEGNet.
- Headline final comparison uses protocol v2 only: HCT-Net A + BN 53.6%, EEGNet + BN 54.3%.
- State that the 0.7-point difference is inside the pre-declared 0.75-point decision threshold.
- Label protocol-v1 baseline results as historical/initial comparison, never as a final leaderboard.
- Describe the novelty as a controlled negative-result map, not as a newly invented attention architecture.
- Keep the final model definition exact: HCT-Net A, 3,924 parameters, Euclidean alignment, label-free BN-statistics adaptation.

## Review Focus

- A reviewer can distinguish familiar-person, unseen-person, protocol-v1, and protocol-v2 results within five seconds.
- No slide implies that HCT-Net beats EEGNet or that large baselines were re-run under protocol v2.
- The novelty appears before the architecture details and can be stated in one sentence.
- Body text remains readable from the back of a classroom; dense tables move to appendix slides.
- Every numerical claim on a headline slide can be located in the final article's result tables.

---

### Task 1: Establish an evidence-locked core story

**Files:**
- Read: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\1_Article\Neural_Decoder_Research_Paper_Group5.pdf`
- Read: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\2_Reviews\Review3_Phase3_Presentation.pdf`
- Create: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\2_Reviews\Review3_talk_track.md`

**Produces:** A one-page spoken narrative and an evidence table used by every revised slide.

- [ ] **Step 1: Write the 30-second opening**

Use this claim: “When a model meets a person it has never seen, making the network larger did not solve the problem; aligning the person’s signal distribution did.”

- [ ] **Step 2: Write the three-part evidence sequence**

1. The problem: same-person performance does not represent first-time-user performance.
2. The controlled finding: HCT-Net A + BN is 53.6% and EEGNet + BN is 54.3% under protocol v2; the result is a tie under the 0.75-point threshold.
3. The lesson: distribution alignment and target BN statistics helped; attention and extra capacity did not show a reliable transfer benefit.

- [ ] **Step 3: Add five anticipated panel questions with short answers**

Cover accuracy level, novelty, fairness, use of target labels, and why the smallest configuration was selected.

- [ ] **Step 4: Verify against the article**

Check every number against Table XXV, Table XXVIII, and the abstract before using it in the deck.

### Task 2: Rebuild the live Review 3 deck around one message per slide

**Files:**
- Read: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\2_Reviews\Review3_Phase3_Presentation.pdf`
- Create: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\2_Reviews\Review3_Phase3_Presentation_v2.pptx`
- Create: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\2_Reviews\Review3_Phase3_Presentation_v2.pdf`

**Produces:** A 12-slide live presentation plus optional evidence appendix.

- [ ] **Step 1: Replace the current opening with a problem-and-novelty sequence**

Slides 1–3:
1. Title and one-sentence objective.
2. “The real problem is a new person”: same-person versus unseen-person CTNet comparison.
3. “Our novelty”: one common pipeline, validation-only decisions, report both successful and failed changes.

- [ ] **Step 2: Compress the method into two visual slides**

Slide 4: dataset and LOSO split. Slide 5: label-free pipeline—filter, Euclidean alignment, standardisation, compact HCT-Net A, BN-statistics adaptation. State clearly that no target labels or target-weight updates are used.

- [ ] **Step 3: Make the model slide subordinate to the research question**

Slide 6: HCT-Net A diagram with only four values: 22×875 input, 3,924 parameters, one encoder layer, 4 classes. Add a small “borrowed building blocks” footnote: EEGNet-style convolution plus Transformer encoder.

- [ ] **Step 4: Use comparable final results only for the headline result**

Slide 7: grouped chart of HCT-Net A + BN 53.6% and EEGNet + BN 54.3%, marked “0.7 points, inside 0.75 threshold: tie.” Keep per-subject range 31.4–77.0% as a secondary callout.

- [ ] **Step 5: Make the negative-result map the centrepiece**

Slide 8: a simple two-column table—“What helped” (Euclidean alignment; BN-statistics adaptation) and “What did not show a reliable transfer benefit” (more width/depth; attention; BN in encoder). Include only validated values: HCT-Net size A 54.3 validation, D 53.3 validation; BN encoder 49.3 validation versus C2+BN 53.6.

- [ ] **Step 6: Include one per-person evidence slide**

Slide 9: HCT-Net A’s nine subject accuracies and the statement “mean hides A02/A05 difficulty; every subject is reported.”

- [ ] **Step 7: End with constraints and contribution**

Slide 10: limitations—nine subjects, no final v2 re-run for every large baseline, 53.6% is not deployment-ready. Slide 11: contribution and future work. Slide 12: closing/thank you.

- [ ] **Step 8: Move detail out of the live deck**

Place the full baseline table, confusion matrix, published-protocol table, full preprocessing list, and references in appendix slides after the closing slide.

- [ ] **Step 9: Visual QA**

Render all slides to images. Require at least 18-point body type, no wall-of-text slide, no unreadable footnote on a headline slide, and no result table without its protocol label.

### Task 3: Tighten the final article without changing evidence

**Files:**
- Read: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\1_Article\Neural_Decoder_Research_Paper_Group5.docx`
- Create: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\1_Article\Neural_Decoder_Research_Paper_Group5_REVISED.docx`
- Create: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\1_Article\Neural_Decoder_Research_Paper_Group5_REVISED.pdf`

**Produces:** A corrected, similarity-reduced article with the original formatting retained.

- [ ] **Step 1: Paraphrase literature/background passages in the editable original**

Use the drafted replacements from the prior originality review only for the Introduction and Related Work. Retain citations [1]–[34], equations, tables, all result wording, and all numerical values.

- [ ] **Step 2: Clarify protocol scope in the abstract and conclusion**

Add the distinction that protocol v1 contains the broad historical baseline comparison, while protocol v2 supports the final HCT-Net A versus EEGNet selection. Replace any absolute “only study” wording with “among the studies reviewed.”

- [ ] **Step 3: Keep the conclusion conservative**

Use “we found no evidence that extra capacity improved cross-subject decoding on this dataset” rather than a universal claim about EEG models.

- [ ] **Step 4: Run final layout and similarity checks**

Export the revised document to PDF, verify it remains 28 pages or fewer with intact figures/tables, and submit the final PDF to the university-approved similarity checker.

### Task 4: Package and rehearse

**Files:**
- Modify: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\README.txt`
- Create: `C:\Users\sathv\Desktop\Group5_DL_Project_Submission\SUBMIT_THESE_FILES.txt`

**Produces:** A submission package that makes it impossible to upload a draft or historical plan accidentally.

- [ ] **Step 1: Mark one article and one presentation as final**

Place `FINAL_` at the start of the final article PDF, final article DOCX, and revised Review 3 deck filenames. Keep Phase 2 design labelled “historical design document.”

- [ ] **Step 2: Create a submission manifest**

List the exact PDF files required by the faculty form. State that raw data, cache, working drafts, and the intermediate rewritten-wording file are not upload items.

- [ ] **Step 3: Rehearse a seven-minute talk**

Budget 45 seconds for the problem, 60 for data/protocol, 60 for model, 150 for results/novelty, 75 for limitations, and 30 for the close. Stop after the conclusion; use appendix slides only for questions.

## Self-Review

- Protocol-v1 and protocol-v2 claims are separated on every headline chart and spoken transition.
- The selected model is never framed as superior to EEGNet; it is framed as statistically indistinguishable under the defined threshold.
- The novelty is a controlled, reproducible finding—not unverified architectural originality.
- The Phase 2 document remains a dated plan and is never substituted for the final article.
- The final export receives both visual QA and an institutional similarity check before submission.
