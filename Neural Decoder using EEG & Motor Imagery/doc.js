// Phase 2 Solution Design: builds the Word document from design.md.
//
//   node doc.js                          names only (the public copy)
//   TEAM_JSON=team.json node doc.js      names from a local file, e.g. with registration numbers
//
// design.md is plain text with a few conventions:
//   # / ## / ###            headings            - item / 1. item     lists
//   Table: caption {#tab:x}  caption, then        ::table widths=..  then a pipe table
//   ![caption](file.png){#fig:x width=6.4}        a figure from fig/
//   {fig:x} / {tab:x}        become "Figure n" / "Table n"
//   > **Title** / > line     a shaded callout     **bold** inside any text
// Run `python figs.py` first. Open the result in Word once to fill in the table of contents
// (finalize.ps1 does that and exports the PDF).
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  AlignmentType, HeadingLevel, LevelFormat, TableOfContents, Footer, PageNumber, PositionalTab, PositionalTabAlignment,
  PositionalTabRelativeTo, PositionalTabLeader, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  TextWrappingType, PageBreak, VerticalAlign, TableLayoutType, Tab, TabStopType,
} = require("docx");

const FIG = path.join(__dirname, "fig");
const OUT = path.join(process.env.OUT_DIR || __dirname, "Phase2_Solution_Design.docx");
const TEAM = process.env.TEAM_JSON
  ? JSON.parse(fs.readFileSync(process.env.TEAM_JSON, "utf8"))
  : ["Ananya Gourishetty", "Haarika D", "Siddhanth Samal", "Sathvik P"];
const SRC = fs.readFileSync(path.join(__dirname, "design.md"), "utf8").replace(/\r\n/g, "\n");

const C = { INK: "14212B", MUTED: "5B6B78", TEAL: "0E9F96", TEAL_D: "0B7C75", TEAL_L: "2EC4B6", TINT: "EEF4F5",
            TINT2: "E1ECEE", RULE: "D3DDE1", WHITE: "FFFFFF", PALE: "CFE3E6" };
const PAGE = { w: 11906, h: 16838, top: 1191, bottom: 1134, side: 1247 };
const TW = PAGE.w - 2 * PAGE.side;                       // text width, twips
const BODY = 21, SMALL = 17;                              // half-points

// ---------------------------------------------------------------- figure and table numbers
const labels = {};
let nf = 0, nt = 0;
for (const m of SRC.matchAll(/\{#(fig|tab):([\w-]+)/g)) {
  labels[`${m[1]}:${m[2]}`] = m[1] === "fig" ? `Figure ${++nf}` : `Table ${++nt}`;
}
const refs = (s) => s.replace(/\{(fig|tab):([\w-]+)\}/g, (_, k, id) => {
  const v = labels[`${k}:${id}`];
  if (!v) throw new Error(`unknown reference ${k}:${id}`);
  return v;
});

// ---------------------------------------------------------------- inline text
function runs(text, o = {}) {
  return refs(text).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((t) => t.startsWith("**")
    ? new TextRun(Object.assign({}, o, { text: t.slice(2, -2), bold: true }))
    : new TextRun(Object.assign({}, o, { text: t })));
}
const P = (text, o = {}) => new Paragraph({
  alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 276 }, children: runs(text, { size: BODY }), ...o,
});

// ---------------------------------------------------------------- blocks
function heading(level, text) {
  const m = text.match(/^(\d+(?:\.\d+)?\.?)\s+(.*)$/);
  const kids = m && level === 1
    ? [new TextRun({ text: m[1] + "  ", color: C.TEAL }), new TextRun({ text: m[2] })]
    : [new TextRun({ text })];
  return new Paragraph({ heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][level - 1], children: kids });
}

function caption(kind, text) {
  const id = (text.match(/\{#((?:fig|tab):[\w-]+)/) || [])[1];
  const clean = text.replace(/\s*\{#[^}]*\}\s*$/, "");
  return new Paragraph({
    keepNext: kind === "tab", keepLines: true, spacing: kind === "tab" ? { before: 200, after: 90 } : { before: 60, after: 240 },
    children: [new TextRun({ text: `${labels[id]}.  `, bold: true, color: C.TEAL_D, size: SMALL }), ...runs(clean, { size: SMALL, color: C.MUTED })],
  });
}

function figure(file, width) {
  const buf = fs.readFileSync(path.join(FIG, file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return new Paragraph({
    alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 160, after: 40 },
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: width * 96, height: (width * 96 * h) / w } })],
  });
}

const NUMERIC = /^[\d.,\s×±%()+\-−–—/:=×]*$/;
function table(rows, widths, center = []) {
  const n = rows[0].length;
  const pct = widths && widths.length === n ? widths : Array(n).fill(1);
  const sum = pct.reduce((a, b) => a + b, 0);
  const colW = pct.map((p) => Math.floor((TW * p) / sum));
  colW[n - 1] += TW - colW.reduce((a, b) => a + b, 0);
  const centred = colW.map((_, ci) => center.includes(ci) ||
    (ci > 0 && rows.slice(1).every((r) => { const v = r[ci].replace(/\*\*/g, ""); return v === "" || NUMERIC.test(v) || ["✓", "—", "…"].includes(v); })));
  const size = n >= 9 ? 16 : 18;
  const keep = rows.length <= 15;
  const line = (sz, color) => ({ style: BorderStyle.SINGLE, size: sz, color });
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: colW, layout: TableLayoutType.FIXED,
    borders: { top: line(10, C.INK), bottom: line(10, C.INK), left: none, right: none,
               insideHorizontal: line(4, C.RULE), insideVertical: none },
    rows: rows.map((r, ri) => new TableRow({
      tableHeader: ri === 0, cantSplit: true,
      children: r.map((cell, ci) => new TableCell({
        width: { size: colW[ci], type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER,
        shading: ri === 0 ? { type: ShadingType.CLEAR, fill: C.TINT2, color: "auto" } : undefined,
        margins: { top: 45, bottom: 45, left: 85, right: 85 },
        children: [new Paragraph({
          keepNext: keep, spacing: { after: 0, line: 240 },
          alignment: centred[ci] ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: runs(cell, { size, bold: ri === 0 || undefined, color: ri === 0 ? C.INK : undefined }),
        })],
      })),
    })),
  });
}

function callout(lines) {
  const kids = lines.map((l, i) => new Paragraph({
    spacing: { after: i === 0 ? 100 : 70, line: 276 }, keepNext: i < lines.length - 1,
    children: runs(l, { size: i === 0 ? 21 : 20, color: i === 0 ? C.TEAL_D : C.INK }),
  }));
  return new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: [TW], layout: TableLayoutType.FIXED,
    borders: { top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } },
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: TW, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: C.TINT, color: "auto" },
      margins: { top: 180, bottom: 140, left: 220, right: 220 }, children: kids,
    })] })],
  });
}

const spacer = (after = 120) => new Paragraph({ spacing: { after }, children: [] });

// ---------------------------------------------------------------- parse design.md
function body() {
  const out = [];
  const lines = SRC.split("\n");
  let para = [], list = null, listN = 0, inRefs = false, pendingCaption = null, opts = {};
  // a paragraph that introduces a figure or table stays on the same page as it
  const nextLine = (i) => { for (let j = i + 1; j < lines.length; j++) if (lines[j].trim()) return lines[j]; return ""; };
  const flushPara = (keep = false) => { if (para.length) { out.push(P(para.join(" "), keep ? { keepNext: true } : {})); para = []; } };
  const flushList = () => { list = null; };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { flushPara(/^(!\[|Table: )/.test(nextLine(i))); flushList(); continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flushPara(); flushList();
      inRefs = m[2] === "References";
      out.push(heading(m[1].length, m[2]));
    } else if (line.startsWith("Table: ")) {
      flushPara(); pendingCaption = line.slice(7);
    } else if (line.startsWith("::table")) {
      opts = {};
      for (const kv of line.slice(7).trim().split(/\s+/).filter(Boolean)) {
        const [k, v] = kv.split("="); opts[k] = v.split(",").map(Number);
      }
    } else if (line.startsWith("|")) {
      flushPara();
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      i--;
      if (pendingCaption) { out.push(caption("tab", pendingCaption)); pendingCaption = null; }
      out.push(table(rows, opts.widths, opts.center || []));
      out.push(spacer(160));
      opts = {};
    } else if ((m = line.match(/^!\[(.*)\]\(([^)]+)\)\{([^}]*)\}$/))) {
      flushPara();
      const width = Number((m[3].match(/width=([\d.]+)/) || [])[1] || 6.4);
      out.push(figure(m[2], width));
      out.push(caption("fig", `${m[1]} {${m[3].split(" ")[0]}}`));
    } else if (line.startsWith("> ")) {
      flushPara();
      const block = [];
      while (i < lines.length && lines[i].startsWith("> ")) { block.push(lines[i].slice(2)); i++; }
      i--;
      out.push(spacer(60)); out.push(callout(block)); out.push(spacer(160));
    } else if ((m = line.match(/^- (.*)$/))) {
      flushPara();
      out.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 90, line: 276 },
        children: runs(m[1], { size: BODY }) }));
    } else if ((m = line.match(/^(\d+)\. (.*)$/)) && !inRefs) {
      flushPara();
      if (!list) { list = true; listN++; }
      out.push(new Paragraph({ numbering: { reference: "numbers", level: 0, instance: listN }, spacing: { after: 90, line: 276 },
        children: runs(m[2], { size: BODY }) }));
    } else if (inRefs && (m = line.match(/^\[(\d+)\]\s+(.*)$/))) {
      out.push(new Paragraph({ spacing: { after: 100, line: 264 }, indent: { left: 560, hanging: 560 },
        tabStops: [{ type: TabStopType.LEFT, position: 560 }],
        children: [new TextRun({ text: `[${m[1]}]`, size: 20, color: C.TEAL_D }), new TextRun({ children: [new Tab()], size: 20 }),
                   new TextRun({ text: m[2], size: 20 })] }));
    } else {
      para.push(line.trim());
    }
  }
  flushPara();
  return out;
}

// ---------------------------------------------------------------- cover and contents
function cover() {
  const band = fs.readFileSync(path.join(FIG, "cover_page.png"));
  const white = (text, o = {}) => new TextRun(Object.assign({ text, color: C.WHITE }, o));
  const out = [
    new Paragraph({ spacing: { before: 0, after: 0 }, children: [new ImageRun({
      type: "png", data: band, transformation: { width: 8.27 * 96, height: 4.35 * 96 },
      floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                  verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                  behindDocument: true, allowOverlap: true, wrap: { type: TextWrappingType.NONE } },
    })] }),
    new Paragraph({ spacing: { before: 260, after: 200 },
      children: [new TextRun({ text: "PHASE 2  ·  SOLUTION DESIGN", bold: true, size: 19, color: C.TEAL_L, characterSpacing: 40 })] }),
    new Paragraph({ spacing: { after: 220, line: 264 }, children: [
      white("Cross-Subject Motor Imagery EEG", { font: "Georgia", size: 48, bold: true }),
      white("Classification Using Deep Learning", { font: "Georgia", size: 48, bold: true, break: 1 })] }),
    new Paragraph({ spacing: { after: 0, line: 288 }, children: [
      new TextRun({ text: "Methodology and implementation plan for a small hybrid CNN–Transformer", size: 25, color: C.PALE }),
      new TextRun({ text: "that has to work for people it has never seen", size: 25, color: C.PALE, break: 1 })] }),
    new Paragraph({ spacing: { before: 2700, after: 0 }, children: [] }),
  ];
  const rows = [["Team", TEAM], ["Group", ["Group 5"]], ["Guide", ["Dr. Mohan Allam"]], ["Course", ["CSE4006 Deep Learning"]],
    ["School", ["School of Computer Science and Engineering, VIT-AP University"]], ["Dataset", ["BCI Competition IV dataset 2a"]]];
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const lw = 1900;
  out.push(new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: [lw, TW - lw], layout: TableLayoutType.FIXED,
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: rows.map(([k, vals]) => new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: lw, type: WidthType.DXA }, margins: { top: 90, bottom: 90, left: 0, right: 120 },
        children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: k.toUpperCase(), bold: true, size: 17, color: C.TEAL_D, characterSpacing: 30 })] })] }),
      new TableCell({ width: { size: TW - lw, type: WidthType.DXA }, margins: { top: 70, bottom: 70, left: 0, right: 0 },
        children: vals.map((v) => new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: v, size: 23, color: C.INK })] })) }),
    ] })),
  }));
  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "Contents", font: "Georgia", size: 34, bold: true, color: C.INK })] }));
  out.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }));
  out.push(new Paragraph({ children: [new PageBreak()] }));
  return out;
}

// ---------------------------------------------------------------- document
const footer = new Footer({ children: [new Paragraph({ children: [
  new TextRun({ text: "Phase 2 Solution Design  ·  Group 5", size: 16, color: C.MUTED }),
  new TextRun({ children: [new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, relativeTo: PositionalTabRelativeTo.MARGIN,
    leader: PositionalTabLeader.NONE }), PageNumber.CURRENT], size: 16, color: C.MUTED }),
] })] });

const doc = new Document({
  creator: "Group 5",
  lastModifiedBy: "Group 5",
  title: "Phase 2 Solution Design: Cross-Subject Motor Imagery EEG Classification Using Deep Learning",
  subject: "CSE4006 Deep Learning, VIT-AP University",
  description: "Methodology and implementation plan for HCT-Net, evaluated leave-one-subject-out on BCI Competition IV 2a",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: BODY, color: C.INK }, paragraph: { spacing: { line: 276 } } },
      heading1: { run: { font: "Georgia", size: 34, bold: true, color: C.INK },
        paragraph: { spacing: { before: 400, after: 140 }, keepNext: true, keepLines: true } },
      heading2: { run: { font: "Calibri", size: 25, bold: true, color: C.TEAL_D },
        paragraph: { spacing: { before: 240, after: 90 }, keepNext: true, keepLines: true } },
      heading3: { run: { font: "Calibri", size: 22, bold: true, color: C.INK },
        paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, keepLines: true } },
    },
    paragraphStyles: [
      { id: "TOC1", name: "toc 1", basedOn: "Normal", next: "Normal", run: { size: 19, bold: true },
        paragraph: { spacing: { before: 20, after: 0, line: 226 } } },
      { id: "TOC2", name: "toc 2", basedOn: "Normal", next: "Normal", run: { size: 18 },
        paragraph: { spacing: { after: 0, line: 226 }, indent: { left: 300 } } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 420, hanging: 260 } }, run: { color: C.TEAL } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 440, hanging: 320 } }, run: { bold: true, color: C.TEAL_D } } }] },
  ] },
  sections: [{
    properties: { titlePage: true, page: { size: { width: PAGE.w, height: PAGE.h },
      margin: { top: PAGE.top, bottom: PAGE.bottom, left: PAGE.side, right: PAGE.side, header: 600, footer: 560 } } },
    footers: { default: footer, first: new Footer({ children: [new Paragraph({ children: [] })] }) },
    children: [...cover(), ...body()],
  }],
});

Packer.toBuffer(doc).then((b) => { fs.writeFileSync(OUT, b); console.log("written", OUT, b.length, "bytes;", nf, "figures,", nt, "tables"); });
