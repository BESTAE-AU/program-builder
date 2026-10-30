// Program export, written into Britt's own new-syllabus program template
// (UNIT 1 – TOTE-ALLY TEXTILES – PROGRAM.docx with its content cleared). The body is built as
// WordprocessingML using the template's own styles (Heading2/3/7, CONTENTHEADING, Content,
// LessonNumbers, ActivityType, NCCD, Activities) and table settings, so it looks the same.
import JSZip from "jszip";
import { activityType, outcomeText, POINTS, pointOutcome } from "../frameworks";
import { getSlot, pieceLabel } from "../rules";
import type { Piece, Unit } from "../types";
import { slotKey } from "../types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Run = { text: string; bold?: boolean; strong?: boolean; highlight?: string };
const run = (r: Run) => {
  const props = [
    r.strong ? '<w:rStyle w:val="Strong"/><w:rFonts w:ascii="Lato Black" w:hAnsi="Lato Black" w:cs="Lato Black"/>' : "",
    r.bold || r.strong ? "<w:b/><w:bCs/>" : "",
    r.highlight ? `<w:highlight w:val="${r.highlight}"/>` : "",
    '<w:lang w:val="en-AU"/>',
  ].join("");
  return `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${esc(r.text)}</w:t></w:r>`;
};
const p = (style: string | null, runs: Run[] | string = []) => {
  const rs = typeof runs === "string" ? (runs ? [{ text: runs }] : []) : runs;
  return `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${rs.map(run).join("")}</w:p>`;
};
const MARGIN = '<w:tcMar><w:top w:w="100" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>';
const cell = (w: number, paras: string[], opts: { span?: number; shade?: boolean; center?: boolean } = {}) =>
  `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${opts.span ? `<w:gridSpan w:val="${opts.span}"/>` : ""}${opts.shade ? '<w:shd w:val="clear" w:color="auto" w:fill="D9DDE1" w:themeFill="background2"/>' : ""}${MARGIN}${opts.center ? '<w:vAlign w:val="center"/>' : ""}</w:tcPr>${paras.length ? paras.join("") : p(null)}</w:tc>`;
const row = (cells: string[], header = false) => `<w:tr>${header ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${cells.join("")}</w:tr>`;
const BORDERS = '<w:tblBorders><w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:left w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:right w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="8" w:space="0" w:color="000000"/><w:insideV w:val="single" w:sz="8" w:space="0" w:color="000000"/></w:tblBorders>';
const table = (style: string | null, width: number, indent: number, grid: number[], rows: string[]) =>
  `<w:tbl><w:tblPr>${style ? `<w:tblStyle w:val="${style}"/>` : ""}<w:tblW w:w="${width}" w:type="dxa"/><w:tblInd w:w="${indent}" w:type="dxa"/>${BORDERS}<w:tblLayout w:type="fixed"/><w:tblLook w:val="0600" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr><w:tblGrid>${grid.map((g) => `<w:gridCol w:w="${g}"/>`).join("")}</w:tblGrid>${rows.join("")}</w:tbl>`;

const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const outcomeParas = (codes: string[]) =>
  codes.flatMap((c) => [p("Heading7", [{ text: `${c}:`, strong: true }]), p(null, outcomeText(c)), p(null)]);

function headerTable(u: Unit) {
  const summative = u.tasks.filter((t) => t.kind === "Summative");
  const formative = u.tasks.filter((t) => t.kind === "Formative");
  const taskLines = (ts: typeof u.tasks) =>
    ts.flatMap((t) => [
      p(null, [{ text: `${t.code} ${t.name}`, bold: true }, { text: t.weighting ? ` (${t.weighting})` : "" }]),
      ...t.parts.map((x) => p("Content", x.name)),
      p("Content", `Set Cycle ${t.setCycle}, due Cycle ${t.dueCycle}`),
    ]);
  const weeks = u.cycles * 2;
  return table("a", 15138, 0, [1266, 6312, 1768, 2012, 3780], [
    row([cell(1266, [p("Heading2", `UNIT ${u.unitNumber}:`)]), cell(6312, [p("Heading2", u.title)]), cell(1768, [p("Heading2", u.stage)]), cell(5792, [p("Heading2", u.year)], { span: 2 })]),
    row([cell(7578, [p("Heading3", "Unit Overview")], { span: 2 }), cell(7560, [p("Heading3", "Duration")], { span: 3 })]),
    row([
      cell(7578, [...lines(u.overview).map((l) => p("Content", l)), ...(u.product ? [p("Content", [{ text: "Students make: ", bold: true }, { text: u.product }])] : [])], { span: 2 }),
      cell(7560, [p(null, [{ text: "Number of Weeks: ", bold: true }, { text: `${weeks} weeks (${u.cycles} cycles)` }]), p(null, [{ text: "Number of Lessons: ", bold: true }, { text: `${u.cycles * u.lessonsPerCycle}` }])], { span: 3 }),
    ]),
    row([cell(7578, [p("Heading3", "Outcomes")], { span: 2 }), cell(7560, [p("Heading3", "Formative and Summative Assessment Tasks")], { span: 3 })]),
    row([
      cell(7578, outcomeParas(u.outcomes), { span: 2 }),
      cell(3780, [p(null, [{ text: "Summative Assessment", bold: true }]), ...taskLines(summative)], { span: 2 }),
      cell(3780, [p(null, [{ text: "Formative Assessment", bold: true }]), ...taskLines(formative)]),
    ]),
  ]);
}

const LEVEL_TEXT = [
  ["QDTP", "Minor adjustments embedded in good teaching, closely comparable to what is provided for all students. This is the programme."],
  ["Supplementary", "Additional support provided at particular times or for particular tasks, targeted support beyond usual classroom differentiation."],
  ["Substantial", "Frequent or significant adjustments across most learning activities, ongoing regular support and modification."],
  ["Extensive", "Highly intensive, individualised support provided at all times or for most of the day."],
];
const OTHER_TEXT = [
  ["Life Skills", "Have a separate programme with embedded adjustments that align with the Extensive adjustments."],
  ["Twice Exceptional (2E)", "Students who are intellectually gifted or possess high cognitive potential, while simultaneously having one or more learning disabilities."],
  ["Gifted/Newman/Extension", "Gifted students are defined as those whose natural potential significantly exceeds that of students of the same age in one or more domains."],
];

function diverseTable(u: Unit) {
  const head = `<w:p><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="120"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial Narrow" w:eastAsia="Arial Narrow" w:hAnsi="Arial Narrow" w:cs="Arial Narrow"/><w:b/><w:bCs/><w:color w:val="365F91"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>Diverse Learning</w:t></w:r></w:p>`;
  const names: Record<string, string> = { supplementary: "Supplementary", substantial: "Substantial", extensive: "Extensive", extension: "Extension / Newman", life_skills: "Life Skills", qdtp: "QDTP", "2e": "Twice Exceptional (2E)" };
  return table("a0", 15138, 0, [15138], [
    row([cell(15138, [head])]),
    row([cell(15138, [
      p(null, [{ text: "Students listed below are undertaking this program and may require personalised adjustments in the classroom and/or assessment to address their specific learning needs." }, { text: u.diverseLink ? ` For more information, please review: ${u.diverseLink}` : "" }]),
      ...u.students.map((s) => p(null, [{ text: s.initials, bold: true }, { text: ` – ${names[s.level] ?? s.level}` }])),
    ])]),
    row([cell(15138, [
      p(null, [{ text: "Levels:", bold: true }]),
      ...LEVEL_TEXT.map(([k, v]) => p(null, [{ text: `${k} - `, bold: true }, { text: v }])),
      p(null, [{ text: "Other classifications:", bold: true }]),
      ...OTHER_TEXT.map(([k, v]) => p(null, [{ text: `${k} - `, bold: true }, { text: v }])),
    ])]),
  ]);
}

// Activity label line in the template's ActivityType style, using framework labels.
function activityLine(piece: Piece, u: Unit) {
  const at = activityType(piece.activityTypeId);
  const label = pieceLabel(piece, u.tasks);
  const mode = at?.mode ? ` (${at.mode.split(" / ")[0].toUpperCase()})` : "";
  return piece.taskId ? `${label} – ${(at?.name ?? "").toUpperCase()}` : `${label} – ${(at?.name ?? "").toUpperCase()}${mode}`;
}

const W = [1703, 3543, 4924, 4425];

function lessonBlock(u: Unit, heading: string, pieces: Piece[]) {
  const outcomes = [...new Set(pieces.flatMap((x) => x.outcomes))];
  const points = [...new Set(pieces.flatMap((x) => x.points))].filter((c) => POINTS[c]);
  const content: string[] = [];
  let lastHeading = "";
  for (const code of points) {
    const pt = POINTS[code];
    if (pt.heading !== lastHeading) {
      content.push(p("CONTENTHEADING", pt.heading.toUpperCase()));
      lastHeading = pt.heading;
    }
    const o = pointOutcome(code);
    content.push(p("Content", `${pt.text}${o ? ` (${o})` : ""}`));
  }
  const activities = [p("LessonNumbers", heading)];
  for (const pc of pieces) {
    activities.push(p("ActivityType", activityLine(pc, u)));
    activities.push(p("Content", pc.title));
    for (const s of pc.steps) activities.push(p("Content", s));
  }
  const many = pieces.length > 1;
  const level = (key: "supplementary" | "substantial" | "extensive" | "extension" | "life_skills") =>
    pieces.filter((pc) => pc.adjustments[key]).map((pc) => p("Activities", many ? [{ text: `${pc.title}: `, bold: true }, { text: pc.adjustments[key]! }] : pc.adjustments[key]!));
  const supported = [
    ...(["supplementary", "substantial", "extensive"] as const).flatMap((k) => {
      const ps = level(k);
      return ps.length ? [p("NCCD", k[0].toUpperCase() + k.slice(1)), ...ps] : [];
    }),
  ];
  return [
    row([cell(W[0], []), cell(W[1], []), cell(W[2], [p("Heading3", "Core")], { shade: true, center: true }), cell(W[3], [p("Heading3", "Supported")], { shade: true, center: true })]),
    row([cell(W[0], outcomeParas(outcomes)), cell(W[1], content), cell(W[2], activities), cell(W[3], supported)]),
    row([cell(W[0], []), cell(W[1], []), cell(W[2], [p("Heading3", "Extension/Newman")], { shade: true, center: true }), cell(W[3], [p("Heading3", "Life skills")], { shade: true, center: true })]),
    row([cell(W[0], []), cell(W[1], []), cell(W[2], level("extension")), cell(W[3], level("life_skills"))]),
  ];
}

function cycleTable(u: Unit, c: number) {
  const rows: string[] = [
    row([cell(W[0], [p("Heading3", `${c}. Outcomes`)]), cell(W[1], [p("Heading3", "Content from Syllabus")]), cell(W[2] + W[3], [p("Heading3", "Teaching, Learning Activities")], { span: 2 })], true),
  ];
  const counts: Record<string, number> = {};
  let any = false;
  for (let l = 1; l <= u.lessonsPerCycle; l++) {
    const s = getSlot(u, slotKey(c, l));
    const pieces = s.pieceIds.map((id) => u.pieces.find((x) => x.id === id)).filter(Boolean) as Piece[];
    if (!pieces.length || s.status === "missed") continue;
    const stream = s.stream || "Lesson";
    counts[stream] = (counts[stream] ?? 0) + 1;
    const title = s.title || pieces[0].area || pieces[0].title;
    const flag = s.status === "optional" ? " (OPTIONAL)" : s.status === "at-risk" ? " (AT RISK)" : "";
    rows.push(...lessonBlock(u, `LESSON ${l} – ${stream.toUpperCase()}: ${title.toUpperCase()}${flag}`, pieces));
    any = true;
  }
  const hw = getSlot(u, slotKey(c, "hw"));
  const hwPieces = hw.pieceIds.map((id) => u.pieces.find((x) => x.id === id)).filter(Boolean) as Piece[];
  if (hwPieces.length) {
    const mins = hwPieces.reduce((a, x) => a + x.minutes, 0);
    rows.push(...lessonBlock(u, `HOMEWORK (${mins} MIN)`, hwPieces));
    any = true;
  }
  return any ? p("Heading3", `CYCLE ${c} · WEEKS ${2 * c - 1}–${2 * c}`) + table(null, 14595, -720, W, rows) + p(null) : "";
}

export async function buildProgram(u: Unit, template: ArrayBuffer): Promise<Blob> {
  const zip = await JSZip.loadAsync(template);
  const doc = await zip.file("word/document.xml")!.async("string");
  const body = [p(null), headerTable(u), p(null), diverseTable(u), p(null), ...Array.from({ length: u.cycles }, (_, i) => cycleTable(u, i + 1))].join("");
  zip.file("word/document.xml", doc.replace("{{BODY}}", body));
  const header = zip.file("word/header3.xml");
  if (header) {
    const h = await header.async("string");
    zip.file("word/header3.xml", h.replace("{{SUBJECT}}", esc(u.course.replace(/\s*\(\d{4}\)$/, ""))).replace("{{YEAR}}", esc(u.calendarYear)));
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
