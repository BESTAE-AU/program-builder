// Program export, written into Britt's own new-syllabus program template
// (UNIT 1 – TOTE-ALLY TEXTILES – PROGRAM.docx with its content cleared). The body is built as
// WordprocessingML using the template's own styles (Heading2/3/7, CONTENTHEADING, Content,
// LessonNumbers, ActivityType, NCCD, Activities) and table settings, so it looks the same.
import JSZip from "jszip";
import { activityType, outcomeText, POINTS, pointOutcome } from "../frameworks";
import { equipment, TEXTILES_GENERAL } from "../frameworks/whs";
import { getSlot, hours, lessonCapabilities, pieceLabel } from "../rules";
import { outcomeText2019, point2019 } from "../frameworks/textiles2019";
import type { Piece, Slot, Unit } from "../types";
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
const outcomeParas = (codes: string[], text: (c: string) => string = outcomeText) =>
  codes.flatMap((c) => [p("Heading7", [{ text: `${c}:`, strong: true }]), p(null, text(c)), p(null)]);

// In 2019+2025 mode the 2019 syllabus is official (full outcomes and content) and the
// 2025 codes sit underneath, so the program carries into 2028 with little rework.
const dual = (u: Unit) => u.syllabusMode === "2019+2025";
const alongside = (label: string, codes: string[]) =>
  codes.length ? [p(null, [{ text: `${label}: `, bold: true }, { text: codes.join(", ") }])] : [];

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
  const h = hours(u);
  return table("a", 15138, 0, [1266, 6312, 1768, 2012, 3780], [
    row([cell(1266, [p("Heading2", `UNIT ${u.unitNumber}:`)]), cell(6312, [p("Heading2", u.title)]), cell(1768, [p("Heading2", u.stage)]), cell(5792, [p("Heading2", u.year)], { span: 2 })]),
    row([cell(7578, [p("Heading3", "Unit Overview")], { span: 2 }), cell(7560, [p("Heading3", "Duration")], { span: 3 })]),
    row([
      cell(7578, [
        ...lines(u.overview).map((l) => p(null, l)),
        ...(u.product.trim() ? [p(null, [{ text: "Students make:", bold: true }]), ...lines(u.product).map((l) => p("Content", l))] : []),
      ], { span: 2 }),
      cell(7560, [
        p(null, [{ text: "Number of Weeks: ", bold: true }, { text: `${weeks} weeks (${u.cycles} cycles)` }]),
        p(null, [{ text: "Number of Hours: ", bold: true }, { text: `${h.planned} hours planned (1 hour per lesson)` }]),
        p(null, [{ text: "Indicative hours: ", bold: true }, { text: `${h.prior} before this unit, ${h.after} after it, of ${h.total} for the course` }]),
      ], { span: 3 }),
    ]),
    ...(u.pedagogy ? [
      row([cell(15138, [p("Heading3", "Pedagogical Approach")], { span: 5 })]),
      row([cell(15138, lines(u.pedagogy).map((l) => p(null, l)), { span: 5 })]),
    ] : []),
    ...(u.priorKnowledge ? [
      row([cell(15138, [p("Heading3", "Prior Knowledge")], { span: 5 })]),
      row([cell(15138, lines(u.priorKnowledge).map((l) => p("Content", l)), { span: 5 })]),
    ] : []),
    row([cell(7578, [p("Heading3", "Outcomes")], { span: 2 }), cell(7560, [p("Heading3", "Formative and Summative Assessment Tasks")], { span: 3 })]),
    row([
      cell(7578, dual(u)
        ? [p(null, [{ text: "Textiles Technology 7–10 (2019)", bold: true }]), ...outcomeParas(u.outcomes2019, outcomeText2019), p(null, [{ text: "Textiles Technology 7–10 (2025), from 2028", bold: true }]), ...outcomeParas(u.outcomes)]
        : outcomeParas(u.outcomes), { span: 2 }),
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
const TAUGHT: Record<string, string> = { taught: "Taught", partly: "Partly taught", not: "Not taught", "": "Not recorded" };

function registerRow(slot: Slot) {
  const r = slot.register;
  return row([cell(W[0] + W[1] + W[2] + W[3], [
    p(null, [{ text: "REGISTER  ", bold: true }, { text: `Date taught: ${r.date || "—"}   ·   ${TAUGHT[r.taught]}` }]),
    ...(r.notes ? [p(null, [{ text: "Notes and variations: ", bold: true }, { text: r.notes }])] : []),
  ], { span: 4, shade: true })]);
}

function registerTable(u: Unit) {
  const r = u.register;
  const box = (label: string, value: string) => [p(null, [{ text: label, bold: true }]), ...lines(value).map((l) => p(null, l))];
  const third = 5046;
  return p("Heading3", "Register") + table("a0", 15138, 0, [third, third, third], [
    row([cell(third, box("Teacher's Comments:", r.teacherComments)), cell(third, box("Summary of Student Comments:", r.studentComments)), cell(third, box("Assessment Comments:", r.assessmentComments))]),
    row([cell(third, box("Suggested improvements for course delivery:", r.improvements)), cell(third, box("Additional / New Resources:", r.newResources)), cell(third, [])]),
    row([cell(third, box("Date Commenced:", r.dateCommenced)), cell(third, box("Date Completed:", r.dateCompleted)), cell(third, [...box("Signature:", r.signature), ...box("Date:", r.signDate)])]),
  ]);
}

function lessonBlock(u: Unit, heading: string, pieces: Piece[], key: string, annotated: boolean) {
  const slot = getSlot(u, key);
  const outcomes25 = [...new Set(pieces.flatMap((x) => x.outcomes))];
  const points = [...new Set(pieces.flatMap((x) => x.points))].filter((c) => POINTS[c]);
  const outcomes19 = [...new Set(pieces.flatMap((x) => x.outcomes2019 ?? []))];
  const points19 = [...new Set(pieces.flatMap((x) => x.points2019 ?? []))].map(point2019).filter(Boolean);
  const content: string[] = [];
  let lastHeading = "";
  if (dual(u)) {
    for (const pt of points19) {
      if (pt!.heading !== lastHeading) {
        content.push(p("CONTENTHEADING", pt!.heading.toUpperCase()));
        lastHeading = pt!.heading;
      }
      content.push(p("Content", `${pt!.text} (${pt!.outcome})`));
    }
    content.push(...alongside("2025 content", points));
  } else {
    for (const code of points) {
      const pt = POINTS[code];
      if (pt.heading !== lastHeading) {
        content.push(p("CONTENTHEADING", pt.heading.toUpperCase()));
        lastHeading = pt.heading;
      }
      const o = pointOutcome(code);
      content.push(p("Content", `${pt.text}${o ? ` (${o})` : ""}`));
    }
  }
  const outcomeCell = dual(u) ? [...outcomeParas(outcomes19, outcomeText2019), ...alongside("2025", outcomes25)] : outcomeParas(outcomes25);
  const activities = [p("LessonNumbers", heading)];
  if (slot.intention) activities.push(p(null, [{ text: "Learning intention: ", bold: true }, { text: slot.intention }]));
  if (slot.success.trim()) {
    activities.push(p(null, [{ text: "Success criteria:", bold: true }]));
    for (const l of lines(slot.success)) activities.push(p("Content", l));
  }
  for (const pc of pieces) {
    activities.push(p("ActivityType", activityLine(pc, u)));
    activities.push(p("Content", pc.title));
    for (const s of pc.steps.filter(Boolean)) activities.push(p("Content", s));
  }
  if (slot.resources.length) {
    activities.push(p("Resources", [{ text: "Resources", bold: true }]));
    for (const r of slot.resources) activities.push(p("Resources", r.url ? `${r.name} – ${r.url}` : r.name));
  }
  const kit = slot.equipment.map(equipment).filter(Boolean);
  if (kit.length) {
    activities.push(p(null, [{ text: "WHS", bold: true }]));
    activities.push(p("Activities", TEXTILES_GENERAL));
    for (const e of kit) activities.push(p("Activities", [{ text: `${e!.name}: `, bold: true }, { text: e!.controls.join(" ") }]));
  }
  const caps = lessonCapabilities(u, key);
  const capParas = [
    ...(caps.length ? [p(null, [{ text: "General capabilities", bold: true }]), ...caps.map((c) => p(null, c))] : []),
    ...(slot.priorities.length ? [p(null, [{ text: "Cross-curriculum priorities", bold: true }]), ...slot.priorities.map((c) => p(null, c))] : []),
  ];
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
    row([cell(W[0], [...outcomeCell, ...capParas]), cell(W[1], content), cell(W[2], activities), cell(W[3], supported)]),
    row([cell(W[0], []), cell(W[1], []), cell(W[2], [p("Heading3", "Extension/Newman")], { shade: true, center: true }), cell(W[3], [p("Heading3", "Life skills")], { shade: true, center: true })]),
    row([cell(W[0], []), cell(W[1], []), cell(W[2], level("extension")), cell(W[3], [p("Activities", "See the separate Life Skills program.")])]),
    ...(annotated ? [registerRow(slot)] : []),
  ];
}

function cycleTable(u: Unit, c: number, annotated: boolean) {
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
    rows.push(...lessonBlock(u, `LESSON ${l} – ${stream.toUpperCase()}: ${title.toUpperCase()}${flag}`, pieces, slotKey(c, l), annotated));
    any = true;
  }
  const hw = getSlot(u, slotKey(c, "hw"));
  const hwPieces = hw.pieceIds.map((id) => u.pieces.find((x) => x.id === id)).filter(Boolean) as Piece[];
  if (hwPieces.length) {
    const mins = hwPieces.reduce((a, x) => a + x.minutes, 0);
    rows.push(...lessonBlock(u, `HOMEWORK (${mins} MIN)`, hwPieces, slotKey(c, "hw"), false));
    any = true;
  }
  return any ? p("Heading3", `CYCLE ${c} · WEEKS ${2 * c - 1}–${2 * c}`) + table(null, 14595, -720, W, rows) + p(null) : "";
}

// annotated = the school's "annotated register": the program with each lesson's date taught and notes.
export async function buildProgram(u: Unit, template: ArrayBuffer, annotated = false): Promise<Blob> {
  const zip = await JSZip.loadAsync(template);
  const doc = await zip.file("word/document.xml")!.async("string");
  const body = [p(null), headerTable(u), p(null), diverseTable(u), p(null), ...Array.from({ length: u.cycles }, (_, i) => cycleTable(u, i + 1, annotated)), registerTable(u)].join("");
  zip.file("word/document.xml", doc.replace("{{BODY}}", body));
  const header = zip.file("word/header3.xml");
  if (header) {
    const h = await header.async("string");
    zip.file("word/header3.xml", h.replace("{{SUBJECT}}", esc(u.course.replace(/\s*\(\d{4}\)$/, ""))).replace("{{YEAR}}", esc(u.calendarYear)));
  }
  return zip.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}
