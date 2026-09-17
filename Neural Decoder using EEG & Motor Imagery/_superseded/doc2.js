const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
  PageBreak, LevelFormat, PageNumber, Footer, BorderStyle, TableOfContents
} = require('docx');
const fs = require('fs');

const CW = 9500;                 // content width, DXA
const NAVY = "1B3A6B";
const NAVYD = "122847";
const PURPLE = "5B3E96";
const GREY = "5A6478";
const CARD = "EFF3F9";
const TINT = "F3F0FA";

// ---------- helpers ----------
const H1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 340, after: 150 },
  children: [new TextRun({ text: t, bold: true, color: NAVYD, size: 27 })]
});
const H2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 230, after: 110 },
  children: [new TextRun({ text: t, bold: true, color: NAVY, size: 22 })]
});
const P = (t, o = {}) => new Paragraph({
  spacing: { after: o.after === undefined ? 130 : o.after, line: 288 },
  alignment: o.align || AlignmentType.JUSTIFIED,
  children: [new TextRun({ text: t, size: 21, italics: !!o.i, color: o.c })]
});
const BUL = (t) => new Paragraph({
  numbering: { reference: "bul", level: 0 },
  spacing: { after: 70, line: 288 },
  children: [new TextRun({ text: t, size: 21 })]
});
const NUMI = (t, inst) => new Paragraph({
  numbering: { reference: "num", level: 0, instance: inst },
  spacing: { after: 70, line: 288 },
  children: [new TextRun({ text: t, size: 21 })]
});
const CAP = (t) => new Paragraph({
  spacing: { before: 70, after: 190 },
  alignment: AlignmentType.LEFT,
  children: [new TextRun({ text: t, size: 17, italics: true, color: GREY })]
});
const SP = (n = 110) => new Paragraph({ spacing: { after: n }, children: [new TextRun({ text: "", size: 10 })] });

function pngSize(p) {
  const b = fs.readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function figure(file, widthPt) {
  const { w, h } = pngSize(file);
  const width = widthPt;
  const height = Math.round(width * (h / w));
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 130, after: 40 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(file), transformation: { width, height } })]
  });
}

function cell(text, { bold = false, bg, align = AlignmentType.LEFT, width, size = 18, color, vAlign } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: "auto" } : undefined,
    margins: { top: 75, bottom: 75, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: align,
      spacing: { after: 0, line: 250 },
      children: [new TextRun({ text: String(text), bold, size, color })]
    })]
  });
}

function table(headers, rows, widths, opts = {}) {
  const head = new TableRow({
    tableHeader: true, cantSplit: true,
    children: headers.map((h, i) => cell(h, {
      bold: true, bg: NAVY, color: "FFFFFF", width: widths[i], size: 18,
      align: (opts.center || []).includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT
    }))
  });
  const body = rows.map((r, ri) => new TableRow({
    cantSplit: true,
    children: r.map((c, i) => cell(c, {
      width: widths[i],
      bg: ri % 2 === 1 ? CARD : undefined,
      size: 18,
      bold: opts.boldFirst && i === 0,
      align: (opts.center || []).includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT
    }))
  }));
  return new Table({ columnWidths: widths, width: { size: CW, type: WidthType.DXA }, rows: [head, ...body] });
}

function note(title, lines, fill = CARD) {
  return new Table({
    columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CW, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill, color: "auto" },
        margins: { top: 130, bottom: 130, left: 150, right: 150 },
        children: [
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, size: 20, color: NAVYD })] }),
          ...lines.map(l => new Paragraph({
            spacing: { after: 50, line: 288 }, alignment: AlignmentType.JUSTIFIED,
            children: [new TextRun({ text: l, size: 20 })]
          }))
        ]
      })]
    })]
  });
}

const C = [];

// =====================================================================
// TITLE PAGE
// =====================================================================
C.push(SP(700));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 90 },
  children: [new TextRun({ text: "DEEP LEARNING THEORY–BASED PRACTICAL WORK", size: 20, color: PURPLE, bold: true })]
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 320 },
  children: [new TextRun({ text: "PHASE 2  ·  SOLUTION DESIGN", size: 20, color: GREY })]
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "Cross-Subject Motor Imagery EEG", bold: true, size: 38, color: NAVYD })]
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 400 },
  children: [new TextRun({ text: "Classification using Deep Learning", bold: true, size: 38, color: NAVYD })]
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 480 },
  children: [new TextRun({
    text: "Methodology, System Architecture and Implementation Plan",
    size: 24, color: NAVY
  })]
}));
C.push(SP(200));
{
  const rows = [
    ["Team members", "[ Names and registration numbers ]"],
    ["Guide / faculty", "[ Name and designation ]"],
    ["Course", "[ Course code and title ]"],
    ["Department / institution", "[ Department, institution ]"],
    ["Primary dataset", "BCI Competition IV Dataset 2a"],
    ["Review", "1st Review, 15 September 2026"],
    ["Final submission", "10 October 2026"],
  ];
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  C.push(new Table({
    columnWidths: [3100, 6400],
    width: { size: CW, type: WidthType.DXA },
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: rows.map(([k, v]) => new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 3100, type: WidthType.DXA },
          margins: { top: 90, bottom: 90, left: 0, right: 140 },
          borders: { top: none, bottom: none, left: none, right: none },
          children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: k, size: 20, color: GREY })] })]
        }),
        new TableCell({
          width: { size: 6400, type: WidthType.DXA },
          margins: { top: 90, bottom: 90, left: 0, right: 0 },
          borders: { top: none, bottom: none, left: none, right: none },
          children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: v, size: 20, color: NAVYD })] })]
        }),
      ]
    }))
  }));
}
C.push(CAP("Fields in square brackets are to be completed before submission."));
C.push(new Paragraph({ children: [new PageBreak()] }));

// =====================================================================
// 1. PROJECT TITLE
// =====================================================================
C.push(H1("1. Project Title"));
C.push(P("Cross-Subject Motor Imagery EEG Classification using a Hybrid Convolutional–Transformer Deep Learning Model."));
C.push(P("The work develops a deep learning model that classifies four motor imagery tasks from electroencephalography, and evaluates it under a subject-independent protocol in which the test subject is not present in the training data. The model is designed to combine the components that the surveyed literature has shown to be effective, while keeping the parameter count low enough to remain practical."));

// =====================================================================
// 2. PROBLEM STATEMENT
// =====================================================================
C.push(H1("2. Problem Statement"));
C.push(P("Motor imagery is the act of imagining a movement without performing it. When a person imagines moving a limb, the sensorimotor cortex produces a measurable change in the mu band (approximately 8 to 13 Hz) and the beta band (approximately 13 to 30 Hz). This change is called event-related desynchronisation, and it appears on the side of the head opposite to the imagined limb. Electroencephalography can record this activity from the scalp without surgery, which makes it the most widely used signal for practical brain–computer interfaces."));
C.push(P("Building a classifier for these signals is difficult for several related reasons. The signal-to-noise ratio is low, because the cortical activity of interest is attenuated by the skull and scalp. The recordings are contaminated by eye movements, muscle activity and mains interference, all of which are often larger in amplitude than the signal being sought. The data are high-dimensional, since a four-second trial recorded from 22 channels at 250 Hz contains more than twenty thousand samples, while a typical dataset provides only a few hundred labelled trials per subject. The signal is also non-stationary, so recordings made from the same person on different days do not have identical statistics."));
C.push(SP(60));
C.push(figure("fig/f_erd.png", 460));
C.push(CAP("Figure 2.1 — Motor imagery suppresses mu-band power in the sensorimotor cortex, on the side opposite the imagined hand. This is the physiological effect a decoder is expected to detect."));
C.push(P("The specific difficulty addressed in this project is variability between people. Skull thickness, cortical folding, electrode placement and the mental strategy a person adopts when imagining movement all differ from one individual to the next. As a result the statistical distribution of the recorded features shifts from subject to subject, and a model trained on one group of people often performs poorly when it is applied to someone new."));

// =====================================================================
// 3. MOTIVATION
// =====================================================================
C.push(H1("3. Motivation"));
C.push(P("A reliable motor imagery decoder would allow a person to issue commands to a computer or a device without any physical movement. The clearest application is assistive technology for people with severe motor impairment arising from conditions such as amyotrophic lateral sclerosis, spinal cord injury or brainstem stroke, for whom keyboards, touchscreens and speech interfaces may all be inaccessible. Related applications include neurorehabilitation, where detecting motor intent can be used to trigger assisted movement in patients relearning motor control, and hands-free interaction in settings where physical input is impractical."));
C.push(P("For any of these applications, the practical obstacle is the calibration session. If a system must be trained on several hours of labelled data from each new user before it becomes usable, it is difficult to deploy. Reducing that requirement depends on the model generalising across people, which is the reason this project treats cross-subject performance as the central objective rather than as a secondary result."));

// =====================================================================
// 4. RESEARCH GAP
// =====================================================================
C.push(H1("4. Research Gap"));
C.push(P("The literature survey conducted in Phase 1 covered four representative deep learning architectures for motor imagery decoding. Taken together they show a clear direction of development and a clear unresolved problem."));
C.push(SP(60));
C.push(figure("fig/f_evolution.png", 462));
C.push(CAP("Figure 4.1 — Development of the surveyed architectures, from a compact convolutional network towards convolutional–Transformer hybrids. Accuracy and parameter counts are as reported by the respective authors."));

C.push(H2("4.1 Observations from the surveyed papers"));
C.push(BUL("Cross-subject generalisation remains difficult. Accuracy is consistently lower when the test subject was not present in the training set."));
C.push(BUL("Zero-calibration and low-calibration operation is still an open problem. Most reported results assume that labelled data from the target subject are available."));
C.push(BUL("Convolutional models such as EEGNet are lightweight and train reliably on small datasets, but their receptive field limits how much long-range temporal structure they can represent."));
C.push(BUL("Transformer-based models such as CTNet and EEG Conformer capture global temporal relationships more directly, but they have substantially more parameters and are more sensitive to the limited size of EEG datasets."));
C.push(BUL("There is no single model in the surveyed set that balances classification accuracy, model complexity and cross-subject generalisation at the same time."));

C.push(H2("4.2 Quantifying the gap"));
C.push(P("The size of the problem can be seen directly in the results reported by CTNet, which evaluates the same architecture under both a subject-specific and a subject-independent protocol."));
C.push(SP(60));
C.push(figure("fig/f_gap.png", 380));
C.push(CAP("Figure 4.2 — Accuracy reported by CTNet under subject-specific and subject-independent evaluation. The four-class task loses close to twenty-four percentage points when the test subject is unseen during training."));
C.push(P("A model that reaches 82.52 per cent on people it has already seen and 58.64 per cent on a new person is not yet suitable for deployment, because the second figure is the one that describes what a first-time user would experience. Reducing this difference, without a large increase in model size, is the gap this project addresses."));

// =====================================================================
// 5. OBJECTIVES
// =====================================================================
C.push(H1("5. Project Objectives"));
C.push(NUMI("To implement a reproducible preprocessing and evaluation pipeline for motor imagery EEG using BCI Competition IV Dataset 2a.", 0));
C.push(NUMI("To implement EEGNet, ATCNet, CTNet and EEG Conformer as baseline models, and to evaluate them under a single identical protocol so that their results can be compared on equal terms.", 0));
C.push(NUMI("To design and implement a hybrid convolutional–Transformer model that combines the convolutional feature extraction used in EEGNet with the attention mechanisms used in ATCNet, CTNet and EEG Conformer.", 0));
C.push(NUMI("To train and evaluate all models using leave-one-subject-out cross-validation, so that every reported figure describes performance on a subject that was not seen during training.", 0));
C.push(NUMI("To measure classification accuracy, Cohen's kappa, precision, recall and F1-score, and to report results for each subject as well as averaged across subjects.", 0));
C.push(NUMI("To compare the parameter count and computational cost of the proposed model against the baselines.", 0));
C.push(NUMI("To analyse whether the proposed combination improves cross-subject performance while remaining comparatively lightweight, and to report the outcome whether or not it does.", 0));

// =====================================================================
// 6. PROPOSED SOLUTION
// =====================================================================
C.push(H1("6. Proposed Solution"));
C.push(P("The proposed solution is a single hybrid model, referred to in this document as HCT-Net, or Hybrid Convolution–Transformer Network. Rather than selecting one of the surveyed architectures and applying it unchanged, the model brings together the specific component from each paper that addresses a specific weakness identified in Section 4."));
C.push(P("The reasoning behind each choice is as follows. The convolutional front end is taken from EEGNet, because depthwise and separable convolution provide spatial filtering comparable to classical common spatial patterns at a very small parameter cost, which directly serves the requirement for a lightweight model. The temporal attention stage takes the sliding-window formulation used by ATCNet rather than attention over the full sequence, because windowing reduces both the parameter count and the tendency to overfit that is associated with unconstrained attention on small datasets. The use of a Transformer encoder on top of a convolutional feature map follows CTNet and EEG Conformer, but with two encoder layers rather than the six used by CTNet, again for reasons of model size and data efficiency. Finally, the training procedure is subject-independent throughout, which none of the four papers adopts as its primary evaluation setting."));
C.push(SP(60));
C.push(note("What is taken from the literature and what is proposed here", [
  "Taken from the literature: the depthwise and separable convolution block (EEGNet), the sliding-window attention formulation (ATCNet), the convolution-then-Transformer arrangement (CTNet and EEG Conformer), and the segmentation-and-reconstruction augmentation scheme (EEG Conformer and CTNet).",
  "Proposed in this project: the particular combination of these components in one lightweight model, the reduced-depth attention configuration chosen for data efficiency, the subject-independent training and evaluation procedure applied uniformly to every model, and the component-wise study that measures what each part contributes to cross-subject performance."
], TINT));

// =====================================================================
// 7. SYSTEM ARCHITECTURE
// =====================================================================
C.push(H1("7. Proposed System Architecture"));
C.push(P("The complete system is organised as a sequence of stages, from the raw recording to a predicted motor imagery class."));
C.push(SP(40));
C.push(figure("fig/f_sysarch.png", 468));
C.push(CAP("Figure 7.1 — System architecture. The two shaded stages are the learned components that together form the proposed model; the remaining stages are fixed signal processing and output layers."));
C.push(SP(40));
C.push(table(
  ["Stage", "Function", "Why it is required"],
  [
    ["Raw EEG", "A four-second trial recorded from 22 electrodes at 250 Hz", "The input signal, as provided by the dataset"],
    ["Preprocessing", "Band-pass filtering, epoching, alignment and normalisation", "Removes noise outside the frequency range of interest and places all subjects on a comparable scale"],
    ["CNN spatial–temporal feature extraction", "Temporal convolution, depthwise spatial convolution, separable convolution", "Learns frequency-selective filters and spatial combinations of electrodes at low parameter cost"],
    ["Lightweight temporal attention", "Windowed multi-head self-attention over the convolutional feature sequence", "Relates information from different parts of the trial, which convolution alone captures only within its receptive field"],
    ["Feature representation", "Fusion of window representations and global average pooling", "Produces a single fixed-length vector describing the trial"],
    ["Classification layer", "Fully connected layer followed by softmax", "Produces a probability for each of the four classes"],
    ["Predicted class", "Left hand, right hand, feet or tongue", "The output of the system"],
  ],
  [2350, 3300, 3850], { boldFirst: true }
));
C.push(CAP("Table 7.1 — Function of each stage in the system architecture."));

C.push(new Paragraph({ children: [new PageBreak()] }));

// =====================================================================
// 8. DATASET
// =====================================================================
C.push(H1("8. Dataset Description"));
C.push(P("The primary dataset is BCI Competition IV Dataset 2a. It was selected because all four surveyed papers evaluate on it, which allows the baseline implementations to be checked against published values before any conclusions are drawn from them. The dataset is publicly available and can be downloaded programmatically."));
C.push(SP(60));
C.push(table(
  ["Property", "Value"],
  [
    ["Dataset", "BCI Competition IV Dataset 2a"],
    ["Number of subjects", "9"],
    ["EEG channels", "22 (plus 3 electrooculogram channels, which are discarded)"],
    ["Motor imagery classes", "4 — left hand, right hand, feet, tongue"],
    ["Sampling rate", "250 Hz"],
    ["Sessions per subject", "2, recorded on different days"],
    ["Trials per session", "288 (72 per class)"],
    ["Trials per subject", "576"],
    ["Total labelled trials", "5,184"],
    ["Trial structure", "Fixation cue at 0 s, visual cue at 2 s, motor imagery performed until approximately 6 s"],
    ["Analysis window used here", "0.5 to 4.0 s after the cue, giving 875 samples per trial"],
  ],
  [3300, 6200], { boldFirst: true }
));
C.push(CAP("Table 8.1 — Properties of BCI Competition IV Dataset 2a."));
C.push(SP(40));
C.push(P("The four classes are distinguished by the region of the sensorimotor cortex that becomes active during imagery. Hand imagery produces activity on the opposite side of the head, foot imagery produces activity near the midline, and tongue imagery produces activity in the lower lateral region."));
C.push(figure("fig/f_classes.png", 464));
C.push(CAP("Figure 8.1 — The four motor imagery classes and the scalp regions associated with each. The maps are schematic and are drawn to indicate expected locations, not measured values."));
C.push(P("Two properties of this dataset shape the experimental design. First, the number of labelled trials is small by the standards of deep learning, so regularisation and data augmentation are necessary rather than optional. Second, with only nine subjects, leave-one-subject-out evaluation produces nine folds, which is enough to report a mean and a standard deviation and to apply a paired statistical test, but not enough to treat any single fold as reliable on its own."));

// =====================================================================
// 9. PREPROCESSING
// =====================================================================
C.push(H1("9. Data Preprocessing"));
C.push(P("Preprocessing is applied identically to every model, so that differences in results are attributable to the models rather than to differences in data handling."));
C.push(NUMI("Load the raw recordings and retain the 22 EEG channels. The three electrooculogram channels are removed after being used to check for ocular contamination.", 1));
C.push(NUMI("Apply a band-pass filter from 4 to 38 Hz using a fourth-order Butterworth filter applied in both directions, so that no phase distortion is introduced. This range retains the mu and beta rhythms that carry motor imagery information, while removing slow drift below 4 Hz and mains interference above 38 Hz.", 1));
C.push(NUMI("Extract a trial window from 0.5 to 4.0 seconds after the cue, giving 875 samples per trial. The first half-second is excluded because it contains the visual response to the cue rather than motor imagery.", 1));
C.push(NUMI("Reject trials in which the peak-to-peak amplitude exceeds 100 microvolts on any channel, and record the rejection rate for each subject so that data quality can be reported.", 1));
C.push(NUMI("Apply Euclidean alignment. For each subject the mean spatial covariance of their trials is computed, and every trial from that subject is transformed by the inverse square root of that matrix. After this step all subjects have the same mean covariance, which removes part of the difference between individuals. The step is unsupervised and requires only unlabelled trials from the subject, so it can also be applied to a new user.", 1));
C.push(NUMI("Standardise each channel using statistics computed from the training subjects only.", 1));
C.push(NUMI("Augment the training data using segmentation and reconstruction, in which trials of the same class are divided into segments and recombined to form additional training examples. This follows the procedure used by EEG Conformer and CTNet.", 1));
C.push(SP(40));
C.push(note("Preventing information leakage", [
  "Normalisation statistics, augmentation and all hyperparameter choices are derived from the training and validation subjects only. The held-out test subject contributes unlabelled trials to the alignment step and nothing else, which is the same information that would be available in a real deployment. Any departure from this rule would make the cross-subject result invalid."
]));

// =====================================================================
// 10. EDA PLAN
// =====================================================================
C.push(H1("10. Exploratory Data Analysis Plan"));
C.push(P("Exploratory analysis is carried out before any model is trained. Its purpose is to confirm that the data are as expected, to establish that the preprocessing pipeline behaves correctly, and to document the variability between subjects that the rest of the project attempts to address."));
C.push(SP(60));
C.push(table(
  ["Analysis", "What it shows", "Why it is done"],
  [
    ["Trial counts and class balance per subject", "Whether any subject or class is under-represented after artefact rejection", "An imbalance would affect how accuracy should be interpreted"],
    ["Artefact rejection rate per subject", "Data quality differences between subjects", "A subject with a high rejection rate may explain a poor fold result later"],
    ["Power spectral density by channel and class", "Whether mu and beta activity are present in the expected bands", "Confirms the filter settings are appropriate"],
    ["Time–frequency maps at C3, Cz and C4", "Whether event-related desynchronisation appears after the cue", "Confirms the analysis window is correctly placed"],
    ["Topographic maps averaged by class", "Whether hand imagery produces activity on the opposite side of the head", "Confirms the labels and channel montage are correctly aligned"],
    ["Covariance distance between subjects", "How far apart subjects are before and after alignment", "Quantifies the variability the project is trying to reduce"],
    ["Low-dimensional projection of trial features", "Whether trials cluster by class or by subject", "Clustering by subject rather than by class is direct evidence of the problem being addressed"],
  ],
  [2900, 3300, 3300], { boldFirst: true }
));
C.push(CAP("Table 10.1 — Planned exploratory analyses."));

C.push(new Paragraph({ children: [new PageBreak()] }));

// =====================================================================
// 11. PROPOSED ARCHITECTURE
// =====================================================================
C.push(H1("11. Proposed Deep Learning Architecture"));
C.push(P("The proposed model is deliberately kept simple. It consists of a convolutional feature extractor, a short attention stage, and a classifier. No component is included unless it addresses a specific limitation identified in the literature survey."));
C.push(SP(40));
C.push(figure("fig/f_model.png", 430));
C.push(CAP("Figure 11.1 — Block diagram of the proposed model. Tensor shapes are given for BCI Competition IV Dataset 2a, and the badges indicate which surveyed paper each component is adapted from."));

C.push(H2("11.1 Layer specification"));
C.push(P("The configuration below is written for 22 channels and 875 samples per trial."));
C.push(SP(50));
C.push(table(
  ["#", "Layer", "Configuration", "Output shape"],
  [
    ["1", "Temporal convolution", "F1 = 16 filters, kernel (1, 64), padding same", "16 × 22 × 875"],
    ["2", "Depthwise spatial convolution", "D = 2, kernel (22, 1), max-norm constraint 1.0", "32 × 1 × 875"],
    ["3", "Batch normalisation, ELU, average pooling (1, 4), dropout 0.25", "—", "32 × 1 × 218"],
    ["4", "Separable convolution", "F2 = 32 filters, kernel (1, 16)", "32 × 1 × 218"],
    ["5", "Batch normalisation, ELU, average pooling (1, 8), dropout 0.25", "—", "32 × 1 × 27"],
    ["6", "Window segmentation", "5 overlapping windows along the time axis", "5 × 32 × 11"],
    ["7", "Multi-head self-attention", "2 heads, 2 encoder layers, learned positional encoding", "5 × 32 × 11"],
    ["8", "Feature fusion and global average pooling", "Average over windows and time", "32"],
    ["9", "Fully connected layer and softmax", "32 → 4", "4"],
  ],
  [500, 2900, 3700, 2400], { boldFirst: true, center: [0, 3] }
));
C.push(CAP("Table 11.1 — Layer specification of the proposed model. The expected parameter count is below 50,000, which places it between ShallowConvNet at 47,364 parameters and ATCNet at 113,732 parameters."));

C.push(H2("11.2 Purpose of each component"));
C.push(SP(50));
C.push(table(
  ["Component", "Adapted from", "What it does", "Why it is included"],
  [
    ["Temporal convolution", "EEGNet", "Learns band-pass filters directly from the data", "Avoids fixing the frequency bands in advance"],
    ["Depthwise spatial convolution", "EEGNet", "Learns a spatial filter for each temporal filter", "Provides spatial filtering similar to common spatial patterns, at very low parameter cost"],
    ["Separable convolution", "EEGNet", "Summarises the temporal pattern of each feature map", "Reduces dimensionality before the attention stage"],
    ["Window segmentation", "ATCNet", "Divides the feature sequence into overlapping windows", "Limits the span over which attention operates, which reduces parameters and overfitting"],
    ["Multi-head self-attention", "CTNet, EEG Conformer", "Relates information from different parts of the trial", "Addresses the limited receptive field of the convolutional stage"],
    ["Euclidean alignment (preprocessing)", "Transfer learning literature", "Standardises the spatial covariance of each subject", "Reduces the distribution shift between subjects without adding parameters"],
    ["Segmentation and reconstruction", "EEG Conformer, CTNet", "Generates additional training trials", "Compensates for the small number of labelled trials"],
  ],
  [2350, 1750, 2700, 2700], { boldFirst: true }
));
C.push(CAP("Table 11.2 — Components of the proposed model, their origin, and the reason for including each."));
C.push(P("Two encoder layers are used rather than the six used by CTNet. This choice is made because the dataset contains fewer than six thousand labelled trials in total, and deeper attention stacks have more capacity to fit subject-specific detail that does not transfer to a new person. Whether this choice is correct is one of the questions the experiments are designed to answer."));

// =====================================================================
// 12. DETAILED METHODOLOGY
// =====================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(H1("12. Detailed Methodology"));
C.push(figure("fig/f_method.png", 468));
C.push(CAP("Figure 12.1 — The methodology as a sequence of stages."));
C.push(P("The project proceeds through the following steps."));
C.push(NUMI("Load BCI Competition IV Dataset 2a and verify the trial counts, labels and channel montage against the dataset description.", 2));
C.push(NUMI("Apply the preprocessing pipeline described in Section 9, and cache the resulting tensors so that preprocessing is performed once rather than once per model.", 2));
C.push(NUMI("Carry out the exploratory analyses listed in Section 10 and record the results, including any subject whose data quality is unusual.", 2));
C.push(NUMI("Implement the four baseline models, using published reference implementations where they are available, and verify that each reproduces its published within-subject accuracy to within a reasonable margin.", 2));
C.push(NUMI("Implement the proposed model and confirm that it trains end to end and that its parameter count is within the intended budget.", 2));
C.push(NUMI("Train all models using the subject-independent procedure described in Section 13, with identical preprocessing, identical folds and identical stopping criteria.", 2));
C.push(NUMI("Evaluate all models using leave-one-subject-out cross-validation as described in Section 14.", 2));
C.push(NUMI("Record accuracy, Cohen's kappa, precision, recall and F1-score for every fold, together with the confusion matrix for each model.", 2));
C.push(NUMI("Record the parameter count, training time and inference time for every model.", 2));
C.push(NUMI("Compare the proposed model against the baselines, using a paired statistical test across the nine subjects.", 2));
C.push(NUMI("Carry out a component-wise study in which individual parts of the proposed model are removed, in order to identify which components contribute to any change in cross-subject performance.", 2));
C.push(NUMI("Document the findings, including any case in which the proposed model does not improve on the baselines.", 2));

// =====================================================================
// 13. TRAINING STRATEGY
// =====================================================================
C.push(H1("13. Training Strategy"));
C.push(P("All models are trained with the same optimiser settings and the same stopping rule, so that the comparison between them is fair. The settings below are the starting configuration; any change made during tuning will be applied to all models and recorded."));
C.push(SP(50));
C.push(table(
  ["Setting", "Value", "Reason"],
  [
    ["Loss function", "Cross-entropy with label smoothing of 0.1", "Label smoothing reduces overconfidence on a small dataset"],
    ["Optimiser", "Adam, initial learning rate 0.001", "Standard choice in the surveyed papers"],
    ["Learning rate schedule", "Cosine decay", "Allows fine adjustment in later epochs"],
    ["Batch size", "64", "Fits comfortably in available GPU memory"],
    ["Maximum epochs", "500", "Sufficient for convergence with early stopping in place"],
    ["Early stopping", "Patience of 50 epochs on validation subject accuracy", "Prevents overfitting to the training subjects"],
    ["Dropout", "0.25 after each pooling stage", "Standard regularisation for EEG models of this size"],
    ["Weight constraint", "Max-norm of 1.0 on the depthwise convolution", "Used by EEGNet to limit the magnitude of spatial filters"],
    ["Weight decay", "0.0001", "Additional regularisation"],
    ["Data augmentation", "Segmentation and reconstruction, applied to the training split only", "Increases the effective number of training trials"],
    ["Random seeds", "Three seeds per configuration, results averaged", "Reduces the effect of initialisation on the comparison"],
  ],
  [2600, 3300, 3600], { boldFirst: true }
));
C.push(CAP("Table 13.1 — Training configuration."));
C.push(P("An optional variant will also be tested if time allows, in which an auxiliary branch attempts to predict which subject produced each trial and its gradient is reversed before reaching the feature extractor. The intention is to discourage the model from retaining subject-identifying information. This is treated as an experimental extension rather than part of the main model, because it adds a training-time hyperparameter that must itself be tuned."));

// =====================================================================
// 14. LOSO
// =====================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(H1("14. Cross-Subject Evaluation using Leave-One-Subject-Out"));
C.push(P("Leave-one-subject-out cross-validation is the evaluation protocol used throughout this project. In each fold, one subject is removed entirely from the training data and is used only for testing. This directly measures what a new user would experience."));
C.push(SP(40));
C.push(figure("fig/f_loso_concept.png", 468));
C.push(CAP("Figure 14.1 — The leave-one-subject-out concept. The model is trained on a group of subjects and evaluated on a subject it has never seen."));
C.push(P("With nine subjects the procedure produces nine folds. In each fold, seven subjects are used for training, one is held out for validation, and one is held out for testing. The reported figure is the mean and standard deviation across the nine folds."));
C.push(SP(40));
C.push(figure("fig/f_loso_folds.png", 400));
C.push(CAP("Figure 14.2 — Fold structure. Every subject serves as the test subject exactly once, and a separate subject is used for validation in each fold."));
C.push(P("A separate validation subject is used rather than a random split of the training subjects' trials. If validation trials came from subjects who also appear in the training set, the early stopping point and any tuned hyperparameter would be chosen to favour within-subject fit, which is the behaviour the protocol is intended to avoid."));
C.push(P("For reference, each model is also trained and tested within subject, using session one for training and session two for testing. This is not a headline result. Its purpose is to check the pipeline: if the reproduced within-subject accuracy of a baseline differs substantially from the published value, then something in the implementation or preprocessing is wrong, and the cross-subject figures cannot be trusted either."));

// =====================================================================
// 15. BASELINES
// =====================================================================
C.push(H1("15. Baseline Models"));
C.push(P("Four baselines are implemented, corresponding to the four papers in the literature survey. A classical method is also included, because deep learning is not automatically superior on datasets of this size."));
C.push(SP(50));
C.push(table(
  ["Model", "Architecture type", "Key idea", "Parameters", "Reported accuracy, IV-2a"],
  [
    ["EEGNet (2018)", "Compact CNN", "Depthwise and separable convolution", "2,548", "68.67% / 71.50%"],
    ["ATCNet (2023)", "CNN with attention and TCN", "Sliding-window attention over temporal features", "113,732", "81.10%"],
    ["EEG Conformer (2023)", "CNN with Transformer", "Convolution followed by global self-attention", "Not stated", "78.66%"],
    ["CTNet (2024)", "CNN with Transformer", "EEGNet front end with a six-layer encoder", "Not stated", "82.52%"],
    ["FBCSP with LDA", "Classical", "Filter-bank common spatial patterns", "Not applicable", "Approximately 68%"],
    ["HCT-Net (proposed)", "CNN with windowed attention", "Combination of the components above", "Target below 50,000", "To be determined"],
  ],
  [2200, 2100, 2500, 1400, 1300], { boldFirst: true, center: [3, 4] }
));
C.push(CAP("Table 15.1 — Baseline models and the proposed model. Accuracies are as reported by the respective authors. EEGNet appears with two figures because different papers report it differently."));
C.push(SP(40));
C.push(table(
  ["Model", "Main strength", "Main limitation", "Role in our experiments"],
  [
    ["EEGNet", "Very small and trains reliably on limited data", "Limited ability to model long-range temporal structure", "Lower bound on model size; reference point for parameter efficiency"],
    ["ATCNet", "Attention applied locally, which suits short EEG trials", "Considerably larger than EEGNet", "Source of the windowed attention formulation used in the proposed model"],
    ["EEG Conformer", "Global self-attention with an interpretability method", "Global attention is costly and needs augmentation to train well", "Reference for the convolution-then-attention arrangement"],
    ["CTNet", "Highest reported within-subject accuracy of the four", "Reports a large drop under subject-independent evaluation", "Provides the quantitative statement of the research gap"],
    ["FBCSP with LDA", "Well understood, fast, no training instability", "Fixed feature extraction, no learned representation", "Check that the deep models justify their additional complexity"],
  ],
  [1700, 2700, 2500, 2600], { boldFirst: true }
));
C.push(CAP("Table 15.2 — Strengths, limitations and the purpose each baseline serves in this project."));
C.push(SP(40));
C.push(note("Why the published figures cannot simply be ranked", [
  "The accuracies in Table 15.1 were obtained under different evaluation protocols. Some use a hold-out split, some use cross-validation, and some are subject-specific. EEGNet is quoted at 68.67 per cent by one paper and 71.50 per cent by another for the same model on the same dataset, purely because the evaluation differs.",
  "Re-implementing all four under one identical leave-one-subject-out protocol is therefore a necessary part of this project, and the resulting comparison is useful independently of how the proposed model performs."
]));

// =====================================================================
// 16. METRICS
// =====================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(H1("16. Evaluation Metrics"));
C.push(SP(50));
C.push(table(
  ["Metric", "Definition", "Why it is used"],
  [
    ["Accuracy", "Proportion of trials classified correctly", "The headline measure, reported as a mean and standard deviation across the nine folds"],
    ["Cohen's kappa", "Agreement corrected for the agreement expected by chance", "Standard in brain–computer interface research and directly comparable with published work"],
    ["Precision (macro)", "Of the trials predicted as a class, the proportion that belong to it, averaged over classes", "Shows whether a class is being over-predicted"],
    ["Recall (macro)", "Of the trials belonging to a class, the proportion correctly identified, averaged over classes", "Shows whether a class is being missed"],
    ["F1-score (macro)", "Harmonic mean of precision and recall, averaged over classes", "Summarises per-class balance in a single number"],
    ["Confusion matrix", "Counts of predicted against true classes", "Identifies which classes are confused; feet and tongue are a known difficult pair"],
    ["Parameter count", "Number of trainable parameters", "Required for the comparison of model complexity"],
    ["Training and inference time", "Wall-clock time per fold and per trial", "Indicates practical cost on the available hardware"],
    ["Wilcoxon signed-rank test", "Paired non-parametric test across the nine subjects", "Determines whether a difference between two models is statistically meaningful"],
  ],
  [2300, 3700, 3500], { boldFirst: true }
));
C.push(CAP("Table 16.1 — Evaluation metrics. Statistical tests are applied at a significance level of 0.05."));
C.push(P("Results are reported for each subject individually as well as averaged. This matters because cross-subject decoders often fail badly on one or two particular subjects, a phenomenon sometimes described as brain–computer interface illiteracy. A model with a slightly lower mean accuracy but a smaller spread across subjects may be preferable in practice, and this distinction is invisible if only the average is reported."));

// =====================================================================
// 17. EXPERIMENTAL PLAN
// =====================================================================
C.push(H1("17. Experimental Plan"));
C.push(SP(50));
C.push(table(
  ["Experiment", "Configuration", "Purpose", "Runs"],
  [
    ["E1 — Baseline reproduction", "Each baseline, within subject, session 1 to session 2", "Confirm the implementations are correct before cross-subject results are trusted", "5 × 9 = 45"],
    ["E2 — Cross-subject baselines", "Each baseline under leave-one-subject-out", "Establish a fair comparison under one protocol", "5 × 9 = 45"],
    ["E3 — Proposed model", "HCT-Net under leave-one-subject-out", "Measure cross-subject performance of the proposed model", "9"],
    ["E4 — Component study", "Components of HCT-Net removed one at a time", "Identify which parts contribute to cross-subject performance", "5 × 9 = 45"],
    ["E5 — Attention depth", "Two encoder layers compared with six", "Test whether reduced depth helps on this dataset size", "9"],
    ["E6 — Complexity comparison", "Parameter count, training and inference time for all models", "Support the claim that the proposed model is comparatively lightweight", "Measured during E2 and E3"],
  ],
  [2350, 2500, 3200, 1450], { boldFirst: true, center: [3] }
));
C.push(CAP("Table 17.1 — Planned experiments. The total is approximately 153 training runs, which is feasible within the Phase 3 window on a single GPU provided preprocessed data are cached."));

// =====================================================================
// 18. TOOLS
// =====================================================================
C.push(H1("18. Tools and Technologies"));
C.push(SP(50));
C.push(table(
  ["Category", "Tool", "Purpose"],
  [
    ["Programming language", "Python 3.10", "All implementation"],
    ["Deep learning framework", "PyTorch 2.x", "Model definition and training"],
    ["EEG processing", "MNE-Python", "Loading, filtering, epoching and topographic plotting"],
    ["Dataset access", "MOABB", "Programmatic download and standard dataset handling"],
    ["Reference implementations", "Braindecode", "Validated implementations of EEGNet and related models"],
    ["Classical baseline", "scikit-learn, pyRiemann", "Filter-bank common spatial patterns with linear discriminant analysis"],
    ["Numerical computing", "NumPy, SciPy", "Filtering, alignment matrices and statistical tests"],
    ["Visualisation", "Matplotlib, Seaborn", "Figures, confusion matrices and topographic maps"],
    ["Experiment tracking", "TensorBoard or Weights and Biases", "Logging results across approximately 153 runs"],
    ["Hardware", "Google Colab or Kaggle GPU", "Model training with checkpointing"],
    ["Version control", "Git and GitHub", "Code, configuration files and recorded results"],
  ],
  [2600, 2900, 4000], { boldFirst: true }
));
C.push(CAP("Table 18.1 — Software and hardware."));
C.push(P("Published reference implementations are used for the baselines wherever they are available. If a baseline were re-implemented from scratch and failed to reproduce its published accuracy, it would not be possible to tell whether the cause was an implementation error or a genuine difference in evaluation, and there is not enough time in Phase 3 to resolve such a question for four architectures."));

// =====================================================================
// 19. IMPLEMENTATION PLAN
// =====================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(H1("19. Implementation Plan and Milestones"));
C.push(P("Phase 3 runs from 16 September to 3 October 2026. The plan is arranged so that the data pipeline and the baselines are working before the proposed model is written, because results from a model evaluated on an unverified pipeline would not be meaningful."));
C.push(SP(40));
C.push(figure("fig/f_timeline.png", 450));
C.push(CAP("Figure 19.1 — Implementation timeline for Phase 3."));
C.push(SP(40));
C.push(table(
  ["Dates", "Milestone", "Completion criterion"],
  [
    ["16–18 Sep", "Dataset preparation and exploratory analysis", "Dataset loads correctly; exploratory figures produced and reviewed"],
    ["19–20 Sep", "Preprocessing pipeline", "Filtering, epoching, alignment and caching verified"],
    ["21–24 Sep", "Baseline implementation", "All baselines run; within-subject accuracy close to published values"],
    ["25–27 Sep", "Proposed model implementation", "Model trains end to end; parameter count confirmed"],
    ["28–29 Sep", "Training and tuning", "Hyperparameters fixed on the validation subject"],
    ["30 Sep – 1 Oct", "Leave-one-subject-out experiments", "Nine folds completed for every model"],
    ["2 Oct", "Comparison and analysis", "Metrics tables, confusion matrices and statistical tests produced"],
    ["3 Oct", "Report and figures", "Results consolidated for the 2nd Review"],
  ],
  [1700, 3300, 4500], { boldFirst: true }
));
C.push(CAP("Table 19.1 — Milestones and completion criteria."));

// =====================================================================
// 20. EXPECTED OUTCOMES
// =====================================================================
C.push(H1("20. Expected Outcomes"));
C.push(P("The following are the outcomes the project is designed to produce. They are stated as expectations. No experiments have been conducted at the time of writing, and none of these statements should be read as a result."));
C.push(SP(50));
C.push(table(
  ["Expected outcome", "How it will be assessed"],
  [
    ["A working implementation of four baseline models and the proposed model, under one common pipeline", "Code in a version-controlled repository with recorded configurations"],
    ["A fair comparison of all models under one identical leave-one-subject-out protocol", "A results table with per-subject and averaged figures"],
    ["Cross-subject accuracy from the proposed model that is competitive with the baselines", "Mean accuracy and Cohen's kappa across nine folds, with a paired statistical test"],
    ["A parameter count lower than the attention-based baselines", "Direct measurement, reported alongside accuracy"],
    ["Evidence of which components affect cross-subject performance", "The component-wise study described in Section 17"],
    ["A clear statement of whether the proposed combination helps", "Reported whether the outcome is positive or negative"],
  ],
  [4700, 4800], { boldFirst: true }
));
C.push(CAP("Table 20.1 — Expected outcomes and how each will be assessed."));
C.push(P("It is possible that the proposed model will not outperform the baselines under cross-subject evaluation. If that occurs, the component-wise study will still indicate which parts of the design were responsible, and that finding is a legitimate contribution. The project is structured so that a negative result remains informative."));

// =====================================================================
// 21. CHALLENGES
// =====================================================================
C.push(H1("21. Possible Challenges and Solutions"));
C.push(SP(50));
C.push(table(
  ["Challenge", "Why it may occur", "Planned response"],
  [
    ["Limited training data", "Fewer than six thousand labelled trials in total", "Augmentation, dropout, weight constraints, early stopping and a deliberately small model"],
    ["Overfitting to training subjects", "The model can fit subject-specific detail that does not transfer", "Validation on a held-out subject rather than a random trial split"],
    ["Baselines not reproducing published accuracy", "Differences in preprocessing or evaluation protocol", "Use published reference implementations; report both reproduced and published figures and explain the difference"],
    ["High variance across folds", "Only nine subjects, some of whom may produce weak signals", "Report per-subject results and standard deviation; use a paired statistical test rather than comparing means alone"],
    ["Training time exceeding available GPU hours", "Approximately 153 runs across all experiments", "Cache preprocessed tensors, use mixed precision, checkpoint every epoch, and reduce the component study if necessary"],
    ["Session interruptions on hosted GPU services", "Time limits on free tiers", "Save checkpoints to persistent storage so that an interruption costs one epoch rather than one fold"],
    ["The proposed model does not improve on the baselines", "The combination may not help on this dataset", "Report the result honestly and use the component study to explain it"],
  ],
  [2500, 3200, 3800], { boldFirst: true }
));
C.push(CAP("Table 21.1 — Anticipated challenges and the response decided in advance for each."));

// =====================================================================
// 22. NOVELTY
// =====================================================================
C.push(H1("22. Novelty and Expected Contribution"));
C.push(P("This section states what is new in the project and what is not, so that the contribution is not overstated."));
C.push(H2("22.1 What is not new"));
C.push(P("The individual components of the proposed model are all taken from published work. Depthwise and separable convolution come from EEGNet, sliding-window attention comes from ATCNet, the arrangement of convolution followed by a Transformer encoder comes from CTNet and EEG Conformer, and segmentation-and-reconstruction augmentation comes from EEG Conformer and CTNet. Leave-one-subject-out evaluation is a standard protocol. None of these is presented as an original contribution."));
C.push(H2("22.2 What the project contributes"));
C.push(BUL("A comparison of EEGNet, ATCNet, CTNet and EEG Conformer under one identical subject-independent protocol. The published figures for these models were obtained under different evaluation settings and cannot be ranked against one another as they stand."));
C.push(BUL("A specific lightweight combination of these components, with the attention depth reduced to suit the size of the dataset, evaluated for cross-subject performance rather than within-subject performance."));
C.push(BUL("A component-wise study that measures how much each part of the combination contributes to cross-subject accuracy, which the surveyed papers do not report."));
C.push(BUL("A comparison of accuracy against parameter count under a single protocol, which supports a practical judgement about whether the additional complexity of attention-based models is justified on this dataset."));
C.push(P("The contribution is therefore a careful comparative study together with a concrete lightweight design, rather than a claim of a fundamentally new architecture. This is stated deliberately, and no claim of improved performance is made in advance of the experiments."));

// =====================================================================
// 23. FUTURE SCOPE
// =====================================================================
C.push(H1("23. Future Scope"));
C.push(BUL("Extending the evaluation to BCI Competition IV Dataset 2b and to larger datasets such as the PhysioNet motor imagery collection, in order to test whether the findings hold with more subjects and different electrode configurations."));
C.push(BUL("Measuring how many labelled trials from a new user are required to reach a given accuracy, which would quantify the calibration effort a real deployment would need."));
C.push(BUL("Investigating domain adaptation methods, including adversarial and contrastive approaches, as a more systematic way of reducing the difference between subjects."));
C.push(BUL("Applying interpretability methods such as class activation topography to check whether the model relies on the expected sensorimotor regions rather than on artefacts."));
C.push(BUL("Testing the model in an online setting, where trials arrive continuously and decisions must be made within a fixed latency budget."));
C.push(BUL("Reducing the model further through quantisation or pruning, with a view to running it on embedded hardware."));

// =====================================================================
// 24. REFERENCES
// =====================================================================
C.push(H1("24. References"));
const refs = [
  "V. J. Lawhern, A. J. Solon, N. R. Waytowich, S. M. Gordon, C. P. Hung and B. J. Lance, “EEGNet: A Compact Convolutional Neural Network for EEG-based Brain–Computer Interfaces,” Journal of Neural Engineering, vol. 15, no. 5, 056013, 2018.",
  "H. Altaheri, G. Muhammad and M. Alsulaiman, “Physics-Informed Attention Temporal Convolutional Network for EEG-Based Motor Imagery Classification,” IEEE Transactions on Industrial Informatics, vol. 19, no. 2, pp. 2249–2258, 2023.",
  "W. Zhao, X. Jiang, B. Zhang, S. Xiao and S. Weng, “CTNet: A Convolutional Transformer Network for EEG-Based Motor Imagery Classification,” Scientific Reports, vol. 14, 20237, 2024.",
  "Y. Song, Q. Zheng, B. Liu and X. Gao, “EEG Conformer: Convolutional Transformer for EEG Decoding and Visualization,” IEEE Transactions on Neural Systems and Rehabilitation Engineering, vol. 31, pp. 710–719, 2023.",
  "M. Tangermann, K.-R. Müller, A. Aertsen et al., “Review of the BCI Competition IV,” Frontiers in Neuroscience, vol. 6, 55, 2012.",
  "H. He and D. Wu, “Transfer Learning for Brain–Computer Interfaces: A Euclidean Space Data Alignment Approach,” IEEE Transactions on Biomedical Engineering, vol. 67, no. 2, pp. 399–410, 2020.",
  "R. T. Schirrmeister, J. T. Springenberg, L. D. J. Fiederer et al., “Deep Learning with Convolutional Neural Networks for EEG Decoding and Visualization,” Human Brain Mapping, vol. 38, no. 11, pp. 5391–5420, 2017.",
  "K. K. Ang, Z. Y. Chin, H. Zhang and C. Guan, “Filter Bank Common Spatial Pattern (FBCSP) in Brain–Computer Interface,” Proceedings of the IEEE International Joint Conference on Neural Networks, pp. 2390–2397, 2008.",
  "A. Gramfort, M. Luessi, E. Larson et al., “MEG and EEG Data Analysis with MNE-Python,” Frontiers in Neuroscience, vol. 7, 267, 2013.",
  "B. Aristimunha, I. Carrara, P. Guetschel et al., “Mother of All BCI Benchmarks (MOABB),” software framework for reproducible EEG decoding, 2023.",
  "G. Pfurtscheller and F. H. Lopes da Silva, “Event-Related EEG/MEG Synchronization and Desynchronization: Basic Principles,” Clinical Neurophysiology, vol. 110, no. 11, pp. 1842–1857, 1999.",
];
refs.forEach((r, i) => C.push(new Paragraph({
  spacing: { after: 110, line: 276 },
  indent: { left: 420, hanging: 420 },
  children: [new TextRun({ text: `[${i + 1}] ${r}`, size: 19 })]
})));

// =====================================================================
const doc = new Document({
  creator: "Phase 2 Solution Design",
  title: "Cross-Subject Motor Imagery EEG Classification using Deep Learning — Phase 2 Solution Design",
  numbering: {
    config: [
      {
        reference: "bul",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 440, hanging: 230 } } }
        }]
      },
      {
        reference: "num",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 280 } } }
        }]
      }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1150, right: 1200, bottom: 1150, left: 1200 } } },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Phase 2 — Solution Design  |  Cross-Subject Motor Imagery EEG Classification  |  ", size: 16, color: GREY }),
            new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })
          ]
        })]
      })
    },
    children: C
  }]
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync('/home/claude/review2/Phase2_Solution_Design.docx', b);
  console.log('written', b.length, 'bytes');
});
