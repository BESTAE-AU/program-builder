// Fill-in demonstration sheet: steps with blanks, a diagram to label, a sketch box and a word bank.
// Students complete it while watching, then keep it in their booklet (generative learning, dual coding).
import { AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import type { Piece } from "../types";

const FONT = "Helvetica";
const NAVY = "001D3E";
const t = (text: string, o: { bold?: boolean; size?: number } = {}) => new TextRun({ text, bold: o.bold, font: FONT, size: o.size ?? 22, color: NAVY });
const head = (text: string) => new Paragraph({ spacing: { before: 240, after: 80 }, children: [t(text.toUpperCase(), { bold: true, size: 22 })] });
const box = (height: number, label: string) =>
  new Table({
    width: { size: 10200, type: WidthType.DXA },
    rows: [new TableRow({ height: { value: height, rule: "atLeast" }, children: [new TableCell({ width: { size: 10200, type: WidthType.DXA }, children: [new Paragraph({ children: [t(label, { size: 18 })] })] })] })],
  });

export async function buildSheet(piece: Piece, unitTitle: string): Promise<Blob> {
  const sheet = piece.sheet ?? { steps: [], labels: [], keyWords: [] };
  const title = piece.title.replace(/^demonstration\s*:\s*/i, "");
  // Label answers go in the word bank, never beside the blanks.
  const bank = [...new Set([...sheet.keyWords, ...sheet.labels].map((w) => w.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const doc = new Document({
    creator: "Unit Builder",
    title: `Demonstration sheet – ${title}`,
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 850, right: 850 } } },
      children: [
        new Paragraph({ children: [t(unitTitle, { size: 18 })] }),
        new Paragraph({ spacing: { after: 120 }, children: [t(`Demonstration: ${title}`, { bold: true, size: 32 })] }),
        new Paragraph({ children: [t("Name: ____________________   Class: ________   Date: ________", { size: 20 })] }),
        head("Watch and fill in the steps"),
        ...sheet.steps.map((s, i) => new Paragraph({ spacing: { after: 160 }, children: [t(`${i + 1}.  ${s}`)] })),
        head("Label the diagram"),
        box(3600, "Sketch or stick the diagram here."),
        ...sheet.labels.map((_, i) => new Paragraph({ spacing: { before: 80 }, children: [t(`${String.fromCharCode(65 + i)}.  ________________________`, { size: 20 })] })),
        head("Sketch your finished sample"),
        box(2400, "Draw what your sample should look like, and note one quality check."),
        head("Word bank"),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 4 }, bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 4 } },
          children: [t(bank.join("   ·   "))],
        }),
      ],
    }],
  });
  return Packer.toBlob(doc);
}
