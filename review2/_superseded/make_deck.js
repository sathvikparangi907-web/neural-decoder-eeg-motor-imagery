const pptxgen = require('pptxgenjs');
const pres = new pptxgen();

pres.layout = 'LAYOUT_WIDE';           // 13.3 x 7.5
const W = 13.3, H = 7.5, M = 0.62;
const CW = W - 2 * M;                  // 12.06

// ---- palette: deep indigo + electric teal (signal / neural) ----
const DARK   = "14163A";
const INDIGO = "2E3A8C";
const TEAL   = "00BFC9";
const CORAL  = "FF6B5B";
const LIGHT  = "F4F7FC";
const CARD   = "EDF1F9";
const GREY   = "5B6478";
const WHITE  = "FFFFFF";

const TITLE_FONT = "Cambria";
const BODY_FONT  = "Calibri";

// ---------- vertical stretch ----------
// Content was authored against a ~5.6" band; the canvas is 7.5".
// Stretch everything below Y0 so the slide fills, leaving footers alone.
const Y0 = 1.45, K = 1.26, SKIP_ABOVE = 6.0;
const ty = (y) => (y <= Y0 ? y : Y0 + (y - Y0) * K);
function stretch(opts) {
  if (!opts || typeof opts !== 'object') return opts;
  if (typeof opts.y === 'number' && opts.y < SKIP_ABOVE) {
    const y0 = opts.y;
    const y1 = ty(y0);
    if (typeof opts.h === 'number') opts.h = ty(y0 + opts.h) - y1;
    opts.y = y1;
  }
  if (Array.isArray(opts.rowH)) opts.rowH = opts.rowH.map(r => r * K);
  return opts;
}
function patch(s) {
  ['addText', 'addShape', 'addTable', 'addChart', 'addImage'].forEach(fn => {
    const orig = s[fn].bind(s);
    s[fn] = (...args) => { stretch(args[args.length - 1]); return orig(...args); };
  });
  return s;
}

// ---------- helpers ----------
function darkSlide() {
  const s = pres.addSlide();
  s.background = { color: DARK };
  return patch(s);
}
function lightSlide(title, kicker) {
  const s = patch(pres.addSlide());
  s.background = { color: WHITE };
  if (kicker) {
    s.addText(kicker.toUpperCase(), {
      x: M, y: 0.34, w: CW, h: 0.26, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11, bold: true, color: TEAL, charSpacing: 2, margin: 0
    });
  }
  s.addText(title, {
    x: M, y: kicker ? 0.60 : 0.44, w: CW, h: 0.62, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 30, bold: true, color: DARK, margin: 0, valign: 'top'
  });
  return s;
}
function card(s, x, y, w, h, fill = CARD) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, fill: { color: fill }, rectRadius: 0.09, line: { color: fill, width: 0 }
  });
}
function numCircle(s, x, y, n, d = 0.42, bg = TEAL, fg = WHITE) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 } });
  s.addText(String(n), {
    x, y, w: d, h: d, isTextBox: true, align: 'center', valign: 'middle',
    fontFace: BODY_FONT, fontSize: 14, bold: true, color: fg, margin: 0
  });
}
function footer(s, txt) {
  s.addText(txt, {
    x: M, y: H - 0.46, w: CW, h: 0.26, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 9.5, color: GREY, margin: 0
  });
}

// =====================================================================
// 1. TITLE
// =====================================================================
{
  const s = darkSlide();
  s.addShape(pres.ShapeType.ellipse, { x: 10.1, y: -1.5, w: 5.2, h: 5.2, fill: { color: INDIGO }, line: { width: 0 } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.4, y: 4.3, w: 3.1, h: 3.1, fill: { color: "1D2050" }, line: { width: 0 } });

  s.addText("PHASE 2  ·  1ST REVIEW", {
    x: M, y: 1.55, w: 9, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, charSpacing: 3, margin: 0
  });
  s.addText("Deep Learning–Based Neural Decoder", {
    x: M, y: 2.0, w: 9.6, h: 0.82, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 40, bold: true, color: WHITE, margin: 0
  });
  s.addText("for EEG Motor Imagery", {
    x: M, y: 2.78, w: 9.6, h: 0.82, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 40, bold: true, color: TEAL, margin: 0
  });
  s.addText("Methodology and Implementation Plan", {
    x: M, y: 3.85, w: 9.6, h: 0.4, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 18, color: "C7CEE6", margin: 0
  });
  s.addShape(pres.ShapeType.rect, { x: M, y: 4.45, w: 1.5, h: 0.035, fill: { color: TEAL }, line: { width: 0 } });
  s.addText("15 September 2026", {
    x: M, y: 4.72, w: 9.6, h: 0.32, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 13, color: "8E97B8", margin: 0
  });
  s.addNotes("Phase 2 deliverable: methodology, architecture, models, datasets, tools, implementation plan, experimental plan. Builds on the literature survey from the 0th Review.");
}

// =====================================================================
// 2. WHERE WE ARE
// =====================================================================
{
  const s = lightSlide("Where this review sits", "Project timeline");
  const phases = [
    ["Phase 1", "Problem + literature survey", "25 Aug – 8 Sep", "COMPLETE", TEAL],
    ["Phase 2", "Methodology + implementation plan", "9 – 15 Sep", "THIS REVIEW", INDIGO],
    ["Phase 3", "Build, train, evaluate", "16 Sep – 3 Oct", "NEXT", "9AA3BC"],
    ["Phase 4", "Paper + final submission", "4 – 10 Oct", "", "9AA3BC"],
  ];
  const cw = 2.85, gap = 0.22;
  phases.forEach((p, i) => {
    const x = M + i * (cw + gap);
    const active = i === 1;
    card(s, x, 1.85, cw, 2.5, active ? DARK : CARD);
    s.addText(p[0], {
      x: x + 0.24, y: 2.08, w: cw - 0.48, h: 0.34, isTextBox: true,
      fontFace: TITLE_FONT, fontSize: 19, bold: true, color: active ? WHITE : DARK, margin: 0
    });
    s.addText(p[1], {
      x: x + 0.24, y: 2.5, w: cw - 0.48, h: 0.95, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 13, color: active ? "C7CEE6" : GREY, margin: 0, valign: 'top'
    });
    s.addText(p[2], {
      x: x + 0.24, y: 3.42, w: cw - 0.48, h: 0.3, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 12, bold: true, color: active ? TEAL : DARK, margin: 0
    });
    if (p[3]) {
      s.addShape(pres.ShapeType.roundRect, {
        x: x + 0.24, y: 3.79, w: 1.5, h: 0.32, rectRadius: 0.16,
        fill: { color: active ? TEAL : "DDE3EF" }, line: { width: 0 }
      });
      s.addText(p[3], {
        x: x + 0.24, y: 3.79, w: 1.5, h: 0.32, isTextBox: true, align: 'center', valign: 'middle',
        fontFace: BODY_FONT, fontSize: 9, bold: true, color: active ? WHITE : GREY, margin: 0
      });
    }
  });
  s.addText("The 0th Review established the problem and surveyed four architectures. This review commits to a specific method, a testable hypothesis, and a dated plan to produce results by 3 October.", {
    x: M, y: 4.72, w: CW, h: 0.6, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 14, color: DARK, margin: 0
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 3. THE PROBLEM IN ONE NUMBER
// =====================================================================
{
  const s = darkSlide();
  s.addText("THE PROBLEM, IN ONE NUMBER", {
    x: M, y: 0.7, w: CW, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, charSpacing: 3, margin: 0
  });

  s.addText("82.52%", {
    x: M, y: 1.75, w: 3.5, h: 1.15, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 60, bold: true, color: WHITE, margin: 0
  });
  s.addText("on people it was\ntrained on", {
    x: M, y: 2.95, w: 3.5, h: 0.75, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 14, color: "8E97B8", margin: 0
  });

  s.addText("→", {
    x: 4.0, y: 1.95, w: 1.0, h: 0.85, isTextBox: true, align: 'center',
    fontFace: BODY_FONT, fontSize: 40, color: INDIGO, margin: 0
  });

  s.addText("58.64%", {
    x: 5.1, y: 1.75, w: 3.5, h: 1.15, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 60, bold: true, color: CORAL, margin: 0
  });
  s.addText("on a person it\nhas never met", {
    x: 5.1, y: 2.95, w: 3.5, h: 0.75, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 14, color: "8E97B8", margin: 0
  });

  card(s, 9.0, 1.75, 3.68, 1.95, "1D2050");
  s.addText("−23.88", {
    x: 9.24, y: 1.98, w: 3.2, h: 0.72, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 38, bold: true, color: CORAL, margin: 0
  });
  s.addText("percentage points lost —\nsame architecture, same dataset,\nonly the test subject changed", {
    x: 9.24, y: 2.72, w: 3.2, h: 0.85, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, color: "C7CEE6", margin: 0
  });

  s.addText("A decoder that scores 82% on people it has met and 59% on a stranger is not a deployable assistive device. A patient cannot be asked to supply hours of labelled calibration data before their wheelchair responds.", {
    x: M, y: 4.35, w: CW, h: 0.7, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 15, color: WHITE, margin: 0
  });
  s.addText("CTNet, BCI Competition IV-2a, 4-class motor imagery.  Source: Zhao et al., Scientific Reports 14:20237 (2024).", {
    x: M, y: 5.45, w: CW, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 10, italic: true, color: "6E77A0", margin: 0
  });
  s.addNotes("This single statistic is the motivation for the entire project. It is from CTNet, one of the four papers we reviewed. Within-subject 82.52%, cross-subject 58.64%.");
}

// =====================================================================
// 4. RESEARCH GAP — three constraints
// =====================================================================
{
  const s = lightSlide("Three constraints that pull against each other", "Research gap");
  const items = [
    ["1", "High accuracy", "on subjects never seen during training — not just on the people in the training set"],
    ["2", "Lightweight", "small enough to run on low-power assistive hardware with low latency"],
    ["3", "No lengthy calibration", "usable without hours of labelled data from each new user"],
  ];
  const cw2 = 3.86, gap2 = 0.24;
  items.forEach((it, i) => {
    const x = M + i * (cw2 + gap2);
    card(s, x, 1.85, cw2, 1.95);
    numCircle(s, x + 0.26, 2.1, it[0]);
    s.addText(it[1], {
      x: x + 0.26, y: 2.66, w: cw2 - 0.52, h: 0.36, isTextBox: true,
      fontFace: TITLE_FONT, fontSize: 18, bold: true, color: DARK, margin: 0
    });
    s.addText(it[2], {
      x: x + 0.26, y: 3.04, w: cw2 - 0.52, h: 0.66, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 12.5, color: GREY, margin: 0, valign: 'top'
    });
  });

  card(s, M, 4.06, CW, 1.42, DARK);
  s.addText("The unresolved question", {
    x: M + 0.3, y: 4.24, w: CW - 0.6, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, margin: 0
  });
  s.addText("Recent architectures close the cross-subject gap by adding capacity — attention layers, transformer depth, larger parameter counts — which works against constraints 2 and 3. Nobody has established whether the gain comes from architectural capacity, or from making the input representation subject-invariant in the first place.", {
    x: M + 0.3, y: 4.56, w: CW - 0.6, h: 0.8, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 13.5, color: WHITE, margin: 0, valign: 'top'
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 5. HYPOTHESIS
// =====================================================================
{
  const s = darkSlide();
  s.addShape(pres.ShapeType.ellipse, { x: -1.6, y: 4.4, w: 4.4, h: 4.4, fill: { color: "1A1D46" }, line: { width: 0 } });
  s.addText("OUR HYPOTHESIS", {
    x: M, y: 0.75, w: CW, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, charSpacing: 3, margin: 0
  });
  s.addText("H1", {
    x: M, y: 1.25, w: 1.2, h: 0.6, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 32, bold: true, color: TEAL, margin: 0
  });
  s.addText("Subject-invariance at the input contributes more to cross-subject decoding than an equivalent increase in model capacity — and the two are complementary, not redundant.", {
    x: M, y: 1.9, w: 11.4, h: 1.6, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 26, bold: true, color: WHITE, margin: 0, lineSpacingMultiple: 1.18
  });

  const subs = [
    ["H2", "Windowed attention matches full self-attention under LOSO with fewer parameters — unconstrained capacity overfits subject-specific structure on ~2,600 trials."],
    ["H3", "Input alignment reduces the number of labelled trials a new user must supply to reach a fixed accuracy."],
  ];
  subs.forEach((h, i) => {
    const y = 3.8 + i * 0.86;
    s.addText(h[0], {
      x: M, y, w: 0.75, h: 0.34, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 15, bold: true, color: TEAL, margin: 0
    });
    s.addText(h[1], {
      x: M + 0.8, y, w: 10.6, h: 0.72, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 13.5, color: "C7CEE6", margin: 0, valign: 'top'
    });
  });

  s.addText("Every hypothesis here is falsifiable by a specific experiment in Section 8. If H1 is wrong, that is a reportable finding — it would tell the field that architectural scaling is the productive direction.", {
    x: M, y: 5.45, w: 11.4, h: 0.6, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, italic: true, color: "8E97B8", margin: 0
  });
  s.addNotes("This is the key slide. At the 0th Review we answered 'Partially' on novelty. This is what replaces that — a specific, testable claim rather than 'we will investigate'.");
}

// =====================================================================
// 6. METHODOLOGY PIPELINE
// =====================================================================
{
  const s = lightSlide("Five-stage pipeline", "Proposed methodology");
  const stages = [
    ["Acquisition", "Load epochs,\nselect channels,\nreject artefacts"],
    ["Conditioning", "Band-pass 4–38 Hz\nEuclidean Alignment\nNormalise"],
    ["Encoding", "Depthwise conv →\nmulti-scale temporal →\nwindowed attention"],
    ["Objective", "Cross-entropy +\ncontrastive +\nadversarial"],
    ["Interpretation", "Class Activation\nTopography +\nattention maps"],
  ];
  const cw3 = 2.24, gap3 = 0.21;
  stages.forEach((st, i) => {
    const x = M + i * (cw3 + gap3);
    const accent = i === 1 || i === 2;
    card(s, x, 2.0, cw3, 2.45, accent ? DARK : CARD);
    numCircle(s, x + 0.22, 2.22, i + 1, 0.4, accent ? TEAL : INDIGO);
    s.addText(st[0], {
      x: x + 0.22, y: 2.76, w: cw3 - 0.44, h: 0.34, isTextBox: true,
      fontFace: TITLE_FONT, fontSize: 15, bold: true, color: accent ? WHITE : DARK, margin: 0
    });
    s.addText(st[1], {
      x: x + 0.22, y: 3.14, w: cw3 - 0.44, h: 1.1, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11.5, color: accent ? "C7CEE6" : GREY, margin: 0, valign: 'top'
    });
  });
  s.addText("Stages 2 and 3 carry the contribution. Stage 2 removes subject-specific covariance before the network ever sees the data; stage 3 is the lightweight hybrid encoder.", {
    x: M, y: 4.72, w: CW, h: 0.5, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 14, color: DARK, margin: 0
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 7. ARCHITECTURE — component provenance
// =====================================================================
{
  const s = lightSlide("SAND-Net: every component traces to a paper", "System architecture");
  s.addText("Subject-Agnostic Neural Decoder — nothing is included because it appeared in a paper; each component must earn its place in the ablation.", {
    x: M, y: 1.28, w: CW, h: 0.34, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 13, color: GREY, margin: 0
  });

  const rows = [
    ["Component", "Taken from", "Why it is included"],
    ["Euclidean Alignment", "He & Wu (2020)", "Removes subject covariance shift — unsupervised, needs no target labels"],
    ["Depthwise-separable conv", "EEGNet (2018)", "CSP-like spatial filters at very low parameter cost"],
    ["Multi-scale dilated conv", "ATCNet (2023) / CTNet (2024)", "Mu and beta rhythms evolve on different timescales"],
    ["Windowed self-attention", "EEG Conformer (2023)", "Long-range dependency without O(T²) cost or overfitting"],
    ["Contrastive + adversarial loss", "Domain-generalisation lit.", "Forces class structure to be shared across subjects"],
    ["Class Activation Topography", "EEG Conformer (2023)", "Channel contribution per class, for physiological validation"],
  ];
  s.addTable(rows.map((r, ri) => r.map((c, ci) => ({
    text: c,
    options: {
      fontFace: BODY_FONT, fontSize: ri === 0 ? 11.5 : 12,
      bold: ri === 0 || ci === 0,
      color: ri === 0 ? WHITE : (ri === 5 ? DARK : DARK),
      fill: { color: ri === 0 ? DARK : (ri === 5 ? "DFF5F6" : (ri % 2 === 0 ? LIGHT : WHITE)) },
      valign: 'middle'
    }
  }))), {
    x: M, y: 1.78, w: CW, colW: [3.3, 3.0, 5.76],
    rowH: [0.34, 0.45, 0.45, 0.45, 0.45, 0.45, 0.45],
    border: { type: 'solid', color: "D8DEEC", pt: 0.5 },
    margin: [4, 9, 4, 9]
  });
  s.addText("Highlighted row: the one addition none of the four reviewed architectures has. Target budget under 50,000 parameters — between ShallowConvNet (47,364) and ATCNet (113,732).", {
    x: M, y: 5.35, w: CW, h: 0.5, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, italic: true, color: GREY, margin: 0
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 8. EUCLIDEAN ALIGNMENT
// =====================================================================
{
  const s = lightSlide("The calibration-free mechanism", "Why alignment, not just architecture");
  card(s, M, 1.75, 5.8, 2.15, DARK);
  s.addText("Euclidean Alignment", {
    x: M + 0.3, y: 1.95, w: 5.2, h: 0.32, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, margin: 0
  });
  s.addText([
    { text: "R", options: { fontSize: 21, color: WHITE } },
    { text: "s", options: { fontSize: 21, color: WHITE, subscript: true } },
    { text: "  =  ", options: { fontSize: 21, color: WHITE } },
    { text: "1/N · Σ X", options: { fontSize: 21, color: WHITE } },
    { text: "i", options: { fontSize: 21, color: WHITE, subscript: true } },
    { text: " X", options: { fontSize: 21, color: WHITE } },
    { text: "i", options: { fontSize: 21, color: WHITE, subscript: true } },
    { text: "ᵀ", options: { fontSize: 21, color: WHITE } },
  ], { x: M + 0.3, y: 2.4, w: 5.2, h: 0.42, isTextBox: true, fontFace: TITLE_FONT, margin: 0 });
  s.addText([
    { text: "X̃", options: { fontSize: 21, color: TEAL } },
    { text: "i", options: { fontSize: 21, color: TEAL, subscript: true } },
    { text: "  =  R", options: { fontSize: 21, color: TEAL } },
    { text: "s", options: { fontSize: 21, color: TEAL, subscript: true } },
    { text: "", options: { fontSize: 21, color: TEAL } },
    { text: "−1/2", options: { fontSize: 21, color: TEAL, superscript: true } },
    { text: " X", options: { fontSize: 21, color: TEAL } },
    { text: "i", options: { fontSize: 21, color: TEAL, subscript: true } },
  ], { x: M + 0.3, y: 2.92, w: 5.2, h: 0.42, isTextBox: true, fontFace: TITLE_FONT, margin: 0 });
  s.addText("After the transform, every subject's mean covariance equals the identity matrix.", {
    x: M + 0.3, y: 3.42, w: 5.2, h: 0.36, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, color: "C7CEE6", margin: 0
  });

  const props = [
    ["Unsupervised", "Needs only unlabelled trials from the new user — never their labels"],
    ["Nearly free", "One eigendecomposition of a 22×22 matrix; negligible against a forward pass"],
    ["Deployable", "New user records a minute of unlabelled imagery; the matrix is computed from it"],
  ];
  props.forEach((p, i) => {
    const y = 1.75 + i * 0.74;
    card(s, 6.72, y, 5.96, 0.63, CARD);
    s.addText(p[0], {
      x: 6.94, y: y + 0.06, w: 1.72, h: 0.26, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: INDIGO, margin: 0
    });
    s.addText(p[1], {
      x: 6.94, y: y + 0.3, w: 5.5, h: 0.3, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11.5, color: GREY, margin: 0
    });
  });

  card(s, M, 4.2, CW, 1.05, "DFF5F6");
  s.addText("This is what makes \"without lengthy calibration\" operational rather than aspirational. Most recent work attacks subject variability inside the network. We attack it before the network sees the data — and then test, in the ablation, which of the two actually matters.", {
    x: M + 0.3, y: 4.38, w: CW - 0.6, h: 0.7, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 13.5, color: DARK, margin: 0, valign: 'top'
  });
  footer(s, "He & Wu, IEEE TBME 67(2):399–410, 2020");
}

// =====================================================================
// 9. DATASETS
// =====================================================================
{
  const s = lightSlide("Three motor imagery datasets, tiered", "Dataset selection");
  const ds = [
    ["PRIMARY", "BCI Competition IV-2a", "9 subjects · 22 channels\n4 classes · 250 Hz\n576 trials/subject", "Common to all four reviewed papers — lets us sanity-check reproduced baselines", TEAL],
    ["SECONDARY", "BCI Competition IV-2b", "9 subjects · 3 channels\n2 classes · 250 Hz\n720 trials/subject", "Only C3, Cz, C4 — tests survival under drastic loss of spatial information", INDIGO],
    ["STRETCH", "High Gamma Dataset", "14 subjects · 128 channels\n4 classes · 500 Hz\n~880 trials/subject", "Harder generalisation test; attempted only if the schedule allows", "9AA3BC"],
  ];
  const cw4 = 3.86, gap4 = 0.24;
  ds.forEach((d, i) => {
    const x = M + i * (cw4 + gap4);
    card(s, x, 1.8, cw4, 2.6);
    s.addShape(pres.ShapeType.roundRect, {
      x: x + 0.24, y: 2.0, w: 1.42, h: 0.3, rectRadius: 0.15, fill: { color: d[4] }, line: { width: 0 }
    });
    s.addText(d[0], {
      x: x + 0.24, y: 2.0, w: 1.42, h: 0.3, isTextBox: true, align: 'center', valign: 'middle',
      fontFace: BODY_FONT, fontSize: 9, bold: true, color: WHITE, margin: 0
    });
    s.addText(d[1], {
      x: x + 0.24, y: 2.42, w: cw4 - 0.48, h: 0.34, isTextBox: true,
      fontFace: TITLE_FONT, fontSize: 16, bold: true, color: DARK, margin: 0
    });
    s.addText(d[2], {
      x: x + 0.24, y: 2.82, w: cw4 - 0.48, h: 0.78, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11.5, color: INDIGO, margin: 0, valign: 'top'
    });
    s.addText(d[3], {
      x: x + 0.24, y: 3.64, w: cw4 - 0.48, h: 0.62, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11, color: GREY, margin: 0, valign: 'top'
    });
  });

  card(s, M, 4.62, CW, 1.05, "FFEFE9");
  s.addText("SEED is deliberately excluded", {
    x: M + 0.3, y: 4.78, w: CW - 0.6, h: 0.28, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: "C2402F", margin: 0
  });
  s.addText("EEG Conformer also evaluates on SEED, but SEED is emotion recognition — participants watch film clips and the label is positive / neutral / negative. It contains no motor imagery and no movement labels. Training jointly across two unrelated label spaces would measure nothing about motor intent decoding.", {
    x: M + 0.3, y: 5.06, w: CW - 0.6, h: 0.55, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, color: DARK, margin: 0, valign: 'top'
  });
  s.addNotes("If asked why we dropped SEED: it is an emotion dataset, not motor imagery. Including it would be a category error, not extra breadth.");
}

// =====================================================================
// 10. THE PROTOCOL PROBLEM (chart)
// =====================================================================
{
  const s = lightSlide("Published numbers cannot be ranked against each other", "Baselines");

  s.addChart(pres.ChartType.bar, [
    {
      name: "Reported accuracy on BCI IV-2a (%)",
      labels: ["EEGNet", "ShallowConvNet", "EEG Conformer", "ATCNet", "CTNet"],
      values: [68.67, 67.48, 78.66, 81.10, 82.52]
    }
  ], {
    x: M, y: 1.72, w: 6.7, h: 3.35,
    barDir: 'col', chartColors: [INDIGO],
    showTitle: false, showLegend: false,
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.00',
    dataLabelFontSize: 10, dataLabelColor: DARK, dataLabelFontFace: BODY_FONT,
    catAxisLabelColor: GREY, catAxisLabelFontSize: 10, catAxisLabelFontFace: BODY_FONT,
    valAxisLabelColor: GREY, valAxisLabelFontSize: 9, valAxisLabelFontFace: BODY_FONT,
    valAxisMinVal: 50, valAxisMaxVal: 95,
    valGridLine: { color: "E4E9F2", size: 1 },
    catGridLine: { style: 'none' },
    barGapWidthPct: 55
  });

  const notes = [
    ["Different protocols", "Hold-out, 5-fold, session-based and subject-specific splits all appear in this chart."],
    ["Same model, two figures", "EEGNet is quoted at 68.67% by the ATCNet authors and 71.50% by another — same model, same dataset."],
    ["All within-subject", "These are not cross-subject numbers. The cross-subject picture is much lower."],
  ];
  notes.forEach((n, i) => {
    const y = 1.78 + i * 0.95;
    card(s, 7.55, y, 5.13, 0.84, CARD);
    s.addText(n[0], {
      x: 7.76, y: y + 0.08, w: 4.7, h: 0.26, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 12, bold: true, color: INDIGO, margin: 0
    });
    s.addText(n[1], {
      x: 7.76, y: y + 0.33, w: 4.7, h: 0.46, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11, color: GREY, margin: 0, valign: 'top'
    });
  });

  card(s, 7.55, 4.63, 5.13, 0.9, DARK);
  s.addText("Our Objective 2", {
    x: 7.76, y: 4.75, w: 4.7, h: 0.26, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: TEAL, margin: 0
  });
  s.addText("Re-run all four under one identical LOSO protocol. That comparison does not exist in the literature.", {
    x: 7.76, y: 5.0, w: 4.7, h: 0.46, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, color: WHITE, margin: 0, valign: 'top'
  });
  footer(s, "Accuracies as reported by each paper's authors under their own evaluation protocol");
}

// =====================================================================
// 11. LOSO PROTOCOL
// =====================================================================
{
  const s = lightSlide("Leave-one-subject-out, with a held-out validation subject", "Experimental protocol");

  const rows = [
    ["Fold", "Training (7 subjects)", "Validation (1)", "Test (1)"],
    ["1", "S3 – S9", "S2", "S1"],
    ["2", "S1, S4 – S9", "S3", "S2"],
    ["…", "…", "…", "…"],
    ["9", "S2 – S7", "S1", "S9"],
  ];
  s.addTable(rows.map((r, ri) => r.map((c, ci) => ({
    text: c,
    options: {
      fontFace: BODY_FONT, fontSize: ri === 0 ? 11.5 : 12.5,
      bold: ri === 0,
      color: ri === 0 ? WHITE : (ci === 3 ? CORAL : DARK),
      fill: { color: ri === 0 ? DARK : (ri % 2 === 0 ? LIGHT : WHITE) },
      align: ci === 0 ? 'center' : 'left', valign: 'middle'
    }
  }))), {
    x: M, y: 1.82, w: 6.6, colW: [0.8, 3.0, 1.5, 1.3],
    rowH: [0.36, 0.42, 0.42, 0.42, 0.42],
    border: { type: 'solid', color: "D8DEEC", pt: 0.5 },
    margin: [4, 9, 4, 9]
  });
  s.addText("Reported figure is the mean and standard deviation across all 9 folds.", {
    x: M, y: 4.08, w: 6.6, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, italic: true, color: GREY, margin: 0
  });

  card(s, 7.45, 1.82, 5.23, 1.5, DARK);
  s.addText("Why a validation SUBJECT, not a validation split", {
    x: 7.68, y: 1.98, w: 4.8, h: 0.28, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: TEAL, margin: 0
  });
  s.addText("Validating on trials from subjects that also appear in training selects hyperparameters that favour within-subject fit — exactly the behaviour we are trying to avoid.", {
    x: 7.68, y: 2.3, w: 4.8, h: 0.9, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, color: WHITE, margin: 0, valign: 'top'
  });

  card(s, 7.45, 3.46, 5.23, 1.5, "FFEFE9");
  s.addText("Leakage control", {
    x: 7.68, y: 3.62, w: 4.8, h: 0.28, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: "C2402F", margin: 0
  });
  s.addText("Normalisation statistics, augmentation and hyperparameter choices come only from training and validation subjects. The test subject contributes unlabelled trials to alignment — the same information a real deployment would have.", {
    x: 7.68, y: 3.94, w: 4.8, h: 0.95, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, color: DARK, margin: 0, valign: 'top'
  });

  s.addText("Metrics: accuracy (mean ± std), Cohen's kappa, macro-F1, confusion matrix, parameters / FLOPs / latency, and a Wilcoxon signed-rank test paired across the 9 subjects at α = 0.05.", {
    x: M, y: 5.25, w: CW, h: 0.5, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12.5, color: DARK, margin: 0
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 12. ABLATION
// =====================================================================
{
  const s = lightSlide("The ablation is the experiment that tests H1", "Ablation design");

  const rows = [
    ["", "EA", "Multi-scale", "Wind. attn", "SupCon", "DANN", "What this row is"],
    ["A1", "—", "—", "—", "—", "—", "EEGNet-equivalent baseline"],
    ["A2", "✓", "—", "—", "—", "—", "Alignment alone"],
    ["A3", "—", "✓", "✓", "—", "—", "Capacity alone"],
    ["A4", "✓", "✓", "—", "—", "—", "Alignment + multi-scale"],
    ["A5", "✓", "✓", "✓", "—", "—", "Full architecture, no DG losses"],
    ["A6", "✓", "✓", "✓", "✓", "—", "Plus contrastive"],
    ["A7", "✓", "✓", "✓", "—", "✓", "Plus adversarial"],
    ["A8", "✓", "✓", "✓", "✓", "✓", "Full SAND-Net"],
  ];
  const hi = [1, 2, 3];  // A1, A2, A3 rows
  s.addTable(rows.map((r, ri) => r.map((c, ci) => ({
    text: c,
    options: {
      fontFace: BODY_FONT, fontSize: ri === 0 ? 10 : 11,
      bold: ri === 0 || ci === 0,
      color: ri === 0 ? WHITE : DARK,
      fill: { color: ri === 0 ? DARK : (hi.includes(ri) ? "DFF5F6" : (ri % 2 === 0 ? LIGHT : WHITE)) },
      align: ci === 6 ? 'left' : 'center', valign: 'middle'
    }
  }))), {
    x: M, y: 1.78, w: 7.5, colW: [0.55, 0.6, 1.05, 0.95, 0.85, 0.7, 2.8],
    rowH: [0.32, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    border: { type: 'solid', color: "D8DEEC", pt: 0.5 },
    margin: [2, 6, 2, 6]
  });

  const comps = [
    ["A1 vs A2 vs A3", "The core test of H1. A2 isolates alignment with no added capacity; A3 isolates capacity with no alignment."],
    ["A3 vs A5", "Does alignment still help once the architecture is already strong?"],
    ["A5 vs A6 / A7 / A8", "Are the domain-generalisation losses complementary to input alignment, or redundant with it?"],
    ["A4 vs A5", "Does windowed attention earn its parameters?"],
  ];
  comps.forEach((c, i) => {
    const y = 1.78 + i * 0.86;
    card(s, 8.4, y, 4.28, 0.76, CARD);
    s.addText(c[0], {
      x: 8.6, y: y + 0.06, w: 3.9, h: 0.24, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: INDIGO, margin: 0
    });
    s.addText(c[1], {
      x: 8.6, y: y + 0.29, w: 3.9, h: 0.44, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 10.5, color: GREY, margin: 0, valign: 'top'
    });
  });

  s.addText("Each configuration runs over all 9 LOSO folds — 72 training runs. If A2 − A1 > A3 − A1, H1 is supported.", {
    x: M, y: 5.35, w: CW, h: 0.4, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: DARK, margin: 0
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 13. TWO VALIDATION EXPERIMENTS
// =====================================================================
{
  const s = lightSlide("Two experiments the reviewed papers do not run", "Validation");

  card(s, M, 1.8, 5.86, 3.4, CARD);
  numCircle(s, M + 0.3, 2.04, "1", 0.44, INDIGO);
  s.addText("Calibration efficiency", {
    x: M + 0.3, y: 2.62, w: 5.26, h: 0.36, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 18, bold: true, color: DARK, margin: 0
  });
  s.addText("After LOSO training, fine-tune on n labelled trials from the held-out subject for n = 0, 5, 10, 20, 40, 80 and plot accuracy against n.", {
    x: M + 0.3, y: 3.04, w: 5.26, h: 0.75, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12.5, color: GREY, margin: 0, valign: 'top'
  });
  s.addText("A model that becomes usable at n = 10 is far more deployable than one needing n = 80 — even if their accuracies at n = 80 are identical. This is the figure tied most directly to the clinical motivation.", {
    x: M + 0.3, y: 3.86, w: 5.26, h: 1.0, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, color: DARK, margin: 0, valign: 'top'
  });

  card(s, 6.82, 1.8, 5.86, 3.4, DARK);
  numCircle(s, 7.12, 2.04, "2", 0.44, TEAL);
  s.addText("Neurophysiological validation", {
    x: 7.12, y: 2.62, w: 5.26, h: 0.36, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 18, bold: true, color: WHITE, margin: 0
  });
  s.addText("Motor imagery produces event-related desynchronisation contralateral to the imagined limb: left-hand imagery suppresses mu rhythm near C4, right-hand near C3.", {
    x: 7.12, y: 3.04, w: 5.26, h: 0.8, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12.5, color: "C7CEE6", margin: 0, valign: 'top'
  });
  s.addText("PASS — contralateral peaks at C3 / C4: the model learned real physiology.", {
    x: 7.12, y: 3.92, w: 5.26, h: 0.4, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, margin: 0, valign: 'top'
  });
  s.addText("FAIL — frontal or symmetric peaks: the model is reading ocular or muscular artefacts, and the accuracy figure is not measuring motor intent regardless of how high it is.", {
    x: 7.12, y: 4.32, w: 5.26, h: 0.7, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: CORAL, margin: 0, valign: 'top'
  });

  s.addText("Interpretability here is a correctness check, not a presentation aid. It has a real failure mode and we will report the result either way.", {
    x: M, y: 5.42, w: CW, h: 0.4, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12.5, italic: true, color: GREY, margin: 0
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 14. TIMELINE
// =====================================================================
{
  const s = lightSlide("Phase 3: 18 days to results", "Implementation plan");
  const ms = [
    ["16–17 Sep", "Environment and data", "All three datasets downloading; EDA plots produced"],
    ["18–19 Sep", "Preprocessing + alignment", "Cached tensors; alignment verified (covariance ≈ identity)"],
    ["20–22 Sep", "Baselines, within-subject", "EEGNet and Conformer reproduce published accuracy within ±3 pts"],
    ["23–25 Sep", "LOSO harness + all baselines", "9-fold LOSO results for all five baselines on IV-2a"],
    ["26–28 Sep", "SAND-Net implementation", "Trains end to end; parameter count under 50k confirmed"],
    ["29–30 Sep", "Ablation study", "All 8 configurations × 9 folds complete"],
    ["1–2 Oct", "IV-2b, calibration, interpretability", "Cross-dataset results; topographies; calibration figure"],
    ["3 Oct", "Consolidation → 2nd Review", "Final tables, figures and significance tests"],
  ];
  ms.forEach((m, i) => {
    const y = 1.65 + i * 0.5;
    const last = i === ms.length - 1;
    s.addShape(pres.ShapeType.roundRect, {
      x: M, y, w: CW, h: 0.44, rectRadius: 0.06,
      fill: { color: last ? "DFF5F6" : (i % 2 === 0 ? LIGHT : WHITE) },
      line: { color: "E4E9F2", width: 0.5 }
    });
    s.addText(m[0], {
      x: M + 0.18, y, w: 1.35, h: 0.44, isTextBox: true, valign: 'middle',
      fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: last ? TEAL : INDIGO, margin: 0
    });
    s.addText(m[1], {
      x: M + 1.62, y, w: 3.5, h: 0.44, isTextBox: true, valign: 'middle',
      fontFace: BODY_FONT, fontSize: 12, bold: true, color: DARK, margin: 0
    });
    s.addText(m[2], {
      x: M + 5.2, y, w: 6.6, h: 0.44, isTextBox: true, valign: 'middle',
      fontFace: BODY_FONT, fontSize: 11.5, color: GREY, margin: 0
    });
  });
  s.addText("Front-loaded deliberately: the pipeline and baselines must work before the proposed model is written. A proposed model evaluated on a broken pipeline is worthless.", {
    x: M, y: 5.72, w: CW, h: 0.45, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12.5, italic: true, color: DARK, margin: 0
  });
}

// =====================================================================
// 15. COMPUTE + RISKS
// =====================================================================
{
  const s = lightSlide("The plan is only credible if it fits the GPU budget", "Feasibility");

  s.addText("Compute estimate", {
    x: M, y: 1.7, w: 5.8, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 13, bold: true, color: INDIGO, margin: 0
  });
  const cr = [
    ["Experiment set", "Runs", "Est. total"],
    ["Baselines, LOSO, IV-2a", "45", "≈ 6 h"],
    ["SAND-Net, LOSO, IV-2a", "9", "≈ 1.2 h"],
    ["Ablation, 8 configs", "72", "≈ 9.6 h"],
    ["IV-2b, all models", "54", "≈ 2.7 h"],
    ["Calibration curve", "54", "≈ 1.8 h"],
    ["Contingency", "—", "≈ 5 h"],
    ["Total", "", "≈ 26 GPU-hours"],
  ];
  s.addTable(cr.map((r, ri) => r.map((c, ci) => ({
    text: c,
    options: {
      fontFace: BODY_FONT, fontSize: ri === 0 ? 10.5 : 11.5,
      bold: ri === 0 || ri === cr.length - 1,
      color: ri === 0 ? WHITE : DARK,
      fill: { color: ri === 0 ? DARK : (ri === cr.length - 1 ? "DFF5F6" : (ri % 2 === 0 ? LIGHT : WHITE)) },
      align: ci === 0 ? 'left' : 'center', valign: 'middle'
    }
  }))), {
    x: M, y: 2.05, w: 5.8, colW: [3.0, 1.2, 1.6],
    rowH: [0.32, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31, 0.33],
    border: { type: 'solid', color: "D8DEEC", pt: 0.5 },
    margin: [2, 7, 2, 7]
  });
  s.addText("Kaggle provides roughly 30 GPU-hours per week, so this fits — provided preprocessing is cached and every run is checkpointed.", {
    x: M, y: 4.80, w: 5.8, h: 0.5, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 11.5, italic: true, color: GREY, margin: 0, valign: 'top'
  });

  s.addText("Top risks, with the response already decided", {
    x: 6.9, y: 1.7, w: 5.78, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 13, bold: true, color: INDIGO, margin: 0
  });
  const risks = [
    ["Runtime exceeds GPU hours", "Cache tensors, mixed precision, drop the High Gamma tier first"],
    ["Baselines miss published accuracy", "Use Braindecode / official repos; report both figures and explain the gap"],
    ["Session timeouts", "Checkpoint every epoch; resumable trainer"],
    ["SAND-Net does not beat baselines", "The ablation still answers H1 — a negative result is a valid finding"],
  ];
  risks.forEach((r, i) => {
    const y = 2.06 + i * 0.78;
    card(s, 6.9, y, 5.78, 0.68, CARD);
    s.addText(r[0], {
      x: 7.1, y: y + 0.05, w: 5.4, h: 0.26, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11.5, bold: true, color: DARK, margin: 0
    });
    s.addText(r[1], {
      x: 7.1, y: y + 0.3, w: 5.4, h: 0.34, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 10.5, color: GREY, margin: 0
    });
  });
  footer(s, "Phase 2 — Methodology and Implementation Plan");
}

// =====================================================================
// 16. SUCCESS CRITERIA
// =====================================================================
{
  const s = darkSlide();
  s.addShape(pres.ShapeType.ellipse, { x: 10.6, y: 4.6, w: 4.2, h: 4.2, fill: { color: "1A1D46" }, line: { width: 0 } });
  s.addText("WHAT WE WILL SHOW ON 3 OCTOBER", {
    x: M, y: 0.68, w: CW, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, charSpacing: 3, margin: 0
  });
  s.addText("Success criteria, fixed in advance", {
    x: M, y: 1.08, w: CW, h: 0.55, isTextBox: true,
    fontFace: TITLE_FONT, fontSize: 30, bold: true, color: WHITE, margin: 0
  });

  const crit = [
    ["≥ 70%", "LOSO accuracy on IV-2a", "Independent LOSO studies place EEGNet and Conformer at 68–70%"],
    ["< 50k", "parameters", "Below ShallowConvNet (47,364), well below ATCNet (113,732)"],
    ["≤ 20", "labelled trials to calibrate", "Within 5 points of subject-specific accuracy"],
    ["p < 0.05", "Wilcoxon signed-rank", "Paired across the 9 subjects — the test Conformer uses"],
  ];
  const cw5 = 2.94, gap5 = 0.19;
  crit.forEach((c, i) => {
    const x = M + i * (cw5 + gap5);
    s.addShape(pres.ShapeType.roundRect, {
      x, y: 1.95, w: cw5, h: 2.25, rectRadius: 0.09, fill: { color: "1D2050" }, line: { width: 0 }
    });
    s.addText(c[0], {
      x: x + 0.22, y: 2.16, w: cw5 - 0.44, h: 0.6, isTextBox: true,
      fontFace: TITLE_FONT, fontSize: 30, bold: true, color: TEAL, margin: 0
    });
    s.addText(c[1], {
      x: x + 0.22, y: 2.8, w: cw5 - 0.44, h: 0.42, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 12.5, bold: true, color: WHITE, margin: 0, valign: 'top'
    });
    s.addText(c[2], {
      x: x + 0.22, y: 3.24, w: cw5 - 0.44, h: 0.82, isTextBox: true,
      fontFace: BODY_FONT, fontSize: 11, color: "8E97B8", margin: 0, valign: 'top'
    });
  });

  s.addText("On novelty", {
    x: M, y: 4.48, w: CW, h: 0.3, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 12, bold: true, color: TEAL, margin: 0
  });
  s.addText("The 0th Review answered “Partially”. That investigation is now complete. The contribution is not a combination of existing techniques — it is the first evaluation of all four architectures under one identical LOSO protocol, a controlled test of whether input alignment or architectural capacity drives cross-subject decoding, and a calibration-efficiency characterisation stating how much labelled data a new user actually needs. The last two are questions the reviewed literature does not answer, and both yield a useful result whichever way they resolve.", {
    x: M, y: 4.8, w: 11.6, h: 1.5, isTextBox: true,
    fontFace: BODY_FONT, fontSize: 13, color: WHITE, margin: 0, valign: 'top', lineSpacingMultiple: 1.15
  });
  s.addNotes("Close on this. The honest framing: we are not claiming a brand-new architecture. We are claiming a question the field has not answered and a rigorous way to answer it.");
}

pres.writeFile({ fileName: '/home/claude/review2/Phase2_Review_Presentation.pptx' })
  .then(f => console.log('written', f));
