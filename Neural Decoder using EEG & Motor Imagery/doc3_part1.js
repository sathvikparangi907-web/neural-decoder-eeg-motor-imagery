// ---------------------------------------------------------------
// Phase 2 Solution Design — shared helpers and sections 1 to 10
// ---------------------------------------------------------------
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
  PageBreak, LevelFormat, PageNumber, Footer, BorderStyle
} = require('docx');
const fs = require('fs');

const CW = 9500;
const NAVY = "1B3A6B";
const NAVYD = "122847";
const PURPLE = "5B3E96";
const GREY = "5A6478";
const CARD = "EFF3F9";
const TINT = "F3F0FA";
const CODEBG = "F5F6F9";
const MONO = "Courier New";

const H1 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 330, after: 145 },
  children: [new TextRun({ text: t, bold: true, color: NAVYD, size: 27 })]
});
const H2 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 250, after: 105 },
  children: [new TextRun({ text: t, bold: true, color: NAVY, size: 22 })]
});
const H3 = (t) => new Paragraph({
  heading: HeadingLevel.HEADING_3, spacing: { before: 190, after: 90 },
  children: [new TextRun({ text: t, bold: true, color: PURPLE, size: 20 })]
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
  children: [new TextRun({ text: t, size: 17, italics: true, color: GREY })]
});
const SP = (n = 110) => new Paragraph({ spacing: { after: n }, children: [new TextRun({ text: "", size: 10 })] });

function pngSize(p) { const b = fs.readFileSync(p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; }
function figure(file, widthPt) {
  const { w, h } = pngSize(file);
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 130, after: 40 },
    children: [new ImageRun({
      type: "png", data: fs.readFileSync(file),
      transformation: { width: widthPt, height: Math.round(widthPt * (h / w)) }
    })]
  });
}
function cell(text, { bold = false, bg, align = AlignmentType.LEFT, width, size = 18, color } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: bg ? { type: ShadingType.CLEAR, fill: bg, color: "auto" } : undefined,
    margins: { top: 72, bottom: 72, left: 95, right: 95 },
    children: [new Paragraph({
      alignment: align, spacing: { after: 0, line: 248 },
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
      bg: (opts.hi || []).includes(ri) ? TINT : (ri % 2 === 1 ? CARD : undefined),
      size: opts.size || 18, bold: opts.boldFirst && i === 0,
      align: (opts.center || []).includes(i) ? AlignmentType.CENTER : AlignmentType.LEFT
    }))
  }));
  return new Table({ columnWidths: widths, width: { size: CW, type: WidthType.DXA }, rows: [head, ...body] });
}
function note(title, lines, fill = CARD) {
  return new Table({
    columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        width: { size: CW, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill, color: "auto" },
        margins: { top: 125, bottom: 125, left: 145, right: 145 },
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
// monospace pseudocode block
function code(title, lines) {
  const kids = [];
  if (title) kids.push(new Paragraph({
    spacing: { after: 90 },
    children: [new TextRun({ text: title, bold: true, size: 18, color: NAVY })]
  }));
  lines.forEach(l => kids.push(new Paragraph({
    spacing: { after: 0, line: 238 },
    children: [new TextRun({ text: l === "" ? " " : l, font: MONO, size: 16, color: NAVYD })]
  })));
  return new Table({
    columnWidths: [CW], width: { size: CW, type: WidthType.DXA },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        width: { size: CW, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: CODEBG, color: "auto" },
        margins: { top: 120, bottom: 120, left: 150, right: 130 },
        children: kids
      })]
    })]
  });
}

module.exports = {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun,
  PageBreak, LevelFormat, PageNumber, Footer, BorderStyle, fs,
  CW, NAVY, NAVYD, PURPLE, GREY, CARD, TINT, MONO,
  H1, H2, H3, P, BUL, NUMI, CAP, SP, figure, table, note, code, cell
};
