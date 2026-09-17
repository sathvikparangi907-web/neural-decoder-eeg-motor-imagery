const K = require('./doc3_part1.js');
const { C, BR } = require('./doc3.js');
require('./doc3_part2.js');
require('./doc3_part3.js');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak, LevelFormat, PageNumber, Footer, fs,
  CW, NAVY, NAVYD, PURPLE, GREY, CARD, TINT,
  H1, H2, H3, P, BUL, NUMI, CAP, SP, figure, table, note, code
} = K;

// =====================================================================
// 19  IMPLEMENTATION PLAN — principal section
// =====================================================================
C.push(H1("19. Implementation Plan and Milestones"));
C.push(P("Phase 3 provides an eighteen-day implementation window. This section sets out the order in which the work is carried out, the reasoning behind that order, and the milestones that mark progress through it. Each milestone carries a completion criterion that can be checked objectively, so that progress is assessed against evidence rather than impression."));

C.push(H2("19.1 Sequencing logic"));
C.push(P("The plan is front-loaded deliberately. The data pipeline and the baselines are built and verified before the proposed model is written. The reason is that a result produced by a new model running on an unverified pipeline cannot be interpreted: if the accuracy is low, there is no way to tell whether the model is weak or the data are being handled incorrectly, and diagnosing that late in the window would leave no time to fix it."));
C.push(P("A second consideration shapes the order. The stages differ greatly in how much they can be compressed if they run late. Writing code can be accelerated by working longer hours; training runs cannot, because they take as long as they take. The work is therefore arranged so that the compute-bound stages fall towards the end of the window with as few unresolved questions in front of them as possible, and so that the implementation stages, which are the ones that can absorb pressure, come first."));
C.push(P("Three ordering rules follow from this and are not negotiable during Phase 3."));
C.push(NUMI("No model is trained on cached data until the alignment check described in Section 9.2 passes and the exploratory analyses in Table 10.1 match their expectations.", 4));
C.push(NUMI("The proposed model is not written until at least two baselines reproduce their published within-subject accuracy.", 4));
C.push(NUMI("No leave-one-subject-out experiment begins until the fold definitions have been checked, because an error there would invalidate every run that follows it.", 4));
C.push(P("A useful property of this arrangement is that implementing the proposed model does not depend on the baselines being finished. It depends only on the preprocessing being complete, so the model can be written and unit-tested while baseline training runs are still occupying the GPU. This overlap is the main source of slack in an otherwise tight schedule."));

C.push(H2("19.2 Timeline"));
C.push(SP(30));
C.push(figure("fig/f_timeline.png", 450));
C.push(CAP("Figure 19.1 — Sequence and relative duration of the implementation stages across the eighteen-day window."));

C.push(H2("19.3 Milestone specification"));
C.push(P("Eight milestones are defined. Each is expressed as a condition that is either satisfied or not, rather than as an amount of work done, so that a milestone cannot be recorded as complete while an unresolved problem remains inside it."));
C.push(SP(40));
C.push(table(
  ["ID", "Milestone", "Definition of done"],
  [
    ["M1", "Dataset prepared and verified", "All nine subjects load successfully; trial counts, class balance, channel count and sampling rate match Table 8.2; the exploratory figures have been produced and reviewed against the expectations in Table 10.1"],
    ["M2", "Preprocessing pipeline complete", "Filtering, epoching, artefact rejection, alignment and caching are implemented; the average spatial covariance after alignment matches the identity matrix within tolerance; the rejection rate is recorded for each subject; cached tensors are written once and reused thereafter"],
    ["M3", "Baselines implemented and reproduced", "All five baselines run end to end; within-subject accuracy falls within roughly three percentage points of the published values, or any difference is documented with an explanation"],
    ["M4", "Proposed model implemented", "Tensor shapes match Table 11.2 at every layer; the parameter count is within five per cent of 20,996; the model reaches near-zero loss when deliberately overfitted on a single batch"],
    ["M5", "Training configuration fixed", "Hyperparameters have been chosen using the validation subject only; configuration files are committed; a smoke test across two folds completes without error; checkpointing is confirmed to resume correctly"],
    ["M6", "Cross-subject experiments complete", "Experiments E2 and E3 are finished for every model across all nine folds with three seeds each; per-fold metrics are written to the results directory"],
    ["M7", "Component study and analysis complete", "Experiments E4 and E5 are finished; metrics, confusion matrices and statistical tests are computed; the reporting templates in Section 17.3 are populated"],
    ["M8", "Report ready for the 2nd Review", "All tables and figures are produced; the findings are written up including any negative or inconclusive result; the repository is tidy and documented"],
  ],
  [500, 2500, 6500], { boldFirst: true, center: [0], size: 17 }
));
C.push(CAP("Table 19.1 — Milestones and their completion criteria."));
C.push(P("The milestones are not of equal size. M1 and M2 are short but block everything that follows, so a delay there is the most expensive kind. M3 is the longest implementation block and also the one most likely to reveal an unexpected problem, since reproducing four published architectures is where discrepancies surface. M6 is the longest block of compute and has the least flexibility, because the number of runs is fixed by the experimental design rather than by choice."));

BR();

// =====================================================================
// 20  EXPECTED OUTCOMES
// =====================================================================
C.push(H1("20. Expected Outcomes"));
C.push(P("The following are the outcomes the project is designed to produce. They are stated as expectations. No experiments have been conducted at the time of writing, and none of these statements should be read as a result."));
C.push(SP(40));
C.push(table(
  ["Expected outcome", "How it will be assessed"],
  [
    ["A working implementation of five baseline models and the proposed model under one common pipeline", "Code in a version-controlled repository with recorded configurations"],
    ["A fair comparison of all models under one identical leave-one-subject-out protocol", "Template 17.1, with per-subject and averaged figures"],
    ["Cross-subject accuracy from the proposed model that is competitive with the baselines", "Mean accuracy and Cohen's kappa across nine folds, with a paired statistical test"],
    ["A parameter count lower than the attention-based baselines", "Direct measurement against the calculation in Table 11.3"],
    ["Evidence of which components affect cross-subject performance", "Template 17.3, from the component study"],
    ["A clear statement of whether the proposed combination helps", "Reported whether the outcome is positive, negative or inconclusive"],
  ],
  [4700, 4800], { boldFirst: true }
));
C.push(CAP("Table 20.1 — Expected outcomes and how each will be assessed."));
C.push(P("It is possible that the proposed model will not outperform the baselines under cross-subject evaluation. If that occurs, the component study will still indicate which parts of the design were responsible, and that finding is a legitimate contribution. The project is structured so that a negative result remains informative, which is why the component study is treated as a core experiment rather than an optional extension."));

// =====================================================================
// 21  CHALLENGES
// =====================================================================
C.push(H1("21. Possible Challenges and Solutions"));
C.push(SP(40));
C.push(table(
  ["Challenge", "Why it may occur", "Planned response"],
  [
    ["Limited training data", "5,184 trials in total, of which roughly 4,032 are available for training in any fold", "Augmentation, dropout, weight constraints, early stopping, and a deliberately small model"],
    ["Overfitting to training subjects", "The model can fit subject-specific detail that does not transfer", "Validation on a held-out subject rather than a random trial split; capacity limited by design"],
    ["Baselines not reproducing published accuracy", "Differences in preprocessing or evaluation protocol between papers", "Use published reference implementations; report both reproduced and published figures and explain the difference"],
    ["High variance across folds", "Only nine subjects, some of whom produce weak sensorimotor rhythms", "Report per-subject results and standard deviation; use a paired test rather than comparing means alone"],
    ["Training time exceeding available GPU hours", "Approximately 153 runs across all experiments", "Cache preprocessed tensors, use mixed precision, reduce the maximum epoch count, and checkpoint every epoch so that an interruption costs one epoch rather than one fold"],
    ["Session interruptions on hosted GPU services", "Time limits on free tiers", "Checkpoint to persistent storage so an interruption costs one epoch rather than one fold"],
    ["The proposed model does not improve on the baselines", "The combination may not help on this dataset", "Report the result honestly and use the component study to explain it"],
    ["Attention stage unstable during training", "Small model dimension and a short sequence can make attention weights collapse", "Monitor attention entropy during the smoke test; fall back to a single encoder layer if instability is observed, and record the change"],
  ],
  [2500, 3200, 3800], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 21.1 — Anticipated challenges and the response decided in advance for each."));

// =====================================================================
// 22  NOVELTY
// =====================================================================
C.push(H1("22. Novelty and Expected Contribution"));
C.push(P("This section states what is new in the project and what is not, so that the contribution is not overstated."));
C.push(H2("22.1 What is not new"));
C.push(P("The individual components of the proposed model are all taken from published work. Depthwise and separable convolution come from EEGNet, sliding-window attention comes from ATCNet, the arrangement of convolution followed by a Transformer encoder comes from CTNet and EEG Conformer, Euclidean alignment comes from the transfer learning literature, and segmentation-and-reconstruction augmentation comes from EEG Conformer and CTNet. Leave-one-subject-out evaluation is a standard protocol. None of these is presented as an original contribution."));
C.push(H2("22.2 What the project contributes"));
C.push(BUL("A comparison of EEGNet, ATCNet, CTNet and EEG Conformer under one identical subject-independent protocol. The published figures for these models were obtained under different evaluation settings and cannot be ranked against one another as they stand."));
C.push(BUL("A specific lightweight combination of these components, at 20,996 parameters, with the attention depth reduced to suit the size of the dataset, and evaluated for cross-subject rather than within-subject performance."));
C.push(BUL("A component study that measures how much each part of the combination contributes to cross-subject accuracy, which the surveyed papers do not report."));
C.push(BUL("A comparison of accuracy against parameter count under a single protocol, which supports a practical judgement about whether the additional complexity of attention-based models is justified on a dataset of this size."));
C.push(P("The contribution is therefore a careful comparative study together with a concrete lightweight design, rather than a claim of a fundamentally new architecture. This is stated deliberately, and no claim of improved performance is made in advance of the experiments."));

// =====================================================================
// 23  FUTURE SCOPE
// =====================================================================
C.push(H1("23. Future Scope"));
C.push(BUL("Extending the evaluation to BCI Competition IV Dataset 2b and to larger collections such as the PhysioNet motor imagery dataset, to test whether the findings hold with more subjects and different electrode configurations."));
C.push(BUL("Measuring how many labelled trials from a new user are required to reach a given accuracy, which would quantify the calibration effort a real deployment would need."));
C.push(BUL("Investigating domain adaptation methods, including the adversarial variant described in Section 13.2 and contrastive approaches, as a more systematic way of reducing the difference between subjects."));
C.push(BUL("Applying interpretability methods such as class activation topography to check whether the model relies on the expected sensorimotor regions rather than on artefacts."));
C.push(BUL("Testing the model in an online setting, where trials arrive continuously and a decision must be produced within a fixed latency budget."));
C.push(BUL("Reducing the model further through quantisation or pruning, with a view to running it on embedded hardware suitable for a wearable device."));

// =====================================================================
// 24  REFERENCES
// =====================================================================
C.push(H1("24. References"));
const refs = [
  "V. J. Lawhern, A. J. Solon, N. R. Waytowich, S. M. Gordon, C. P. Hung and B. J. Lance, “EEGNet: A Compact Convolutional Neural Network for EEG-based Brain–Computer Interfaces,” Journal of Neural Engineering, vol. 15, no. 5, 056013, 2018.",
  "H. Altaheri, G. Muhammad and M. Alsulaiman, “Physics-Informed Attention Temporal Convolutional Network for EEG-Based Motor Imagery Classification,” IEEE Transactions on Industrial Informatics, vol. 19, no. 2, pp. 2249–2258, 2023.",
  "W. Zhao, X. Jiang, B. Zhang, S. Xiao and S. Weng, “CTNet: A Convolutional Transformer Network for EEG-Based Motor Imagery Classification,” Scientific Reports, vol. 14, 20237, 2024.",
  "Y. Song, Q. Zheng, B. Liu and X. Gao, “EEG Conformer: Convolutional Transformer for EEG Decoding and Visualization,” IEEE Transactions on Neural Systems and Rehabilitation Engineering, vol. 31, pp. 710–719, 2023.",
  "M. Tangermann, K.-R. Müller, A. Aertsen et al., “Review of the BCI Competition IV,” Frontiers in Neuroscience, vol. 6, 55, 2012.",
  "C. Brunner, R. Leeb, G. Müller-Putz, A. Schlögl and G. Pfurtscheller, “BCI Competition 2008 – Graz Data Set A,” Institute for Knowledge Discovery, Graz University of Technology, 2008.",
  "H. He and D. Wu, “Transfer Learning for Brain–Computer Interfaces: A Euclidean Space Data Alignment Approach,” IEEE Transactions on Biomedical Engineering, vol. 67, no. 2, pp. 399–410, 2020.",
  "R. T. Schirrmeister, J. T. Springenberg, L. D. J. Fiederer et al., “Deep Learning with Convolutional Neural Networks for EEG Decoding and Visualization,” Human Brain Mapping, vol. 38, no. 11, pp. 5391–5420, 2017.",
  "K. K. Ang, Z. Y. Chin, H. Zhang and C. Guan, “Filter Bank Common Spatial Pattern (FBCSP) in Brain–Computer Interface,” Proceedings of the IEEE International Joint Conference on Neural Networks, pp. 2390–2397, 2008.",
  "A. Vaswani, N. Shazeer, N. Parmar et al., “Attention Is All You Need,” Advances in Neural Information Processing Systems 30, 2017.",
  "A. Gramfort, M. Luessi, E. Larson et al., “MEG and EEG Data Analysis with MNE-Python,” Frontiers in Neuroscience, vol. 7, 267, 2013.",
  "B. Aristimunha, I. Carrara, P. Guetschel et al., “Mother of All BCI Benchmarks (MOABB),” software framework for reproducible EEG decoding, 2023.",
  "G. Pfurtscheller and F. H. Lopes da Silva, “Event-Related EEG/MEG Synchronization and Desynchronization: Basic Principles,” Clinical Neurophysiology, vol. 110, no. 11, pp. 1842–1857, 1999.",
  "S. Holm, “A Simple Sequentially Rejective Multiple Test Procedure,” Scandinavian Journal of Statistics, vol. 6, no. 2, pp. 65–70, 1979.",
];
refs.forEach((r, i) => C.push(new Paragraph({
  spacing: { after: 110, line: 276 },
  indent: { left: 420, hanging: 420 },
  children: [new TextRun({ text: `[${i + 1}] ${r}`, size: 19 })]
})));

// =====================================================================
// BUILD
// =====================================================================
const doc = new Document({
  creator: "Phase 2 Solution Design",
  title: "Cross-Subject Motor Imagery EEG Classification — Complete Methodology and Detailed Implementation Plan",
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
  console.log('written', b.length, 'bytes,', C.length, 'blocks');
});
