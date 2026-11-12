// Phase 2 Solution Design: the slides.
//
//   node deck.js                         names only (the public copy)
//   TEAM_JSON=team.json node deck.js     names from a local file, e.g. with registration numbers
//
// Run `python figs.py` first: the slides use the PNGs in fig/.
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const FIG = path.join(__dirname, "fig");
const OUT = path.join(process.env.OUT_DIR || __dirname, "Phase2_Presentation.pptx");
const TEAM = process.env.TEAM_JSON
  ? JSON.parse(fs.readFileSync(process.env.TEAM_JSON, "utf8"))
  : ["Ananya Gourishetty", "Haarika D", "Siddhanth Samal", "Sathvik P"];

const C = {
  INK: "14212B", MUTED: "5B6B78", DEEP: "0B2530", TEAL: "0E9F96", TEAL_D: "0B7C75", TEAL_L: "2EC4B6",
  RED: "E34948", TINT: "EEF4F5", TINT2: "E1ECEE", RULE: "D3DDE1", CONTEXT: "C3CDD3", SLATE: "3E5A66",
  AMBER: "EDA100", WHITE: "FFFFFF", PALE: "CFE3E6",
};
const THEME = {
  name: "Neural Decoder", headFontFace: "Georgia", bodyFontFace: "Calibri",
  colors: { dk1: C.INK, lt1: C.WHITE, dk2: C.DEEP, lt2: C.TINT, accent1: C.TEAL, accent2: C.RED,
            accent3: "2A78D6", accent4: "EB6834", accent5: "1BAF7A", accent6: C.AMBER, hlink: C.TEAL_D, folHlink: C.MUTED },
};
const W = 13.333, H = 7.5, M = 0.6, CW = W - 2 * M;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.author = "Group 5";
pres.company = "VIT-AP University";
pres.title = "Phase 2 Solution Design: Cross-Subject Motor Imagery EEG Classification";
pres.subject = "CSE4006 Deep Learning";

pres.defineSlideMaster({
  title: "COVER",
  background: { path: path.join(FIG, "cover_slide.png") },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.75, y: 1.55, w: 8.4, h: 1.35, fontFace: "Georgia",
      fontSize: 36, bold: true, color: C.WHITE, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.75, y: 3.05, w: 6.2, h: 0.9, fontSize: 19,
      color: C.PALE, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.WHITE },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 0.36, w: 9, h: 0.3, fontSize: 12, bold: true,
      color: C.TEAL_D, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.66, w: CW, h: 0.8, fontFace: "Georgia",
      fontSize: 34, bold: true, color: C.INK, valign: "top", align: "left", margin: 0 }, text: "" } },
    { text: { text: "Phase 2 Solution Design  ·  Group 5",
      options: { x: M, y: 7.02, w: 6, h: 0.26, fontSize: 10, color: C.MUTED, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.26, fontSize: 10, color: C.MUTED, align: "right" },
});
pres.defineSlideMaster({
  title: "CLOSING",
  background: { path: path.join(FIG, "cover_slide.png") },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.75, y: 2.2, w: 6.5, h: 1.2, fontFace: "Georgia",
      fontSize: 54, bold: true, color: C.WHITE, valign: "top", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.75, y: 3.45, w: 6.2, h: 0.6, fontSize: 22,
      color: C.TEAL_L, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});

// ---------------------------------------------------------------------------- helpers
let currentSection = null;
function slideOf(master, section) {
  if (section !== currentSection) { pres.addSection({ title: section }); currentSection = section; }
  return pres.addSlide({ masterName: master, sectionTitle: section });
}
function content(section, kicker, title) {
  const s = slideOf("CONTENT", section);
  s.addText([{ text: kicker.toUpperCase(), options: { charSpacing: 2 } }], { placeholder: "kicker" });
  s.addText(title, { placeholder: "title" });
  return s;
}
function T(s, text, o) {
  s.addText(text, Object.assign({ isTextBox: true, margin: 0, fontSize: 16, color: C.INK, valign: "top" }, o));
}
function box(s, x, y, w, h, fill) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, width: 0 } });
}
function rect(s, x, y, w, h, fill) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill, width: 0 } });
}
function disc(s, x, y, d, fill, label, color = C.WHITE, size = 18) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0 } });
  if (label !== undefined) {
    T(s, String(label), { x, y, w: d, h: d, align: "center", valign: "middle", fontFace: "Georgia", fontSize: size, bold: true, color });
  }
}
function arrow(s, x, y, w, color = C.MUTED) {
  s.addShape(pres.shapes.LINE, { x, y, w, h: 0, line: { color, width: 1.5, endArrowType: "triangle" } });
}
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function img(s, name, x, y, w) {
  const file = path.join(FIG, name), { w: pw, h: ph } = pngSize(file);
  s.addImage({ path: file, x, y, w, h: (w * ph) / pw });
  return (w * ph) / pw;
}
const para = (text, extra = {}) => ({ text, options: Object.assign({ breakLine: true, paraSpaceAfter: 10 }, extra) });
const label = (s, text, x, y, w, color = C.TEAL_D) =>
  T(s, [{ text: text.toUpperCase(), options: { charSpacing: 2 } }], { x, y, w, h: 0.26, fontSize: 11, bold: true, color });

// ---------------------------------------------------------------------------- 1 cover
{
  const s = slideOf("COVER", "Opening");
  s.addText("Cross-Subject Motor Imagery\nEEG Classification", { placeholder: "title" });
  s.addText("A small hybrid CNN–Transformer that has to work for people it has never seen", { placeholder: "body" });
  label(s, "Phase 2  ·  Solution design", 0.75, 1.15, 6, C.TEAL_L);
  const twoLines = TEAM.some((n) => n.includes("("));
  label(s, "Team", 0.75, 4.3, 2, C.TEAL_L);
  T(s, twoLines ? `${TEAM[0]}     ${TEAM[1]}\n${TEAM[2]}     ${TEAM[3]}` : TEAM.join("   ·   "),
    { x: 0.75, y: 4.6, w: 7.4, h: twoLines ? 0.66 : 0.34, fontSize: 16, color: C.WHITE, paraSpaceAfter: 3 });
  const y = twoLines ? 5.55 : 5.25;
  label(s, "Guide", 0.75, y, 2, C.TEAL_L);
  T(s, "Dr. Mohan Allam", { x: 0.75, y: y + 0.3, w: 2.7, h: 0.34, fontSize: 16, color: C.WHITE });
  label(s, "Course", 3.6, y, 2, C.TEAL_L);
  T(s, "CSE4006 Deep Learning  ·  Group 5", { x: 3.6, y: y + 0.3, w: 4.4, h: 0.34, fontSize: 16, color: C.WHITE });
  T(s, "School of Computer Science and Engineering, VIT-AP University",
    { x: 0.75, y: y + 0.85, w: 7.4, h: 0.3, fontSize: 14, color: C.PALE });
  s.addNotes("We are Group 5: Ananya, Haarika, Siddhanth and Sathvik, guided by Dr. Mohan Allam. This is our Phase 2 " +
    "solution design. The short version: we want to decode imagined movements from EEG for a person the model has never " +
    "seen, and we want to do it with a small model. The next slides cover why that is hard, what others have tried, what " +
    "we will build, and how we will test it fairly.");
}

// ---------------------------------------------------------------------------- 2 the problem
{
  const s = content("The problem", "01  ·  The problem", "Accuracy collapses on a new person");
  T(s, [
    para("A motor-imagery BCI turns imagined movements into commands, for example for someone who can no longer move their hands."),
    para("Today, every new user first sits through a long labelled calibration session. Skip it, and accuracy falls sharply."),
    { text: "Our goal: a decoder that works on a person it has never seen.", options: { bold: true, color: C.TEAL_D } },
  ], { x: M, y: 1.85, w: 4.9, h: 4.3, fontSize: 19 });
  box(s, 6.15, 1.75, 6.58, 4.6, C.TINT);
  T(s, "82.5%", { x: 6.55, y: 2.25, w: 2.7, h: 1.0, fontFace: "Georgia", fontSize: 58, bold: true, color: C.TEAL });
  T(s, "when the person was\npart of training", { x: 6.55, y: 3.35, w: 2.7, h: 0.7, fontSize: 15, color: C.MUTED });
  arrow(s, 9.3, 2.8, 0.45, C.MUTED);
  T(s, "58.6%", { x: 9.95, y: 2.25, w: 2.6, h: 1.0, fontFace: "Georgia", fontSize: 58, bold: true, color: C.RED });
  T(s, "on a person it\nhas never seen", { x: 9.95, y: 3.35, w: 2.6, h: 0.7, fontSize: 15, color: C.MUTED });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.27, y: 4.45, w: 2.55, h: 0.55, rectRadius: 0.27,
    fill: { color: C.RED }, line: { color: C.RED, width: 0 } });
  T(s, "−23.9 points", { x: 8.27, y: 4.45, w: 2.55, h: 0.55, align: "center", valign: "middle", fontSize: 18, bold: true, color: C.WHITE });
  T(s, "CTNet on BCI IV-2a, four classes (Zhao et al., 2024). Chance is 25%.",
    { x: 6.55, y: 5.55, w: 5.9, h: 0.4, fontSize: 12, color: C.MUTED });
  s.addNotes("This is the number behind the whole project. CTNet, one of the strongest recent models, gets 82.52% on four " +
    "classes when the test person was part of training. Hold that person out and it falls to 58.64%, almost 24 points " +
    "lower. The second number is what a new user would actually get. On the two-class BCI IV-2b data the drop is 12.22 " +
    "points, so this is not a one-off. That is why every new user records a long calibration session today, and that " +
    "session is what we want to make unnecessary.");
}

// ---------------------------------------------------------------------------- 3 what to detect
{
  const s = content("The problem", "01  ·  The problem", "What the decoder has to pick up");
  img(s, "erd.png", M, 1.55, 8.4);
  T(s, "Imagine moving your left hand and the 8–13 Hz rhythm over the right side of your head gets weaker. " +
    "Right hand, left side. The decoder has to find that drop inside very noisy signals.",
    { x: 9.35, y: 1.85, w: 3.38, h: 2.7, fontSize: 17 });
  const cards = [
    ["µV", "Tiny signal", "A few millionths of a volt, mixed with eye, muscle and mains noise."],
    ["288", "Little data", "labelled trials per session, yet one trial is 22 × 875 numbers."],
    ["9", "Every head differs", "people, each with their own skull, cap fit and way of imagining."],
  ];
  cards.forEach(([big, head, body], i) => {
    const x = M + i * (3.89 + 0.23), y = 4.7;
    box(s, x, y, 3.89, 2.0, C.TINT);
    T(s, big, { x: x + 0.28, y: y + 0.28, w: 1.3, h: 0.8, fontFace: "Georgia", fontSize: 36, bold: true, color: C.TEAL });
    T(s, head, { x: x + 1.55, y: y + 0.3, w: 2.2, h: 0.4, fontSize: 17, bold: true });
    T(s, body, { x: x + 1.55, y: y + 0.74, w: 2.12, h: 1.15, fontSize: 14, color: C.MUTED });
  });
  s.addNotes("What does the decoder look for? When you imagine moving a hand, the mu rhythm, around 8 to 13 Hz, weakens " +
    "over the motor cortex on the opposite side. This is called event-related desynchronisation. Three things make it " +
    "hard to read: the signal is tiny and buried in noise from the eyes and muscles, there is very little labelled data, " +
    "and every head is different, so the same imagined movement looks different from one person to the next. That last " +
    "problem is the one we are going after.");
}

// ---------------------------------------------------------------------------- 4 dataset
{
  const s = content("The data", "02  ·  The data", "Our data: 9 people, 4 imagined movements");
  img(s, "classes.png", M, 1.55, 8.4);
  T(s, [
    para("BCI Competition IV dataset 2a, recorded at Graz University of Technology. We chose it because all four papers we " +
      "build on report results on it, so our re-runs can be checked against their published numbers."),
    { text: "Nine people gives nine leave-one-out folds: enough for a mean, a spread and a paired test, but too few to trust " +
      "any single fold on its own.", options: { color: C.MUTED } },
  ], { x: M, y: 4.65, w: 8.4, h: 2.1, fontSize: 16 });
  const stats = [["9", "people, A01 to A09"], ["22", "EEG electrodes; 3 eye channels dropped"], ["250 Hz", "sampling rate"],
    ["2", "sessions each, on different days"], ["5,184", "labelled trials in total"], ["25%", "chance level, as the four classes are balanced"]];
  stats.forEach(([n, l], i) => {
    const y = 1.6 + i * 0.86;
    T(s, n, { x: 9.35, y, w: 1.55, h: 0.6, fontFace: "Georgia", fontSize: 26, bold: true, color: C.TEAL });
    T(s, l, { x: 10.95, y: y + 0.06, w: 1.78, h: 0.7, fontSize: 13 });
  });
  s.addNotes("We use BCI Competition IV dataset 2a from Graz. Nine people, 22 electrodes, four imagined movements: left " +
    "hand, right hand, both feet and tongue. Each person did two sessions on different days with 288 trials each, so " +
    "5,184 trials in total. The classes are perfectly balanced, which puts chance at 25%. We picked this dataset because " +
    "all four papers we build on report on it, so we can check our versions of their models against their numbers. " +
    "Nine people also limits what we can claim, and we keep that in mind throughout.");
}

// ---------------------------------------------------------------------------- 5 trial timeline
{
  const s = content("The data", "02  ·  The data", "We read 3.5 seconds of imagery per trial");
  const x0 = 0.95, x1 = 12.35, sec = (x1 - x0) / 7.5, X = (t) => x0 + t * sec;
  const yb = 3.15, hb = 1.05;
  [[0, 2, "Fixation cross\nand beep", C.TINT], [2, 1.25, "Arrow\ncue", "DCEAF7"],
   [3.25, 2.75, "Imagining the movement", "D3EFEB"], [6, 1.5, "Rest", "F4F6F7"]].forEach(([t, d, lab, fill]) => {
    box(s, X(t) + 0.03, yb, d * sec - 0.06, hb, fill);
    T(s, lab, { x: X(t), y: yb, w: d * sec, h: hb, align: "center", valign: "middle", fontSize: 16 });
  });
  const ya = yb + hb + 0.3;
  s.addShape(pres.shapes.LINE, { x: x0, y: ya, w: x1 - x0, h: 0, line: { color: C.INK, width: 1.25 } });
  for (let t = 0; t <= 7; t++) {
    s.addShape(pres.shapes.LINE, { x: X(t), y: ya - 0.07, w: 0, h: 0.14, line: { color: C.INK, width: 1.25 } });
    T(s, `${t} s`, { x: X(t) - 0.4, y: ya + 0.12, w: 0.8, h: 0.3, align: "center", fontSize: 13, color: C.MUTED });
  }
  for (const t of [2.5, 6]) {
    s.addShape(pres.shapes.LINE, { x: X(t), y: 2.3, w: 0, h: yb - 2.3, line: { color: C.TEAL_D, width: 1.5, dashType: "dash" } });
  }
  s.addShape(pres.shapes.LINE, { x: X(2.5), y: 2.6, w: X(6) - X(2.5), h: 0,
    line: { color: C.TEAL_D, width: 1.75, beginArrowType: "triangle", endArrowType: "triangle" } });
  T(s, "3.5 s window = 875 samples", { x: X(2.5), y: 1.8, w: X(6) - X(2.5), h: 0.45, align: "center", fontSize: 20, bold: true, color: C.TEAL_D });
  const notes = [
    ["Why start 0.5 s after the arrow?", "That first half-second is mostly the brain reacting to seeing the arrow. A model " +
      "could learn that reaction and still know nothing about imagined movement."],
    ["Why stop at 6 s?", "The imagery period ends there. The window gives 875 samples per electrode at 250 Hz, for every model alike."],
  ];
  notes.forEach(([h, b], i) => {
    T(s, [{ text: h, options: { bold: true, breakLine: true, paraSpaceAfter: 4 } }, { text: b, options: { color: C.MUTED } }],
      { x: M + i * 6.2, y: 5.35, w: 5.9, h: 1.4, fontSize: 15 });
  });
  s.addNotes("Each trial follows the same timeline. A fixation cross and a beep, then at two seconds an arrow tells the " +
    "person which movement to imagine, and they keep imagining it until about six seconds. We take the window from 0.5 " +
    "to 4 seconds after the arrow: 3.5 seconds, or 875 samples per electrode. We skip the first half-second on purpose. " +
    "That part is mostly the brain’s response to seeing the arrow, and a model could learn the arrow instead of the imagery.");
}

// ---------------------------------------------------------------------------- 6 size vs accuracy
{
  const s = content("What others have tried", "03  ·  What others have tried", "Bigger models don’t fix the new-person problem");
  const models = ["EEGNet+", "ShallowConvNet+", "CTNet", "DeepConvNet+", "EEG Conformer+"];
  const common = {
    y: 1.6, h: 4.0, barDir: "bar", catAxisOrientation: "maxMin", barGapWidthPct: 55, showLegend: false,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineShow: false,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 13, dataLabelFontFace: "Calibri", dataLabelColor: C.INK,
    catAxisLabelFontSize: 14, catAxisLabelFontFace: "Calibri", catAxisLabelColor: C.INK,
    showTitle: true, titleFontSize: 15, titleFontFace: "Calibri", titleColor: C.INK,
  };
  s.addChart(pres.charts.BAR, [{ name: "Parameters", labels: models, values: [3188, 44644, 152364, 282079, 697412] }],
    Object.assign({}, common, { x: M, w: 6.3, chartColors: [C.SLATE], title: "Parameters (log scale)",
      valAxisLogScaleBase: 10, valAxisMinVal: 1000, valAxisMaxVal: 10000000, valAxisHidden: true, dataLabelFormatCode: "#\\,###" }));
  s.addChart(pres.charts.BAR, [{ name: "Accuracy", labels: models, values: [56.85, 56.75, 58.64, 60.15, 53.41] }],
    Object.assign({}, common, { x: 7.05, w: 5.68, chartColors: [C.TEAL], title: "Accuracy on an unseen person (%)",
      catAxisHidden: true, valAxisMinVal: 0, valAxisMaxVal: 100, valAxisHidden: true, dataLabelFormatCode: "0.00" }));
  box(s, M, 5.75, CW, 0.7, C.TINT);
  T(s, [{ text: "EEG Conformer has 219 times EEGNet’s parameters and scores 3.4 points lower. ", options: { bold: true } },
        { text: "The best of the five is only 3.3 points ahead." }],
    { x: M + 0.3, y: 5.75, w: CW - 0.6, h: 0.7, valign: "middle", fontSize: 17 });
  T(s, "Leave-one-subject-out accuracy reported by Zhao et al. (2024); + marks models the CTNet authors re-ran under the same " +
    "protocol. Parameter counts: braindecode reference models at our 875-sample input. Chance is 25%.",
    { x: M, y: 6.52, w: CW, h: 0.42, fontSize: 11, color: C.MUTED });
  s.addNotes("This is what published work tells us. On the left is model size on a log scale, from about 3,000 to about " +
    "700,000 parameters. On the right is accuracy on a person held out of training, all measured by the CTNet authors " +
    "under one protocol. Size grows more than two hundred times, but accuracy stays between 53 and 60 percent, and the " +
    "biggest model is actually the lowest. So more capacity is not what fixes the new-person problem, and that shaped our " +
    "whole design: keep the model small and deal with the differences between people in the data.");
}

// ---------------------------------------------------------------------------- 7 four papers
{
  const s = content("What others have tried", "03  ·  What others have tried", "What we take from each paper");
  const papers = [
    ["2018", "EEGNet", "Compact CNN", "3,188 parameters", "Learns frequency filters, then spatial filters, with very few weights.", "the whole convolutional front end"],
    ["2023", "ATCNet", "CNN + attention + TCN", "113,732 parameters", "Applies attention inside sliding windows of the feature sequence.", "attention inside short windows"],
    ["2023", "EEG Conformer", "CNN + Transformer", "697,412 parameters", "Convolution for local detail, then a Transformer across the trial.", "convolution first, attention after"],
    ["2024", "CTNet", "CNN + Transformer", "152,364 parameters", "An EEGNet front end feeding a six-layer Transformer encoder.", "the encoder design, cut to two layers"],
  ];
  papers.forEach(([yr, name, kind, size, idea, take], i) => {
    const x = M + i * (2.86 + 0.23), y = 1.65;
    box(s, x, y, 2.86, 4.0, C.TINT);
    label(s, yr, x + 0.25, y + 0.25, 1.5);
    T(s, name, { x: x + 0.25, y: y + 0.55, w: 2.55, h: 0.5, fontFace: "Georgia", fontSize: 20, bold: true });
    T(s, kind, { x: x + 0.25, y: y + 1.08, w: 2.45, h: 0.3, fontSize: 14, color: C.MUTED });
    T(s, size, { x: x + 0.25, y: y + 1.4, w: 2.45, h: 0.3, fontSize: 14, color: C.MUTED });
    T(s, idea, { x: x + 0.25, y: y + 1.85, w: 2.4, h: 1.05, fontSize: 15 });
    label(s, "We take", x + 0.25, y + 2.95, 1.5);
    T(s, take, { x: x + 0.25, y: y + 3.22, w: 2.4, h: 0.7, fontSize: 16, bold: true, color: C.TEAL_D });
  });
  box(s, M, 5.85, CW, 0.85, C.DEEP);
  T(s, "None of the four is small, accurate and reliable on new people at the same time. That is the gap we work on.",
    { x: M + 0.35, y: 5.85, w: CW - 0.7, h: 0.85, valign: "middle", fontSize: 18, color: C.WHITE });
  s.addNotes("We build on four papers and take one thing from each. From EEGNet, the convolutional front end, which learns " +
    "frequency and spatial filters with very few weights. From ATCNet, the idea of running attention inside short windows. " +
    "From EEG Conformer and CTNet, the order: convolution first, a Transformer after it. And from CTNet the encoder itself, " +
    "cut from six layers to two. None of these models is small, accurate and reliable on new people at once. That is the gap.");
}

// ---------------------------------------------------------------------------- 8 objectives
{
  const s = content("Our design", "04  ·  Our design", "What we set out to do");
  const goals = [
    "Build one reproducible pipeline for BCI IV-2a, from raw files to results.",
    "Re-run EEGNet, ATCNet, EEG Conformer, CTNet and FBCSP under one identical protocol.",
    "Design HCT-Net: small, hybrid, and built for people it has never seen.",
    "Test every model only on unseen people, with leave-one-subject-out.",
    "Report every result, including the ones that go against us.",
  ];
  goals.forEach((g, i) => {
    const y = 1.7 + i * 0.98;
    disc(s, M, y, 0.6, C.TEAL, i + 1);
    T(s, g, { x: M + 0.85, y: y + 0.02, w: 6.6, h: 0.6, valign: "middle", fontSize: 18 });
  });
  box(s, 8.45, 1.7, 4.28, 4.55, C.DEEP);
  label(s, "The question behind all five", 8.8, 2.05, 3.7, C.TEAL_L);
  T(s, "Can a model with about 21,000 parameters hold its own against much larger ones on a person it has never seen?",
    { x: 8.8, y: 2.5, w: 3.6, h: 3.4, fontFace: "Georgia", fontSize: 24, color: C.WHITE });
  s.addNotes("These are our five objectives. The one we care most about is the fourth: every number we report is measured " +
    "on someone the model never saw. The fifth is a promise: if our model does not beat the baselines we still report it, " +
    "and the component study tells us why. Underneath it all is one question: can a model of about twenty-one thousand " +
    "parameters hold its own against much larger ones on a new person?");
}

// ---------------------------------------------------------------------------- 9 system
{
  const s = content("Our design", "04  ·  Our design", "HCT-Net in one picture");
  const stages = [
    ["Raw EEG", "22 electrodes\n250 Hz", C.TINT, C.INK], ["Preprocessing", "filter, cut,\nalign, scale", C.TINT, C.INK],
    ["CNN front end", "temporal, spatial,\nseparable conv", C.TEAL, C.WHITE], ["Windowed attention", "2 encoder layers\nover 5 windows", C.TEAL_D, C.WHITE],
    ["Pool and classify", "average, then\na linear layer", C.TINT, C.INK], ["Prediction", "left, right,\nfeet or tongue", "F4F6F7", C.INK],
  ];
  const w = 1.7, gap = (CW - 6 * w) / 5, y = 1.85, h = 1.9;
  stages.forEach(([name, sub, fill, color], i) => {
    const x = M + i * (w + gap);
    box(s, x, y, w, h, fill);
    T(s, name, { x: x + 0.1, y: y + 0.25, w: w - 0.2, h: 0.7, align: "center", fontSize: 16, bold: true, color });
    T(s, sub, { x: x + 0.1, y: y + 1.0, w: w - 0.2, h: 0.75, align: "center", fontSize: 13, color: color === C.WHITE ? "E7F6F4" : C.MUTED });
    if (i < 5) arrow(s, x + w + 0.06, y + h / 2, gap - 0.12);
  });
  T(s, "Taken from published work", { x: M, y: 3.95, w: w, h: 0.62, valign: "middle", fontSize: 12, color: C.MUTED });
  [[1, "alignment from\nHe & Wu"], [2, "from EEGNet"], [3, "from ATCNet, CTNet,\nEEG Conformer"]].forEach(([i, txt]) => {
    const x = M + i * (w + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 3.95, w, h: 0.62, rectRadius: 0.1,
      fill: { color: C.TINT2 }, line: { color: C.TINT2, width: 0 } });
    T(s, txt, { x, y: 3.95, w, h: 0.62, align: "center", valign: "middle", fontSize: 12, bold: true, color: C.TEAL_D });
  });
  [["What is borrowed", "Every block comes from published work: the front end from EEGNet, windowed attention from ATCNet, " +
      "convolution then Transformer from EEG Conformer and CTNet, and alignment from He and Wu."],
   ["What is ours", "Putting them together at this size for a 5,184-trial dataset, cutting attention to two layers, testing " +
      "every model the same way, and measuring what each part adds."]].forEach(([h, b], i) => {
    T(s, [{ text: h, options: { bold: true, color: C.TEAL_D, breakLine: true, paraSpaceAfter: 4 } }, { text: b }],
      { x: M + i * 6.2, y: 4.95, w: 5.9, h: 1.85, fontSize: 16 });
  });
  s.addNotes("This is the whole system. Raw EEG is filtered, cut into trials, aligned and scaled. The CNN front end, taken " +
    "from EEGNet, learns frequency and spatial filters. A small Transformer then looks across time inside five overlapping " +
    "windows. We average, classify, and output one of four movements. Only the two coloured blocks have trainable weights. " +
    "Nothing here is a new invention. What is ours is how the pieces are combined and sized for a dataset this small, and " +
    "the fact that every model gets exactly the same treatment.");
}

// ---------------------------------------------------------------------------- 10 inside HCT-Net
{
  const s = content("Our design", "04  ·  Our design", "Inside HCT-Net: 20,996 parameters");
  const blocks = [
    ["Input", "22 electrodes ×\n875 samples", "22 × 875", C.TINT, C.INK],
    ["Temporal conv", "16 filters, each\n64 samples long", "16 × 22 × 875", C.TEAL, C.WHITE],
    ["Spatial conv", "2 filters per band\nacross 22 electrodes", "32 × 1 × 875", C.TEAL, C.WHITE],
    ["Separable conv", "plus pooling\n÷4, then ÷8", "32 × 27", C.TEAL, C.WHITE],
    ["Transformer × 2", "5 windows of 11,\n2 heads, width 32", "5 × 32 × 11", C.TEAL_D, C.WHITE],
    ["Average + linear", "softmax over\nfour classes", "4", C.TINT, C.INK],
  ];
  const w = 1.85, gap = (CW - 6 * w) / 5, y = 1.7, h = 1.5;
  blocks.forEach(([name, sub, shape, fill, color], i) => {
    const x = M + i * (w + gap);
    box(s, x, y, w, h, fill);
    T(s, name, { x: x + 0.12, y: y + 0.2, w: w - 0.24, h: 0.4, align: "center", fontSize: 15, bold: true, color });
    T(s, sub, { x: x + 0.12, y: y + 0.66, w: w - 0.24, h: 0.7, align: "center", fontSize: 13, color: color === C.WHITE ? "E7F6F4" : C.MUTED });
    T(s, shape, { x, y: y + h + 0.12, w, h: 0.3, align: "center", fontFace: "Consolas", fontSize: 13, color: C.INK });
    if (i < 5) arrow(s, x + w + 0.03, y + h / 2, gap - 0.06);
  });
  T(s, "Where the 20,996 parameters go", { x: M, y: 3.85, w: 6, h: 0.35, fontSize: 16, bold: true });
  const parts = [[3424, C.TEAL], [17088, C.TEAL_D], [352, C.SLATE], [132, C.AMBER]];
  let x = M;
  parts.forEach(([n, fill]) => { const ww = (CW * n) / 20996; rect(s, x, 4.3, ww, 0.5, fill); x += ww; });
  T(s, "3,424", { x: M, y: 4.3, w: (CW * 3424) / 20996, h: 0.5, align: "center", valign: "middle", fontSize: 14, bold: true, color: C.WHITE });
  T(s, "17,088", { x: M + (CW * 3424) / 20996, y: 4.3, w: (CW * 17088) / 20996, h: 0.5, align: "center", valign: "middle", fontSize: 14, bold: true, color: C.WHITE });
  T(s, "Convolution (16%)", { x: M, y: 4.88, w: 2.6, h: 0.3, fontSize: 13, color: C.MUTED });
  T(s, "Transformer encoder (81%)", { x: M + (CW * 3424) / 20996, y: 4.88, w: (CW * 17088) / 20996, h: 0.3, align: "center", fontSize: 13, color: C.MUTED });
  T(s, "positions 352 + classifier 132", { x: W - M - 3.2, y: 4.88, w: 3.2, h: 0.3, align: "right", fontSize: 13, color: C.MUTED });
  [["Why two encoder layers, not CTNet’s six?", "Six layers at this width would put 51,264 parameters in attention alone, " +
      "more than our whole budget of 50,000."],
   ["Why keep it this small?", "Each fold trains on only 4,032 trials. Every extra weight is another chance to memorise the " +
      "seven training people instead of learning what they share."]].forEach(([h, b], i) => {
    T(s, [{ text: h, options: { bold: true, breakLine: true, paraSpaceAfter: 4 } }, { text: b, options: { color: C.MUTED } }],
      { x: M + i * 6.2, y: 5.5, w: 5.9, h: 1.3, fontSize: 15 });
  });
  s.addNotes("Inside the model. A trial is 22 electrodes by 875 samples. Sixteen temporal filters, each 64 samples or about " +
    "a quarter of a second, act like learned band-pass filters. A depthwise spatial layer gives each band two spatial " +
    "filters across all electrodes, a learned version of CSP. A separable convolution and two pooling steps shrink time " +
    "from 875 to 27 steps. The Transformer then works inside five overlapping windows of 11 steps. In total that is 20,996 " +
    "parameters, and 81% of them sit in the encoder, which is why we stopped at two layers.");
}

// ---------------------------------------------------------------------------- 11 size in context
{
  const s = content("Our design", "04  ·  Our design", "Small, but not the smallest");
  const names = ["EEGNet", "HCT-Net (ours)", "ShallowConvNet", "ATCNet", "CTNet", "DeepConvNet", "EEG Conformer"];
  const vals = [3188, 20996, 44644, 113732, 152364, 282079, 697412];
  s.addChart(pres.charts.BAR, [{ name: "Parameters", labels: names, values: vals }], {
    x: M, y: 1.6, w: 8.0, h: 4.9, barDir: "bar", catAxisOrientation: "maxMin", barGapWidthPct: 45, showLegend: false,
    chartColors: names.map((n) => (n.startsWith("HCT") ? C.TEAL : C.CONTEXT)),
    valAxisLogScaleBase: 10, valAxisMinVal: 1000, valAxisMaxVal: 10000000, valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, catAxisLineShow: false,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#\\,###", dataLabelFontSize: 14,
    dataLabelFontFace: "Calibri", dataLabelColor: C.INK,
    catAxisLabelFontSize: 15, catAxisLabelFontFace: "Calibri", catAxisLabelColor: C.INK,
    showTitle: true, title: "Trainable parameters, log scale", titleFontSize: 15, titleFontFace: "Calibri", titleColor: C.INK,
  });
  [["1/5", "the size of ATCNet"], ["1/33", "the size of EEG Conformer"], ["6.6×", "the size of EEGNet, our smallest baseline"]].forEach(([n, l], i) => {
    const y = 1.75 + i * 1.5;
    T(s, n, { x: 9.15, y, w: 3.5, h: 0.8, fontFace: "Georgia", fontSize: 40, bold: true, color: i === 2 ? C.SLATE : C.TEAL });
    T(s, l, { x: 9.15, y: y + 0.8, w: 3.5, h: 0.5, fontSize: 15, color: C.MUTED });
  });
  T(s, "Counts from the braindecode 1.8.1 reference implementations: 22 channels, 4 classes, 875-sample input.",
    { x: M, y: 6.6, w: CW, h: 0.3, fontSize: 11, color: C.MUTED });
  s.addNotes("In context, HCT-Net is about one fifth the size of ATCNet and one thirty-third the size of EEG Conformer. It " +
    "is not the smallest, though. EEGNet is six and a half times smaller, and it is the baseline we most need to beat. If " +
    "HCT-Net cannot beat EEGNet on new people, the extra attention is not earning its parameters, and we will say so.");
}

// ---------------------------------------------------------------------------- 12 preprocessing
{
  const s = content("Our design", "04  ·  Our design", "One preprocessing pipeline for every model");
  const steps = [
    ["Keep 22 channels", "Drop the 3 eye channels after using them to spot artefacts."],
    ["Band-pass 4–38 Hz", "Run forwards and backwards, so nothing shifts in time."],
    ["Cut the trial", "0.5 to 4.0 s after the cue: 875 samples."],
    ["Reject artefacts", "Any channel swinging more than 100 µV peak to peak."],
    ["Align each session", "Euclidean alignment, using only unlabelled trials."],
    ["Standardise", "Means and spreads from the training people only."],
    ["Augment", "Stitch 8 segments from same-class trials. Training only."],
    ["Cache", "Write once, reuse for every model and every fold."],
  ];
  steps.forEach(([h, b], i) => {
    const x = M + (i % 4) * (2.86 + 0.23), y = i < 4 ? 1.65 : 3.75, hot = i === 4;
    box(s, x, y, 2.86, 1.85, hot ? C.TEAL : C.TINT);
    disc(s, x + 0.22, y + 0.22, 0.5, hot ? C.WHITE : C.TEAL, i + 1, hot ? C.TEAL : C.WHITE, 16);
    T(s, h, { x: x + 0.86, y: y + 0.22, w: 1.9, h: 0.5, valign: "middle", fontSize: 16, bold: true, color: hot ? C.WHITE : C.INK });
    T(s, b, { x: x + 0.22, y: y + 0.88, w: 2.45, h: 0.9, fontSize: 14, color: hot ? "E7F6F4" : C.MUTED });
  });
  T(s, "The test person’s labels are never used. Their unlabelled trials go into one place only: their own alignment in step 5.",
    { x: M, y: 5.95, w: CW, h: 0.7, fontSize: 17 });
  s.addNotes("Every model goes through the same eight preprocessing steps, so any difference in results comes from the " +
    "models and not from how the data was handled. A few details matter. The filter runs forwards and backwards, so it " +
    "does not shift the signal in time. Standardisation uses statistics from the training people only. Augmentation makes " +
    "new training trials by stitching together eight segments from different trials of the same class, and it never " +
    "touches validation or test data.");
}

// ---------------------------------------------------------------------------- 13 alignment
{
  const s = content("Our design", "04  ·  Our design", "Alignment puts every person in one frame");
  img(s, "alignment.png", M, 1.6, 7.4);
  T(s, "Illustration, not measured data.", { x: M, y: 4.78, w: 7.4, h: 0.3, fontSize: 11, color: C.MUTED });
  T(s, "For each person", { x: 8.45, y: 1.7, w: 4.3, h: 0.4, fontSize: 18, bold: true });
  const steps = [
    [{ text: "Average the covariance of all their trials. Call it R." }],
    [{ text: "Multiply every trial by R" }, { text: "−1/2", options: { superscript: true } }, { text: "." }],
    [{ text: "Now their average covariance is the identity, the star in the picture." }],
  ];
  steps.forEach((runs, i) => {
    const y = 2.25 + i * 0.95;
    disc(s, 8.45, y, 0.45, C.TEAL, i + 1, C.WHITE, 15);
    T(s, runs, { x: 9.1, y: y - 0.02, w: 3.65, h: 0.85, fontSize: 16 });
  });
  T(s, [{ text: "✓  needs no labels", options: { breakLine: true } },
        { text: "✓  adds zero parameters", options: { breakLine: true } },
        { text: "✓  costs one 22 × 22 eigen-decomposition" }],
    { x: 8.45, y: 5.15, w: 4.3, h: 1.1, fontSize: 15, bold: true, color: C.TEAL_D, paraSpaceAfter: 3 });
  T(s, "So a new user only has to wear the cap and record a few unlabelled trials. That is enough to align them before the model sees anything.",
    { x: M, y: 5.25, w: 7.4, h: 1.2, fontFace: "Georgia", fontSize: 18 });
  s.addNotes("Euclidean alignment, from He and Wu, is the step we expect to do most of the work against the new-person " +
    "problem. For each person we average the covariance matrices of their trials, then multiply every trial by the inverse " +
    "square root of that average. Afterwards everyone's average covariance is the identity, so the model no longer has to " +
    "learn each person’s head shape and cap position. It needs no labels and adds no parameters, so it works for a " +
    "brand-new user. We will check it in code: after alignment the average covariance must equal the identity within a small tolerance.");
}

// ---------------------------------------------------------------------------- 14 evaluation
{
  const s = content("How we test it", "05  ·  How we test it", "Every test is on a person the model never saw");
  const cw = 0.5, ch = 0.4, g = 0.06, gx = M + 0.95, gy = 2.05;
  for (let c = 0; c < 9; c++) T(s, `A0${c + 1}`, { x: gx + c * (cw + g), y: 1.68, w: cw, h: 0.3, align: "center", fontSize: 12 });
  for (let f = 0; f < 9; f++) {
    T(s, `Fold ${f + 1}`, { x: M, y: gy + f * (ch + g), w: 0.85, h: ch, valign: "middle", fontSize: 12, color: C.MUTED });
    for (let c = 0; c < 9; c++) {
      const role = c === f ? "test" : c === (f + 1) % 9 ? "val" : "";
      const xx = gx + c * (cw + g), yy = gy + f * (ch + g);
      rect(s, xx, yy, cw, ch, role === "test" ? C.RED : role === "val" ? C.TEAL : C.TINT);
      if (role) T(s, role, { x: xx, y: yy, w: cw, h: ch, align: "center", valign: "middle", fontSize: 11, bold: true, color: C.WHITE });
    }
  }
  T(s, "In every fold, 7 people train, 1 validates and 1 is tested. The roles rotate.",
    { x: M, y: 6.25, w: 6.2, h: 0.5, fontSize: 13, color: C.MUTED });
  T(s, [
    { text: "What we measure", options: { bold: true, color: C.TEAL_D, breakLine: true, paraSpaceAfter: 6 } },
    { text: "Accuracy per person, mean and spread", options: { bullet: true, breakLine: true } },
    { text: "Cohen’s kappa, which corrects for chance", options: { bullet: true, breakLine: true } },
    { text: "Macro precision, recall and F1", options: { bullet: true, breakLine: true } },
    { text: "Confusion matrix, to catch feet vs tongue", options: { bullet: true, breakLine: true } },
    { text: "Size, training time and inference time", options: { bullet: true, breakLine: true, paraSpaceAfter: 14 } },
    { text: "How we decide a difference is real", options: { bold: true, color: C.TEAL_D, breakLine: true, paraSpaceAfter: 6 } },
    { text: "Wilcoxon signed-rank test over the nine people, Holm correction across the five comparisons, and three random seeds for every setting." },
  ], { x: 7.35, y: 1.7, w: 5.38, h: 5.0, fontSize: 16, paraSpaceAfter: 4 });
  s.addNotes("This is how we test. Nine folds, one per person. In each fold one person is the test person, the next is used " +
    "for validation, and the other seven train the model. Everyone is the test person exactly once. We use a separate " +
    "validation person rather than a random split, because a split would tune the model towards people it already knows. " +
    "We also run every model within subject, session one to session two, only as a sanity check against published numbers. " +
    "The Wilcoxon test with Holm correction decides whether a difference is real.");
}

// ---------------------------------------------------------------------------- 15 experiments
{
  const s = content("How we test it", "05  ·  How we test it", "Six experiments, one question each");
  const exps = [
    ["E1", "Baselines within subject", "Do our versions match their papers?", "45"],
    ["E2", "Baselines on unseen people", "How do they do under one protocol?", "45"],
    ["E3", "HCT-Net on unseen people", "How does our model do?", "9"],
    ["E4", "Component study", "Which parts actually matter?", "45"],
    ["E5", "Attention depth", "Are two layers enough, or do six help?", "9"],
    ["E6", "Size and speed", "Is HCT-Net really lighter?", "—"],
  ];
  T(s, "runs", { x: 6.0, y: 1.58, w: 0.6, h: 0.25, align: "right", fontSize: 11, color: C.MUTED });
  exps.forEach(([id, name, q, runs], i) => {
    const y = 1.88 + i * 0.73;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: y + 0.06, w: 0.62, h: 0.42, rectRadius: 0.21,
      fill: { color: C.TEAL_D }, line: { color: C.TEAL_D, width: 0 } });
    T(s, id, { x: M, y: y + 0.06, w: 0.62, h: 0.42, align: "center", valign: "middle", fontSize: 14, bold: true, color: C.WHITE });
    T(s, [{ text: name, options: { bold: true, breakLine: true } }, { text: q, options: { color: C.MUTED, fontSize: 14 } }],
      { x: M + 0.85, y, w: 4.3, h: 0.7, fontSize: 16 });
    T(s, runs, { x: 5.6, y: y + 0.06, w: 1.0, h: 0.42, align: "right", valign: "middle", fontSize: 18, bold: true, color: C.TEAL_D });
  });
  T(s, "153 runs per seed, three seeds each. E6 is measured during E2 and E3.",
    { x: M, y: 6.33, w: 6.6, h: 0.4, fontSize: 13, color: C.MUTED });
  T(s, "E4: switch one part off at a time", { x: 7.3, y: 1.7, w: 5.43, h: 0.4, fontSize: 16, bold: true });
  const Y = "✓", N = "✕";
  const rows = [["V0  full model", Y, Y, Y, Y], ["V1  no attention", Y, N, Y, Y], ["V2  global attention", Y, "global", Y, Y],
    ["V3  no alignment", Y, Y, N, Y], ["V4  no augmentation", Y, Y, Y, N], ["V5  convolution only", Y, N, N, N]];
  const head = ["Variant", "Conv", "Attention", "Alignment", "Augment"].map((t, i) => ({ text: t,
    options: { bold: true, color: C.WHITE, fill: { color: C.DEEP }, align: i ? "center" : "left" } }));
  const body = rows.map((r) => r.map((t, i) => ({ text: t, options: {
    align: i ? "center" : "left", bold: i > 0 && t !== "global",
    color: i === 0 ? C.INK : t === N ? C.RED : C.TEAL_D } })));
  s.addTable([head, ...body], { x: 7.3, y: 2.2, w: 5.43, colW: [1.95, 0.58, 0.92, 0.98, 1.0], rowH: 0.46,
    fontSize: 13, fontFace: "Calibri", valign: "middle", border: { type: "solid", pt: 0.75, color: C.RULE },
    fill: { color: C.WHITE }, margin: [0, 0.08, 0, 0.08] });
  T(s, "Every variant is trained and tested exactly like the full model, so a change in accuracy belongs to the part that was switched off.",
    { x: 7.3, y: 5.6, w: 5.43, h: 1.1, fontSize: 14, color: C.MUTED });
  s.addNotes("Six experiments, each answering one question. E1 checks that our versions of the baselines reproduce their " +
    "papers’ within-subject numbers; if they do not, nothing after it can be trusted. E2 and E3 are the main comparison on " +
    "unseen people. E4 switches parts of HCT-Net off one at a time. E5 tests two encoder layers against six. E6 measures " +
    "size and speed. That is 153 training runs for each seed, and every setting gets three seeds.");
}

// ---------------------------------------------------------------------------- 16 plan
{
  const s = content("Plan", "06  ·  Plan", "An 18-day build, checked at every step");
  const tasks = [["Dataset preparation and checks", 0, 3, C.SLATE], ["Preprocessing pipeline", 3, 2, C.SLATE],
    ["Baselines built and reproduced", 5, 4, C.SLATE], ["HCT-Net implemented", 9, 3, C.TEAL], ["Training set-up and tuning", 12, 2, C.TEAL],
    ["Leave-one-subject-out runs", 14, 2, C.TEAL], ["Comparison and statistics", 16, 1, C.AMBER], ["Report and figures", 17, 1, C.AMBER]];
  const bx = 4.35, bw = 7.9, day = bw / 18, y0 = 1.72, rh = 0.46;
  tasks.forEach(([name, st, d, fill], i) => {
    const y = y0 + i * rh;
    T(s, name, { x: M, y, w: 3.6, h: rh, valign: "middle", fontSize: 14 });
    rect(s, bx + st * day + 0.02, y + 0.09, d * day - 0.04, rh - 0.18, fill);
    T(s, `${d} day${d > 1 ? "s" : ""}`, { x: bx + (st + d) * day + 0.08, y, w: 0.9, h: rh, valign: "middle", fontSize: 12, color: C.MUTED });
  });
  const ya = y0 + tasks.length * rh + 0.08;
  s.addShape(pres.shapes.LINE, { x: bx, y: ya, w: bw, h: 0, line: { color: C.RULE, width: 1 } });
  [[0, "1"], [3, "4"], [5, "6"], [9, "10"], [12, "13"], [14, "15"], [16, "17"], [17, "18"]].forEach(([o, t]) => {
    T(s, t, { x: bx + o * day - 0.25, y: ya + 0.06, w: 0.5, h: 0.26, align: "center", fontSize: 12, color: C.MUTED });
  });
  T(s, "day", { x: bx - 0.75, y: ya + 0.06, w: 0.6, h: 0.26, align: "right", fontSize: 12, color: C.MUTED });
  const rules = ["Nothing trains until the alignment check passes.", "HCT-Net is written only after two baselines match their papers.",
    "No leave-one-subject-out run starts until the folds are checked."];
  rules.forEach((r, i) => {
    const x = M + i * (3.89 + 0.23);
    box(s, x, 5.85, 3.89, 0.92, C.TINT);
    T(s, r, { x: x + 0.25, y: 5.85, w: 3.45, h: 0.92, valign: "middle", fontSize: 15 });
  });
  s.addNotes("Phase 3 gives us eighteen days, and the order is deliberate. Data checks and preprocessing come first, then " +
    "the baselines, and only then our own model, because a new model on an unchecked pipeline cannot be interpreted. Three " +
    "rules protect the plan. Code can be written faster under pressure; training runs cannot, so the compute-heavy stages " +
    "sit at the end with as few open questions as possible. Each stage ends in a milestone with a pass-or-fail check.");
}

// ---------------------------------------------------------------------------- 17 outcomes
{
  const s = content("Plan", "06  ·  Plan", "What we expect, and what is new");
  box(s, M, 1.65, 5.95, 4.35, C.TINT);
  T(s, [
    { text: "WE EXPECT", options: { bold: true, color: C.TEAL_D, charSpacing: 2, fontSize: 12, breakLine: true, paraSpaceAfter: 2 } },
    { text: "not yet measured", options: { color: C.MUTED, fontSize: 13, breakLine: true, paraSpaceAfter: 12 } },
    { text: "Accuracy on new people that holds up against much bigger models", options: { bullet: true, breakLine: true } },
    { text: "All of it at 20,996 parameters, about a fifth of ATCNet", options: { bullet: true, breakLine: true } },
    { text: "Less need for a long calibration session", options: { bullet: true, breakLine: true } },
    { text: "A clear answer either way, with the component study explaining it", options: { bullet: true } },
  ], { x: M + 0.35, y: 1.95, w: 5.3, h: 3.9, fontSize: 17, paraSpaceAfter: 8 });
  box(s, 6.78, 1.65, 5.95, 4.35, C.DEEP);
  T(s, [
    { text: "WHAT IS NEW", options: { bold: true, color: C.TEAL_L, charSpacing: 2, fontSize: 12, breakLine: true, paraSpaceAfter: 14 } },
    { text: "All four architectures compared under one leave-one-subject-out protocol", options: { bullet: true, breakLine: true } },
    { text: "A compact combination with attention sized for 5,184 trials", options: { bullet: true, breakLine: true } },
    { text: "A component study on unseen people, which the four papers do not report", options: { bullet: true, breakLine: true } },
    { text: "Accuracy weighed against model size under a single protocol", options: { bullet: true } },
  ], { x: 7.13, y: 1.95, w: 5.3, h: 3.9, fontSize: 17, color: C.WHITE, paraSpaceAfter: 8 });
  T(s, "No single block is new. What we add is the combination, the fair protocol and the measurement.",
    { x: M, y: 6.25, w: CW, h: 0.5, fontFace: "Georgia", fontSize: 18 });
  s.addNotes("What we expect, stated as expectations because nothing has been run yet: accuracy on new people that holds " +
    "up against bigger models, at about twenty-one thousand parameters, and less need for calibration. What is new is " +
    "modest and specific: one fair comparison of all four architectures under a single leave-one-subject-out protocol, a " +
    "compact combination sized for this dataset, a component study on unseen people, and accuracy measured against size. " +
    "If the result is negative, it is still a result, and we will report it.");
}

// ---------------------------------------------------------------------------- 18 close
{
  const s = slideOf("CLOSING", "Close");
  s.addText("Thank you", { placeholder: "title" });
  s.addText("Questions are welcome", { placeholder: "body" });
  T(s, "Next, in Phase 3: the pipeline and baselines first, then HCT-Net, then the leave-one-subject-out experiments.",
    { x: 0.75, y: 4.6, w: 5.9, h: 1.0, fontSize: 18, color: C.PALE });
  T(s, `Group 5  ·  ${TEAM.map((n) => n.replace(/\s*\(.*\)/, "")).join(", ")}`,
    { x: 0.75, y: 6.45, w: 7.5, h: 0.35, fontSize: 13, color: C.PALE });
  s.addNotes("Thank you. Next comes Phase 3: the pipeline and the baselines first, then HCT-Net, then the experiments. " +
    "We are happy to take questions.");
}

module.exports = { THEME };
if (require.main === module) {
  pres.writeFile({ fileName: OUT }).then(async (f) => {
    // Optional: THEME_HELPER names a module exporting applyTheme(file, theme), which writes THEME's
    // colours into the deck's theme so PowerPoint's colour picker offers them. The slides look the same without it.
    const helper = process.env.THEME_HELPER;
    if (helper) {
      const { applyTheme } = require(helper);
      await applyTheme(f, THEME);
    }
    console.log("written", f);
  });
}
