const K = require('./doc3_part1.js');
const { C, BR } = require('./doc3.js');
require('./doc3_part2.js');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak, LevelFormat, PageNumber, Footer, fs,
  CW, NAVY, NAVYD, PURPLE, GREY, CARD, TINT,
  H1, H2, H3, P, BUL, NUMI, CAP, SP, figure, table, note, code
} = K;

// =====================================================================
// 14  LOSO
// =====================================================================
C.push(H1("14. Cross-Subject Evaluation using Leave-One-Subject-Out"));
C.push(P("Leave-one-subject-out cross-validation is the evaluation protocol used throughout this project. In each fold, one subject is removed entirely from the training data and is used only for testing. This directly measures what a new user would experience."));
C.push(SP(40));
C.push(figure("fig/f_loso_concept.png", 468));
C.push(CAP("Figure 14.1 — The leave-one-subject-out concept. The model is trained on a group of subjects and evaluated on a subject it has never seen."));
C.push(P("With nine subjects the procedure produces nine folds. In each fold, seven subjects are used for training, one is held out for validation and one is held out for testing. The reported figure is the mean and standard deviation across the nine folds."));
C.push(SP(40));
C.push(figure("fig/f_loso_folds.png", 400));
C.push(CAP("Figure 14.2 — Fold structure. Every subject serves as the test subject exactly once, and a separate subject is used for validation in each fold."));

C.push(H2("14.1 Why a validation subject rather than a validation split"));
C.push(P("A separate validation subject is used rather than a random split of the training subjects' trials. If validation trials came from subjects who also appear in the training set, the early stopping point and any tuned hyperparameter would be chosen to favour within-subject fit, which is exactly the behaviour the protocol is intended to avoid. Holding out a whole subject costs one subject's worth of training data in each fold, and that cost is accepted deliberately."));

C.push(H2("14.2 The within-subject reference protocol"));
C.push(P("For reference, each model is also trained and tested within subject, using session one for training and session two for testing. This is not a headline result. Its purpose is to check the pipeline: if the reproduced within-subject accuracy of a baseline differs substantially from the published value, then something in the implementation or preprocessing is wrong, and the cross-subject figures cannot be trusted either. Both protocols are reported so that the difference between them can be quantified for every model, which is itself informative."));

BR();

// =====================================================================
// 15  BASELINES
// =====================================================================
C.push(H1("15. Baseline Models"));
C.push(P("Four baselines are implemented, corresponding to the four papers in the literature survey. A classical method is also included, because deep learning is not automatically superior on datasets of this size, and a deep model that cannot beat filter-bank common spatial patterns would not justify its complexity."));
C.push(SP(40));
C.push(table(
  ["Model", "Architecture type", "Key idea", "Parameters, 875 samples", "Parameters, 1,125 samples"],
  [
    ["EEGNet (2018)", "Compact CNN", "Depthwise and separable convolution", "3,188", "3,700"],
    ["ATCNet (2023)", "CNN with attention and TCN", "Sliding-window attention over temporal features", "113,732", "113,732"],
    ["EEG Conformer (2023)", "CNN with Transformer", "Convolution followed by global self-attention", "697,412", "871,492"],
    ["CTNet (2024)", "CNN with Transformer", "EEGNet front end with a six-layer encoder", "152,364", "153,004"],
    ["FBCSP with LDA", "Classical", "Filter-bank common spatial patterns", "Not applicable", "Not applicable"],
    ["HCT-Net (proposed)", "CNN with windowed attention", "Combination of the components above", "20,996", "—"],
  ],
  [1900, 1900, 2600, 1550, 1550], { boldFirst: true, center: [3, 4], hi: [5], size: 17 }
));
C.push(CAP("Table 15.1 — Baseline models and the proposed model. Parameter counts are for 22 channels and four classes, from the braindecode 1.8.1 reference implementations, at this project's 875-sample input and at the 1,125-sample input of the ATCNet reference implementation. The 2,548 often quoted for EEGNet corresponds to a window of about 2.2 s. Published accuracies are given separately, in Table 15.2 for cross-subject evaluation and Table 15.3 for within-subject evaluation, because they come from different protocols."));
C.push(SP(40));
C.push(table(
  ["Model", "A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "Mean ± std", "Kappa"],
  [
    ["ShallowConvNet+", "66.84", "46.53", "67.53", "52.26", "34.38", "39.76", "65.45", "71.18", "66.84", "56.75 ± 13.77", "0.4234"],
    ["DeepConvNet+", "68.58", "47.40", "78.99", "52.26", "50.87", "41.84", "69.44", "71.70", "60.24", "60.15 ± 12.71", "0.4686"],
    ["EEGNet+", "69.79", "42.01", "79.51", "50.87", "35.76", "37.15", "65.80", "67.36", "63.37", "56.85 ± 15.82", "0.4246"],
    ["EEG Conformer+", "68.75", "37.33", "69.62", "43.58", "29.51", "35.24", "58.33", "74.48", "63.89", "53.41 ± 17.08", "0.3789"],
    ["CTNet", "69.27", "43.92", "79.34", "55.38", "43.92", "36.11", "65.10", "70.66", "64.06", "58.64 ± 14.61", "0.4486"],
  ],
  [1500, 600, 600, 600, 600, 600, 600, 600, 600, 600, 1500, 1100],
  { boldFirst: true, center: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 15 }
));
C.push(CAP("Table 15.2 — Cross-subject reference: leave-one-subject-out accuracy (%) on BCI IV-2a as reported by Zhao et al. (2024), the CTNet paper. Each subject is held out in turn and the model is trained on the data of the other eight, for 600 epochs with batch size 512 and learning rate 0.001, on the 2–6 s window (1,000 samples) with z-score normalisation and no alignment; the held-out subject is used only for testing, with no fine-tuning. Models marked + were re-implemented by the CTNet authors under the same conditions. This is the only published comparison of these architectures under one cross-subject protocol that could be verified, and it is the reference for this project's cross-subject results."));
C.push(SP(40));
C.push(table(
  ["Model", "Accuracy", "Source", "Evaluation behind the figure"],
  [
    ["CTNet", "82.52%", "Zhao et al. (2024)", "Session 1 trains, session 2 tests; 30% of the training data held out for validation; 1,000 epochs"],
    ["EEG Conformer", "78.66%", "Song et al. (2023), authors' code repository", "Hold-out, as stated in the repository"],
    ["ATCNet", "85.38%", "Altaheri et al. (2023), paper", "Subject-dependent, as stated in the paper's abstract"],
    ["ATCNet", "81.10%", "ATCNet authors' code repository", "Train–validation–test script: session 1 trains, session 2 tests"],
    ["EEGNet", "68.67%", "ATCNet authors' code repository", "The same train–validation–test script as the 81.10% ATCNet figure"],
    ["EEGNet+", "77.39%", "Zhao et al. (2024), re-implemented", "The CTNet paper's subject-specific protocol, as for CTNet above"],
    ["EEG Conformer+", "77.66%", "Zhao et al. (2024), re-implemented", "The CTNet paper's subject-specific protocol, as for CTNet above"],
    ["FBCSP with LDA", "Approximately 68%", "BCI Competition IV results (Ang et al.)", "Competition protocol, session 1 trains, session 2 tests; not re-checked in the 2026 audit"],
  ],
  [1700, 1300, 2700, 3800], { boldFirst: true, center: [1], size: 16 }
));
C.push(CAP("Table 15.3 — Published within-subject accuracies on BCI IV-2a, with the source and the evaluation behind each. These figures come from different protocols and are comparable neither with each other nor with the cross-subject results in Table 15.2. An EEGNet figure of 71.50% that appeared in an earlier version of this table has been removed because no source for it could be verified."));
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
  [1700, 2700, 2500, 2600], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 15.4 — Strengths, limitations, and the purpose each baseline serves in this project."));
C.push(SP(40));
C.push(note("Why the published figures cannot simply be ranked", [
  "The within-subject accuracies in Table 15.3 were obtained under different evaluation protocols and cannot be ranked against one another. The same model on the same dataset differs by several points depending on who evaluated it: EEGNet is 68.67 per cent in the ATCNet repository's evaluation and 77.39 per cent in the CTNet paper's re-implementation.",
  "Cross-subject figures are scarcer. Table 15.2 is the only published comparison of these architectures under one leave-one-subject-out protocol that could be verified, and it serves as the reference for this project's cross-subject results. This project's own protocol differs from it in stated ways — seven training subjects plus a separate validation subject, early stopping, a 3.5 s window and Euclidean alignment — so the comparison is indicative rather than exact.",
  "Re-implementing all four under one identical leave-one-subject-out protocol is therefore a necessary part of this project, and the resulting comparison is useful independently of how the proposed model performs."
]));

BR();

// =====================================================================
// 16  METRICS
// =====================================================================
C.push(H1("16. Evaluation Metrics"));
C.push(SP(40));
C.push(table(
  ["Metric", "Definition", "Why it is used"],
  [
    ["Accuracy", "Proportion of trials classified correctly", "The headline measure, reported as a mean and standard deviation across the nine folds. Meaningful here because the classes are exactly balanced"],
    ["Cohen's kappa", "Agreement corrected for the agreement expected by chance", "Standard in brain–computer interface research and directly comparable with published work. For a balanced four-class task, kappa of 0 corresponds to chance and 1 to perfect agreement"],
    ["Precision (macro)", "Of the trials predicted as a class, the proportion that belong to it, averaged over classes", "Shows whether a class is being over-predicted"],
    ["Recall (macro)", "Of the trials belonging to a class, the proportion correctly identified, averaged over classes", "Shows whether a class is being missed"],
    ["F1-score (macro)", "Harmonic mean of precision and recall, averaged over classes", "Summarises per-class balance in a single number, so a model that ignores a hard class cannot hide behind the average"],
    ["Confusion matrix", "Counts of predicted against true classes", "Identifies which classes are confused; feet and tongue are a known difficult pair for the reason given in Section 8.5"],
    ["Parameter count", "Number of trainable parameters", "Required for the comparison of model complexity, and for checking the budget in Table 11.3"],
    ["Training time per fold", "Wall-clock time for one training run", "Determines whether the experiment schedule is feasible"],
    ["Inference time per trial", "Wall-clock time for a single forward pass", "Relevant to whether the model could run in a real-time setting"],
    ["Wilcoxon signed-rank test", "Paired non-parametric test across the nine subjects", "Determines whether a difference between two models is statistically meaningful rather than fold-to-fold variation"],
  ],
  [2300, 3500, 3700], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 16.1 — Evaluation metrics. Statistical tests are applied at a significance level of 0.05."));
C.push(P("Results are reported for each subject individually as well as averaged. This matters because cross-subject decoders often fail badly on one or two particular subjects, a phenomenon sometimes described as brain–computer interface illiteracy. A model with a slightly lower mean accuracy but a smaller spread across subjects may be preferable in practice, and this distinction is invisible if only the average is reported."));

BR();

// =====================================================================
// 17  EXPERIMENTAL PLAN
// =====================================================================
C.push(H1("17. Experimental Plan"));

C.push(H2("17.1 Variables and controls"));
C.push(P("Stating what varies and what is held constant makes it possible to attribute any observed difference to a cause. In this project the independent variable is the model, and everything else is held fixed."));
C.push(SP(40));
C.push(table(
  ["Role", "Item", "Treatment"],
  [
    ["Independent variable", "Model architecture", "Varied: six models plus five component-study variants"],
    ["Independent variable", "Encoder depth (experiment E5 only)", "Varied: 2 layers against 6"],
    ["Dependent variables", "Accuracy, kappa, precision, recall, F1, parameters, time", "Measured on every fold"],
    ["Controlled", "Dataset and preprocessing", "Identical cached tensors for every model"],
    ["Controlled", "Fold membership", "The same nine train / validation / test splits for every model"],
    ["Controlled", "Optimiser, schedule, batch size, stopping rule", "Identical, as specified in Table 13.1"],
    ["Controlled", "Random seeds", "The same three seeds for every configuration"],
    ["Nuisance", "Subject-to-subject variation in signal quality", "Handled by pairing: the Wilcoxon test compares models on the same subjects"],
    ["Nuisance", "GPU non-determinism", "Reduced by seeding; residual effect quantified by the three-seed average"],
  ],
  [2100, 3600, 3800], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 17.1 — Variables and controls."));

C.push(H2("17.2 Experiment definitions"));
C.push(SP(40));
C.push(table(
  ["ID", "Experiment", "Configuration", "Purpose", "Runs"],
  [
    ["E1", "Baseline reproduction", "Each baseline, within subject, session 1 to session 2", "Confirm the implementations are correct before cross-subject results are trusted", "5 × 9 = 45"],
    ["E2", "Cross-subject baselines", "Each baseline under leave-one-subject-out", "Establish a fair comparison under one protocol", "5 × 9 = 45"],
    ["E3", "Proposed model", "HCT-Net under leave-one-subject-out", "Measure cross-subject performance of the proposed model", "9"],
    ["E4", "Component study", "Five variants, each removing one component", "Identify which parts contribute to cross-subject performance", "5 × 9 = 45"],
    ["E5", "Attention depth", "Two encoder layers compared with six", "Test the claim made in Section 11.6", "9"],
    ["E6", "Complexity comparison", "Parameter count, training and inference time", "Support the claim that the proposed model is comparatively lightweight", "Measured during E2 and E3"],
  ],
  [550, 2000, 2600, 2900, 1450], { boldFirst: true, center: [0, 4], size: 17 }
));
C.push(CAP("Table 17.2 — Planned experiments. The total is approximately 153 training runs."));
C.push(SP(40));
C.push(table(
  ["Variant", "Convolution", "Windowed attention", "Euclidean alignment", "Augmentation"],
  [
    ["V0 — full model", "Yes", "Yes", "Yes", "Yes"],
    ["V1 — no attention", "Yes", "Removed", "Yes", "Yes"],
    ["V2 — global attention", "Yes", "Replaced by global", "Yes", "Yes"],
    ["V3 — no alignment", "Yes", "Yes", "Removed", "Yes"],
    ["V4 — no augmentation", "Yes", "Yes", "Yes", "Removed"],
    ["V5 — convolution only", "Yes", "Removed", "Removed", "Removed"],
  ],
  [2500, 1700, 2100, 1800, 1400], { boldFirst: true, center: [1, 2, 3, 4], hi: [0], size: 17 }
));
C.push(CAP("Table 17.3 — Component study configurations. Comparing V0 with V1 isolates the contribution of attention; V0 with V3 isolates alignment; V0 with V5 gives the total contribution of everything added to the convolutional core."));

C.push(H2("17.3 Result reporting templates"));
C.push(P("The tables that the experiments will fill in are defined now, before any result exists. Fixing the reporting format in advance means the results cannot be presented selectively after the fact."));
C.push(SP(40));
C.push(table(
  ["Model", "A01", "A02", "…", "A09", "Mean", "Std", "Kappa", "p vs. proposed"],
  [
    ["FBCSP + LDA", "—", "—", "—", "—", "—", "—", "—", "—"],
    ["EEGNet", "—", "—", "—", "—", "—", "—", "—", "—"],
    ["ATCNet", "—", "—", "—", "—", "—", "—", "—", "—"],
    ["EEG Conformer", "—", "—", "—", "—", "—", "—", "—", "—"],
    ["CTNet", "—", "—", "—", "—", "—", "—", "—", "—"],
    ["HCT-Net", "—", "—", "—", "—", "—", "—", "—", "—"],
  ],
  [1900, 850, 850, 700, 850, 900, 800, 900, 1750],
  { boldFirst: true, center: [1, 2, 3, 4, 5, 6, 7, 8], hi: [5], size: 16 }
));
C.push(CAP("Template 17.1 — Cross-subject accuracy per subject. This is the principal results table for the 2nd Review."));
C.push(SP(40));
C.push(table(
  ["Model", "Accuracy", "Kappa", "Precision", "Recall", "F1", "Parameters", "Train time / fold"],
  [
    ["EEGNet", "—", "—", "—", "—", "—", "3,188", "—"],
    ["ATCNet", "—", "—", "—", "—", "—", "113,732", "—"],
    ["EEG Conformer", "—", "—", "—", "—", "—", "697,412", "—"],
    ["CTNet", "—", "—", "—", "—", "—", "152,364", "—"],
    ["HCT-Net", "—", "—", "—", "—", "—", "20,996", "—"],
  ],
  [1900, 1150, 900, 1150, 1000, 800, 1400, 1200],
  { boldFirst: true, center: [1, 2, 3, 4, 5, 6, 7], hi: [4], size: 16 }
));
C.push(CAP("Template 17.2 — Summary of metrics and cost. The parameter column is already known (braindecode 1.8.1 reference implementations at this project's 875-sample input) and is filled in; everything else is measured."));
C.push(SP(40));
C.push(table(
  ["Variant", "Mean accuracy", "Change from V0", "Significant?", "Interpretation"],
  [
    ["V0 — full model", "—", "reference", "—", "—"],
    ["V1 — no attention", "—", "—", "—", "—"],
    ["V2 — global attention", "—", "—", "—", "—"],
    ["V3 — no alignment", "—", "—", "—", "—"],
    ["V4 — no augmentation", "—", "—", "—", "—"],
    ["V5 — convolution only", "—", "—", "—", "—"],
  ],
  [2400, 1700, 1700, 1500, 2200], { boldFirst: true, center: [1, 2, 3], hi: [0], size: 17 }
));
C.push(CAP("Template 17.3 — Component study. The interpretation column is written after the numbers are in, not before."));

C.push(H2("17.4 Statistical procedure"));
C.push(NUMI("For each pair of models, collect the nine paired per-subject accuracies.", 3));
C.push(NUMI("Apply the Wilcoxon signed-rank test to the paired differences, two-sided, at a significance level of 0.05.", 3));
C.push(NUMI("Where the proposed model is compared against all five baselines, apply a Holm–Bonferroni correction across the five comparisons and report both the corrected and uncorrected values.", 3));
C.push(NUMI("Report the effect size alongside the p-value, since with nine samples a non-significant result may still indicate a practically meaningful difference, and a significant one may not.", 3));
C.push(NUMI("State explicitly when a comparison is inconclusive rather than describing it as a trend.", 3));

BR();

// =====================================================================
// 18  TOOLS AND ENVIRONMENT
// =====================================================================
C.push(H1("18. Tools, Frameworks and Environment"));

C.push(H2("18.1 Software stack"));
C.push(SP(40));
C.push(table(
  ["Category", "Tool and version", "Purpose"],
  [
    ["Language", "Python 3.10", "All implementation"],
    ["Deep learning", "PyTorch 2.x with CUDA", "Model definition, automatic differentiation, training"],
    ["EEG processing", "MNE-Python 1.6 or later", "Loading, filtering, epoching, topographic plotting"],
    ["Dataset access", "MOABB 1.0 or later", "Programmatic download and standard dataset handling"],
    ["Reference models", "Braindecode 0.8 or later", "Validated implementations of EEGNet, ShallowConvNet and related models"],
    ["Classical baseline", "scikit-learn 1.4, pyRiemann 0.6", "Filter-bank common spatial patterns with linear discriminant analysis"],
    ["Numerical computing", "NumPy 1.26, SciPy 1.11", "Filtering, alignment matrices, statistical tests"],
    ["Visualisation", "Matplotlib 3.8, Seaborn 0.13", "Figures, confusion matrices, topographic maps"],
    ["Experiment tracking", "TensorBoard, or Weights and Biases", "Logging approximately 153 runs with per-fold metrics"],
    ["Configuration", "PyYAML", "One configuration file per experiment"],
    ["Version control", "Git with GitHub", "Code, configuration files and result tables"],
  ],
  [2300, 3100, 4100], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 18.1 — Software stack. Versions are recorded so that the environment can be reconstructed."));
C.push(P("Published reference implementations are used for the baselines wherever they are available. If a baseline were re-implemented from scratch and failed to reproduce its published accuracy, it would not be possible to distinguish an implementation error from a genuine difference in evaluation, and there is not enough time in Phase 3 to resolve such a question for four architectures."));

C.push(H2("18.2 Environment setup"));
C.push(SP(30));
C.push(code("Reproducible environment", [
  "# create and activate an isolated environment",
  "python3.10 -m venv .venv",
  "source .venv/bin/activate",
  "",
  "# core scientific stack",
  "pip install numpy==1.26.* scipy==1.11.* pandas matplotlib seaborn",
  "",
  "# deep learning (CUDA build selected to match the driver)",
  "pip install torch torchvision --index-url \\",
  "    https://download.pytorch.org/whl/cu121",
  "",
  "# EEG-specific",
  "pip install mne moabb braindecode pyriemann scikit-learn",
  "",
  "# tracking and configuration",
  "pip install tensorboard pyyaml",
  "",
  "# freeze for reproducibility",
  "pip freeze > requirements.lock",
]));
C.push(P("The locked requirements file is committed to the repository, so that the exact environment can be recreated. On hosted services such as Colab or Kaggle, the same file is used to install the environment at the start of each session."));

C.push(H2("18.3 Repository structure"));
C.push(SP(30));
C.push(code("Project layout", [
  "mi-eeg-cross-subject/",
  "|-- configs/               one YAML file per experiment",
  "|   |-- e1_reproduction.yaml",
  "|   |-- e2_baselines_loso.yaml",
  "|   |-- e3_hctnet_loso.yaml",
  "|   |-- e4_component_study.yaml",
  "|   '-- e5_attention_depth.yaml",
  "|-- data/",
  "|   |-- loaders.py         dataset download and channel selection",
  "|   '-- splits.py          LOSO fold definitions",
  "|-- preprocessing/",
  "|   |-- filters.py         band-pass, epoching, rejection, scaling",
  "|   |-- align.py           Euclidean alignment (Section 9.2)",
  "|   '-- augment.py         segmentation and reconstruction",
  "|-- models/",
  "|   |-- eegnet.py  atcnet.py  ctnet.py  conformer.py",
  "|   |-- fbcsp.py",
  "|   '-- hctnet.py          the proposed model (Section 11)",
  "|-- training/",
  "|   |-- trainer.py         one fold, one model (Section 12.6)",
  "|   '-- schedules.py",
  "|-- evaluation/",
  "|   |-- loso.py            the LOSO loop (Section 12.7)",
  "|   |-- metrics.py         accuracy, kappa, precision, recall, F1",
  "|   '-- stats.py           Wilcoxon, Holm-Bonferroni",
  "|-- analysis/",
  "|   |-- figures.py",
  "|   '-- tables.py",
  "|-- results/               per-fold metrics, logs (checkpoints ignored)",
  "|-- tests/                 shape assertions, alignment check",
  "|-- requirements.lock",
  "'-- README.md",
]));

C.push(H2("18.4 Reproducibility measures"));
C.push(BUL("Every experiment is defined by a YAML configuration file committed to the repository, so any reported number can be regenerated by pointing the runner at its configuration."));
C.push(BUL("Every run records its seeds, the git commit hash, and the environment lock file alongside its results."));
C.push(BUL("Preprocessed tensors are cached with a hash of the preprocessing configuration in the filename, so a change to preprocessing cannot silently reuse stale data."));
C.push(BUL("Checkpoints are written every epoch to persistent storage, so an interrupted session costs one epoch rather than one fold."));
C.push(BUL("Unit tests cover the tensor shapes of every model and the alignment check described in Section 9.2; these run before any experiment."));

BR();

module.exports = {};
