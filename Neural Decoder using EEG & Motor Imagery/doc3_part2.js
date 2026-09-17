const K = require('./doc3_part1.js');
const { C, BR } = require('./doc3.js');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak, LevelFormat, PageNumber, Footer, fs,
  CW, NAVY, NAVYD, PURPLE, GREY, CARD, TINT,
  H1, H2, H3, P, BUL, NUMI, CAP, SP, figure, table, note, code
} = K;

// =====================================================================
// 10  EDA PLAN
// =====================================================================
C.push(H1("10. Exploratory Data Analysis Plan"));
C.push(P("Exploratory analysis is carried out before any model is trained. Its purpose is threefold: to confirm that the data are as the dataset description claims, to establish that the preprocessing pipeline behaves correctly, and to document the variability between subjects that the rest of the project attempts to address. Each analysis has a stated expectation, so that a result which contradicts it is recognised as a problem rather than accepted."));
C.push(SP(40));
C.push(table(
  ["Analysis", "What it shows", "Expected result"],
  [
    ["Trial counts and class balance per subject", "Whether any subject or class is under-represented after artefact rejection", "576 trials per subject and 144 per class before rejection"],
    ["Artefact rejection rate per subject", "Data quality differences between subjects", "Under roughly 15 per cent for most subjects"],
    ["Power spectral density per channel and class", "Whether mu and beta activity are present in the expected bands", "Clear peaks near 10 Hz and 20 Hz over sensorimotor channels"],
    ["Time–frequency maps at C3, Cz and C4", "Whether event-related desynchronisation appears after the cue", "Power reduction in the mu band from roughly 0.5 s after the cue"],
    ["Topographic maps averaged by class", "Whether hand imagery produces activity on the opposite side of the head", "Left-hand imagery strongest near C4 and right-hand imagery near C3"],
    ["Covariance distance between subjects", "How far apart subjects are before and after alignment", "A clear reduction in pairwise distance after alignment"],
    ["Low-dimensional projection of trial features", "Whether trials cluster by class or by subject", "Clustering by subject before alignment, and less of it afterwards"],
  ],
  [3000, 3300, 3200], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 10.1 — Planned exploratory analyses and the outcome expected from each."));
C.push(P("Each analysis carries an expectation, so that a result which contradicts it is recognised as a problem rather than accepted. A mismatch is investigated and resolved before any model is trained, since an error in the data that goes unnoticed at this point would affect every result that follows and would be very difficult to trace later. The figures produced by this stage are kept and included in the final report, because they document that the pipeline was verified rather than assumed to be correct."));

BR();

// =====================================================================
// 11  PROPOSED ARCHITECTURE
// =====================================================================
C.push(H1("11. Proposed Deep Learning Architecture"));

C.push(H2("11.1 Design constraints"));
C.push(P("The architecture is constrained before it is designed. The constraints below follow from the design principles in Section 6.1 and from the dataset properties in Section 8."));
C.push(SP(40));
C.push(table(
  ["Constraint", "Value", "Reason"],
  [
    ["Trainable parameters", "Below 50,000", "Below ShallowConvNet at 47,364 and far below ATCNet at 113,732; a small model is less able to memorise subject-specific detail"],
    ["Attention span", "Windowed, not global", "Global attention over 27 time steps is affordable but unconstrained; windowing imposes a locality prior that suits short EEG trials"],
    ["Encoder depth", "2 layers", "CTNet uses 6; with fewer than 6,000 trials in total, additional depth is more likely to fit subject-specific structure than shared structure"],
    ["Input length", "875 samples", "Fixed by the analysis window in Section 8.3"],
    ["Output", "4 classes", "Fixed by the dataset"],
  ],
  [2200, 1900, 5400], { boldFirst: true }
));
C.push(CAP("Table 11.1 — Architectural constraints fixed in advance."));

C.push(H2("11.2 Block diagram"));
C.push(SP(30));
C.push(figure("fig/f_model.png", 430));
C.push(CAP("Figure 11.1 — Block diagram of the proposed model. Tensor shapes are given for BCI Competition IV Dataset 2a, and the badges indicate which surveyed paper each component is adapted from."));

C.push(H2("11.3 Layer-by-layer specification"));
C.push(P("The configuration below is written for 22 channels and 875 samples per trial."));
C.push(SP(40));
C.push(table(
  ["#", "Layer", "Configuration", "Output shape"],
  [
    ["1", "Temporal convolution", "F1 = 16 filters, kernel (1, 64), padding same, no bias", "16 × 22 × 875"],
    ["2", "Batch normalisation", "—", "16 × 22 × 875"],
    ["3", "Depthwise spatial convolution", "D = 2, kernel (22, 1), max-norm constraint 1.0, no bias", "32 × 1 × 875"],
    ["4", "Batch normalisation, ELU", "—", "32 × 1 × 875"],
    ["5", "Average pooling, dropout", "Pool (1, 4), dropout 0.25", "32 × 1 × 218"],
    ["6", "Separable convolution", "F2 = 32 filters, kernel (1, 16), depthwise then pointwise", "32 × 1 × 218"],
    ["7", "Batch normalisation, ELU", "—", "32 × 1 × 218"],
    ["8", "Average pooling, dropout", "Pool (1, 8), dropout 0.25", "32 × 1 × 27"],
    ["9", "Window segmentation", "5 overlapping windows of length 11, stride 4", "5 × 32 × 11"],
    ["10", "Positional encoding", "Learned, shape (11, 32), added to each window", "5 × 32 × 11"],
    ["11", "Transformer encoder", "2 layers, 2 heads, model dimension 32, feed-forward 64, GELU", "5 × 32 × 11"],
    ["12", "Fusion and global average pooling", "Mean over windows, then over time", "32"],
    ["13", "Fully connected, softmax", "32 → 4", "4"],
  ],
  [500, 2700, 3900, 2400], { boldFirst: true, center: [0, 3], size: 17 }
));
C.push(CAP("Table 11.2 — Layer specification of the proposed model."));

C.push(H2("11.4 Parameter budget"));
C.push(P("The parameter count is calculated below rather than estimated, so that the claim that the model is lightweight can be checked before implementation. The count assumes convolutions without bias terms, as in EEGNet, and a feed-forward expansion factor of two inside the encoder."));
C.push(SP(40));
C.push(table(
  ["Component", "Calculation", "Parameters"],
  [
    ["Temporal convolution", "16 × 1 × 1 × 64", "1,024"],
    ["Batch normalisation 1", "2 × 16", "32"],
    ["Depthwise spatial convolution", "16 × 2 × 22 × 1", "704"],
    ["Batch normalisation 2", "2 × 32", "64"],
    ["Separable convolution, depthwise", "32 × 1 × 16", "512"],
    ["Separable convolution, pointwise", "32 × 32", "1,024"],
    ["Batch normalisation 3", "2 × 32", "64"],
    ["Convolutional block subtotal", "", "3,424"],
    ["Attention projections, per layer", "4 × (32 × 32 + 32)", "4,224"],
    ["Layer normalisation, per layer", "2 × 2 × 32", "128"],
    ["Feed-forward, per layer", "(32 × 64 + 64) + (64 × 32 + 32)", "4,192"],
    ["Encoder layer subtotal", "4,224 + 128 + 4,192", "8,544"],
    ["Encoder, 2 layers", "2 × 8,544", "17,088"],
    ["Learned positional encoding", "11 × 32", "352"],
    ["Classifier", "32 × 4 + 4", "132"],
    ["Total", "3,424 + 17,088 + 352 + 132", "20,996"],
  ],
  [3700, 3400, 2400], { boldFirst: true, center: [2], hi: [7, 11, 15], size: 17 }
));
C.push(CAP("Table 11.3 — Calculated parameter budget for the proposed model."));
C.push(SP(40));
C.push(table(
  ["Model", "Parameters", "Relative to the proposed model"],
  [
    ["EEGNet", "2,548", "0.12 ×"],
    ["EEG-TCNet", "4,096", "0.20 ×"],
    ["HCT-Net (proposed)", "20,996", "1.00 ×"],
    ["ShallowConvNet", "47,364", "2.26 ×"],
    ["ATCNet", "113,732", "5.42 ×"],
    ["DeepConvNet", "553,654", "26.37 ×"],
  ],
  [3600, 2900, 3000], { boldFirst: true, center: [1, 2], hi: [2] }
));
C.push(CAP("Table 11.4 — Parameter count in context. Counts for the published models are from the ATCNet reference implementation. The proposed model is roughly one fifth the size of ATCNet and comfortably inside the 50,000 budget, leaving room for adjustment during tuning."));

C.push(H2("11.5 Purpose of each component"));
C.push(SP(40));
C.push(table(
  ["Component", "Adapted from", "What it does", "Why it is included"],
  [
    ["Temporal convolution", "EEGNet", "Learns band-pass filters directly from the data", "Avoids fixing the frequency bands in advance"],
    ["Depthwise spatial convolution", "EEGNet", "Learns a spatial filter for each temporal filter", "Spatial filtering comparable to common spatial patterns at very low parameter cost"],
    ["Separable convolution", "EEGNet", "Summarises the temporal pattern of each feature map", "Reduces dimensionality before the attention stage"],
    ["Window segmentation", "ATCNet", "Divides the feature sequence into overlapping windows", "Limits the span over which attention operates, reducing parameters and overfitting"],
    ["Multi-head self-attention", "CTNet, EEG Conformer", "Relates information from different parts of the trial", "Addresses the limited receptive field of the convolutional stage"],
    ["Euclidean alignment", "Transfer learning literature", "Standardises the spatial covariance of each subject", "Reduces distribution shift between subjects without adding parameters"],
    ["Segmentation and reconstruction", "EEG Conformer, CTNet", "Generates additional training trials", "Compensates for the small number of labelled trials"],
  ],
  [2350, 1750, 2700, 2700], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 11.5 — Components of the proposed model, their origin, and the reason for including each."));

C.push(H2("11.6 Why two encoder layers rather than six"));
C.push(P("CTNet uses a six-layer Transformer encoder and reports strong within-subject accuracy. This project uses two. The reasoning is that the dataset contains 5,184 labelled trials in total, and under leave-one-subject-out only about 4,032 of those are available for training in any fold. A six-layer encoder at this model dimension would roughly triple the attention parameter count, from 17,088 to 51,264, which alone would exceed the budget set in Table 11.1 before the convolutional block is counted."));
C.push(P("There is also a substantive reason rather than merely a budgetary one. Additional attention capacity gives the model more freedom to fit structure that is specific to the training subjects, and that structure does not transfer to a new person. The gap documented in Figure 4.2 is precisely the symptom of a model fitting subject-specific detail. Reducing capacity is therefore a plausible response to the problem, not only a concession to hardware. Whether it is the correct response is an empirical question, and it is tested directly as experiment E5 in Section 17.2."));

C.push(H2("11.7 How a trial passes through the model"));
C.push(P("This section follows a single trial from input to prediction and explains what each stage is doing to the signal, rather than restating the layer table."));
C.push(P("The input is a preprocessed trial of 22 channels by 875 samples. The first operation is a convolution along time only, with sixteen separate filters each spanning 64 samples. At 250 Hz, 64 samples is about a quarter of a second, which covers roughly two to three cycles of a mu rhythm. Each filter is therefore learning to respond to a particular frequency band, and because the filters are learned rather than fixed, the network chooses its own bands instead of being restricted to the mu and beta ranges specified in advance. At this point the trial has become sixteen filtered copies of itself, one per band, each still carrying all 22 channels."));
C.push(P("The second operation is a depthwise convolution across channels. Its kernel spans the full height of 22 electrodes and a single time sample, so it forms weighted combinations of electrodes at each instant. This is the same idea as a classical common spatial pattern filter, except that it is learned jointly with everything else. The depth multiplier of two means each of the sixteen frequency bands receives two independent spatial filters, giving 32 feature maps in total, and it collapses the channel dimension to one. A max-norm constraint is applied to these weights so that no single electrode combination is allowed to grow without limit and dominate the representation."));
C.push(P("Two rounds of pooling then reduce the time axis. The first averages over groups of four samples, taking the length from 875 down to 218, and the second averages over groups of eight, taking it down to 27. The reason for reducing so aggressively is that the information carried by a mu rhythm lies in how its power changes over hundreds of milliseconds, not in the position of individual peaks, so averaging discards timing detail the classifier does not need while cutting the cost of everything that follows. Between the two pooling stages is a separable convolution, which first summarises the temporal pattern within each feature map independently and then mixes the maps together, a factorisation that achieves the same effect as a full convolution at a fraction of the parameter cost."));
C.push(P("What leaves the convolutional stage is a sequence of 27 positions, each described by 32 features. This sequence is where the attention stage operates. Rather than allowing every position to attend to every other, the sequence is cut into five windows of eleven positions each, with a stride of four so that neighbouring windows overlap. The overlap matters: without it a hard boundary could fall in the middle of an informative interval and split it between two windows that never see each other. Windowing also constrains what the attention mechanism can learn, which on a dataset of this size is an advantage rather than a limitation."));
C.push(P("A learned positional encoding is added to each window before attention is applied, because self-attention is otherwise indifferent to order and would treat a window as an unordered set. Inside each window, two attention heads compute how strongly every position should influence every other, and a small feed-forward network transforms the result. This repeats over two encoder layers. The practical effect is that a feature at one moment in the trial can be interpreted in the light of what is happening at another moment within the same window, which pure convolution cannot do beyond the span of its kernel."));
C.push(P("Finally the five window representations are averaged together, and the time axis within them is averaged as well, producing a single vector of 32 numbers that describes the whole trial. A fully connected layer maps that vector to four values, one per motor imagery class, and a softmax turns them into probabilities. The predicted class is the one with the highest probability."));

BR();

// =====================================================================
// 12  DETAILED METHODOLOGY  — principal section
// =====================================================================
C.push(H1("12. Detailed Methodology"));
C.push(P("This section sets out the complete method, stage by stage. Each stage states what it receives, what it does, what it produces, and the check that must pass before the next stage begins. The intention is that the project could be carried out by following this section alone."));
C.push(SP(40));
C.push(figure("fig/f_method.png", 468));
C.push(CAP("Figure 12.1 — The methodology as a sequence of stages."));

C.push(H2("12.1 Stage 1 — Data acquisition and verification"));
C.push(P("The dataset is downloaded programmatically through MOABB, which handles the file format and the standard channel naming. Before anything else is done, the loaded data are verified against the published dataset description, because every later result depends on the data being what it is assumed to be."));
C.push(SP(30));
C.push(table(
  ["Receives", "Does", "Produces"],
  [
    ["Nothing; downloads from source", "Download all 9 subjects, both sessions. Verify channel count, sampling rate, trial count and class balance against Table 8.2", "Raw epochs held in memory or on disk"],
  ],
  [2600, 4100, 2800], { size: 17 }
));
C.push(P("Any mismatch at this point is resolved before continuing. A silent discrepancy here, such as a mislabelled class or a missing run, would propagate into every subsequent result and would be extremely difficult to detect later."));

C.push(H2("12.2 Stage 2 — Preprocessing"));
C.push(P("The pipeline specified in Section 9 is implemented and applied. The output is written to disk as cached tensors, one file per subject per session, so that the operation is performed once for the whole project rather than repeated for every model and every fold."));
C.push(SP(30));
C.push(table(
  ["Receives", "Does", "Produces"],
  [
    ["Raw epochs from Stage 1", "Filter, epoch, reject artefacts, align, standardise, cache", "Cached tensors of shape N × 22 × 875 with labels, per subject"],
  ],
  [2600, 4100, 2800], { size: 17 }
));

C.push(H2("12.3 Stage 3 — Exploratory analysis"));
C.push(P("The analyses listed in Table 10.1 are carried out on the cached data. This stage is a verification step as much as an exploratory one: several of the checks in that table would reveal a preprocessing error that the numeric assertions in Stage 2 would not catch. For example, a mirrored channel montage would produce correct covariance statistics but reversed topographic maps."));
C.push(SP(30));
C.push(table(
  ["Receives", "Does", "Produces"],
  [
    ["Cached tensors", "Run every analysis in Table 10.1 and record the result", "A set of figures, retained for the final report"],
  ],
  [2600, 4100, 2800], { size: 17 }
));

C.push(H2("12.4 Stage 4 — Baseline implementation and reproduction"));
C.push(P("The four surveyed architectures and the classical control are implemented, using published reference implementations wherever they are available. Each is then trained and tested within subject, session one to session two, and the resulting accuracy is compared against the value published by its authors."));
C.push(P("This reproduction step is not a result in itself and will not be presented as one. Its purpose is diagnostic. If a reproduced within-subject accuracy differs substantially from the published value, then either the implementation or the preprocessing is wrong, and the cross-subject figures that follow could not be trusted. Establishing this before the main experiments is the reason a dedicated milestone in Section 19 is set aside for it."));
C.push(SP(30));
C.push(table(
  ["Receives", "Does", "Produces"],
  [
    ["Cached tensors, model definitions", "Train each baseline within subject; compare to published accuracy", "A reproduction table with published and reproduced figures side by side"],
  ],
  [2600, 4100, 2800], { size: 17 }
));

C.push(H2("12.5 Stage 5 — Proposed model implementation"));
C.push(P("The proposed model is implemented according to Table 11.2 and the description in Section 11.7. Three checks are applied before it is trained on real folds. First, tensor shapes are asserted at every layer against Table 11.2. Second, the parameter count is printed and compared against Table 11.3. Third, the model is trained deliberately to overfit a single batch of a few trials; if it cannot reach near-zero loss on data it has seen repeatedly, there is a defect in the implementation that no amount of tuning will fix."));
C.push(SP(30));
C.push(table(
  ["Receives", "Does", "Produces"],
  [
    ["Specification in Section 11", "Implement, assert shapes, count parameters, overfit one batch", "A model class with the same interface as the baselines"],
  ],
  [2600, 4100, 2800], { size: 17 }
));

C.push(H2("12.6 Stage 6 — Training"));
C.push(P("All models are trained using the configuration set out in Section 13, with the same optimiser, the same learning-rate schedule and the same stopping rule, so that any difference in results reflects the models rather than the way they were trained."));
C.push(P("Training begins by loading the cached tensors for the seven training subjects and applying augmentation to them. The validation subject's trials are loaded without augmentation, because their purpose is to estimate how the model behaves on genuine data. The optimiser is Adam with an initial learning rate of 0.001, and the learning rate follows a cosine schedule that decays smoothly over the maximum epoch count, allowing large adjustments early in training and fine adjustments towards the end."));
C.push(P("Within each epoch the training trials are shuffled and presented in batches of 64. For each batch the model produces class scores, a cross-entropy loss with label smoothing is computed against the true labels, and the gradients of that loss are propagated back through the network to update the weights. Immediately after each update the max-norm constraint is reapplied to the depthwise spatial convolution, so that no spatial filter can grow beyond the permitted magnitude between updates."));
C.push(P("At the end of every epoch the model is switched to evaluation mode, which disables dropout and freezes the batch normalisation statistics, and its accuracy on the validation subject is measured. If that accuracy is the best seen so far, the current weights are saved and the patience counter is reset. If it is not, the counter increases, and training stops once it reaches the patience limit. Stopping this way means the model is never allowed to keep improving on the training subjects at the expense of a subject it has not been trained on, which is the behaviour that produces the cross-subject gap described in Section 4."));
C.push(P("What is returned is not the model as it stood at the final epoch but the checkpoint with the best validation accuracy, since the epochs after that point were by definition moving in the wrong direction."));

C.push(H2("12.7 Stage 7 — Cross-subject evaluation"));
C.push(P("The leave-one-subject-out loop is the outermost structure of the experiments. It is written once and reused by every model, so that no model can accidentally be evaluated under a different protocol from another."));
C.push(P("The loop runs nine times, once for each subject. On each pass one subject is designated the test subject and a second, taken as the next subject in order, is designated the validation subject. The remaining seven form the training set. Because the validation role rotates along with the test role, no subject occupies the same position twice, and every subject serves as the unseen test subject exactly once."));
C.push(P("At the start of each fold the random seeds are reset and a completely fresh model is constructed. This matters: carrying weights over from a previous fold would mean the model had already seen the subject it is about to be tested on, which would invalidate the entire result. Training then proceeds as described in Stage 6, using only the seven training subjects and the one validation subject."));
C.push(P("Once training has finished, the held-out subject's trials are loaded. These are never augmented and never contributed anything to the choice of weights or hyperparameters. The trained model produces a prediction for each of them, and accuracy, Cohen's kappa, macro-averaged precision, recall and F1, and the confusion matrix are computed and recorded against that subject's identifier."));
C.push(P("The loop therefore produces nine independent measurements rather than a single number, and it is those nine that are reported, both individually and as a mean with a standard deviation. Each configuration is run with three random seeds and the per-fold results averaged, so that a difference between two models is not an artefact of a single fortunate initialisation."));

C.push(H2("12.8 Stage 8 — Statistical analysis"));
C.push(P("Comparing two mean accuracies is not sufficient to claim that one model is better than another, particularly with only nine folds. Each pairwise comparison uses the Wilcoxon signed-rank test, applied to the nine paired per-subject accuracies. The test is non-parametric, which matters because per-subject accuracy is not normally distributed across subjects, and it is paired, which matters because the same nine subjects are used for every model."));
C.push(P("Where multiple comparisons are made against the same baseline, the significance level is adjusted accordingly, and both the adjusted and unadjusted results are reported."));

C.push(H2("12.9 Stage 9 — Component study"));
C.push(P("The component study removes one part of the proposed model at a time and repeats the full leave-one-subject-out evaluation, so that the contribution of each part can be attributed rather than assumed. The configurations are listed in Table 17.2."));
C.push(P("This stage is what distinguishes a designed model from an assembled one. Without it, a combination of published components is only a combination; with it, the project can state which parts of the combination mattered for cross-subject performance and which did not."));

C.push(H2("12.10 The complete method in summary"));
C.push(P("Taken together, the nine stages form a single sequence with three distinct phases."));
C.push(P("The first phase is performed once for the whole project. The dataset is downloaded and verified against its published description, the preprocessing pipeline is applied and its output cached to disk, and the exploratory analyses are run to confirm that the cached data behave as the physiology predicts. Nothing beyond this point is attempted until these checks pass, because every subsequent result depends on them."));
C.push(P("The second phase is repeated for each of the six models. Each is first reproduced within subject and checked against its published accuracy, which establishes that the implementation and the pipeline are sound. Each is then trained and evaluated under the leave-one-subject-out protocol, producing nine per-subject measurements per model per seed. Because the folds, the preprocessing and the training configuration are identical for every model, the resulting figures are directly comparable, which is not true of the published numbers the models were originally reported with."));
C.push(P("The third phase interprets what was measured. The proposed model is compared against each baseline using a paired statistical test across the nine subjects, and the component study repeats the evaluation with individual parts of the proposed model removed, so that any difference observed in the second phase can be attributed to a specific design choice rather than to the combination as a whole. The tables and figures required for the review are then generated from the recorded per-fold metrics rather than from any separate calculation, so that what is presented is exactly what was measured."));

BR();

// =====================================================================
// 13  TRAINING STRATEGY
// =====================================================================
C.push(H1("13. Training Strategy"));
C.push(P("All models are trained with the same optimiser settings and the same stopping rule, so that the comparison between them is fair. The settings below are the starting configuration; any change made during tuning is applied to every model and recorded in the configuration file for that experiment."));
C.push(SP(40));
C.push(table(
  ["Setting", "Value", "Reason"],
  [
    ["Loss function", "Cross-entropy with label smoothing of 0.1", "Label smoothing reduces overconfidence, which matters on a small dataset where a model can become certain about patterns it has seen only a few times"],
    ["Optimiser", "Adam, initial learning rate 0.001", "The choice used by all four surveyed papers; changing it would make comparison with their results harder to interpret"],
    ["Learning rate schedule", "Cosine annealing over the maximum epoch count", "Allows large steps early and fine adjustment late without a hand-tuned step schedule"],
    ["Batch size", "64", "Fits comfortably in the memory of the available GPUs and gives stable batch normalisation statistics"],
    ["Maximum epochs", "500", "Generous upper bound; early stopping is expected to trigger first"],
    ["Early stopping", "Patience of 50 epochs on validation subject accuracy", "Stops before the model begins fitting the training subjects specifically"],
    ["Dropout", "0.25 after each pooling stage", "The value used by EEGNet; higher values were found by its authors to hurt on datasets of this size"],
    ["Weight constraint", "Max-norm of 1.0 on the depthwise convolution", "Used by EEGNet to keep individual spatial filters from dominating"],
    ["Weight decay", "0.0001", "Mild additional regularisation, applied uniformly"],
    ["Data augmentation", "Segmentation and reconstruction, training split only", "Increases the effective number of training trials; never applied to validation or test data"],
    ["Random seeds", "Three per configuration, results averaged", "A single seed can produce a difference between models that is initialisation noise rather than a real effect"],
    ["Mixed precision", "Enabled where supported", "Reduces training time by roughly a third, which matters given the number of runs"],
  ],
  [2400, 3100, 4000], { boldFirst: true, size: 17 }
));
C.push(CAP("Table 13.1 — Training configuration, with the reason for each value."));

C.push(H2("13.1 Determinism and reproducibility of training"));
C.push(P("Every run fixes the seeds of Python, NumPy and PyTorch, and records them alongside the result. Deterministic algorithms are enabled where PyTorch provides them. Complete bit-level determinism on a GPU is not always achievable, so the project does not claim it; what is claimed and checked is that re-running a configuration with the same seed reproduces the reported accuracy to within a small tolerance, and that tolerance is reported."));

C.push(H2("13.2 An optional variant"));
C.push(P("If the schedule allows, one additional variant will be tested, in which an auxiliary branch attempts to predict which subject produced each trial and its gradient is reversed before reaching the feature extractor, so that the encoder is discouraged from retaining subject-identifying information. This is treated as an experimental extension rather than part of the main model, because it introduces a training-time weighting that must itself be tuned, and tuning it properly would consume time that the core experiments need. If it is not reached, it is recorded as future work rather than quietly dropped."));

BR();

module.exports = {};
