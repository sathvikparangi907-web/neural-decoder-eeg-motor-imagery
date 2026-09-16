const pptxgen = require('pptxgenjs');
const fs = require('fs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';                // 13.3 x 7.5 in
const W = 13.3, H = 7.5, M = 0.62;
const CW = W - 2 * M;

const NAVY   = "1B3A6B";
const NAVYD  = "122847";
const PURPLE = "5B3E96";
const PURPLL = "8A6FC4";
const STEEL  = "4A6FA5";
const GREY   = "5A6478";
const LGREY  = "8C96AC";
const CARD   = "EFF3F9";
const TINT   = "F1EDF9";
const WHITE  = "FFFFFF";

const TF = "Cambria";     // titles
const BF = "Calibri";     // body

let slideNo = 0;

function png(p) {
  const b = fs.readFileSync(p);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function img(s, file, x, y, w) {
  const { w: pw, h: ph } = png(file);
  s.addImage({ path: file, x, y, w, h: w * (ph / pw) });
  return w * (ph / pw);
}

function slide(title, kicker, opts = {}) {
  const s = pres.addSlide();
  s.background = { color: WHITE };
  slideNo++;
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.36, w: CW, h: 0.24, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 10.5, bold: true, color: PURPLE, charSpacing: 1.6
    });
  }
  if (title) {
    s.addText(title, {
      x: M, y: 0.63, w: CW, h: 0.58, isTextBox: true, margin: 0, valign: 'top',
      fontFace: TF, fontSize: 27, bold: true, color: NAVYD
    });
  }
  if (!opts.noNumber) {
    s.addText(String(slideNo), {
      x: W - M - 0.6, y: H - 0.48, w: 0.6, h: 0.26, isTextBox: true, margin: 0,
      align: 'right', fontFace: BF, fontSize: 10, color: LGREY
    });
  }
  return s;
}
function card(s, x, y, w, h, fill = CARD) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, fill: { color: fill }, rectRadius: 0.07, line: { color: fill, width: 0 }
  });
}
function numDot(s, x, y, n, d = 0.38, bg = NAVY) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: bg }, line: { width: 0 } });
  s.addText(String(n), {
    x, y, w: d, h: d, isTextBox: true, align: 'center', valign: 'middle', margin: 0,
    fontFace: BF, fontSize: 12, bold: true, color: WHITE
  });
}
function caption(s, t, y) {
  s.addText(t, {
    x: M, y, w: CW, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 12, color: GREY, italic: true
  });
}
function tableOpts(colW, rowH) {
  return {
    x: M, y: 0, w: CW, colW, rowH,
    border: { type: 'solid', color: "D5DDEA", pt: 0.5 },
    margin: [3, 8, 3, 8]
  };
}
function mkTable(rows, opts) {
  return rows.map((r, ri) => r.map((c, ci) => ({
    text: c,
    options: {
      fontFace: BF,
      fontSize: ri === 0 ? (opts.hs || 11) : (opts.bs || 11.5),
      bold: ri === 0 || (opts.boldFirst && ci === 0),
      color: ri === 0 ? WHITE : NAVYD,
      fill: { color: ri === 0 ? NAVY : (opts.hi === ri ? TINT : (ri % 2 === 0 ? CARD : WHITE)) },
      align: (opts.center || []).includes(ci) ? 'center' : 'left',
      valign: 'middle'
    }
  })));
}

// =====================================================================
// 1  TITLE
// =====================================================================
{
  const s = slide(null, null, { noNumber: true });
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: 0.16, fill: { color: NAVY }, line: { width: 0 } });
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0.16, w: W, h: 0.06, fill: { color: PURPLE }, line: { width: 0 } });

  s.addText("DEEP LEARNING THEORY–BASED PRACTICAL WORK", {
    x: M, y: 1.35, w: CW, h: 0.3, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 12, bold: true, color: PURPLE, charSpacing: 2
  });
  s.addText("Phase 2  ·  Solution Design", {
    x: M, y: 1.68, w: CW, h: 0.3, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, color: GREY
  });

  s.addText("Cross-Subject Motor Imagery EEG", {
    x: M, y: 2.35, w: 11.8, h: 0.72, isTextBox: true, margin: 0,
    fontFace: TF, fontSize: 36, bold: true, color: NAVYD
  });
  s.addText("Classification using Deep Learning", {
    x: M, y: 3.05, w: 11.8, h: 0.72, isTextBox: true, margin: 0,
    fontFace: TF, fontSize: 36, bold: true, color: NAVYD
  });
  s.addText("A hybrid convolutional–Transformer approach evaluated on unseen subjects", {
    x: M, y: 3.92, w: 11.8, h: 0.4, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 15, color: STEEL
  });

  const meta = [
    ["Team members", "[ Names and registration numbers ]"],
    ["Guide / faculty", "[ Name and designation ]"],
    ["Course", "[ Course code and title ]"],
    ["Date", "15 September 2026"],
  ];
  meta.forEach(([k, v], i) => {
    const y = 4.85 + i * 0.36;
    s.addText(k, {
      x: M, y, w: 2.2, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12, color: GREY
    });
    s.addText(v, {
      x: M + 2.3, y, w: 8.5, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12, color: NAVYD
    });
  });
  s.addNotes("Phase 2 presents the solution design: how the literature survey from Phase 1 becomes a concrete, implementable project plan. Fill in team, guide and course before presenting.");
}

// =====================================================================
// 2  PROBLEM STATEMENT
// =====================================================================
{
  const s = slide("Decoding imagined movement from scalp EEG", "Problem statement");
  s.addText("When a person imagines moving a limb, the sensorimotor cortex shows a measurable drop in mu-band power on the opposite side of the head. The task is to recover which movement was imagined from that signal.", {
    x: M, y: 1.35, w: CW, h: 0.5, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13.5, color: NAVYD
  });

  const ch = [
    ["Low signal-to-noise ratio", "Cortical activity is attenuated by the skull and scalp, and is mixed with eye, muscle and mains interference"],
    ["Small, high-dimensional data", "A four-second trial holds over twenty thousand samples, but each subject provides only a few hundred labelled trials"],
    ["Variability between people", "Skull shape, electrode placement and mental strategy differ, so feature distributions shift from subject to subject"],
  ];
  const cw = 3.88, gap = 0.21;
  ch.forEach(([t, b], i) => {
    const x = M + i * (cw + gap);
    card(s, x, 2.02, cw, 1.5);
    s.addText(t, {
      x: x + 0.22, y: 2.16, w: cw - 0.44, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12.5, bold: true, color: NAVY
    });
    s.addText(b, {
      x: x + 0.22, y: 2.48, w: cw - 0.44, h: 0.95, isTextBox: true, margin: 0, valign: 'top',
      fontFace: BF, fontSize: 11, color: GREY
    });
  });

  img(s, "fig/f_erd.png", 1.95, 3.72, 9.4);
  s.addNotes("Three difficulties: noise, data scarcity, and subject variability. The third is the one this project targets.");
}

// =====================================================================
// 3  LITERATURE SURVEY SUMMARY
// =====================================================================
{
  const s = slide("From compact CNNs to convolutional–Transformer hybrids", "Literature survey summary");
  const h = img(s, "fig/f_evolution.png", M, 1.55, 12.06);

  const y = 1.55 + h + 0.25;
  const pts = [
    ["What improved", "Each step added a better way to relate information across the whole trial, rather than only within a short window."],
    ["What it cost", "Parameter counts rose from roughly two thousand to over one hundred thousand, and the data requirement rose with them."],
  ];
  pts.forEach(([t, b], i) => {
    const x = M + i * 6.13;
    card(s, x, y, 5.93, 1.2);
    s.addText(t, {
      x: x + 0.24, y: y + 0.15, w: 5.45, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12.5, bold: true, color: PURPLE
    });
    s.addText(b, {
      x: x + 0.24, y: y + 0.48, w: 5.45, h: 0.62, isTextBox: true, margin: 0, valign: 'top',
      fontFace: BF, fontSize: 11.5, color: NAVYD
    });
  });
  s.addNotes("The four papers form a progression: CNN, then CNN with attention and temporal convolution, then CNN with a Transformer encoder. Capability rose, and so did cost.");
}

// =====================================================================
// 4  RESEARCH GAP
// =====================================================================
{
  const s = slide("Four limitations common to the surveyed work", "Research gap");
  const gaps = [
    "Cross-subject generalisation remains difficult; accuracy falls when the test subject is unseen.",
    "Zero-calibration and low-calibration operation is still an open problem.",
    "CNNs are lightweight but limited in modelling long-range temporal structure.",
    "Transformers capture global relationships but cost more and need more data.",
  ];
  gaps.forEach((g, i) => {
    const y = 1.5 + i * 0.86;
    card(s, M, y, 6.55, 0.74);
    numDot(s, M + 0.22, y + 0.18, i + 1, 0.38, i < 2 ? PURPLE : NAVY);
    s.addText(g, {
      x: M + 0.75, y, w: 5.6, h: 0.74, isTextBox: true, margin: 0, valign: 'middle',
      fontFace: BF, fontSize: 11.8, color: NAVYD
    });
  });

  img(s, "fig/f_gap.png", 7.55, 1.72, 5.13);

  card(s, 7.55, 5.02, 5.13, 1.32, CARD);
  s.addText("The clearest illustration", {
    x: 7.79, y: 5.18, w: 4.7, h: 0.28, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 12, bold: true, color: NAVY
  });
  s.addText("CTNet is the strongest of the four within subject, yet loses 23.88 points on the four-class task when the test subject is unseen.", {
    x: 7.79, y: 5.48, w: 4.7, h: 0.72, isTextBox: true, margin: 0, valign: 'top',
    fontFace: BF, fontSize: 11.8, color: NAVYD
  });

  card(s, M, 5.02, 6.55, 1.32, TINT);
  s.addText("What is needed", {
    x: M + 0.24, y: 5.18, w: 6.1, h: 0.28, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 12, bold: true, color: PURPLE
  });
  s.addText("A model that balances classification accuracy, model complexity and generalisation to new people, rather than optimising any one of them alone.", {
    x: M + 0.24, y: 5.48, w: 6.1, h: 0.72, isTextBox: true, margin: 0, valign: 'top',
    fontFace: BF, fontSize: 11.8, color: NAVYD
  });
  s.addNotes("CTNet is the clearest illustration: 82.52 per cent within subject, 58.64 per cent on an unseen subject. Nearly twenty-four points.");
}

// =====================================================================
// 5  OBJECTIVES
// =====================================================================
{
  const s = slide("What the project sets out to do", "Project objectives");
  const objs = [
    "Implement a reproducible preprocessing and evaluation pipeline for BCI Competition IV Dataset 2a.",
    "Implement EEGNet, ATCNet, CTNet and EEG Conformer as baselines under one identical protocol.",
    "Design a hybrid model combining the convolutional front end of EEGNet with the attention mechanisms of the other three.",
    "Train and evaluate every model using leave-one-subject-out cross-validation.",
    "Measure accuracy, Cohen's kappa, precision, recall and F1-score, per subject and averaged.",
    "Compare parameter count and computational cost alongside accuracy.",
  ];
  objs.forEach((o, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * 6.13, y = 1.55 + row * 1.42;
    card(s, x, y, 5.93, 1.22);
    numDot(s, x + 0.24, y + 0.2, i + 1, 0.4, i < 4 ? NAVY : PURPLE);
    s.addText(o, {
      x: x + 0.8, y, w: 4.9, h: 1.22, isTextBox: true, margin: 0, valign: 'middle',
      fontFace: BF, fontSize: 11.8, color: NAVYD
    });
  });
  card(s, M, 5.85, 12.06, 0.86, TINT);
  s.addText("The final objective is to report whether the proposed combination improves cross-subject performance while remaining lightweight — and to report it either way.", {
    x: M + 0.3, y: 5.85, w: 11.5, h: 0.86, isTextBox: true, margin: 0, valign: 'middle',
    fontFace: BF, fontSize: 12.5, color: NAVYD
  });
  s.addNotes("Six objectives. The seventh, on the purple band, is the honesty commitment: a negative result is still reported.");
}

// =====================================================================
// 6  DATASET
// =====================================================================
{
  const s = slide("BCI Competition IV Dataset 2a", "Dataset");
  const rows = [
    ["Property", "Value"],
    ["Subjects", "9"],
    ["EEG channels", "22"],
    ["Classes", "4 — left hand, right hand, feet, tongue"],
    ["Sampling rate", "250 Hz"],
    ["Sessions per subject", "2, on different days"],
    ["Trials per subject", "576"],
    ["Total labelled trials", "5,184"],
    ["Analysis window", "0.5 to 4.0 s after cue (875 samples)"],
  ];
  s.addTable(mkTable(rows, { boldFirst: true, hs: 11, bs: 11.5 }), {
    ...tableOpts([2.35, 3.55], [0.32, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31]),
    x: M, y: 1.5, w: 5.9
  });
  s.addText("Chosen because all four surveyed papers evaluate on it, so our baseline implementations can be checked against published values.", {
    x: M, y: 4.62, w: 5.9, h: 0.6, isTextBox: true, margin: 0, valign: 'top',
    fontFace: BF, fontSize: 11.5, color: GREY, italic: true
  });

  s.addText("The four motor imagery classes", {
    x: 6.85, y: 1.5, w: 5.83, h: 0.3, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 12.5, bold: true, color: NAVY
  });
  img(s, "fig/f_classes.png", 6.85, 1.9, 5.83);
  s.addText("Each class activates a different region of the sensorimotor cortex. Hand imagery appears on the opposite side of the head, foot imagery near the midline.", {
    x: 6.85, y: 3.72, w: 5.83, h: 0.8, isTextBox: true, margin: 0, valign: 'top',
    fontFace: BF, fontSize: 11.5, color: NAVYD
  });

  card(s, M, 5.55, 12.06, 1.1, CARD);
  s.addText("With only nine subjects, leave-one-subject-out gives nine folds — enough for a mean, a standard deviation and a paired test, but not enough to treat any single fold as reliable on its own.", {
    x: M + 0.3, y: 5.55, w: 11.5, h: 1.1, isTextBox: true, margin: 0, valign: 'middle',
    fontFace: BF, fontSize: 12, color: NAVYD
  });
  s.addNotes("Nine subjects, four classes, 576 trials each. Small by deep learning standards, which is why regularisation and augmentation are necessary rather than optional.");
}

// =====================================================================
// 7  SYSTEM ARCHITECTURE
// =====================================================================
{
  const s = slide("From raw EEG to a predicted movement", "Proposed system architecture");
  const h = img(s, "fig/f_sysarch.png", M, 1.5, 12.06);
  const y = 1.5 + h + 0.3;

  const notes = [
    ["CNN feature extraction", "Depthwise and separable convolution, adapted from EEGNet. Learns spatial filters at very low parameter cost."],
    ["Temporal attention", "Windowed self-attention, adapted from ATCNet, CTNet and EEG Conformer. Relates distant parts of the trial."],
  ];
  notes.forEach(([t, b], i) => {
    const x = M + i * 6.13;
    card(s, x, y, 5.93, 1.35, i === 0 ? CARD : TINT);
    s.addText(t, {
      x: x + 0.24, y: y + 0.16, w: 5.45, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12.5, bold: true, color: i === 0 ? NAVY : PURPLE
    });
    s.addText(b, {
      x: x + 0.24, y: y + 0.5, w: 5.45, h: 0.76, isTextBox: true, margin: 0, valign: 'top',
      fontFace: BF, fontSize: 11.5, color: NAVYD
    });
  });
  s.addNotes("The two shaded stages are the learned components. Everything else is fixed signal processing or output layers.");
}

// =====================================================================
// 8  METHODOLOGY
// =====================================================================
{
  const s = slide("Step-by-step pipeline", "Proposed methodology");
  const h = img(s, "fig/f_method.png", 1.45, 1.42, 10.4);
  const y = 1.42 + h + 0.30;

  const rows = [
    ["Stage", "What happens", "Why it matters"],
    ["Preprocessing", "Band-pass 4–38 Hz, epoch 0.5–4.0 s, alignment, normalisation", "Identical for every model, so differences come from the models"],
    ["Feature extraction", "Convolutional block followed by windowed attention", "The learned part of the system"],
    ["Model training", "Subject-independent, validation on a held-out subject", "Avoids selecting hyperparameters that favour within-subject fit"],
    ["LOSO evaluation", "Nine folds, each with a different unseen test subject", "Measures what a new user would experience"],
    ["Performance analysis", "Metrics per subject, plus a paired statistical test", "Averages alone hide failures on individual subjects"],
  ];
  s.addTable(mkTable(rows, { boldFirst: true, hs: 10.5, bs: 11 }), {
    ...tableOpts([2.5, 5.0, 4.56], [0.3, 0.40, 0.30, 0.40, 0.30, 0.40]),
    x: M, y
  });
  s.addNotes("Seven stages. Highlighted ones are where the technical work sits.");
}

// =====================================================================
// 9  BASELINE COMPARISON
// =====================================================================
{
  const s = slide("Four published baselines and the proposed model", "Baseline comparison");
  const rows = [
    ["Model", "Architecture type", "Main strength", "Main limitation", "Role in our experiments"],
    ["EEGNet\n(2018)", "Compact CNN", "Very small; trains reliably on limited data", "Limited long-range temporal modelling", "Lower bound on model size"],
    ["ATCNet\n(2023)", "CNN + attention + TCN", "Attention applied locally, suits short trials", "Considerably larger than EEGNet", "Source of the windowed attention idea"],
    ["EEG Conformer\n(2023)", "CNN + Transformer", "Global self-attention with interpretability", "Costly; needs augmentation to train well", "Reference for convolution-then-attention"],
    ["CTNet\n(2024)", "CNN + Transformer", "Highest reported within-subject accuracy", "Large drop under subject-independent testing", "States the research gap quantitatively"],
    ["Proposed\nHCT-Net", "CNN + windowed attention", "Combines the components above at 20,996 parameters", "Not yet evaluated", "The model under investigation"],
  ];
  s.addTable(mkTable(rows, { boldFirst: true, hs: 10.5, bs: 10.8, hi: 5 }), {
    ...tableOpts([1.9, 2.3, 2.75, 2.65, 2.46],
                 [0.36, 0.72, 0.72, 0.72, 0.72, 0.72]),
    x: M, y: 1.5
  });
  s.addText("Published accuracies are not shown side by side here because each paper used a different evaluation protocol, so the figures cannot be ranked against one another. Re-running all four under one leave-one-subject-out protocol is part of this project.", {
    x: M, y: 5.62, w: CW, h: 0.7, isTextBox: true, margin: 0, valign: 'top',
    fontFace: BF, fontSize: 11.8, color: GREY, italic: true
  });
  s.addNotes("Important point to make aloud: the published numbers use different protocols. EEGNet is quoted at 68.67 per cent by one paper and 71.50 by another, for the same model on the same dataset.");
}

// =====================================================================
// 10  EVALUATION STRATEGY
// =====================================================================
{
  const s = slide("Leave-one-subject-out evaluation", "Evaluation strategy");
  const h = img(s, "fig/f_loso_concept.png", 0.98, 1.38, 11.35);
  const y = 1.38 + h + 0.28;

  const mets = [
    ["Accuracy", "Mean and standard deviation over nine folds"],
    ["Cohen's kappa", "Corrected for chance agreement"],
    ["Precision, recall, F1", "Macro-averaged over the four classes"],
    ["Parameters and time", "Model complexity and computational cost"],
  ];
  const cw = 2.92, gap = 0.19;
  mets.forEach(([t, b], i) => {
    const x = M + i * (cw + gap);
    card(s, x, y, cw, 1.12, i === 3 ? TINT : CARD);
    s.addText(t, {
      x: x + 0.2, y: y + 0.14, w: cw - 0.4, h: 0.3, isTextBox: true, margin: 0,
      fontFace: BF, fontSize: 12, bold: true, color: i === 3 ? PURPLE : NAVY
    });
    s.addText(b, {
      x: x + 0.2, y: y + 0.45, w: cw - 0.4, h: 0.6, isTextBox: true, margin: 0, valign: 'top',
      fontFace: BF, fontSize: 10.8, color: GREY
    });
  });
  s.addText("A Wilcoxon signed-rank test, paired across the nine subjects, is used to decide whether a difference between two models is meaningful. Results are reported per subject as well as averaged.", {
    x: M, y: y + 1.24, w: 11.3, h: 0.5, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 11.8, color: NAVYD
  });
  s.addNotes("Nine folds. Seven training subjects, one validation subject, one test subject. The validation subject is held out too, which matters for honest hyperparameter selection.");
}

// =====================================================================
// 11  EXPECTED OUTCOMES AND NOVELTY
// =====================================================================
{
  const s = slide("What we expect, and what is actually new", "Expected outcomes and novelty");

  card(s, M, 1.45, 5.93, 3.55, CARD);
  s.addText("Expected outcomes", {
    x: M + 0.28, y: 1.62, w: 5.4, h: 0.32, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, bold: true, color: NAVY
  });
  const outs = [
    "Better generalisation to unseen subjects than the heavier baselines",
    "Competitive motor imagery classification accuracy",
    "A lightweight architecture \u2014 20,996 parameters, about one fifth the size of ATCNet",
    "Reduced dependence on subject-specific calibration",
  ];
  outs.forEach((o, i) => {
    s.addText(o, {
      x: M + 0.55, y: 2.05 + i * 0.66, w: 5.15, h: 0.6, isTextBox: true, margin: 0, valign: 'top',
      fontFace: BF, fontSize: 11.6, color: NAVYD, bullet: true
    });
  });

  card(s, 6.75, 1.45, 5.93, 3.55, TINT);
  s.addText("What the project contributes", {
    x: 7.03, y: 1.62, w: 5.4, h: 0.32, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, bold: true, color: PURPLE
  });
  const contrib = [
    "A comparison of all four architectures under one identical LOSO protocol",
    "A specific lightweight combination, with attention depth reduced to suit the dataset size",
    "A component-wise study showing what each part contributes to cross-subject accuracy",
    "Accuracy measured against parameter count under a single protocol",
  ];
  contrib.forEach((o, i) => {
    s.addText(o, {
      x: 7.3, y: 2.05 + i * 0.66, w: 5.15, h: 0.6, isTextBox: true, margin: 0, valign: 'top',
      fontFace: BF, fontSize: 11.6, color: NAVYD, bullet: true
    });
  });

  s.addShape(pres.ShapeType.roundRect, {
    x: M, y: 5.2, w: 12.06, h: 1.25, rectRadius: 0.07,
    fill: { color: NAVYD }, line: { width: 0 }
  });
  s.addText("These are expected outcomes, not results.", {
    x: M + 0.35, y: 5.36, w: 11.4, h: 0.32, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 13, bold: true, color: "C9D6EC"
  });
  s.addText("No experiments have been run at this stage. The individual components are all taken from published work; what is proposed is the particular combination, the subject-independent evaluation, and the study of what each component contributes.", {
    x: M + 0.35, y: 5.68, w: 11.4, h: 0.62, isTextBox: true, margin: 0, valign: 'top',
    fontFace: BF, fontSize: 11.8, color: WHITE
  });
  s.addNotes("Say this explicitly: nothing on the left has been measured. The novelty claim is modest and deliberate — a careful comparative study plus a concrete lightweight design.");
}

// =====================================================================
// 12  IMPLEMENTATION PLAN AND CONCLUSION
// =====================================================================
{
  const s = slide("Implementation plan and conclusion", "Phase 3, 16 September to 3 October");
  const h = img(s, "fig/f_timeline.png", 1.85, 1.40, 9.6);

  const y = 1.40 + h + 0.26;
  s.addShape(pres.ShapeType.roundRect, {
    x: M, y, w: 12.06, h: 1.45, rectRadius: 0.07, fill: { color: CARD }, line: { width: 0 }
  });
  s.addText("In summary", {
    x: M + 0.32, y: y + 0.16, w: 11.4, h: 0.3, isTextBox: true, margin: 0,
    fontFace: BF, fontSize: 12.5, bold: true, color: NAVY
  });
  s.addText("The literature survey identified a specific, measurable gap: cross-subject accuracy falls sharply, and closing it currently costs model size. Phase 2 turns that into an implementable plan — one dataset, five models, one evaluation protocol, and a fixed schedule. The plan is deliberately front-loaded, so that the pipeline and baselines are verified before the proposed model is written.", {
    x: M + 0.32, y: y + 0.5, w: 11.4, h: 0.85, isTextBox: true, margin: 0, valign: 'top',
    fontFace: BF, fontSize: 12, color: NAVYD
  });
  s.addNotes("Close here. The point of Phase 2 is that the survey has become a concrete plan that fits the remaining time.");
}

pres.writeFile({ fileName: '/home/claude/review2/Phase2_Presentation.pptx' })
  .then(f => console.log('written', f));
