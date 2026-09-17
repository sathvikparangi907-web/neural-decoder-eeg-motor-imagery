const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, LevelFormat, PageNumber, Footer, convertInchesToTwip
} = require('docx');
const fs = require('fs');

const CW = 9000;            // content width in DXA
const NAVY = "1F3864";
const ACCENT = "2E74B5";
const GREY = "595959";

// ---------- helpers ----------
const H1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 360, after: 160 },
  children: [new TextRun({ text: t, bold: true, color: NAVY, size: 30 })]
});

const H2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text: t, bold: true, color: ACCENT, size: 24 })]
});

const P = (t, opts = {}) => new Paragraph({
  spacing: { after: opts.after === undefined ? 120 : opts.after, line: 276 },
  alignment: opts.align || AlignmentType.JUSTIFIED,
  indent: opts.indent,
  children: [new TextRun({ text: t, size: 21, italics: !!opts.italics, bold: !!opts.bold, color: opts.color })]
});

// rich paragraph: array of [text, {bold,italics,color}]
const RP = (runs, opts = {}) => new Paragraph({
  spacing: { after: opts.after === undefined ? 120 : opts.after, line: 276 },
  alignment: opts.align || AlignmentType.JUSTIFIED,
  children: runs.map(([text, o = {}]) => new TextRun({
    text, size: 21, bold: !!o.b, italics: !!o.i, color: o.c, font: o.f
  }))
});

const BUL = (t, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { after: 70, line: 276 },
  children: [new TextRun({ text: t, size: 21 })]
});

const BULR = (runs, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { after: 70, line: 276 },
  children: runs.map(([text, o = {}]) => new TextRun({
    text, size: 21, bold: !!o.b, italics: !!o.i, color: o.c, font: o.f
  }))
});

const NUM_ = (instance, t) => NUM(t, instance);
const NUM = (t, instance = 0) => new Paragraph({
  numbering: { reference: "steps", level: 0, instance },
  spacing: { after: 70, line: 276 },
  children: [new TextRun({ text: t, size: 21 })]
});

function cell(text, { bold = false, bg, align = AlignmentType.LEFT, width, size = 19, color, italics = false } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: "auto" } : undefined,
    margins: { top: 80, bottom: 80, left: 110, right: 110 },
    children: [new Paragraph({
      alignment: align,
      spacing: { after: 0, line: 240 },
      children: [new TextRun({ text: String(text), bold, size, color, italics })]
    })]
  });
}

function table(headers, rows, widths, opts = {}) {
  const headRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((h, i) => cell(h, {
      bold: true, bg: NAVY, color: "FFFFFF", width: widths[i],
      align: i === 0 ? AlignmentType.LEFT : (opts.centerCols === false ? AlignmentType.LEFT : AlignmentType.CENTER),
      size: 19
    }))
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    cantSplit: true,
    children: r.map((c, i) => cell(c, {
      width: widths[i],
      bg: ri % 2 === 1 ? "F2F5FA" : undefined,
      bold: opts.boldFirstCol && i === 0,
      align: i === 0 ? AlignmentType.LEFT : (opts.centerCols === false ? AlignmentType.LEFT : AlignmentType.CENTER),
      size: 19
    }))
  }));
  return new Table({
    columnWidths: widths,
    width: { size: CW, type: WidthType.DXA },
    rows: [headRow, ...bodyRows]
  });
}

const CAP = (t) => new Paragraph({
  spacing: { before: 60, after: 200 },
  children: [new TextRun({ text: t, size: 17, italics: true, color: GREY })]
});

const SPACER = (n = 120) => new Paragraph({ spacing: { after: n }, children: [new TextRun({ text: "", size: 12 })] });

// callout box
function callout(title, body, fill = "EAF1F8") {
  return new Table({
    columnWidths: [CW],
    width: { size: CW, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CW, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill, color: "auto" },
        margins: { top: 140, bottom: 140, left: 160, right: 160 },
        children: [
          new Paragraph({ spacing: { after: 70 }, children: [new TextRun({ text: title, bold: true, size: 21, color: NAVY })] }),
          ...(Array.isArray(body) ? body : [body]).map(b =>
            new Paragraph({ spacing: { after: 50, line: 276 }, alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: b, size: 21 })] }))
        ]
      })]
    })]
  });
}

// ---------- document content ----------
const children = [];

// Title block
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 400, after: 60 },
  children: [new TextRun({ text: "DEEP LEARNING–BASED NEURAL DECODER", bold: true, size: 36, color: NAVY })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [new TextRun({ text: "FOR EEG MOTOR IMAGERY", bold: true, size: 36, color: NAVY })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: "Phase 2 — Methodology and Implementation Plan", size: 26, color: ACCENT })]
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 300 },
  children: [new TextRun({ text: "1st Review  •  15 September 2026", size: 21, color: GREY })]
}));

children.push(callout(
  "Scope of this document",
  ["This document covers the seven Phase 2 deliverables: proposed methodology, system architecture, model and algorithm selection, dataset selection and description, tools and environment, implementation plan with milestones, and the experimental plan with evaluation metrics. It builds directly on the literature survey submitted at the 0th Review."],
  "EAF1F8"
));
children.push(SPACER(200));

// ---------------- 1. Recap ----------------
children.push(H1("1. Problem Recap and Research Gap"));
children.push(P("Electroencephalography records the brain's electrical activity non-invasively, and motor imagery — imagining a movement without performing it — produces characteristic changes in the mu (8–13 Hz) and beta (13–30 Hz) rhythms over the sensorimotor cortex. A decoder that maps these signals to intended movements would let people with severe motor impairment control computers, wheelchairs and prosthetic limbs without moving."));
children.push(P("The obstacle is not classification accuracy in the abstract; it is that accuracy collapses when the model meets a person it was not trained on. EEG is shaped by individual skull thickness, cortical folding, electrode placement and the strategy a person adopts when imagining movement, so the feature distribution shifts from subject to subject. Our literature survey quantified this directly."));

children.push(SPACER(60));
children.push(table(
  ["Model", "Within-subject accuracy (IV-2a)", "Cross-subject accuracy (IV-2a)", "Drop"],
  [
    ["CTNet (2024)", "82.52%", "58.64%", "−23.88 pts"],
    ["CTNet (2024), IV-2b", "88.49%", "76.27%", "−12.22 pts"],
  ],
  [2600, 2300, 2300, 1800],
  { boldFirstCol: true }
));
children.push(CAP("Figure/Table 1.1 — The generalisation penalty reported by CTNet. The same architecture loses nearly 24 accuracy points on the 4-class task when the test subject is unseen during training. Source: Zhao et al., Scientific Reports 14:20237 (2024)."));

children.push(P("A model that scores 82% on people it has met and 59% on a stranger is not deployable. A patient cannot be asked to supply hours of labelled calibration data before their wheelchair responds. This gap — high accuracy on unseen subjects, achieved with a model small enough to run on assistive hardware, and with little or no calibration — is the problem this project targets."));

children.push(SPACER(60));
children.push(callout("Research gap (carried forward from the 0th Review)",
  ["Existing motor imagery decoders achieve strong within-subject accuracy but degrade sharply on unseen subjects. Recent architectures close this gap by adding capacity — attention layers, transformer depth, larger parameter counts — which conflicts with the low-power, low-latency requirements of real assistive devices. It is not established whether the improvement in cross-subject decoding comes from architectural capacity or from making the input representation subject-invariant in the first place."],
  "FFF4E5"));

// ---------------- 2. Hypothesis ----------------
children.push(H1("2. Research Hypothesis and Objectives"));
children.push(P("The 0th Review identified the gap but did not commit to a testable claim. Phase 2 closes that. The project is organised around one primary hypothesis and two secondary hypotheses, each falsifiable by a specific experiment."));

children.push(H2("2.1 Primary hypothesis"));
children.push(callout("H1",
  ["For cross-subject motor imagery decoding, making the input representation subject-invariant through covariance alignment contributes more to leave-one-subject-out accuracy than an equivalent increase in model capacity, and its benefit is largely complementary to feature-space domain-generalisation losses rather than redundant with them."],
  "E8F3EC"));
children.push(RP([
  ["Tested by: ", { b: true }],
  ["the ablation grid in Section 10. If alignment and added capacity contribute equally, or if alignment's benefit disappears once domain-generalisation losses are present, H1 is falsified — and that is itself a reportable finding, because it would tell the field that architectural scaling is the productive direction."]
]));

children.push(H2("2.2 Secondary hypotheses"));
children.push(BULR([["H2. ", { b: true }], ["Windowed self-attention matches or exceeds full self-attention under leave-one-subject-out evaluation while using materially fewer parameters, because unconstrained attention capacity overfits subject-specific structure on datasets of this size (~2,600 trials)."]]));
children.push(BULR([["H3. ", { b: true }], ["Subject-invariant alignment reduces the number of labelled target-subject trials needed to reach a fixed accuracy threshold, measured as a calibration-efficiency curve."]]));

children.push(H2("2.3 Objectives"));
children.push(NUM("Build a reproducible preprocessing and evaluation pipeline for motor imagery EEG with a single, fixed leave-one-subject-out protocol applied identically to every model."));
children.push(NUM("Reproduce four published architectures — EEGNet, ATCNet, CTNet and EEG Conformer — under that one protocol, so their cross-subject performance can be compared on equal terms for the first time."));
children.push(NUM("Design and implement SAND-Net, a lightweight hybrid decoder that combines one justified component from each reviewed architecture with an explicit subject-invariance mechanism."));
children.push(NUM("Run a component-wise ablation that isolates the contribution of alignment, multi-scale temporal modelling, windowed attention and the domain-generalisation losses."));
children.push(NUM("Quantify calibration efficiency: accuracy as a function of the number of labelled trials available from the unseen subject."));
children.push(NUM("Validate model interpretability against known neurophysiology — specifically, whether learned channel importance reproduces contralateral event-related desynchronisation."));

children.push(SPACER(60));
children.push(callout("Why objective 2 matters on its own",
  ["The four papers report accuracies obtained under different train/test splits — hold-out, 5-fold, session-based, subject-specific. The published numbers therefore cannot be ranked against each other. Evaluating all four under one identical protocol is a contribution independent of whether our own model wins."],
  "EAF1F8"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------------- 3. Methodology ----------------
children.push(H1("3. Proposed Methodology"));
children.push(P("The system is a five-stage pipeline. Stages 1 and 2 are signal processing, stage 3 is the learned decoder, stage 4 is the training objective, and stage 5 is interpretation."));

children.push(SPACER(60));
children.push(table(
  ["Stage", "Operation", "Purpose"],
  [
    ["1. Acquisition", "Load raw EEG epochs, select channels, reject bad trials", "Standardised input across three datasets"],
    ["2. Signal conditioning", "Band-pass filter → epoch → Euclidean Alignment → normalise", "Remove noise; remove subject-specific covariance shift"],
    ["3. Feature encoding", "Depthwise-separable convolution → multi-scale temporal branch → windowed self-attention", "Learn spatial filters, multi-band temporal dynamics, long-range dependencies"],
    ["4. Objective", "Cross-entropy + supervised contrastive + domain-adversarial loss", "Force class structure to be shared across subjects"],
    ["5. Interpretation", "Class Activation Topography + attention heatmaps", "Check the model uses sensorimotor cortex, not artefacts"],
  ],
  [1900, 3500, 3600],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 3.1 — Methodology overview. Each stage is specified in detail in Sections 4 to 7."));

children.push(H2("3.1 Why subject-invariance is applied at the input, not only in the network"));
children.push(P("Most recent work attacks subject variability inside the network, through adversarial feature alignment or attention. Euclidean Alignment attacks it before the network sees the data: it whitens each subject's trials by their own mean spatial covariance, so every subject's data arrives with identity covariance. The operation is unsupervised — it needs only unlabelled trials from the new subject, never their labels — and costs one eigendecomposition of a 22×22 matrix, which is negligible against a forward pass."));
children.push(P("This matters for deployment. A new user puts on the headset, records a minute of unlabelled motor imagery, and the alignment matrix is computed from it. No labelling, no supervised calibration session. That is what makes the 'without lengthy calibration' requirement operational rather than aspirational."));

children.push(SPACER(60));
children.push(callout("Euclidean Alignment — formal definition",
  ["For subject s with trials X₁ … X_N, each of shape C channels × T samples, compute the mean spatial covariance R_s = (1/N) Σᵢ Xᵢ Xᵢᵀ. Each trial is then aligned as X̃ᵢ = R_s^(−1/2) Xᵢ. After this transform the mean covariance of every subject equals the identity matrix, so the first-order distribution shift between subjects is removed. Reference: He and Wu, IEEE Transactions on Biomedical Engineering 67(2):399–410, 2020."],
  "F2F2F2"));

// ---------------- 4. Architecture ----------------
children.push(H1("4. System Architecture — SAND-Net"));
children.push(P("SAND-Net (Subject-Agnostic Neural Decoder) is assembled from components taken deliberately from the reviewed literature, with one addition. The design rule was that every component must earn its place in the ablation; nothing is included because it appeared in a paper."));

children.push(H2("4.1 Component provenance and justification"));
children.push(SPACER(60));
children.push(table(
  ["Component", "Taken from", "Why it is included", "Cost"],
  [
    ["Euclidean Alignment", "He & Wu (2020)", "Removes subject covariance shift; unsupervised, needs no target labels", "≈0 parameters"],
    ["Depthwise-separable conv block", "EEGNet (Lawhern, 2018)", "Learns CSP-like spatial filters at very low parameter cost", "Low"],
    ["Multi-scale dilated temporal conv", "ATCNet (2023), CTNet (2024)", "Mu and beta rhythms evolve on different timescales; one kernel size cannot capture both", "Moderate"],
    ["Windowed multi-head self-attention", "EEG Conformer (2023), ATCNet (2023)", "Long-range temporal dependency without the O(T²) cost and overfitting of full attention", "Moderate"],
    ["Supervised contrastive + domain-adversarial loss", "Domain-generalisation literature", "Pulls same-class trials from different subjects together in feature space", "Training only; zero at inference"],
    ["Class Activation Topography", "EEG Conformer (2023)", "Maps channel contribution per class for neurophysiological validation", "Zero"],
  ],
  [2300, 1900, 3400, 1400],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 4.1 — Every component traces to a reviewed paper or to an explicit gap in them. The fifth row is the addition none of the four architectures has."));

children.push(H2("4.2 Layer specification"));
children.push(P("Configuration shown for BCI IV-2a: C = 22 channels, T = 875 samples (0.5–4.0 s post-cue at 250 Hz), 4 classes."));
children.push(SPACER(60));
children.push(table(
  ["#", "Layer", "Configuration", "Output shape"],
  [
    ["0", "Euclidean Alignment", "R_s^(−1/2) applied per subject", "22 × 875"],
    ["1", "Temporal convolution", "F1 = 16, kernel (1, 64), padding same", "16 × 22 × 875"],
    ["2", "Depthwise spatial conv", "D = 2, kernel (22, 1), max-norm 1.0", "32 × 1 × 875"],
    ["3", "BN → ELU → AvgPool(1,4) → Dropout 0.25", "—", "32 × 1 × 218"],
    ["4", "Separable convolution", "F2 = 32, kernel (1, 16)", "32 × 1 × 218"],
    ["5", "BN → ELU → AvgPool(1,8) → Dropout 0.25", "—", "32 × 1 × 27"],
    ["6", "Multi-scale temporal branch", "3 parallel dilated convs, k = 4/8/16, dilation 1/2/4", "96 × 27"],
    ["7", "Fusion", "1×1 convolution", "32 × 27"],
    ["8", "Windowed MHSA", "5 overlapping windows, 2 heads, depth 2, learnable positional encoding", "32 × 27"],
    ["9", "Global average pool → FC", "32 → 4, softmax", "4"],
  ],
  [500, 2700, 3700, 2100],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 4.2 — SAND-Net layer specification. Target parameter budget is under 50,000, placing it between ShallowConvNet (47,364) and ATCNet (113,732)."));

children.push(H2("4.3 Training objective"));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 100, after: 180 },
  children: [
    new TextRun({ text: "L", size: 24, bold: true }),
    new TextRun({ text: "total", size: 24, bold: true, subScript: true }),
    new TextRun({ text: "  =  L", size: 24 }),
    new TextRun({ text: "CE", size: 24, subScript: true }),
    new TextRun({ text: "  +  λ", size: 24 }),
    new TextRun({ text: "1", size: 24, subScript: true }),
    new TextRun({ text: " · L", size: 24 }),
    new TextRun({ text: "SupCon", size: 24, subScript: true }),
    new TextRun({ text: "  +  λ", size: 24 }),
    new TextRun({ text: "2", size: 24, subScript: true }),
    new TextRun({ text: " · L", size: 24 }),
    new TextRun({ text: "DANN", size: 24, subScript: true }),
  ]
}));
const lossBullet = (sub, text) => new Paragraph({
  numbering: { reference: "bullets", level: 0 },
  spacing: { after: 70, line: 276 },
  children: [
    new TextRun({ text: "L", size: 21, bold: true }),
    new TextRun({ text: sub, size: 21, bold: true, subScript: true }),
    new TextRun({ text: " — " + text, size: 21 }),
  ]
});
children.push(lossBullet("CE", "standard cross-entropy on the four motor imagery classes."));
children.push(lossBullet("SupCon", "supervised contrastive loss computed across subjects: trials of the same class from different subjects are pulled together, trials of different classes are pushed apart. This is what forces the class structure to be subject-independent rather than subject-specific."));
children.push(lossBullet("DANN", "a subject classifier attached through a gradient reversal layer. If the encoder's features can still identify who produced the trial, they carry subject information the decoder should not be relying on."));
children.push(P("λ₁ and λ₂ are tuned on the validation subject only, never on the test subject. λ₂ is ramped from 0 following the standard DANN schedule to avoid destabilising early training."));

// ---------------- 5. Datasets ----------------
children.push(H1("5. Dataset Selection and Description"));
children.push(P("Three motor imagery datasets are used, in a tiered arrangement. All are public, all are standard benchmarks in this literature, and all can be downloaded programmatically through MOABB."));

children.push(SPACER(60));
children.push(table(
  ["Dataset", "Tier", "Subjects", "Channels", "Classes", "Rate", "Trials/subject"],
  [
    ["BCI Competition IV-2a", "Primary", "9", "22", "4", "250 Hz", "576"],
    ["BCI Competition IV-2b", "Secondary", "9", "3", "2", "250 Hz", "720"],
    ["High Gamma Dataset", "Stretch", "14", "128", "4", "500 Hz", "~880"],
  ],
  [2500, 1300, 1000, 1100, 900, 1000, 1200],
  { boldFirstCol: true }
));
children.push(CAP("Table 5.1 — Dataset tiers. The primary dataset carries the main claims; the secondary tests whether they transfer; the stretch tier is attempted only if the schedule allows and is not load-bearing for any conclusion."));

children.push(H2("5.1 Why these three"));
children.push(BUL("BCI IV-2a is the common denominator of all four reviewed papers, so our reproduced baselines can be sanity-checked against published numbers before we trust anything else."));
children.push(BUL("BCI IV-2b uses only three electrodes (C3, Cz, C4), which sit inside 2a's montage. It tests whether the approach survives a drastic reduction in spatial information — directly relevant to low-cost consumer headsets."));
children.push(BUL("High Gamma Dataset has more subjects and higher-density coverage, giving a harder generalisation test if time permits."));

children.push(H2("5.2 Why SEED is excluded"));
children.push(P("The EEG Conformer paper also evaluates on SEED, and it was tempting to include it for breadth. SEED is an emotion recognition dataset: participants watch film clips and the task is to predict positive, neutral or negative affect. It contains no motor imagery and no movement labels. A model trained jointly on SEED and IV-2a would be predicting across two unrelated label spaces, which measures nothing about motor intent decoding. It is therefore excluded, and this is a deliberate decision rather than an oversight."));

children.push(H2("5.3 Preprocessing pipeline"));
children.push(NUM_(1, "Load raw recordings via MNE-Python / MOABB; retain the 22 EEG channels and discard the 3 EOG channels."));
children.push(NUM_(1, "Band-pass filter 4–38 Hz using a 4th-order Butterworth filter applied forward and backward (zero-phase) to preserve temporal structure."));
children.push(NUM_(1, "Epoch each trial from 0.5 s to 4.0 s after the cue, giving 875 samples per trial at 250 Hz."));
children.push(NUM_(1, "Reject trials whose peak-to-peak amplitude exceeds 100 μV on any channel, after recording the rejection rate per subject."));
children.push(NUM_(1, "Compute the Euclidean Alignment matrix per subject per session and apply it. For the held-out test subject this uses only their unlabelled trials."));
children.push(NUM_(1, "Standardise per channel using exponential moving standardisation, with statistics computed on the training subjects only."));
children.push(NUM_(1, "Augment the training split using Segmentation and Reconstruction — splitting trials into segments and recombining segments from same-class trials — following the procedure used by EEG Conformer and CTNet."));

children.push(SPACER(60));
children.push(callout("Leakage control",
  ["Normalisation statistics, augmentation and hyperparameter selection are derived exclusively from the training and validation subjects. The held-out test subject contributes only unlabelled trials to the alignment step, which is the same information a real deployment would have. Any deviation from this is a leak and invalidates the cross-subject claim."],
  "FFF4E5"));

// ---------------- 6. Baselines ----------------
children.push(H1("6. Baseline Models"));
children.push(P("Five baselines are reproduced. Four are the architectures from the literature survey; the fifth is a classical method included because deep models are not automatically better on data of this size."));

children.push(SPACER(60));
children.push(table(
  ["Baseline", "Type", "Parameters", "Published IV-2a accuracy", "Protocol used in source"],
  [
    ["FBCSP + LDA", "Classical", "—", "~68%", "Subject-specific"],
    ["EEGNet", "Compact CNN", "2,548", "68.67% / 71.50%", "Varies by source"],
    ["ShallowConvNet", "CNN", "47,364", "66.41% / 67.48%", "Varies by source"],
    ["ATCNet", "CNN + attention + TCN", "113,732", "81.10%", "Train-Val-Test split"],
    ["CTNet", "CNN + transformer", "Not stated", "82.52%", "Subject-specific"],
    ["EEG Conformer", "CNN + transformer", "Not stated", "78.66%", "Hold-out"],
  ],
  [2100, 2100, 1400, 2000, 1400],
  { boldFirstCol: true }
));
children.push(CAP("Table 6.1 — Published baselines. Parameter counts for EEGNet, ShallowConvNet and ATCNet are from the ATCNet reference implementation. Accuracies are as reported by the authors under their own protocols."));

children.push(SPACER(60));
children.push(callout("Reading Table 6.1 correctly",
  ["These numbers are not directly comparable. Each row uses a different train/test protocol, and some models appear with two different figures depending on which paper is reporting them. EEGNet is quoted at 68.67% by the ATCNet authors and 71.50% by the SATrans-Net authors — same model, same dataset, different evaluation. Re-running all of them under one protocol is precisely why Objective 2 exists.",
   "Cross-subject figures are scarcer and lower. CTNet reports 58.64% on IV-2a under subject-independent evaluation; independent LOSO studies place EEGNet and Conformer around 68–70%, and recent work (SATrans-Net) reports 72.33%. Our target band is set from these, not from the within-subject column."],
  "EAF1F8"));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------------- 7. Experimental plan ----------------
children.push(H1("7. Experimental Plan and Evaluation Protocol"));

children.push(H2("7.1 Primary protocol — leave-one-subject-out"));
children.push(P("For each of the 9 subjects in IV-2a, that subject is held out entirely as the test set. Of the remaining 8, one is held out as a validation subject for early stopping and hyperparameter selection, and 7 are used for training. This rotates 9 times and the reported figure is the mean and standard deviation across the 9 folds."));
children.push(P("Using a held-out validation subject rather than a random split of the training subjects' trials is deliberate. Validating on trials from subjects that also appear in training would select hyperparameters that favour within-subject fit, which is the behaviour we are trying to avoid."));

children.push(SPACER(60));
children.push(table(
  ["Fold", "Training subjects", "Validation subject", "Test subject"],
  [
    ["1", "S3 – S9 (7 subjects)", "S2", "S1"],
    ["2", "S1, S4 – S9", "S3", "S2"],
    ["…", "…", "…", "…"],
    ["9", "S2 – S7", "S1", "S9"],
  ],
  [900, 3500, 2400, 2200],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 7.1 — LOSO fold structure. No trial from the test subject is ever seen with its label during training."));

children.push(H2("7.2 Secondary protocol — within-subject reference"));
children.push(P("Each model is also trained and tested within subject, session 1 to session 2, so our reproduced figures can be checked against the published ones. If our reproduced within-subject EEGNet lands far from the published value, the pipeline is wrong and the cross-subject numbers cannot be trusted either. This is a correctness check, not a headline result."));

children.push(H2("7.3 Calibration-efficiency experiment"));
children.push(P("This experiment tests H3 and produces the figure most directly tied to the clinical motivation. After LOSO training, the model is fine-tuned on n labelled trials from the held-out subject, for n = 0, 5, 10, 20, 40 and 80, and accuracy is recorded at each point. Plotting accuracy against n for SAND-Net and each baseline shows how much labelled data a new user must supply before the system becomes usable. A model that reaches an acceptable threshold at n = 10 is far more deployable than one that needs n = 80, even if their n = 80 accuracies are identical."));

children.push(H2("7.4 Evaluation metrics"));
children.push(SPACER(60));
children.push(table(
  ["Metric", "What it captures", "Why included"],
  [
    ["Accuracy (mean ± std over 9 folds)", "Overall correctness and its variability", "Standard; the std across folds is as important as the mean"],
    ["Cohen's kappa", "Agreement corrected for chance", "Standard in BCI; comparable to published work"],
    ["Macro-F1", "Per-class balance", "Reveals a model that wins by ignoring a hard class"],
    ["Confusion matrix", "Which classes are confused", "Feet vs tongue confusion is a known failure mode"],
    ["Parameters, FLOPs, latency", "Model cost", "The 'lightweight' claim must be measured, not asserted"],
    ["Wilcoxon signed-rank test", "Statistical significance across subjects", "Paired, non-parametric, n = 9; the test EEG Conformer uses"],
  ],
  [2700, 3100, 3200],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 7.2 — Evaluation metrics. Significance is tested at α = 0.05, paired across the 9 subjects."));

children.push(P("Reporting only the mean accuracy would hide the behaviour that matters most. Cross-subject decoders frequently fail badly on one or two specific subjects — the so-called BCI-illiteracy phenomenon — and a model with a slightly lower mean but a much smaller standard deviation is the better assistive device. Per-subject results will therefore be reported in full, not only as an average."));

// ---------------- 8. Ablation ----------------
children.push(H1("8. Ablation Study Design"));
children.push(P("The ablation is the experiment that tests H1, and it is designed so that specific row comparisons answer specific questions."));

children.push(SPACER(60));
children.push(table(
  ["#", "EA", "Multi-scale", "Windowed attn", "SupCon", "DANN", "What this row is"],
  [
    ["A1", "—", "—", "—", "—", "—", "EEGNet-equivalent baseline"],
    ["A2", "Yes", "—", "—", "—", "—", "Alignment alone"],
    ["A3", "—", "Yes", "Yes", "—", "—", "Capacity alone"],
    ["A4", "Yes", "Yes", "—", "—", "—", "Alignment + multi-scale"],
    ["A5", "Yes", "Yes", "Yes", "—", "—", "Full architecture, no DG losses"],
    ["A6", "Yes", "Yes", "Yes", "Yes", "—", "Plus contrastive"],
    ["A7", "Yes", "Yes", "Yes", "—", "Yes", "Plus adversarial"],
    ["A8", "Yes", "Yes", "Yes", "Yes", "Yes", "Full SAND-Net"],
  ],
  [600, 800, 1400, 1500, 1100, 900, 2700],
  { boldFirstCol: true }
));
children.push(CAP("Table 8.1 — Ablation grid. Each configuration is run over all 9 LOSO folds."));

children.push(H2("8.1 Which comparison answers which question"));
children.push(BULR([["A1 vs A2 vs A3 — ", { b: true }], ["the core test of H1. A2 isolates the gain from alignment with no added capacity; A3 isolates the gain from added capacity with no alignment. If A2 − A1 > A3 − A1, H1 is supported.", {}]]));
children.push(BULR([["A3 vs A5 — ", { b: true }], ["does alignment still help once the architecture is already strong, or is its benefit absorbed by capacity?", {}]]));
children.push(BULR([["A5 vs A6, A7, A8 — ", { b: true }], ["are the domain-generalisation losses complementary to input alignment, or redundant with it? This is the second half of H1.", {}]]));
children.push(BULR([["A4 vs A5 — ", { b: true }], ["does windowed attention earn its parameters, or is the multi-scale convolution doing the work?", {}]]));

children.push(P("A separate run replaces windowed attention with full self-attention at matched depth, holding everything else fixed, to test H2."));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ---------------- 9. Explainability ----------------
children.push(H1("9. Interpretability and Neurophysiological Validation"));
children.push(P("Interpretability here is not a presentation aid; it is a correctness check. EEG models are notorious for achieving high accuracy by learning eye-movement or muscle artefacts that happen to correlate with the cue, rather than the motor imagery itself. Two analyses are run."));

children.push(H2("9.1 Class Activation Topography"));
children.push(P("Following the method introduced with EEG Conformer, per-class channel contributions are projected onto a scalp topography. This yields one topographic map per motor imagery class, showing which electrodes drove the decision."));

children.push(H2("9.2 The falsification test"));
children.push(P("Motor imagery produces event-related desynchronisation contralateral to the imagined limb: imagining left-hand movement suppresses mu rhythm over the right sensorimotor cortex, near electrode C4, and right-hand imagery does the same over the left, near C3. This is established neurophysiology, independent of any model."));

children.push(SPACER(60));
children.push(callout("Pass / fail criterion",
  ["If the left-hand topography peaks near C4 and the right-hand topography peaks near C3, the model has learned genuine sensorimotor physiology. If the peaks are frontal, symmetric, or concentrated on peripheral electrodes, the model is likely exploiting ocular or muscular artefacts, and the accuracy figure is not measuring motor intent decoding regardless of how high it is.",
   "This is a genuine test with a genuine failure mode, and the result will be reported either way."],
  "E8F3EC"));

children.push(H2("9.3 Attention analysis"));
children.push(P("Attention weights across the five temporal windows are averaged per class and plotted against trial time. The expectation is that weight concentrates roughly 0.5 to 2.5 s after the cue, the interval in which event-related desynchronisation is strongest. Attention concentrated at trial onset would suggest the model is reading the cue artefact rather than the imagery."));

// ---------------- 10. Tools ----------------
children.push(H1("10. Tools, Frameworks and Environment"));
children.push(SPACER(60));
children.push(table(
  ["Category", "Choice", "Role"],
  [
    ["Language", "Python 3.10+", "All implementation"],
    ["Deep learning", "PyTorch 2.x", "Model definition, training, autograd for gradient reversal"],
    ["EEG processing", "MNE-Python", "Loading, filtering, epoching, topographic plotting"],
    ["Dataset access", "MOABB", "Programmatic download and standardised cross-subject splits"],
    ["Reference models", "Braindecode", "Validated EEGNet, ShallowConvNet, Deep4Net implementations"],
    ["Classical baseline", "scikit-learn, pyRiemann", "FBCSP + LDA"],
    ["Numerics", "NumPy, SciPy", "Alignment matrices, filtering, statistical tests"],
    ["Visualisation", "Matplotlib, Seaborn, MNE topomaps", "Results figures, topographies, confusion matrices"],
    ["Experiment tracking", "Weights & Biases or TensorBoard", "Logging 230+ training runs with fold-level metrics"],
    ["Compute", "Google Colab (T4) / Kaggle (P100)", "GPU training with checkpointing"],
    ["Version control", "Git + GitHub", "Code, configs, seeds, and result tables"],
  ],
  [2000, 3000, 4000],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 10.1 — Software and hardware environment."));

children.push(P("Using Braindecode's reference implementations rather than writing every baseline from scratch is a deliberate risk-reduction choice: a reproduction failure caused by our own reimplementation bug would be indistinguishable from a genuine result, and we do not have time in Phase 3 to debug four architectures."));

children.push(H2("10.1 Reproducibility measures"));
children.push(BUL("Every run is seeded; seeds are recorded alongside results."));
children.push(BUL("Preprocessed tensors are cached to disk so that preprocessing is performed once, not once per model."));
children.push(BUL("Every experiment is defined by a YAML config committed to the repository, so any reported number can be regenerated by pointing the trainer at its config."));
children.push(BUL("Checkpoints are written every epoch to persistent storage, so a session timeout costs one epoch, not one fold."));

// ---------------- 11. Implementation plan ----------------
children.push(H1("11. Implementation Plan and Milestones"));
children.push(P("Phase 3 runs from 16 September to 3 October 2026 — 18 days. The plan is front-loaded: the pipeline and baselines must be working before the proposed model is written, because a proposed model evaluated on a broken pipeline is worthless."));

children.push(SPACER(60));
children.push(table(
  ["Days", "Dates", "Milestone", "Deliverable / exit criterion"],
  [
    ["1–2", "16–17 Sep", "Environment and data", "All three datasets downloading; EDA plots produced"],
    ["3–4", "18–19 Sep", "Preprocessing + Euclidean Alignment", "Cached tensors; alignment verified (covariance ≈ identity)"],
    ["5–7", "20–22 Sep", "Baselines, within-subject", "EEGNet and Conformer reproduce published accuracy within ±3 pts"],
    ["8–10", "23–25 Sep", "LOSO harness + all baselines", "9-fold LOSO results for all five baselines on IV-2a"],
    ["11–13", "26–28 Sep", "SAND-Net implementation", "Model trains end to end; parameter count under 50k confirmed"],
    ["14–15", "29–30 Sep", "Ablation study", "All 8 configurations × 9 folds complete"],
    ["16–17", "1–2 Oct", "IV-2b, calibration curve, interpretability", "Cross-dataset results; topographies; calibration figure"],
    ["18", "3 Oct", "Consolidation", "Final tables, figures and significance tests for the 2nd Review"],
  ],
  [800, 1400, 2900, 3900],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 11.1 — Phase 3 schedule, aligned to the 2nd Review on 3 October 2026."));

children.push(H2("11.1 Compute budget"));
children.push(P("The schedule is only credible if the experiments fit the available GPU time. Estimated per-fold training times on a T4-class GPU:"));
children.push(SPACER(60));
children.push(table(
  ["Experiment set", "Runs", "Est. minutes per run", "Est. total"],
  [
    ["Baselines, LOSO, IV-2a", "5 models × 9 folds = 45", "3 – 15", "≈ 6 h"],
    ["SAND-Net, LOSO, IV-2a", "9", "8", "≈ 1.2 h"],
    ["Ablation, 8 configs", "8 × 9 = 72", "8", "≈ 9.6 h"],
    ["IV-2b, all models", "6 × 9 = 54", "3", "≈ 2.7 h"],
    ["Calibration curve", "6 points × 9 folds", "2", "≈ 1.8 h"],
    ["Contingency for reruns", "—", "—", "≈ 5 h"],
    ["Total", "", "", "≈ 26 GPU-hours"],
  ],
  [3000, 2400, 2100, 1500],
  { boldFirstCol: true }
));
children.push(CAP("Table 11.2 — Compute estimate. Kaggle provides roughly 30 GPU-hours per week, so this fits within the window provided preprocessing is cached and runs are checkpointed. Free-tier Colab alone would be tight and the ablation would need to be run over multiple sessions."));

// ---------------- 12. Risks ----------------
children.push(H1("12. Risk Register"));
children.push(SPACER(60));
children.push(table(
  ["Risk", "Likelihood", "Impact", "Mitigation"],
  [
    ["LOSO runtime exceeds available GPU hours", "Medium", "High", "Cache preprocessed tensors; mixed-precision training; early stopping; drop the High Gamma tier first"],
    ["Reproduced baselines miss published accuracy", "Medium", "High", "Use Braindecode / official repositories; report reproduced and published figures side by side and explain the gap"],
    ["Session timeouts lose training progress", "High", "Medium", "Checkpoint every epoch to persistent storage; resumable trainer"],
    ["SAND-Net does not beat the baselines", "Medium", "Medium", "The ablation still answers H1; a negative result that shows capacity beats alignment is a valid and reportable finding"],
    ["High Gamma Dataset too heavy to process", "Medium", "Low", "Declared a stretch tier; no conclusion depends on it"],
    ["Adversarial loss destabilises training", "Medium", "Medium", "Ramp λ₂ from zero; A6 (contrastive only) is a working fallback configuration"],
    ["Interpretability shows artefact reliance", "Low", "High", "Report it honestly; tighten artefact rejection and re-run; this is the reason the check exists"],
  ],
  [2900, 1200, 1100, 3800],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 12.1 — Risk register with mitigations. Risks are listed with the response already decided, so Phase 3 does not lose days to deliberation."));

// ---------------- 13. Expected outcomes ----------------
children.push(H1("13. Expected Outcomes and Success Criteria"));
children.push(P("Success is defined in advance so that the 2nd Review can be assessed against a fixed standard rather than a standard chosen after seeing the results."));

children.push(SPACER(60));
children.push(table(
  ["Criterion", "Target", "Basis for the target"],
  [
    ["LOSO accuracy, IV-2a", "≥ 70%", "Independent LOSO studies place EEGNet and Conformer at 68–70%; SATrans-Net reports 72.33%"],
    ["Parameter count", "< 50,000", "Below ShallowConvNet (47,364) and well below ATCNet (113,732)"],
    ["Std. dev. across subjects", "Lower than the best baseline", "Consistency matters more than peak accuracy for assistive use"],
    ["Calibration efficiency", "Within 5 pts of subject-specific accuracy using ≤ 20 labelled trials", "Defines what 'without lengthy calibration' means in practice"],
    ["Statistical significance", "p < 0.05, Wilcoxon signed-rank", "Same test used by EEG Conformer"],
    ["Interpretability", "Contralateral peaks at C3 / C4", "Established event-related desynchronisation physiology"],
  ],
  [2700, 2700, 3600],
  { boldFirstCol: true, centerCols: false }
));
children.push(CAP("Table 13.1 — Pre-registered success criteria."));

children.push(H2("13.1 Deliverables at the 2nd Review (3 October 2026)"));
children.push(BUL("Working implementation of the full pipeline, five baselines and SAND-Net, in a public repository."));
children.push(BUL("LOSO results table for all models on IV-2a and IV-2b, with per-subject breakdown and significance tests."));
children.push(BUL("Completed ablation table with the H1 verdict stated explicitly."));
children.push(BUL("Calibration-efficiency curve."));
children.push(BUL("Class Activation Topography figures with the neurophysiological validation result."));

children.push(H2("13.2 Statement on novelty"));
children.push(P("The 0th Review answered 'Partially' to the question of sufficient novelty, and recorded that further investigation was needed. That investigation is now complete, and the position has changed. The contribution is no longer described as a combination of existing techniques. It is: (i) the first evaluation of EEGNet, ATCNet, CTNet and EEG Conformer under a single identical leave-one-subject-out protocol, which the published literature does not provide; (ii) a controlled test of whether input-space subject-invariance or architectural capacity contributes more to cross-subject decoding; and (iii) a calibration-efficiency characterisation that states how much labelled data a new user actually needs. Points (ii) and (iii) are questions the reviewed literature does not answer, and both produce a useful result whichever way they resolve."));

// ---------------- References ----------------
children.push(H1("References"));
const refs = [
  "Lawhern, V. J., Solon, A. J., Waytowich, N. R., Gordon, S. M., Hung, C. P., & Lance, B. J. (2018). EEGNet: A Compact Convolutional Neural Network for EEG-based Brain–Computer Interfaces. Journal of Neural Engineering, 15(5), 056013. arXiv:1611.08024",
  "Altaheri, H., Muhammad, G., & Alsulaiman, M. (2023). Physics-Informed Attention Temporal Convolutional Network for EEG-Based Motor Imagery Classification. IEEE Transactions on Industrial Informatics, 19(2), 2249–2258.",
  "Zhao, W., Jiang, X., Zhang, B., Xiao, S., & Weng, S. (2024). CTNet: A Convolutional Transformer Network for EEG-Based Motor Imagery Classification. Scientific Reports, 14, 20237.",
  "Song, Y., Zheng, Q., Liu, B., & Gao, X. (2023). EEG Conformer: Convolutional Transformer for EEG Decoding and Visualization. IEEE Transactions on Neural Systems and Rehabilitation Engineering, 31, 710–719.",
  "He, H., & Wu, D. (2020). Transfer Learning for Brain–Computer Interfaces: A Euclidean Space Data Alignment Approach. IEEE Transactions on Biomedical Engineering, 67(2), 399–410. arXiv:1808.05464",
  "Ganin, Y., & Lempitsky, V. (2015). Unsupervised Domain Adaptation by Backpropagation. Proceedings of ICML 2015.",
  "Khosla, P., Teterwak, P., Wang, C., et al. (2020). Supervised Contrastive Learning. Advances in Neural Information Processing Systems 33.",
  "Schirrmeister, R. T., Springenberg, J. T., Fiederer, L. D. J., et al. (2017). Deep Learning with Convolutional Neural Networks for EEG Decoding and Visualization. Human Brain Mapping, 38(11), 5391–5420.",
  "Chaisaen, R., et al. (2024). Compact Convolutional Transformer for Subject-Independent Motor Imagery EEG-based BCIs. Scientific Reports, 14.",
  "Aristimunha, B., Carrara, I., Guetschel, P., et al. (2023). Mother of All BCI Benchmarks (MOABB) and Braindecode. Software frameworks for reproducible EEG decoding.",
];
refs.forEach((r, i) => children.push(new Paragraph({
  spacing: { after: 110, line: 264 },
  indent: { left: 400, hanging: 400 },
  children: [new TextRun({ text: `[${i + 1}]  ${r}`, size: 19 })]
})));

// ---------- assemble ----------
const doc = new Document({
  creator: "Deep Learning Project — Phase 2",
  title: "Deep Learning-Based Neural Decoder for EEG Motor Imagery — Methodology and Implementation Plan",
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 460, hanging: 240 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 240 } } } },
        ]
      },
      {
        reference: "steps",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 460, hanging: 280 } } } },
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1100, right: 1300, bottom: 1100, left: 1300 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Phase 2 — Methodology and Implementation Plan  |  Page ", size: 17, color: GREY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 17, color: GREY })
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/claude/review2/Phase2_Methodology_Implementation_Plan.docx', buf);
  console.log('written', buf.length, 'bytes');
});
