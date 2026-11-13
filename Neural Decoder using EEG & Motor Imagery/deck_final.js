// Final presentation: Deep Learning–Based Neural Decoder for EEG Motor Imagery (final review).
//   node deck_r3.js                         names only
//   TEAM_JSON=team.json node deck_r3.js     names from a local file (e.g. with registration numbers)
// Every number is taken from the final article; the table it comes from is named in the speaker notes.
// Type sizes follow the review brief: titles 36 pt, body 18 pt or more, captions 12-14 pt.
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const FIG = path.join(__dirname, "fig");
const OUT = path.join(process.env.OUT_DIR || __dirname, "Review3_Final_Presentation.pptx");
const TEAM = process.env.TEAM_JSON
  ? JSON.parse(fs.readFileSync(process.env.TEAM_JSON, "utf8"))
  : ["Ananya Gourishetty", "Haarika D", "Siddhanth Samal", "Sathvik P"];

const C = {
  BG: "FBFBF8", NAVY: "13213C", INK: "1F2733", MUTED: "5B6474", BLUE: "2F5496", ORANGE: "D9661F",
  CARD: "EEF2F7", CARD2: "E4ECF7", PEACH: "FBE9DD", RULE: "D5DCE6", WHITE: "FFFFFF", PALE: "C9D5E8", GLOW: "E8762F",
};
const THEME = {
  name: "Neural Decoding", headFontFace: "Georgia", bodyFontFace: "Calibri",
  colors: { dk1: C.INK, lt1: C.WHITE, dk2: C.NAVY, lt2: C.BG, accent1: C.BLUE, accent2: C.ORANGE, accent3: "8FA6C9",
            accent4: "5B6474", accent5: "C9D5E8", accent6: "E8762F", hlink: C.BLUE, folHlink: C.MUTED },
};
const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: "Georgia", bodyFontFace: "Calibri" };
pres.author = "Group 5";
pres.company = "VIT-AP University";
pres.title = "Deep Learning–Based Neural Decoder for EEG Motor Imagery";
pres.subject = "CSE4006 Deep Learning, final project presentation";

pres.defineSlideMaster({ title: "DARK", background: { color: C.NAVY }, objects: [] });
pres.defineSlideMaster({
  title: "CONTENT", background: { color: C.BG },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 0.4, w: 10, h: 0.3, fontSize: 13, bold: true,
      color: C.ORANGE, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.72, w: CW, h: 0.75, fontFace: "Georgia",
      fontSize: 34, bold: true, color: C.NAVY, valign: "top", align: "left", margin: 0 }, text: "" } },
    { text: { text: "Deep Learning–Based Neural Decoder for EEG Motor Imagery  ·  Group 5",
      options: { x: M, y: 7.0, w: 8, h: 0.28, fontSize: 12, color: C.MUTED, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.8, y: 7.0, w: 0.8, h: 0.28, fontSize: 12, color: C.MUTED, align: "right" },
});

// ------------------------------------------------------------------ helpers
let section = null;
function slideOf(master, sec) {
  if (sec !== section) { pres.addSection({ title: sec }); section = sec; }
  return pres.addSlide({ masterName: master, sectionTitle: sec });
}
function content(sec, kicker, title) {
  const s = slideOf("CONTENT", sec);
  s.addText([{ text: kicker.toUpperCase(), options: { charSpacing: 2 } }], { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  return s;
}
function T(s, text, o) {
  s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontSize: 18, color: C.INK, valign: "top" }, o));
}
function box(s, x, y, w, h, fill, line) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.07, fill: { color: fill },
    line: line ? { color: line, width: 1 } : { color: fill, width: 0 } });
}
function rect(s, x, y, w, h, fill) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 } });
}
function disc(s, x, y, d, fill, label, color = C.WHITE, size = 16) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0 } });
  if (label !== undefined) T(s, String(label), { x, y, w: d, h: d, align: "center", valign: "middle", fontSize: size, bold: true, color });
}
function arrow(s, x, y, w, color = C.MUTED) {
  s.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color, width: 1.75, endArrowType: "triangle" } });
}
function img(s, name, x, y, w, altText) {
  const file = path.join(FIG, name), b = fs.readFileSync(file);
  const h = (w * b.readUInt32BE(20)) / b.readUInt32BE(16);
  s.addImage({ path: file, x, y, w, h, altText });
  return h;
}
const label = (s, text, x, y, w, color = C.ORANGE) =>
  T(s, [{ text: text.toUpperCase(), options: { charSpacing: 2 } }], { x, y, w, h: 0.28, fontSize: 13, bold: true, color });
const P = (text, o = {}) => ({ text, options: Object.assign({ breakLine: true, paraSpaceAfter: 8 }, o) });
const chartText = { catAxisLabelFontFace: "Calibri", valAxisLabelFontFace: "Calibri", dataLabelFontFace: "Calibri",
  legendFontFace: "Calibri", titleFontFace: "Calibri", catAxisLabelColor: C.INK, valAxisLabelColor: C.MUTED, dataLabelColor: C.INK };
const teamLine = (sep) => TEAM.join(sep);

// ------------------------------------------------------------------ 1 title
{
  const s = slideOf("DARK", "Opening");
  s.addImage({ path: path.join(FIG, "title_net.png"), x: 8.3, y: 0.95, w: 4.75, h: 4.75, altText: "The 22 EEG electrodes as a network; C3, Cz and C4 over the motor cortex glow orange." });
  label(s, "Final review  ·  CSE4006 Deep Learning", 0.75, 0.9, 7, C.GLOW);
  T(s, "Deep Learning–Based Neural Decoder for EEG Motor Imagery", { x: 0.75, y: 1.3, w: 7.6, h: 2.3,
    fontFace: "Georgia", fontSize: 36, bold: true, color: C.WHITE });
  T(s, "Cross-subject decoding on BCI Competition IV-2a, tested on people the model has never seen",
    { x: 0.75, y: 3.85, w: 7.0, h: 0.8, fontSize: 19, color: C.PALE });
  const two = TEAM.some((n) => n.includes("("));
  T(s, [{ text: "Group 5", options: { bold: true, breakLine: true, paraSpaceAfter: 4 } },
        { text: two ? `${TEAM[0]}   ·   ${TEAM[1]}` : teamLine("  ·  "), options: { breakLine: two } },
        ...(two ? [{ text: `${TEAM[2]}   ·   ${TEAM[3]}` }] : [])],
    { x: 0.75, y: 5.05, w: 7.6, h: two ? 0.95 : 0.7, fontSize: 18, color: C.WHITE });
  T(s, "School of Computer Science and Engineering, VIT-AP University  ·  Guide: Dr. Mohan Allam",
    { x: 0.75, y: two ? 6.12 : 5.9, w: 8.5, h: 0.32, fontSize: 14, color: C.PALE });
  T(s, "github.com/sathvikparangi907-web/neural-decoder-eeg-motor-imagery",
    { x: 0.75, y: two ? 6.48 : 6.26, w: 8.5, h: 0.3, fontSize: 13, color: "8FA6C9" });
  s.addNotes("We are Group 5. Our project asks a simple question: can a decoder read imagined movements from the EEG of " +
    "someone it has never seen, with no calibration session? We will show what we built, the one result that matters, " +
    "and what we learned about why decoders fail on new people.");
}

// ------------------------------------------------------------------ 2 recap
{
  const s = content("Context", "Recap of the phases", "Three phases: problem, design, build");
  const phases = [
    ["Phase 1", "The problem", "Every new user needs a calibration session first. We surveyed the published decoders.", false],
    ["Phase 2", "The design", "HCT-Net designed at 20,996 parameters, with a leave-one-subject-out test plan.", false],
    ["Phase 3", "The build", "Seven activities built and run. Six decoders compared; the final model has 3,924 parameters.", true],
  ];
  s.addShape(pres.shapes.LINE, { x: M + 1.95, y: 1.95, w: 8.2, h: 0, line: { color: C.RULE, width: 1.5 } });
  phases.forEach(([ph, title, body, dark], i) => {
    const x = M + i * (3.95 + 0.17), y = 2.35;
    disc(s, x + 1.8, 1.8, 0.3, i === 2 ? C.ORANGE : C.BLUE);
    box(s, x, y, 3.95, 3.15, dark ? C.NAVY : C.CARD);
    label(s, ph, x + 0.35, y + 0.35, 3, dark ? C.GLOW : C.ORANGE);
    T(s, title, { x: x + 0.35, y: y + 0.75, w: 3.3, h: 0.5, fontFace: "Georgia", fontSize: 24, bold: true, color: dark ? C.WHITE : C.NAVY });
    T(s, body, { x: x + 0.35, y: y + 1.4, w: 3.3, h: 1.6, fontSize: 18, color: dark ? C.PALE : C.INK });
  });
  box(s, M, 5.8, CW, 0.85, C.CARD2);
  T(s, [{ text: "Objective throughout: ", options: { bold: true } }, { text: "decode four imagined movements from the EEG of a person the model has never seen, with no calibration session." }],
    { x: M + 0.35, y: 5.8, w: CW - 0.7, h: 0.85, valign: "middle", fontSize: 18 });
  s.addNotes("A quick recap. Phase 1 defined the problem and surveyed the literature. Phase 2 designed HCT-Net and the test " +
    "plan. Phase 3, which this review covers, built everything, ran it, and cut the model from 20,996 to 3,924 parameters.");
}

// ------------------------------------------------------------------ 3 problem
{
  const s = content("The problem", "Problem statement", "Decoders fail on people they have not seen");
  T(s, [
    P("A brain–computer interface turns imagined movement into commands, for people with ALS, spinal-cord injury or stroke."),
    P("Today every new user must first record a labelled calibration session."),
    { text: "Goal: a decoder that works for a new person with zero calibration.", options: { bold: true, color: C.NAVY } },
  ], { x: M, y: 1.95, w: 5.3, h: 4.4, fontSize: 20, paraSpaceAfter: 14 });
  s.addChart(pres.charts.BAR, [
    { name: "Same person (within subject)", labels: ["BCI IV-2a, 4 classes", "BCI IV-2b, 2 classes"], values: [82.52, 88.49] },
    { name: "New person (leave-one-subject-out)", labels: ["BCI IV-2a, 4 classes", "BCI IV-2b, 2 classes"], values: [58.64, 76.27] },
  ], Object.assign({}, chartText, {
    x: 6.2, y: 1.75, w: 6.5, h: 4.55, barDir: "col", barGapWidthPct: 70, chartColors: [C.NAVY, C.ORANGE],
    valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 100, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", dataLabelFontSize: 16, dataLabelFontBold: true,
    catAxisLabelFontSize: 16, showLegend: true, legendPos: "t", legendFontSize: 15,
    showTitle: true, title: "CTNet [1]: familiar person vs new person", titleFontSize: 16, titleColor: C.INK,
  }));
  T(s, "−23.88 points", { x: 6.95, y: 6.32, w: 2.6, h: 0.32, align: "center", fontSize: 16, bold: true, color: C.ORANGE });
  T(s, "−12.22 points", { x: 9.95, y: 6.32, w: 2.6, h: 0.32, align: "center", fontSize: 16, bold: true, color: C.ORANGE });
  s.addNotes("This is the problem. CTNet, a strong recent model, scores 82.52% on four classes when the test person was in " +
    "training, but 58.64% on someone new: almost 24 points lower. On the two-class dataset the drop is 12 points. The second " +
    "number is what a real first-time user would get, which is why every user calibrates first today.");
}

// ------------------------------------------------------------------ 4 why it is hard
{
  const s = content("The problem", "Why unseen people are difficult", "Every person's EEG sits in its own place");
  img(s, "pca.png", M, 1.75, 7.2, "Two scatter plots of trials: before alignment, trials from three people form separate clouds; after Euclidean alignment they overlap.");
  T(s, "Each dot is one trial. Left: before alignment. Right: after Euclidean alignment [4].", { x: M, y: 5.65, w: 7.2, h: 0.35, fontSize: 13, color: C.MUTED });
  T(s, "46.8%", { x: 8.35, y: 1.8, w: 4.4, h: 1.0, fontFace: "Georgia", fontSize: 54, bold: true, color: C.ORANGE });
  T(s, "of trials lie closer to their own person's centre than to anyone else's. Chance is 11.1%.", { x: 8.35, y: 2.85, w: 4.35, h: 0.95, fontSize: 18 });
  T(s, "22.9%", { x: 8.35, y: 3.95, w: 4.4, h: 0.8, fontFace: "Georgia", fontSize: 40, bold: true, color: C.BLUE });
  T(s, "after Euclidean alignment of each person's data.", { x: 8.35, y: 4.75, w: 4.35, h: 0.6, fontSize: 18 });
  T(s, "Skull, cortex, cap position and imagery strategy differ, so the signal carries the person as well as the movement.",
    { x: 8.35, y: 5.5, w: 4.35, h: 1.15, fontSize: 18, color: C.MUTED });
  s.addNotes("Why is a new person so hard? Each person's EEG carries a strong personal signature. Using only the power of the " +
    "22 channels, 46.8% of trials sit closer to their own person's centre than to anyone else's, against 11.1% by chance. " +
    "Euclidean alignment cuts that to 22.9%. A model trained on seven people meets an eighth whose signals sit somewhere " +
    "new. (Article, Fig. 6.)");
}

// ------------------------------------------------------------------ 4a objectives
{
  const s = content("Objectives and survey", "Objectives", "Six objectives, set before the build");
  const objs = [
    ["Pipeline", "A reproducible preprocessing and evaluation pipeline for BCI Competition IV-2a"],
    ["Baselines", "EEGNet, ATCNet, CTNet and EEG Conformer, with FBCSP as a classical control, under one protocol"],
    ["HCT-Net", "Combine EEGNet's convolutional front end with windowed Transformer attention"],
    ["Unseen people", "Leave-one-subject-out testing: every number comes from a person the model never saw"],
    ["Metrics", "Accuracy, Cohen's κ, precision, recall and F1, per person and on average, with model size"],
    ["Honest answer", "State whether the hybrid helps new people while staying small, whichever way it goes"],
  ];
  objs.forEach(([t, body], i) => {
    const x = M + (i % 3) * (3.95 + 0.14), y = 1.8 + Math.floor(i / 3) * 2.45;
    box(s, x, y, 3.95, 2.25, i === 5 ? C.NAVY : C.CARD);
    disc(s, x + 0.3, y + 0.3, 0.55, i === 5 ? C.ORANGE : C.BLUE, i + 1, C.WHITE, 18);
    T(s, t, { x: x + 1.0, y: y + 0.3, w: 2.8, h: 0.55, valign: "middle", fontFace: "Georgia", fontSize: 22, bold: true, color: i === 5 ? C.WHITE : C.NAVY });
    T(s, body, { x: x + 0.3, y: y + 1.0, w: 3.4, h: 1.15, fontSize: 17, color: i === 5 ? C.PALE : C.INK });
  });
  s.addNotes("These are the six objectives we set in the solution design, before building anything. The last one matters " +
    "most to us: we committed to reporting whether the hybrid model helps on new people, whichever way the answer went.");
}

// ------------------------------------------------------------------ 4b literature survey
{
  const s = content("Objectives and survey", "Literature survey", "What the published models do on a new person");
  const head = ["Model", "Parameters", "Main idea", "What HCT-Net takes", "New person*"].map((t, i) => ({ text: t,
    options: { bold: true, color: C.WHITE, fill: { color: C.NAVY }, align: i === 1 || i === 4 ? "center" : "left" } }));
  const rows = [
    ["FBCSP + LDA (2008) [11]", "—", "Hand-designed spatial filters per frequency band, then a linear classifier", "Classical control only", "not reported"],
    ["EEGNet (2018) [7]", "3,188", "Compact convolutions: frequency, then spatial, then a summary", "The whole convolutional front end", "56.85%"],
    ["ATCNet (2023) [8]", "113,732", "Attention and temporal convolution inside sliding windows", "Attention limited to short windows", "not reported"],
    ["EEG Conformer (2023) [6]", "697,412", "Convolution for local features, a Transformer across the trial", "Convolution first, attention after", "53.41%"],
    ["CTNet (2024) [1]", "152,364", "EEGNet-style front end feeding a six-layer Transformer", "The encoder, cut to two layers", "58.64%"],
  ].map((r, k) => r.map((t, i) => ({ text: t, options: { align: i === 1 || i === 4 ? "center" : "left",
    bold: i === 0 || i === 4, color: i === 4 && t.endsWith("%") ? C.ORANGE : C.INK, fill: { color: k % 2 ? C.WHITE : "F6F8FB" } } })));
  s.addTable([head, ...rows], { x: M, y: 1.7, w: CW, colW: [2.75, 1.4, 3.9, 2.6, 1.48], rowH: 0.72, fontSize: 15,
    fontFace: "Calibri", valign: "middle", border: { type: "solid", pt: 0.5, color: C.RULE }, margin: [0, 0.1, 0, 0.1] });
  T(s, "* Published leave-one-subject-out accuracy on BCI IV-2a, from the CTNet paper's re-runs under one protocol [1]. Parameters for our 875-sample input.",
    { x: M, y: 6.15, w: CW, h: 0.3, fontSize: 12, color: C.MUTED });
  T(s, [{ text: "Gap: ", options: { bold: true, color: C.NAVY } },
        { text: "size does not predict accuracy on a new person, and two of the five have no published new-person figure." }],
    { x: M, y: 6.45, w: CW, h: 0.4, fontSize: 16 });
  s.addNotes("Our literature survey traced the path from hand-designed features to compact convolutional networks and then " +
    "to attention and Transformers. Two things stood out. Size does not predict accuracy on a new person: EEG Conformer has " +
    "219 times as many parameters as EEGNet and is 3.4 points less accurate. And the published numbers come from different " +
    "protocols, so they cannot be ranked. That is the gap our project fills.");
}

// ------------------------------------------------------------------ 5 novelty
{
  const s = content("The idea", "Our novelty", "What is new in this project?");
  const rows = [
    ["Does a larger network help a new, unseen person?", "No reliable benefit from added depth, width or attention", C.ORANGE],
    ["Does reducing the signal difference between people help?", "Yes: Euclidean alignment and batch-norm adaptation improved transfer", C.BLUE],
    ["Can every decision be made without the test labels?", "Yes: the validation person and the test person were kept separate", C.BLUE],
  ];
  label(s, "We tested", M + 0.35, 1.75, 5, C.NAVY);
  label(s, "What we found", 6.85, 1.75, 5, C.NAVY);
  rows.forEach(([q, a, col], i) => {
    const y = 2.15 + i * 1.18;
    box(s, M, y, CW, 1.05, i % 2 ? C.WHITE : C.CARD, i % 2 ? C.RULE : undefined);
    T(s, q, { x: M + 0.35, y, w: 5.65, h: 1.05, valign: "middle", fontSize: 20 });
    T(s, a, { x: 6.85, y, w: 5.6, h: 1.05, valign: "middle", fontSize: 20, bold: true, color: col });
  });
  T(s, "The important factor was reducing person-to-person signal mismatch, not making the network bigger.",
    { x: M, y: 5.85, w: CW, h: 1.0, fontFace: "Georgia", fontSize: 26, bold: true, color: C.NAVY });
  s.addNotes("This is what is new. We did not invent a new layer. We asked three questions under one strict, fair protocol. " +
    "Does a bigger network help a new person? No. Does reducing the difference between people help? Yes, clearly. Can every " +
    "decision be made without touching the test labels? Yes, and we did exactly that. The lesson: reduce the mismatch between " +
    "people, do not grow the model.");
}

// ------------------------------------------------------------------ 6 data
{
  const s = content("Data and protocol", "Dataset", "Our data: 9 people, 4 imagined movements");
  const stats = [["9", "people, A01 to A09"], ["22", "EEG electrodes"], ["4", "movements: left hand, right hand, feet, tongue"], ["5,184", "labelled trials, two days per person"]];
  stats.forEach(([n, l], i) => {
    const x = M + i * (2.93 + 0.18);
    box(s, x, 1.75, 2.93, 1.75, C.CARD);
    T(s, n, { x: x + 0.3, y: 1.92, w: 2.4, h: 0.75, fontFace: "Georgia", fontSize: 40, bold: true, color: C.NAVY });
    T(s, l, { x: x + 0.3, y: 2.7, w: 2.45, h: 0.75, fontSize: 16, color: C.MUTED });
  });
  T(s, "One trial, and the window the decoder sees", { x: M, y: 3.8, w: 8, h: 0.35, fontSize: 18, bold: true });
  const x0 = M + 0.1, sec = 1.95, X = (t) => x0 + t * sec, yb = 4.3;
  [[0, 2, "Fixation cross", C.CARD2, C.INK], [2, 1.25, "Arrow cue", "D7E2F2", C.INK], [3.25, 2.75, "Imagining the movement", C.BLUE, C.WHITE]].forEach(([t, d, lab, fill, col]) => {
    rect(s, X(t) + 0.02, yb, d * sec - 0.04, 0.6, fill);
    T(s, lab, { x: X(t), y: yb, w: d * sec, h: 0.6, align: "center", valign: "middle", fontSize: 16, color: col });
  });
  rect(s, X(2.5), yb + 0.75, 3.5 * sec, 0.45, C.ORANGE);
  T(s, "875 samples analysed", { x: X(2.5), y: yb + 0.75, w: 3.5 * sec, h: 0.45, align: "center", valign: "middle", fontSize: 16, bold: true, color: C.WHITE });
  for (let t = 0; t <= 6; t += 2) T(s, `${t} s`, { x: X(t) - 0.3, y: yb + 1.3, w: 0.6, h: 0.28, align: "center", fontSize: 14, color: C.MUTED });
  T(s, "Window: 0.5–4.0 s after the cue, leaving out the response to the arrow itself. Chance is 25%.",
    { x: M, y: 5.95, w: CW, h: 0.55, fontSize: 18, color: C.MUTED });
  T(s, "Brunner et al. [3]; 250 Hz, two sessions per person on different days.", { x: M, y: 6.6, w: 9, h: 0.3, fontSize: 12, color: C.MUTED });
  s.addNotes("Our data is BCI Competition IV-2a: nine people, 22 electrodes, four imagined movements, 5,184 trials over two " +
    "days per person. For each trial we analyse 3.5 seconds of imagery, 875 samples, starting half a second after the arrow " +
    "so the model cannot learn the arrow itself.");
}

// ------------------------------------------------------------------ 7 LOSO
{
  const s = content("Data and protocol", "Training and evaluation", "Each person is tested once, as a stranger");
  const cw = 0.55, ch = 0.43, g = 0.06, gx = M + 1.15, gy = 2.2;
  for (let c = 0; c < 9; c++) T(s, `A0${c + 1}`, { x: gx + c * (cw + g), y: 1.82, w: cw, h: 0.3, align: "center", fontSize: 14 });
  for (let f = 0; f < 9; f++) {
    T(s, `Fold ${f + 1}`, { x: M, y: gy + f * (ch + g), w: 1.05, h: ch, valign: "middle", fontSize: 14, color: C.MUTED });
    for (let c = 0; c < 9; c++) {
      const role = c === f ? "test" : c === (f + 1) % 9 ? "val" : "";
      rect(s, gx + c * (cw + g), gy + f * (ch + g), cw, ch, role === "test" ? C.NAVY : role === "val" ? C.ORANGE : "D9E1EC");
    }
  }
  [["D9E1EC", "Train (7 people)"], [C.ORANGE, "Validation (1)"], [C.NAVY, "Test, unseen (1)"]].forEach(([col, t], i) => {
    rect(s, gx + i * 1.95, 6.68, 0.24, 0.24, col);
    T(s, t, { x: gx + i * 1.95 + 0.32, y: 6.64, w: 1.6, h: 0.32, fontSize: 13, color: C.MUTED });
  });
  T(s, [
    P("7 people train the model."), P("1 person validates: it chooses between designs."),
    P("1 person is tested once, at the very end.", { paraSpaceAfter: 18 }),
    { text: "Early stopping uses a 10% stop-set from the training people, and every setting runs with three seeds.", options: { color: C.MUTED } },
  ], { x: 7.6, y: 2.1, w: 5.1, h: 4.4, fontSize: 20, paraSpaceAfter: 10 });
  s.addNotes("Leave-one-subject-out. In every fold, seven people train, one validates and one is tested. The validation " +
    "person only chooses between designs; the test person is scored once at the end and never steers a decision. Early " +
    "stopping uses a separate 10% stop-set. Every setting runs with three seeds, and a change is kept only if it adds at " +
    "least 0.75 points on validation.");
}

// ------------------------------------------------------------------ 8 pipeline
{
  const s = content("Method", "Label-free pipeline", "Nothing about the new person is ever labelled");
  const groups = [
    ["Once", "per person, cached", ["Keep the 22 EEG channels", "Band-pass 4–38 Hz", "Cut 0.5–4.0 s after the cue", "Flag artefacts above 100 µV"], false],
    ["Every fold", "training people only", ["Euclidean alignment per session [4]", "Standardise with training statistics", "Augment by recombining same-class segments"], false],
    ["New person", "no labels, no retraining", ["Align their own unlabelled trials", "Re-estimate batch-norm statistics [5]", "Predict the imagined movement"], true],
  ];
  groups.forEach(([h, sub, items, dark], i) => {
    const x = M + i * (3.95 + 0.17), y = 1.8, hh = 3.95;
    box(s, x, y, 3.95, hh, dark ? C.NAVY : C.CARD);
    T(s, h, { x: x + 0.35, y: y + 0.3, w: 3.3, h: 0.55, fontFace: "Georgia", fontSize: 26, bold: true, color: dark ? C.WHITE : C.NAVY });
    T(s, sub, { x: x + 0.35, y: y + 0.88, w: 3.3, h: 0.35, fontSize: 16, color: dark ? C.GLOW : C.ORANGE, bold: true });
    items.forEach((it, k) => {
      disc(s, x + 0.35, y + 1.47 + k * 0.6, 0.14, dark ? C.GLOW : C.BLUE);
      T(s, it, { x: x + 0.65, y: y + 1.36 + k * 0.6, w: 3.1, h: 0.55, fontSize: 18, color: dark ? C.WHITE : C.INK });
    });
    if (i < 2) arrow(s, x + 3.97, y + hh / 2, 0.13);
  });
  box(s, M, 6.0, CW, 0.75, C.PEACH);
  T(s, [{ text: "Zero calibration: ", options: { bold: true } }, { text: "both steps that adapt to a new person use only that person's unlabelled trials." }],
    { x: M + 0.35, y: 6.0, w: CW - 0.7, h: 0.75, valign: "middle", fontSize: 18 });
  s.addNotes("The pipeline has three parts. Once per person: channels, filtering, cutting trials, flagging artefacts. In " +
    "every fold, on the training people: alignment, standardisation and augmentation. And for a new person, two steps " +
    "that need no labels at all: align their own unlabelled trials, and re-estimate the batch-norm statistics on them. " +
    "No label, no gradient step, no retraining.");
}

// ------------------------------------------------------------------ 9 model
{
  const s = content("Method", "Model architecture", "HCT-Net A: a compact hybrid model");
  const blocks = [["Input", "one trial, 3.5 s", C.CARD, C.INK], ["Convolution", "EEGNet-style: temporal, spatial, separable", C.BLUE, C.WHITE],
    ["5 windows", "11 steps each, overlapping", C.CARD, C.INK], ["Transformer", "1 encoder layer, 2 heads", C.BLUE, C.WHITE],
    ["Pool + linear", "softmax over the classes", C.CARD, C.INK]];
  const bw = 2.13, gap = (CW - 5 * bw) / 4, y = 1.85, bh = 1.75;
  blocks.forEach(([h, sub, fill, col], i) => {
    const x = M + i * (bw + gap);
    box(s, x, y, bw, bh, fill);
    T(s, h, { x: x + 0.15, y: y + 0.25, w: bw - 0.3, h: 0.45, align: "center", fontSize: 20, bold: true, color: col });
    T(s, sub, { x: x + 0.15, y: y + 0.78, w: bw - 0.3, h: 0.85, align: "center", fontSize: 16, color: col === C.WHITE ? "DCE6F5" : C.MUTED });
    if (i < 4) arrow(s, x + bw + 0.04, y + bh / 2, gap - 0.08);
  });
  const stats = [["22 × 875", "input: electrodes × samples"], ["3,924", "trainable parameters"], ["1", "Transformer encoder layer"], ["4", "classes out"]];
  stats.forEach(([n, l], i) => {
    const x = M + i * (2.93 + 0.18);
    T(s, n, { x, y: 4.0, w: 2.93, h: 0.8, align: "center", fontFace: "Georgia", fontSize: 38, bold: true, color: i === 1 ? C.BLUE : C.NAVY });
    T(s, l, { x, y: 4.82, w: 2.93, h: 0.4, align: "center", fontSize: 18, color: C.MUTED });
  });
  box(s, M, 5.6, CW, 1.05, C.CARD2);
  T(s, [{ text: "Borrowed building blocks: ", options: { bold: true } },
        { text: "EEGNet-style convolution [7] feeding a Transformer encoder [9]. The Phase 2 design had 20,996 parameters; a size sweep showed the smallest version did as well." }],
    { x: M + 0.35, y: 5.6, w: CW - 0.7, h: 1.05, valign: "middle", fontSize: 18 });
  s.addNotes("The final model, HCT-Net A. A trial of 22 electrodes by 875 samples goes through an EEGNet-style convolutional " +
    "front end, is cut into five overlapping windows, passes one small Transformer layer, and is averaged and classified. " +
    "3,924 parameters: 1,456 in the convolution, 2,224 in the encoder, 176 for positions and 68 in the head. The Phase 2 " +
    "design was five times bigger and no better. (Article, Section IV-C and Table XVI.)");
}

// ------------------------------------------------------------------ 10 result
{
  const s = content("Result", "Final result", "53.6% vs 54.3%: a tie, not a win");
  const plot = { x: 0.24, y: 0.12, w: 0.66, h: 0.74 }, cx = M, cy = 1.7, cwid = 8.0, chgt = 3.55;
  s.addChart(pres.charts.BAR, [{ name: "Accuracy", labels: ["EEGNet + BN", "HCT-Net A + BN"], values: [54.3, 53.6] }],
    Object.assign({}, chartText, {
      x: cx, y: cy, w: cwid, h: chgt, barDir: "bar", catAxisOrientation: "maxMin", barGapWidthPct: 45, layout: plot,
      chartColors: [C.ORANGE, C.BLUE], showLegend: false, valAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 100,
      valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineShow: false,
      showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0\\%", dataLabelFontSize: 30, dataLabelFontBold: true,
      catAxisLabelFontSize: 18, showTitle: true, title: "Accuracy on people never seen in training", titleFontSize: 16, titleColor: C.INK,
    }));
  const chanceX = cx + cwid * (plot.x + 0.25 * plot.w), top = cy + chgt * plot.y, bot = cy + chgt * (plot.y + plot.h);
  s.addShape(pres.shapes.LINE, { x: chanceX, y: top, w: 0, h: bot - top, line: { color: C.MUTED, width: 1.25, dashType: "dash" } });
  T(s, "chance 25%", { x: chanceX - 0.6, y: bot + 0.04, w: 1.2, h: 0.28, align: "center", fontSize: 13, color: C.MUTED });
  T(s, [{ text: "Difference: ", options: { color: C.MUTED } }, { text: "0.7 points", options: { bold: true, breakLine: true } },
        { text: "Predefined decision threshold: ", options: { color: C.MUTED } }, { text: "0.75 points", options: { bold: true, breakLine: true } },
        { text: "Conclusion: ", options: { color: C.MUTED } }, { text: "a tie, not a claimed win", options: { bold: true, color: C.ORANGE } }],
    { x: M + 0.25, y: 5.55, w: 7.6, h: 1.2, fontSize: 18, paraSpaceAfter: 2 });
  const cards = [["3,924", "parameters in HCT-Net A"], ["κ = 0.381", "Cohen's kappa (0 = chance)"], ["9", "people, each tested once as a stranger"]];
  cards.forEach(([n, l], i) => {
    const y = 1.75 + i * 1.68;
    box(s, 9.0, y, 3.73, 1.48, i === 0 ? C.NAVY : C.CARD);
    T(s, n, { x: 9.3, y: y + 0.18, w: 3.2, h: 0.7, fontFace: "Georgia", fontSize: 32, bold: true, color: i === 0 ? C.WHITE : C.NAVY });
    T(s, l, { x: 9.3, y: y + 0.88, w: 3.2, h: 0.5, fontSize: 16, color: i === 0 ? C.PALE : C.MUTED });
  });
  s.addNotes("This is our headline. Under the final protocol, mean of three seeds, HCT-Net A scores 53.6% on people it " +
    "has never seen and EEGNet scores 54.3%. The 0.7-point gap is inside the 0.75-point threshold we fixed before " +
    "testing, and the 95% interval runs from minus 4.3 to plus 2.9. So we call it a tie, not a win. HCT-Net A has 3,924 " +
    "parameters and a kappa of 0.381. (Article, Tables XVII and XVIII.)");
}

// ------------------------------------------------------------------ 11 helped / failed
{
  const s = content("Result", "What helped, what failed", "Alignment helped; extra size did not");
  const col = (x, title, color, items) => {
    T(s, title, { x, y: 1.75, w: 5.95, h: 0.5, fontFace: "Georgia", fontSize: 26, bold: true, color });
    items.forEach(([h, d], i) => {
      const y = 2.4 + i * 1.32;
      box(s, x, y, 5.95, 1.18, i % 2 ? C.WHITE : C.CARD, i % 2 ? C.RULE : undefined);
      T(s, h, { x: x + 0.3, y: y + 0.13, w: 5.4, h: 0.45, fontSize: 20, bold: true });
      T(s, d, { x: x + 0.3, y: y + 0.6, w: 5.4, h: 0.45, fontSize: 18, color: color === C.ORANGE ? C.ORANGE : C.BLUE });
    });
  };
  col(M, "Helped", C.BLUE, [
    ["Euclidean alignment [4]", "+9.4 points on EEGNet, 9 of 9 people better"],
    ["Batch-norm re-estimation [5]", "+4.3 points on HCT-Net A, 9 of 9 people better"],
  ]);
  col(6.78, "Did not help", C.ORANGE, [
    ["5× more parameters (design D)", "52.7% vs 53.6%: no gain"],
    ["Attention", "removing it cost nothing (48.8% vs 46.9%, v1)"],
    ["Batch norm inside the encoder", "49.3% vs 53.6% on validation, 9 of 9 worse"],
  ]);
  T(s, "Protocol v2, three seeds, unless marked v1 (earlier protocol, one seed). Article Tables X, XI, XIV and XVI–XVIII.",
    { x: M, y: 6.5, w: CW, h: 0.3, fontSize: 12, color: C.MUTED });
  s.addNotes("What moved results, and what did not. Alignment added 9.4 points to EEGNet and helped all nine people. " +
    "Re-estimating batch-norm statistics on the new person's unlabelled trials added 4.3 points to HCT-Net A, again for all " +
    "nine. On the other side: five times more parameters gave nothing, removing attention cost nothing, and batch norm " +
    "inside the encoder made every person worse.");
}

// ------------------------------------------------------------------ 12 per person
{
  const s = content("Result", "Per-person results", "Per person, accuracy runs from 31% to 77%");
  const subs = ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09"];
  const plot = { x: 0.07, y: 0.16, w: 0.86, h: 0.66 }, cx = M, cy = 1.65, cwid = 8.3, chgt = 4.95;
  s.addChart(pres.charts.BAR, [
    { name: "HCT-Net A (ours)", labels: subs, values: [72.2, 31.4, 76.7, 44.6, 37.6, 45.0, 51.6, 65.0, 58.5] },
    { name: "EEGNet", labels: subs, values: [74.4, 30.7, 77.3, 46.1, 36.6, 48.8, 42.5, 65.3, 67.0] },
  ], Object.assign({}, chartText, {
    x: cx, y: cy, w: cwid, h: chgt, barDir: "col", barGapWidthPct: 55, layout: plot, chartColors: [C.BLUE, C.ORANGE],
    valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25, valAxisLabelFontSize: 14, valAxisLabelFormatCode: "0\\%",
    valGridLine: { color: "E3E8EF", size: 0.75 }, catGridLine: { style: "none" }, catAxisLabelFontSize: 16,
    showLegend: true, legendPos: "t", legendFontSize: 16, showValue: false,
  }));
  const yAt = (v) => cy + chgt * (plot.y + plot.h * (1 - v / 100));
  s.addShape(pres.shapes.LINE, { x: cx + cwid * plot.x, y: yAt(25), w: cwid * plot.w, h: 0, line: { color: C.MUTED, width: 1.25, dashType: "dash" } });
  T(s, "chance", { x: cx + cwid * (plot.x + plot.w) + 0.06, y: yAt(25) - 0.14, w: 0.75, h: 0.28, fontSize: 13, color: C.MUTED });
  const notes = [["31–77%", "A02 lowest, A03 highest"], ["4 of 9", "people below 46%: A02, A05, A04, A06"], ["Feet", "is the hardest class (appendix A3)"]];
  notes.forEach(([n, l], i) => {
    const y = 1.8 + i * 1.6;
    box(s, 9.2, y, 3.53, 1.4, i === 0 ? C.NAVY : C.CARD);
    T(s, n, { x: 9.5, y: y + 0.15, w: 3.0, h: 0.65, fontFace: "Georgia", fontSize: 30, bold: true, color: i === 0 ? C.WHITE : C.NAVY });
    T(s, l, { x: 9.5, y: y + 0.8, w: 3.05, h: 0.55, fontSize: 16, color: i === 0 ? C.PALE : C.MUTED });
  });
  T(s, "Test accuracy per person, protocol v2 with BN adaptation, mean of three seeds (article Table XXV).", { x: M, y: 6.62, w: 8.3, h: 0.3, fontSize: 12, color: C.MUTED });
  s.addNotes("The average hides a lot. Per person, accuracy runs from 31% for A02 to 77% for A03, and four of nine people stay " +
    "below 46%. The same people are hard for every model, and they are the people whose own two recording days differ " +
    "most. Feet is the hardest movement to recognise. Every person's result is reported in the article.");
}

// ------------------------------------------------------------------ 13 challenges
{
  const s = content("Reflection", "Challenges faced", "Three challenges, each solved and measured");
  const cards = [
    ["The validation person flattered itself", "It stopped training and chose designs.", "Early stopping moved to a 10% stop-set.", "Validation–test gap: 6.9 → 0.3 points"],
    ["One run was not enough", "Seed noise moved results by about a point.", "Three seeds and a 0.75-point rule.", "Two single-run gains failed and were dropped"],
    ["The Phase 2 model transferred worst", "46.9%: lowest of the five networks (v1).", "A size sweep and label-free adaptation.", "3,924 parameters, 53.6%: level with EEGNet"],
  ];
  cards.forEach(([h, prob, fix, res], i) => {
    const x = M + i * (3.95 + 0.17), y = 1.8;
    box(s, x, y, 3.95, 4.85, C.CARD);
    label(s, `Challenge ${i + 1}`, x + 0.35, y + 0.3, 3, C.ORANGE);
    T(s, h, { x: x + 0.35, y: y + 0.65, w: 3.3, h: 0.95, fontFace: "Georgia", fontSize: 21, bold: true, color: C.NAVY });
    T(s, [{ text: "Problem  ", options: { bold: true, color: C.ORANGE, breakLine: true } }, { text: prob, options: { breakLine: true, paraSpaceAfter: 10 } },
          { text: "Fix  ", options: { bold: true, color: C.BLUE, breakLine: true } }, { text: fix, options: { breakLine: true, paraSpaceAfter: 10 } },
          { text: "Result  ", options: { bold: true, color: C.NAVY, breakLine: true } }, { text: res, options: { bold: true } }],
      { x: x + 0.35, y: y + 1.65, w: 3.3, h: 3.05, fontSize: 18, paraSpaceAfter: 2 });
  });
  s.addNotes("Three problems we hit. First, our validation person both stopped training and chose designs, so it " +
    "flattered itself; moving early stopping to a separate stop-set closed the gap between validation and test from 6.9 to " +
    "0.3 points. Second, one run was too noisy, so every setting got three seeds and a fixed threshold. Third, our Phase 2 " +
    "design transferred worst of the networks; the size sweep and adaptation brought it level with EEGNet at a fifth of the size.");
}

// ------------------------------------------------------------------ 14 limitations
{
  const s = content("Reflection", "Limitations", "What this study cannot claim");
  const rows = [
    ["5.4", "points", "Nine people is a small sample: differences below about 5.4 points cannot be detected reliably (80% power)."],
    ["v1", "only", "ATCNet, CTNet and EEG Conformer have one-seed results under the earlier protocol; they were not re-run under v2."],
    ["53.6%", "", "is not ready for daily use: four people stay below 46%, and a familiar person scores 18.5 points higher."],
  ];
  rows.forEach(([big, unit, text], i) => {
    const y = 1.85 + i * 1.6;
    box(s, M, y, CW, 1.4, i % 2 ? C.WHITE : C.CARD, i % 2 ? C.RULE : undefined);
    T(s, [{ text: big, options: { fontSize: 40 } }, ...(unit ? [{ text: ` ${unit}`, options: { fontSize: 20 } }] : [])],
      { x: M + 0.4, y, w: 2.9, h: 1.4, valign: "middle", fontFace: "Georgia", bold: true, color: C.ORANGE });
    T(s, text, { x: 3.65, y, w: 8.85, h: 1.4, valign: "middle", fontSize: 20 });
  });
  s.addNotes("Three honest limits. With nine people we can only detect differences above about 5.4 points, so small " +
    "differences between models are out of reach. The three large baselines were run only under our earlier protocol, with " +
    "one seed. And 53.6% is far from a usable product: four people stay below 46%, and the same model scores 18.5 points " +
    "higher on a familiar person.");
}

// ------------------------------------------------------------------ 15 conclusion
{
  const s = content("Close", "Conclusion and future scope", "Not size, but alignment and adaptation");
  box(s, M, 1.8, 6.0, 3.65, C.NAVY);
  T(s, "Conclusions", { x: M + 0.35, y: 2.05, w: 5.3, h: 0.5, fontFace: "Georgia", fontSize: 24, bold: true, color: C.WHITE });
  T(s, [P("HCT-Net A, 3,924 parameters: 53.6% on unseen people, a tie with EEGNet", { bullet: true }),
        P("Alignment (+9.4) and label-free adaptation (+4.3) moved results most", { bullet: true }),
        { text: "Above 3,924 parameters, extra size bought nothing", options: { bullet: true } }],
    { x: M + 0.35, y: 2.7, w: 5.35, h: 2.65, fontSize: 18, color: C.WHITE, paraSpaceAfter: 10 });
  box(s, 6.73, 1.8, 6.0, 3.65, C.CARD);
  T(s, "Future scope", { x: 7.08, y: 2.05, w: 5.3, h: 0.5, fontFace: "Georgia", fontSize: 24, bold: true, color: C.NAVY });
  T(s, [P("Adapt online as a new user's trials arrive", { bullet: true }),
        P("Pre-train on PhysioNet MI (109 people), then adapt", { bullet: true }),
        { text: "Re-run every baseline under the final protocol", options: { bullet: true } }],
    { x: 7.08, y: 2.7, w: 5.35, h: 2.65, fontSize: 18, paraSpaceAfter: 10 });
  box(s, M, 5.7, CW, 1.0, C.PEACH);
  T(s, [{ text: "Contribution: ", options: { bold: true } },
        { text: "the building blocks are borrowed; what is new is the measurement: six decoders in one fair pipeline, a strict selection protocol, and evidence that the cross-subject gap is not a capacity problem." }],
    { x: M + 0.35, y: 5.7, w: CW - 0.7, h: 1.0, valign: "middle", fontSize: 18 });
  s.addNotes("To conclude: our compact model ties EEGNet on people it has never seen. What moved results was reducing the " +
    "difference between people: alignment and label-free adaptation. Extra size bought nothing. Next we would adapt online " +
    "as a user's trials arrive, pre-train on larger datasets, and re-run every baseline under the final protocol.");
}

// ------------------------------------------------------------------ 16 closing
{
  const s = slideOf("DARK", "Close");
  s.addImage({ path: path.join(FIG, "title_net.png"), x: 9.35, y: 1.6, w: 3.6, h: 3.6, altText: "The EEG electrode network with C3, Cz and C4 highlighted." });
  T(s, "Bigger models were not the answer.", { x: 0.75, y: 2.1, w: 8.6, h: 0.75, fontFace: "Georgia", fontSize: 32, bold: true, color: C.WHITE });
  T(s, "Better subject alignment was.", { x: 0.75, y: 2.95, w: 8.6, h: 0.75, fontFace: "Georgia", fontSize: 32, bold: true, color: C.GLOW });
  T(s, "Thank you. Questions are welcome.", { x: 0.75, y: 4.3, w: 7.2, h: 0.5, fontSize: 22, color: C.PALE });
  T(s, `Group 5  ·  ${TEAM.map((n) => n.replace(/\s*\(.*\)/, "")).join(", ")}`, { x: 0.75, y: 6.3, w: 8, h: 0.35, fontSize: 14, color: C.PALE });
  s.addNotes("If you remember one thing: bigger models were not the answer; better alignment between people was. Thank you. " +
    "The appendix has the full baseline table, the confusion matrices and our references for questions.");
}

// ------------------------------------------------------------------ A1 activities
{
  const s = content("Appendix", "Appendix A1", "All seven Phase 3 activities are complete");
  ["Setup & data", "Preprocessing & EDA", "Five baselines", "HCT-Net", "Training & tuning", "Experiments", "Evaluation"].forEach((t, i) => {
    const x = M + i * (1.66 + 0.1);
    box(s, x, 1.8, 1.66, 1.45, C.CARD);
    T(s, String(i + 1).padStart(2, "0"), { x: x + 0.2, y: 1.95, w: 1.3, h: 0.45, fontFace: "Georgia", fontSize: 22, bold: true, color: C.BLUE });
    T(s, t, { x: x + 0.2, y: 2.45, w: 1.35, h: 0.75, fontSize: 16, bold: true });
  });
  const stats = [["6.9 → 0.3", "points between validation and test once early stopping got its own stop-set"],
    ["+4.3", "test points from label-free adaptation (49.3% → 53.6%); all nine people improve"],
    ["20,996 → 3,924", "parameters after the size sweep, with accuracy level or better"],
    ["6 decoders", "compared in one pipeline, every published figure traced to its source"]];
  stats.forEach(([n, l], i) => {
    const x = M + (i % 2) * (6.0 + 0.13), y = 3.6 + Math.floor(i / 2) * 1.6;
    box(s, x, y, 6.0, 1.42, C.WHITE, C.RULE);
    T(s, n, { x: x + 0.3, y: y + 0.13, w: 5.4, h: 0.62, fontFace: "Georgia", fontSize: 28, bold: true, color: C.NAVY });
    T(s, l, { x: x + 0.3, y: y + 0.76, w: 5.45, h: 0.6, fontSize: 16, color: C.MUTED });
  });
  s.addNotes("For questions about scope: all seven activities are complete and in the repository.");
}

// ------------------------------------------------------------------ A2 baseline table
{
  const s = content("Appendix", "Appendix A2", "Every model, with its protocol");
  const head = ["Model", "Parameters", "Protocol", "Test accuracy", "κ"].map((t, i) => ({ text: t,
    options: { bold: true, color: C.WHITE, fill: { color: C.NAVY }, align: i ? "center" : "left" } }));
  const groupRow = (t) => [{ text: t, options: { colspan: 5, bold: true, color: C.NAVY, fill: { color: C.CARD2 } } }];
  const rows = [
    groupRow("Final protocol v2: three seeds, BN adaptation"),
    ["HCT-Net A (ours)", "3,924", "v2", "53.6 ± 15.6", "0.381", true], ["EEGNet [7]", "3,188", "v2", "54.3 ± 17.0", "0.391"],
    ["HCT-Net D (Phase 2 design)", "20,996", "v2", "52.7 ± 15.3", "0.369"], ["TS-LR + re-centring, classical", "—", "deterministic", "50.5 ± 15.4", "0.340"],
    groupRow("Earlier protocol v1: one seed, no adaptation (not re-run under v2)"),
    ["ATCNet [8]", "113,732", "v1", "52.4 ± 17.5", "0.365"], ["EEG Conformer [6]", "697,412", "v1", "52.1 ± 14.6", "0.362"],
    ["EEGNet [7]", "3,188", "v1", "51.2 ± 17.0", "0.349"], ["CTNet [1]", "152,364", "v1", "50.2 ± 13.6", "0.336"],
    ["HCT-Net D", "20,996", "v1", "46.9 ± 17.5", "0.292"], ["FBCSP + LDA [11]", "—", "v1", "44.2 ± 13.0", "0.256"],
  ].map((r, k) => (r[0] && r[0].options ? r : r.slice(0, 5).map((t, i) => ({ text: t, options: {
    align: i ? "center" : "left", bold: !!r[5] || i === 3 || i === 4, color: r[5] ? C.NAVY : C.INK,
    fill: { color: r[5] ? "FBE3D0" : (k % 2 ? C.WHITE : "F6F8FB") } } }))));
  s.addTable([head, ...rows], { x: M, y: 1.6, w: CW, colW: [4.4, 1.7, 2.0, 2.4, 1.63], rowH: 0.36, fontSize: 14,
    fontFace: "Calibri", valign: "middle", border: { type: "solid", pt: 0.5, color: C.RULE }, margin: [0, 0.12, 0, 0.12] });
  T(s, "Test accuracy on unseen people, mean ± SD across the nine test people. v1 and v2 numbers are not a single ranking. Article Tables VIII and XVII.",
    { x: M, y: 6.6, w: CW, h: 0.3, fontSize: 12, color: C.MUTED });
  s.addNotes("The full comparison, with protocols kept apart. Only the top block is directly comparable with our final model.");
}

// ------------------------------------------------------------------ A3 confusion
{
  const s = content("Appendix", "Appendix A3", "Feet is the hardest class to recognise");
  img(s, "confusion.png", M + 0.1, 1.7, 8.3, "Confusion matrices for HCT-Net D and EEGNet: feet is recognised 30% and 39% of the time and is most often confused with tongue.");
  T(s, [P("Feet is recognised only 30% (HCT-Net D) and 39% (EEGNet) of the time.", { paraSpaceAfter: 12 }),
        P("Its errors go mostly to tongue: both sit near the middle of the head.", { paraSpaceAfter: 12 }),
        { text: "Left and right hand are recognised best.", options: {} }],
    { x: 9.3, y: 1.95, w: 3.45, h: 4.2, fontSize: 18 });
  T(s, "Percent of each true class, pooled over the nine test folds, protocol v1, one seed (article Fig. 19).", { x: M, y: 6.6, w: CW, h: 0.3, fontSize: 12, color: C.MUTED });
  s.addNotes("Per class, feet is the weakest: recognised about a third of the time and mostly confused with tongue.");
}

// ------------------------------------------------------------------ A4 references
{
  const s = content("Appendix", "References", "Sources cited in this presentation");
  const refs = [
    "W. Zhao et al., “CTNet: a convolutional transformer network for EEG-based motor imagery classification,” Sci. Rep., 2024.",
    "M. Tangermann et al., “Review of the BCI Competition IV,” Front. Neurosci., 2012.",
    "C. Brunner et al., “BCI Competition 2008 – Graz data set A,” Graz Univ. Technol., 2008.",
    "H. He and D. Wu, “Transfer learning for brain–computer interfaces: a Euclidean space data alignment approach,” IEEE Trans. Biomed. Eng., 2020.",
    "Y. Li et al., “Revisiting batch normalization for practical domain adaptation,” arXiv:1603.04779, 2016.",
    "Y. Song et al., “EEG Conformer: convolutional transformer for EEG decoding and visualization,” IEEE TNSRE, 2023.",
    "V. J. Lawhern et al., “EEGNet: a compact convolutional neural network for EEG-based BCIs,” J. Neural Eng., 2018.",
    "H. Altaheri et al., “Physics-informed attention temporal convolutional network for EEG-based motor imagery classification,” IEEE TII, 2023.",
    "A. Vaswani et al., “Attention is all you need,” NeurIPS, 2017.",
    "R. T. Schirrmeister et al., “Deep learning with convolutional neural networks for EEG decoding and visualization,” Hum. Brain Mapp., 2017.",
    "K. K. Ang et al., “Filter bank common spatial pattern (FBCSP) in brain–computer interface,” Proc. IJCNN, 2008.",
  ];
  const run = (r, i) => [{ text: `[${i + 1}]  `, options: { bold: true, color: C.BLUE, paraSpaceAfter: 9 } }, { text: r, options: { breakLine: true, paraSpaceAfter: 9 } }];
  T(s, refs.slice(0, 6).flatMap((r, i) => run(r, i)), { x: M, y: 1.75, w: 5.95, h: 5.0, fontSize: 14 });
  T(s, refs.slice(6).flatMap((r, i) => run(r, i + 6)), { x: 6.78, y: 1.75, w: 5.95, h: 5.0, fontSize: 14 });
  s.addNotes("Full references with volumes and pages are in the article.");
}

module.exports = { THEME };
if (require.main === module) {
  pres.writeFile({ fileName: OUT }).then(async (f) => {
    const helper = process.env.THEME_HELPER;
    if (helper) { const { applyTheme } = require(helper); await applyTheme(f, THEME); }
    console.log("written", f);
  });
}
