const K = require('./doc3_part1.js');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak, LevelFormat, PageNumber, Footer, BorderStyle, fs,
  CW, NAVY, NAVYD, PURPLE, GREY, CARD, TINT,
  H1, H2, H3, P, BUL, NUMI, CAP, SP, figure, table, note, code
} = K;

const C = [];
const BR = () => C.push(new Paragraph({ children: [new PageBreak()] }));

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
  alignment: AlignmentType.CENTER, spacing: { after: 380 },
  children: [new TextRun({ text: "Classification using Deep Learning", bold: true, size: 38, color: NAVYD })]
}));
C.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 460 },
  children: [new TextRun({ text: "Complete Methodology and Detailed Implementation Plan", size: 24, color: NAVY })]
}));
C.push(SP(180));
{
  const rows = [
    ["Team members", "[ Names and registration numbers ]"],
    ["Guide / faculty", "[ Name and designation ]"],
    ["Course", "[ Course code and title ]"],
    ["Department / institution", "[ Department, institution ]"],
    ["Primary dataset", "BCI Competition IV Dataset 2a"],
    ["Review", "1st Review, 15 September 2026"],
    ["Implementation window", "16 September – 3 October 2026"],
    ["Final submission", "10 October 2026"],
  ];
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  C.push(new Table({
    columnWidths: [3300, 6200], width: { size: CW, type: WidthType.DXA },
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: rows.map(([k, v]) => new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 3300, type: WidthType.DXA }, margins: { top: 85, bottom: 85, left: 0, right: 140 },
          borders: { top: none, bottom: none, left: none, right: none },
          children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: k, size: 20, color: GREY })] })]
        }),
        new TableCell({
          width: { size: 6200, type: WidthType.DXA }, margins: { top: 85, bottom: 85, left: 0, right: 0 },
          borders: { top: none, bottom: none, left: none, right: none },
          children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: v, size: 20, color: NAVYD })] })]
        }),
      ]
    }))
  }));
}
C.push(CAP("Fields in square brackets are to be completed before submission."));
BR();

// =====================================================================
// 1
// =====================================================================
C.push(H1("1. Project Title"));
C.push(P("Cross-Subject Motor Imagery EEG Classification using a Hybrid Convolutional–Transformer Deep Learning Model."));
C.push(P("The work develops a deep learning model that classifies four motor imagery tasks from electroencephalography, and evaluates it under a subject-independent protocol in which the test subject is not present in the training data. The model combines components that the surveyed literature has shown to be effective, while keeping the parameter count low enough to remain practical on modest hardware."));

// =====================================================================
// 2
// =====================================================================
C.push(H1("2. Problem Statement"));
C.push(P("Motor imagery is the act of imagining a movement without performing it. When a person imagines moving a limb, the sensorimotor cortex produces a measurable change in the mu band (approximately 8 to 13 Hz) and the beta band (approximately 13 to 30 Hz). This change is called event-related desynchronisation, and it appears on the side of the head opposite to the imagined limb. Electroencephalography records this activity from the scalp without surgery, which makes it the most widely used signal for practical brain–computer interfaces."));
C.push(P("Building a classifier for these signals is difficult for several related reasons. The signal-to-noise ratio is low, because the cortical activity of interest is attenuated by the skull and scalp. The recordings are contaminated by eye movements, muscle activity and mains interference, all of which are often larger in amplitude than the signal being sought. The data are high-dimensional: a four-second trial recorded from 22 channels at 250 Hz contains more than twenty thousand samples, while a typical dataset provides only a few hundred labelled trials per subject. The signal is also non-stationary, so recordings made from the same person on different days do not have identical statistics."));
C.push(SP(50));
C.push(figure("fig/f_erd.png", 460));
C.push(CAP("Figure 2.1 — Motor imagery suppresses mu-band power in the sensorimotor cortex, on the side opposite the imagined hand. This is the physiological effect a decoder is expected to detect."));
C.push(P("The specific difficulty addressed in this project is variability between people. Skull thickness, cortical folding, electrode placement and the mental strategy a person adopts when imagining movement all differ from one individual to the next. As a result the statistical distribution of the recorded features shifts from subject to subject, and a model trained on one group of people often performs poorly when applied to someone new."));

// =====================================================================
// 3
// =====================================================================
C.push(H1("3. Motivation"));
C.push(P("A reliable motor imagery decoder would allow a person to issue commands to a computer or a device without any physical movement. The clearest application is assistive technology for people with severe motor impairment arising from conditions such as amyotrophic lateral sclerosis, spinal cord injury or brainstem stroke, for whom keyboards, touchscreens and speech interfaces may all be inaccessible. Related applications include neurorehabilitation, where detecting motor intent can be used to trigger assisted movement in patients relearning motor control, and hands-free interaction in settings where physical input is impractical."));
C.push(P("For any of these applications the practical obstacle is the calibration session. If a system must be trained on several hours of labelled data from each new user before it becomes usable, it is difficult to deploy. Reducing that requirement depends on the model generalising across people, which is why this project treats cross-subject performance as the central objective rather than as a secondary result."));

// =====================================================================
// 4
// =====================================================================
C.push(H1("4. Research Gap"));
C.push(P("The literature survey conducted in Phase 1 covered four representative deep learning architectures for motor imagery decoding. Taken together they show a clear direction of development and a clear unresolved problem."));
C.push(SP(50));
C.push(figure("fig/f_evolution.png", 462));
C.push(CAP("Figure 4.1 — Development of the surveyed architectures, from a compact convolutional network towards convolutional–Transformer hybrids. Accuracies and parameter counts are as reported by the respective authors."));

C.push(H2("4.1 Observations from the surveyed papers"));
C.push(BUL("Cross-subject generalisation remains difficult. Accuracy is consistently lower when the test subject was not present in the training set."));
C.push(BUL("Zero-calibration and low-calibration operation is still an open problem. Most reported results assume that labelled data from the target subject are available."));
C.push(BUL("Convolutional models such as EEGNet are lightweight and train reliably on small datasets, but their receptive field limits how much long-range temporal structure they can represent."));
C.push(BUL("Transformer-based models such as CTNet and EEG Conformer capture global temporal relationships more directly, but they have substantially more parameters and are more sensitive to the limited size of EEG datasets."));
C.push(BUL("No single model in the surveyed set balances classification accuracy, model complexity and cross-subject generalisation at the same time."));

C.push(H2("4.2 Quantifying the gap"));
C.push(P("The size of the problem can be seen directly in the results reported by CTNet, which evaluates the same architecture under both a subject-specific and a subject-independent protocol."));
C.push(SP(50));
C.push(figure("fig/f_gap.png", 380));
C.push(CAP("Figure 4.2 — Accuracy reported by CTNet under subject-specific and subject-independent evaluation. The four-class task loses close to twenty-four percentage points when the test subject is unseen during training."));
C.push(P("A model that reaches 82.52 per cent on people it has already seen and 58.64 per cent on a new person is not yet suitable for deployment, because the second figure is the one that describes what a first-time user would experience. Reducing this difference, without a large increase in model size, is the gap this project addresses."));

// =====================================================================
// 5
// =====================================================================
C.push(H1("5. Project Objectives"));
C.push(NUMI("To implement a reproducible preprocessing and evaluation pipeline for motor imagery EEG using BCI Competition IV Dataset 2a.", 0));
C.push(NUMI("To implement EEGNet, ATCNet, CTNet and EEG Conformer as baseline models, and to evaluate them under a single identical protocol so that their results can be compared on equal terms.", 0));
C.push(NUMI("To design and implement a hybrid convolutional–Transformer model that combines the convolutional feature extraction used in EEGNet with the attention mechanisms used in ATCNet, CTNet and EEG Conformer.", 0));
C.push(NUMI("To train and evaluate all models using leave-one-subject-out cross-validation, so that every reported figure describes performance on a subject that was not seen during training.", 0));
C.push(NUMI("To measure classification accuracy, Cohen's kappa, precision, recall and F1-score, and to report results for each subject as well as averaged across subjects.", 0));
C.push(NUMI("To compare the parameter count and computational cost of the proposed model against the baselines.", 0));
C.push(NUMI("To analyse whether the proposed combination improves cross-subject performance while remaining comparatively lightweight, and to report the outcome whether or not it does.", 0));

BR();

// =====================================================================
// 6  PROPOSED SOLUTION
// =====================================================================
C.push(H1("6. Proposed Solution"));
C.push(P("The proposed solution is a single hybrid model, referred to in this document as HCT-Net, or Hybrid Convolution–Transformer Network. Rather than selecting one of the surveyed architectures and applying it unchanged, the model brings together the specific component from each paper that addresses a specific weakness identified in Section 4. This section sets out the principles that guided the design, the alternatives that were considered and rejected, and the approach that was selected."));

C.push(H2("6.1 Design principles"));
C.push(P("Five principles were fixed before any architecture was drawn. Each follows from the research gap rather than from preference, and each is checkable."));
C.push(SP(50));
C.push(table(
  ["Principle", "Statement", "Follows from", "How it is checked"],
  [
    ["P1 — Cross-subject first", "Every design decision is judged by its effect on unseen subjects, not on within-subject accuracy", "Section 4.2: the twenty-four point drop is the problem", "All headline results use leave-one-subject-out"],
    ["P2 — Small by default", "Capacity is added only where a specific limitation requires it", "Small dataset; deployment on modest hardware", "Parameter count computed in Section 11.4"],
    ["P3 — Every component justified", "No component is included because it appeared in a published paper", "Combination without reason is not a design", "Component study, experiment E4"],
    ["P4 — One protocol for all models", "Baselines and the proposed model share preprocessing, folds and stopping rules", "Published figures use different protocols and cannot be ranked", "Single configuration file per experiment"],
    ["P5 — Honest reporting", "Negative and inconclusive outcomes are reported in the same detail as positive ones", "The project is a study, not a demonstration", "Result templates in Section 17.3 are fixed in advance"],
  ],
  [1750, 2900, 2450, 2400], { boldFirst: true }
));
C.push(CAP("Table 6.1 — Design principles and the evidence each responds to."));

C.push(H2("6.2 Candidate approaches considered"));
C.push(P("Six families of approach were considered before the hybrid was selected. They are set out below with the reason each was or was not adopted. The assessment is qualitative and reflects behaviour reported in the surveyed literature; it is not a measurement made by this project."));
C.push(SP(50));
C.push(figure("fig/f_selection.png", 462));
C.push(CAP("Figure 6.1 — Qualitative assessment of candidate model families against the four criteria that follow from the research gap."));
C.push(SP(40));
C.push(table(
  ["Approach", "Why it was considered", "Why it was not selected on its own"],
  [
    ["FBCSP with linear discriminant analysis", "Well understood, fast, no training instability, still competitive on small datasets", "Feature extraction is fixed in advance and cannot adapt; retained as a control baseline rather than the main method"],
    ["Compact CNN (EEGNet alone)", "Very small and trains reliably; the natural lower bound on model size", "Receptive field limits how much long-range temporal structure it can represent; retained as a baseline"],
    ["Deep CNN (DeepConvNet)", "Greater capacity than a compact CNN", "Reported accuracy on this dataset is poor relative to its size, which suggests it overfits at this data scale"],
    ["Recurrent networks (LSTM, GRU)", "Designed for sequences and can carry information across a whole trial", "Slow to train, difficult to stabilise on short noisy sequences, and not used by any of the four surveyed papers"],
    ["Pure Transformer on raw EEG", "Directly models relationships between any two time points", "Very large parameter count and a strong data requirement; EEG datasets of this size do not support it without heavy augmentation"],
    ["Hybrid convolution with windowed attention", "Convolution supplies cheap spatial filtering; attention supplies long-range structure; windowing limits the cost of attention", "Selected. It is the only family that is acceptable on all four criteria, although it is best on none"],
  ],
  [2100, 3500, 3900], { boldFirst: true, hi: [5] }
));
C.push(CAP("Table 6.2 — Candidate approaches and the reason each was accepted or set aside."));

C.push(H2("6.3 The selected approach"));
C.push(P("The reasoning behind each component of the selected approach is as follows. The convolutional front end is taken from EEGNet, because depthwise and separable convolution provide spatial filtering comparable to classical common spatial patterns at a very small parameter cost, which directly serves principle P2. The temporal attention stage takes the sliding-window formulation used by ATCNet rather than attention over the full sequence, because windowing reduces both the parameter count and the tendency to overfit that is associated with unconstrained attention on small datasets. The use of a Transformer encoder on top of a convolutional feature map follows CTNet and EEG Conformer, but with two encoder layers rather than the six used by CTNet, again for reasons of model size and data efficiency. Euclidean alignment is applied during preprocessing because it reduces the difference between subjects at zero parameter cost, which serves P1 and P2 at the same time. Finally, the training and evaluation procedure is subject-independent throughout, which none of the four papers adopts as its primary setting."));

C.push(H2("6.4 What is taken from the literature and what is proposed here"));
C.push(SP(40));
C.push(note("Stated explicitly, so that the contribution is not overstated", [
  "Taken from the literature: the depthwise and separable convolution block (EEGNet), the sliding-window attention formulation (ATCNet), the convolution-then-Transformer arrangement (CTNet and EEG Conformer), Euclidean alignment (transfer learning literature), and segmentation-and-reconstruction augmentation (EEG Conformer and CTNet).",
  "Proposed in this project: the particular combination of these components in one lightweight model, the reduced-depth attention configuration chosen for data efficiency, the subject-independent training and evaluation procedure applied uniformly to every model, and the component study that measures what each part contributes to cross-subject performance."
], TINT));

BR();

// =====================================================================
// 7  SYSTEM ARCHITECTURE
// =====================================================================
C.push(H1("7. Proposed System Architecture"));

C.push(H2("7.1 End-to-end flow"));
C.push(P("The complete system is organised as a sequence of stages, from the raw recording to a predicted motor imagery class."));
C.push(SP(40));
C.push(figure("fig/f_sysarch.png", 468));
C.push(CAP("Figure 7.1 — System architecture. The two shaded stages are the learned components that together form the proposed model; the remaining stages are fixed signal processing and output layers."));
C.push(SP(40));
C.push(table(
  ["Stage", "Function", "Why it is required"],
  [
    ["Raw EEG", "A trial recorded from 22 electrodes at 250 Hz", "The input signal, as provided by the dataset"],
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

C.push(H2("7.2 Data flow and tensor shapes"));
C.push(P("The table below traces a single trial through the system, so that the shape of the data at every interface is fixed before implementation begins. Batch dimensions are omitted."));
C.push(SP(40));
C.push(table(
  ["Point in the system", "Shape", "Data type", "Produced by"],
  [
    ["Raw recording, one session", "25 × 6.1 × 10⁵", "float32", "Dataset loader"],
    ["After channel selection", "22 × 6.1 × 10⁵", "float32", "data/loaders.py"],
    ["After band-pass filter", "22 × 6.1 × 10⁵", "float32", "preprocessing/filters.py"],
    ["After epoching", "22 × 875 per trial", "float32", "preprocessing/filters.py"],
    ["After artefact rejection", "22 × 875, fewer trials", "float32", "preprocessing/filters.py"],
    ["After Euclidean alignment", "22 × 875", "float32", "preprocessing/align.py"],
    ["After standardisation", "22 × 875", "float32", "preprocessing/filters.py"],
    ["Cached tensor on disk", "N × 22 × 875 plus N labels", "float32, int64", "preprocessing cache"],
    ["After convolutional block", "32 × 27", "float32", "models/hctnet.py"],
    ["After window segmentation", "5 × 32 × 11", "float32", "models/hctnet.py"],
    ["After attention and fusion", "32", "float32", "models/hctnet.py"],
    ["Model output", "4 class logits", "float32", "models/hctnet.py"],
  ],
  [3100, 2500, 1900, 2000], { boldFirst: true, center: [1, 2], size: 17 }
));
C.push(CAP("Table 7.2 — Data flow with shapes at every interface. Fixing these in advance means each module can be written and tested independently."));

C.push(H2("7.3 Software module structure and interfaces"));
C.push(P("The implementation is divided into modules with one responsibility each. The boundaries are chosen so that an error in one stage cannot silently affect another, and so that the expensive preprocessing step is performed once rather than once per model."));
C.push(SP(40));
C.push(figure("fig/f_modules.png", 462));
C.push(CAP("Figure 7.2 — Software modules and the artefacts passed between them."));
C.push(SP(40));
C.push(table(
  ["Module", "Responsibility", "Inputs", "Outputs"],
  [
    ["data/", "Load the dataset, select channels, define fold membership", "Raw GDF files", "Raw epochs, fold definitions"],
    ["preprocessing/", "Filter, epoch, reject, align, normalise, augment, cache", "Raw epochs", "Cached tensors on disk"],
    ["models/", "Define every architecture, including all baselines", "Configuration", "Model objects with a common interface"],
    ["training/", "Run one training job for one fold", "Cached tensors, model, configuration", "Trained weights, training log"],
    ["evaluation/", "Run the LOSO loop, compute metrics, run statistical tests", "Trained weights, cached tensors", "Per-fold metrics, test results"],
    ["analysis/", "Produce every figure and table in the final report", "Per-fold metrics", "Figures and tables"],
    ["configs/", "Define each experiment as a file", "—", "YAML configuration files"],
    ["results/", "Store metrics, checkpoints and logs", "—", "Files under version control except checkpoints"],
  ],
  [1750, 3000, 2350, 2400], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 7.3 — Module responsibilities and interfaces."));

C.push(H2("7.4 What is fixed and what is learned"));
C.push(P("It is worth stating clearly which parts of the system have trainable parameters and which do not, because the distinction matters when the parameter count is compared against the baselines."));
C.push(SP(40));
C.push(table(
  ["Component", "Trainable?", "Note"],
  [
    ["Band-pass filter", "No", "Fixed fourth-order Butterworth, coefficients computed once"],
    ["Epoching and artefact rejection", "No", "Deterministic given the thresholds"],
    ["Euclidean alignment", "No", "One matrix per subject, computed from that subject's own unlabelled trials"],
    ["Standardisation", "No", "Statistics computed from the training subjects"],
    ["Convolutional block", "Yes", "3,424 parameters"],
    ["Windowed attention block", "Yes", "17,440 parameters including positional encoding"],
    ["Classifier", "Yes", "132 parameters"],
  ],
  [3200, 1600, 4700], { boldFirst: true, center: [1] }
));
C.push(CAP("Table 7.4 — Trainable and non-trainable components. Alignment reduces the difference between subjects without adding a single parameter, which is why it is applied in preprocessing rather than inside the network."));

BR();

// =====================================================================
// 8  DATASET
// =====================================================================
C.push(H1("8. Dataset Description"));

C.push(H2("8.1 Why this dataset was selected"));
C.push(P("Five public motor imagery datasets were considered. BCI Competition IV Dataset 2a was selected as the primary dataset for the reasons set out below."));
C.push(SP(40));
C.push(table(
  ["Dataset", "Subjects", "Channels", "Classes", "Assessment"],
  [
    ["BCI IV-2a", "9", "22", "4", "Selected. Used by all four surveyed papers, so reproduced baselines can be checked against published values. Four classes make the task non-trivial. Small enough to run full leave-one-subject-out within the available time"],
    ["BCI IV-2b", "9", "3", "2", "Only three electrodes and two classes. Useful as a secondary check but too easy to serve as the main task. Listed under future scope"],
    ["High Gamma Dataset", "14", "128", "4", "More subjects and higher density, but 128 channels at 500 Hz makes preprocessing and training considerably heavier than the schedule allows"],
    ["PhysioNet Motor Movement/Imagery", "109", "64", "4", "Far more subjects, which would strengthen a cross-subject claim, but it is not used by any surveyed paper, so no baseline comparison is possible"],
    ["SEED", "15", "62", "3", "Excluded. This is an emotion recognition dataset with no motor imagery and no movement labels"],
  ],
  [2100, 1150, 1150, 1000, 4100], { boldFirst: true, center: [1, 2, 3], hi: [0], size: 17 }
));
C.push(CAP("Table 8.1 — Datasets considered, and the reason for the selection."));

C.push(H2("8.2 Dataset properties"));
C.push(SP(40));
C.push(table(
  ["Property", "Value"],
  [
    ["Dataset", "BCI Competition IV Dataset 2a"],
    ["Source", "Graz University of Technology, released for BCI Competition IV (2008)"],
    ["Number of subjects", "9, labelled A01 to A09"],
    ["EEG channels", "22, arranged over sensorimotor cortex"],
    ["Additional channels", "3 electrooculogram channels, used for artefact checking then discarded"],
    ["Motor imagery classes", "4 — left hand, right hand, both feet, tongue"],
    ["Sampling rate", "250 Hz"],
    ["Hardware band-pass", "0.5 to 100 Hz, with a 50 Hz notch applied at acquisition"],
    ["Sessions per subject", "2, recorded on different days"],
    ["Runs per session", "6"],
    ["Trials per run", "48 (12 per class)"],
    ["Trials per session", "288 (72 per class)"],
    ["Trials per subject", "576"],
    ["Total labelled trials", "5,184"],
    ["Class balance", "Exactly balanced by design"],
    ["Analysis window used here", "0.5 to 4.0 s after the cue, giving 875 samples per trial"],
  ],
  [3300, 6200], { boldFirst: true }
));
C.push(CAP("Table 8.2 — Properties of BCI Competition IV Dataset 2a."));

C.push(H2("8.3 Trial structure and timing"));
C.push(P("Each trial follows a fixed timing protocol. Understanding it matters because the choice of analysis window is determined by it."));
C.push(SP(40));
C.push(figure("fig/f_trial.png", 462));
C.push(CAP("Figure 8.1 — Timing of a single trial, and the position of the analysis window used in this project."));
C.push(P("A fixation cross appears at the start of the trial together with a short warning tone. At two seconds a visual cue in the form of an arrow indicates which movement to imagine, and remains on screen for 1.25 seconds. The subject performs the imagery until approximately six seconds, after which there is a short break of variable length."));
C.push(P("The analysis window is taken from 0.5 seconds after the cue to 4.0 seconds after the cue, which corresponds to 2.5 to 6.0 seconds in absolute trial time. The first half-second after the cue is excluded deliberately, because it contains the visual evoked response to the arrow rather than motor imagery, and a model that learned to classify the arrow direction from the visual response would appear to work while decoding nothing about movement intent. The window closes at six seconds because the imagery period ends there. The resulting window is 3.5 seconds, or 875 samples at 250 Hz."));

C.push(H2("8.4 The four motor imagery classes"));
C.push(P("The four classes are distinguished by the region of sensorimotor cortex that becomes active during imagery. Hand imagery produces activity on the opposite side of the head, foot imagery produces activity near the midline, and tongue imagery produces activity in the lower lateral region."));
C.push(SP(40));
C.push(figure("fig/f_classes.png", 464));
C.push(CAP("Figure 8.2 — The four motor imagery classes and the scalp regions associated with each. The maps are schematic and indicate expected locations rather than measured values."));

C.push(H2("8.5 Known characteristics and difficulties"));
C.push(BUL("Feet and tongue imagery are harder to separate than left and right hand imagery, because both produce activity near the midline rather than on opposite sides. Confusion between these two classes is expected and will be visible in the confusion matrix."));
C.push(BUL("Performance varies considerably between subjects. Some individuals produce clear, consistent sensorimotor rhythms while others do not, a phenomenon sometimes described as brain–computer interface illiteracy. This is a property of the subjects, not of the model, and it is the reason per-subject results are reported."));
C.push(BUL("The two sessions were recorded on different days, so electrode placement and impedance differ between them. A model trained on session one and tested on session two therefore faces a distribution shift even within the same subject."));
C.push(BUL("With 5,184 trials in total, the dataset is small by deep learning standards. Regularisation and augmentation are necessary rather than optional, and models with large parameter counts are at real risk of overfitting."));

C.push(H2("8.6 Implications for the experimental design"));
C.push(P("Three consequences follow directly from the properties above and shape the rest of this document. First, leave-one-subject-out evaluation on nine subjects produces nine folds, which is enough to report a mean and a standard deviation and to apply a paired statistical test, but not enough to treat any single fold as reliable on its own. Second, because the classes are exactly balanced, accuracy is a meaningful headline metric, although macro-averaged precision, recall and F1 are still reported so that a model which ignores a difficult class cannot hide behind the average. Third, because the dataset is small, the parameter budget for the proposed model is set deliberately low, and this constraint is treated as a design requirement rather than as something to be optimised away."));

BR();

// =====================================================================
// 9  PREPROCESSING
// =====================================================================
C.push(H1("9. Data Preprocessing"));
C.push(P("Preprocessing is applied identically to every model, so that any difference in results is attributable to the models rather than to differences in data handling. This section specifies each step exactly."));

C.push(H2("9.1 Step-by-step specification"));
C.push(SP(40));
C.push(table(
  ["#", "Operation", "Parameters", "Rationale"],
  [
    ["1", "Load and select channels", "Retain 22 EEG channels; discard 3 EOG channels after artefact checking", "The EOG channels are not inputs to the model but are useful for identifying contaminated trials"],
    ["2", "Band-pass filter", "4 to 38 Hz, fourth-order Butterworth, applied forward and backward", "Retains mu and beta rhythms; removes slow drift below 4 Hz and mains interference above 38 Hz. Applying the filter in both directions gives zero phase distortion, which preserves the temporal structure the attention stage relies on"],
    ["3", "Epoch", "0.5 to 4.0 s after cue, giving 875 samples", "Excludes the visual evoked response to the cue; ends as the imagery period ends"],
    ["4", "Artefact rejection", "Reject a trial if peak-to-peak amplitude exceeds 100 µV on any channel", "Removes trials dominated by eye blinks or movement. The rejection rate is recorded per subject and reported"],
    ["5", "Euclidean alignment", "Per subject and per session; see Section 9.2", "Reduces the difference between subjects before the network sees the data, at zero parameter cost"],
    ["6", "Standardisation", "Per channel, using the mean and standard deviation of the training subjects only", "Places all channels on a comparable scale without using information from the test subject"],
    ["7", "Augmentation", "Segmentation and reconstruction, training split only; see Section 9.3", "Increases the effective number of training trials on a small dataset"],
    ["8", "Cache", "Write tensors and labels to disk as compressed arrays", "Preprocessing runs once, not once per model, which is what makes the experiment schedule feasible"],
  ],
  [500, 2100, 3000, 3900], { boldFirst: true, center: [0], size: 17 }
));
C.push(CAP("Table 9.1 — Preprocessing specification. Every parameter is fixed here so that the pipeline can be implemented without further decisions."));

C.push(H2("9.2 Euclidean alignment in detail"));
C.push(P("Euclidean alignment is the step that does most of the work in reducing the difference between people, so it is worth setting out carefully what it does and why it works."));
C.push(P("Every EEG trial can be summarised by its spatial covariance matrix, a 22 by 22 table in which each entry records how strongly the signals at two electrodes vary together. This matrix captures how the underlying cortical sources are mixed on their way to the scalp. That mixing is determined by physical properties of the individual: the thickness and conductivity of the skull, the shape and folding of the cortex, and the exact position in which the electrode cap was placed. None of these has anything to do with which movement the person is imagining, yet all of them shape the recorded signal. This is the main reason a model trained on one group of people transfers poorly to a new person."));
C.push(P("The method proceeds in two steps. First, the covariance matrix of every trial belonging to one subject is computed and the average is taken. This average describes the typical way that subject's signals are mixed across electrodes, with the class-specific detail averaged out, because each class contributes roughly equally to the set. Second, every trial from that subject is multiplied by the inverse square root of that average matrix. The effect is that of a whitening transform: after it is applied, the average covariance of the subject's trials becomes the identity matrix."));
C.push(P("The consequence is that all subjects arrive at the network sharing the same average spatial statistics. A model no longer has to spend capacity learning that one person's signals are generally larger at one electrode, or that two electrodes happen to be more correlated in one individual than another. What remains, and what the model is then free to learn, is the variation around that common average, which is where the class-discriminating information lives."));
C.push(P("The inverse square root is computed through a symmetric eigendecomposition. The average covariance matrix is decomposed into eigenvectors and eigenvalues, each eigenvalue is raised to the power of minus one half, and the matrix is reassembled. One practical precaution is required: if two electrodes are nearly identical, for example because a channel was flat or duplicated, an eigenvalue can be extremely close to zero, and raising it to a negative power would produce a very large number that dominates the result. Small eigenvalues are therefore clamped to a small positive floor before the inverse is taken."));
C.push(P("Two properties make this step particularly suitable for the present project. It is unsupervised, meaning it uses only the trials themselves and never their labels, so it can be applied to a new user who has not yet provided any labelled data at all. It also introduces no trainable parameters: the entire cost is one eigendecomposition of a 22 by 22 matrix per subject, which is negligible compared with a single forward pass of the network. It therefore improves cross-subject behaviour without working against the requirement that the model stay small."));
C.push(P("Correctness is verified numerically rather than assumed. After alignment, the average covariance of each subject's trials is recomputed and compared against the identity matrix. If the two agree within a small tolerance, the implementation is behaving as intended. This check is written as a unit test and is the completion criterion for milestone M2 in Section 19."));

C.push(H2("9.3 Data augmentation"));
C.push(P("With 5,184 labelled trials in total, and roughly 4,032 available for training in any single fold, the dataset is small relative to the capacity of even a modest neural network. Augmentation is therefore a necessity rather than a refinement. The scheme used here is segmentation and reconstruction, following the procedure adopted by EEG Conformer and CTNet."));
C.push(P("The idea is straightforward. Each trial is divided into a fixed number of equal intervals along the time axis; eight is used as the starting value. A new, synthetic trial is then assembled by taking the first interval from one real trial, the second interval from another, the third from a third, and so on, with every donor drawn from the pool of trials carrying the same class label. The result is a trial that never occurred in the recording session but which is composed entirely of genuine EEG belonging to that class."));
C.push(P("The assumption underlying the method is that, within the analysis window, sub-intervals of trials of the same class are broadly interchangeable. This is reasonable for motor imagery, because the person is engaged in a sustained mental task throughout the window rather than producing a brief transient event, so any part of the interval carries the same kind of information. The recombination preserves the spatial structure of the signal exactly, since every interval retains all 22 channels together, and it preserves the spectral character of each interval. What it disrupts is the continuity of the signal at the boundaries between intervals, and the long-range temporal relationship between distant parts of a trial."));
C.push(P("That disruption is the reason the number of segments matters. Dividing a trial into a small number of long intervals produces synthetic trials that stay close to real ones but adds little variety. Dividing it into many short intervals produces far more variety but leaves a signal that is discontinuous at every boundary and no longer resembles a genuine recording. Eight intervals, each roughly 0.44 seconds long, is the compromise the surveyed papers settle on, and it will be confirmed on the validation subject rather than tuned on the test subject."));
C.push(P("Augmentation is applied to the training split only. Validation and test trials are always genuine recordings, because the purpose of those splits is to estimate performance on real data as a new user would supply it."));

C.push(H2("9.4 Preventing information leakage"));
C.push(SP(40));
C.push(note("Leakage rules, applied without exception", [
  "Normalisation statistics are computed from the training subjects only, never from the validation or test subject.",
  "Augmentation is applied to the training split only.",
  "Hyperparameters, including the early stopping point, are selected using the validation subject only.",
  "The test subject contributes unlabelled trials to the Euclidean alignment step and nothing else. This is the same information a real deployment would have, since a new user can record unlabelled data before any labels exist.",
  "Any departure from these rules invalidates the cross-subject result, and would need to be reported as a limitation rather than corrected silently."
]));

BR();

module.exports = { C, BR };
