// Brainstorm & Planning export, laid out like "Unit 1 - Brainstorm and Planning.docx":
// resources table, then the cycle × stream table (Theory | Homework | Design | Prac),
// the assessment timeline, the case study and the brand allocation table.
import { AlignmentType, Document, HeadingLevel, Packer, PageOrientation, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { getSlot, lessonTitle } from "../rules";
import type { Piece, Stream, Unit } from "../types";
import { slotKey } from "../types";

const NAVY = "001D3E";
const FONT = "Helvetica";
const FULL = 15138;

const para = (text: string, o: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}) =>
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text, bold: o.bold, color: o.color, italics: o.italics, font: FONT, size: o.size ?? 18 })] });

const cell = (children: Paragraph[], width: number, o: { fill?: string; span?: number } = {}) =>
  new TableCell({
    children: children.length ? children : [para("")],
    width: { size: width, type: WidthType.DXA },
    columnSpan: o.span,
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });

const head = (text: string, width: number, span?: number) => cell([para(text, { bold: true, color: "FFFFFF" })], width, { fill: NAVY, span });

function lessonParas(u: Unit, key: string, number: number): Paragraph[] {
  const s = getSlot(u, key);
  const pieces = s.pieceIds.map((id) => u.pieces.find((p) => p.id === id)).filter(Boolean) as Piece[];
  if (!pieces.length) return s.status === "at-risk" ? [para(`${number}. Likely lost (at risk)`, { italics: true })] : [];
  const flag = s.status === "optional" ? " (optional)" : s.status === "at-risk" ? " (at risk)" : "";
  return [para(`${number}. ${lessonTitle(u, key)}${flag}`, { bold: true }), ...pieces.map((p) => para(p.title))];
}

function cycleTable(u: Unit) {
  const W = [1400, 3434, 3434, 3434, 3436];
  const n: Record<Stream, number> = { Theory: 0, Design: 0, Prac: 0, "": 0 };
  const rows = [new TableRow({ tableHeader: true, children: ["Cycle", "Theory", "Homework", "Design", "Prac"].map((h, i) => head(h, W[i])) })];
  for (let c = 1; c <= u.cycles; c++) {
    const cols: Record<string, Paragraph[]> = { Theory: [], Design: [], Prac: [], Homework: [] };
    for (let l = 1; l <= u.lessonsPerCycle; l++) {
      const key = slotKey(c, l);
      const s = getSlot(u, key);
      const stream = s.stream || "Theory";
      if (!s.pieceIds.length && s.status !== "at-risk") continue;
      n[stream as Stream]++;
      cols[stream].push(...lessonParas(u, key, n[stream as Stream]));
    }
    const hw = getSlot(u, slotKey(c, "hw"));
    for (const id of hw.pieceIds) {
      const p = u.pieces.find((x) => x.id === id);
      if (p) cols.Homework.push(para(`${p.title} (${p.minutes} min)`));
    }
    rows.push(new TableRow({
      children: [
        cell([para(`CYCLE ${c}`, { bold: true }), para(`Weeks ${2 * c - 1}–${2 * c}`)], W[0], { fill: "D9DDE5" }),
        cell(cols.Theory, W[1]), cell(cols.Homework, W[2]), cell(cols.Design, W[3]), cell(cols.Prac, W[4]),
      ],
    }));
  }
  return new Table({ width: { size: FULL, type: WidthType.DXA }, columnWidths: W, rows });
}

function timelineTable(u: Unit) {
  const first = 3138;
  const w = Math.floor((FULL - first) / u.cycles);
  const W = [first, ...Array(u.cycles).fill(w)];
  return new Table({
    width: { size: FULL, type: WidthType.DXA },
    columnWidths: W,
    rows: [
      new TableRow({ children: [head("Task", first), ...Array.from({ length: u.cycles }, (_, i) => head(`C${i + 1}`, w))] }),
      ...u.tasks.map((t) => new TableRow({
        children: [
          cell([para(`${t.code} ${t.name}`, { bold: true }), para(t.kind)], first),
          ...Array.from({ length: u.cycles }, (_, i) => {
            const c = i + 1;
            const inside = c >= t.setCycle && c <= t.dueCycle;
            const mark = c === t.setCycle ? "Set" : c === t.dueCycle ? "Due" : "";
            return cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: mark, bold: true, color: inside ? "FFFFFF" : NAVY, font: FONT, size: 16 })] })], w, { fill: inside ? (t.kind === "Formative" ? "A6214D" : NAVY) : undefined });
          }),
        ],
      })),
    ],
  });
}

export async function buildPlanning(u: Unit): Promise<Blob> {
  const W3 = [3600, 3600, FULL - 7200];
  const spacer = () => new Paragraph({ spacing: { after: 160 }, children: [] });
  const doc = new Document({
    creator: "Unit Builder",
    title: `Unit ${u.unitNumber} – ${u.title} – Brainstorm and Planning`,
    styles: { default: { document: { run: { font: FONT, size: 18, color: NAVY } } } },
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 }, margin: { top: 566, bottom: 566, left: 850, right: 850 } } },
      children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: `Unit ${u.unitNumber}: ${u.title}`, bold: true, font: FONT, size: 36, color: NAVY })] }),
        para(`${u.course} · ${u.year} · ${u.cycles} cycles × ${u.lessonsPerCycle} lessons`, { color: "4A5468" }),
        spacer(),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Student resources", bold: true, font: FONT, size: 24, color: NAVY })] }),
        new Table({
          width: { size: FULL, type: WidthType.DXA }, columnWidths: W3,
          rows: [
            new TableRow({ children: ["Resource", "Used in", "What it holds"].map((h, i) => head(h, W3[i])) }),
            ...u.resources.map((r) => new TableRow({ children: [cell([para(r.name, { bold: true })], W3[0]), cell([para(r.used)], W3[1]), cell([para(r.holds)], W3[2])] })),
          ],
        }),
        spacer(),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Scope and sequence", bold: true, font: FONT, size: 24, color: NAVY })] }),
        cycleTable(u),
        spacer(),
        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Assessment timeline", bold: true, font: FONT, size: 24, color: NAVY })] }),
        timelineTable(u),
        spacer(),
        ...(u.caseStudy ? [new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Class case study", bold: true, font: FONT, size: 24, color: NAVY })] }), para(u.caseStudy), spacer()] : []),
        ...(u.brands.length ? [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Student allocations", bold: true, font: FONT, size: 24, color: NAVY })] }),
          new Table({
            width: { size: 7200, type: WidthType.DXA }, columnWidths: [3600, 3600],
            rows: [
              new TableRow({ children: [head("Brand / topic", 3600), head("Student", 3600)] }),
              ...u.brands.map((b) => new TableRow({ children: [cell([para(b.name)], 3600), cell([para(b.student)], 3600)] })),
            ],
          }),
        ] : []),
      ],
    }],
  });
  return Packer.toBlob(doc);
}
