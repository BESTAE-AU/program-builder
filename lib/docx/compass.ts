// Compass lesson plans, following Britt's plan-lesson rules: student-facing, 60-minute lesson with
// a 55-minute period (theory activities total 50; practical activities total 45 plus pack-up),
// fixed hand-in captions, ACTIVITY / FORMATIVE TASK / ASSESSMENT TASK badges, no outcome codes.
import { AlignmentType, Document, Packer, PageBreak, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { activityType } from "../frameworks";
import { equipment } from "../frameworks/whs";
import { getSlot, lessonTitle, pieceLabel } from "../rules";
import type { HandIn, Piece, Unit } from "../types";
import { slotKey } from "../types";

export const HAND_IN_CAPTION: Record<HandIn, string> = {
  NONE: "", SHOW: "SHOW TEACHER", PAPER: "HAND IN", DRIVE: "SAVE TO DRIVE", CANVAS: "SUBMIT TO CANVAS",
  WAYGROUND: "COMPLETE IN WAYGROUND", BRING: "BRING NEXT LESSON", SAME: "",
};

export type CompassActivity = { title: string; minutes: number; badge: string; chips: string[]; handIn: string; steps: string[]; phase: string };

// I do / We do / You do, in words students understand, from the activity's step or task stage.
function phaseFor(p: Piece) {
  if (p.taskId && (p.stage === "PRODUCE" || p.stage === "REFINE")) return "On your own";
  const step = activityType(p.activityTypeId)?.step;
  return step === "LEARN" ? "Watch and listen" : step === "PRACTISE" ? "Try it together" : step === "APPLY" ? "On your own" : step === "RECALL" ? "Remember" : step === "CHECK" ? "Show what you know" : "";
}
export type CompassPlan = {
  heading: string;
  lessonType: "theory" | "practical";
  focus: string;
  activities: CompassActivity[];
  packUp: number;
  total: number;
  target: number;
  homework: { task: string; badge: string; minutes: number; handIn: string }[];
  links: string[];
  notices: string[];
};

function badge(p: Piece, u: Unit) {
  const task = p.taskId ? u.tasks.find((t) => t.id === p.taskId) : undefined;
  const collects = ["PAPER", "CANVAS", "DRIVE", "WAYGROUND"].includes(p.handIn);
  if (task && collects) return task.kind === "Summative" ? "ASSESSMENT TASK" : "FORMATIVE TASK";
  return "ACTIVITY";
}

function activityTitle(p: Piece) {
  const name = activityType(p.activityTypeId)?.name ?? "Activity";
  const rest = p.title.replace(/^(demonstration|instruction|skill practice)\s*:\s*/i, "");
  const keepCase = /^[A-Z]{2}|^[A-Z][a-z]*[A-Z]/.test(rest); // AT1, InDesign
  return `${name}: ${keepCase ? rest : rest.charAt(0).toLowerCase() + rest.slice(1)}`;
}

export function compassPlan(u: Unit, cycle: number, lesson: number): CompassPlan | null {
  const key = slotKey(cycle, lesson);
  const s = getSlot(u, key);
  const pieces = s.pieceIds.map((id) => u.pieces.find((p) => p.id === id)).filter(Boolean) as Piece[];
  if (!pieces.length || s.status === "at-risk" || s.status === "missed") return null;
  const practical = s.stream === "Prac";
  const activities = pieces.map((p) => ({
    title: activityTitle(p),
    minutes: p.minutes,
    badge: badge(p, u),
    chips: pieceLabel(p, u.tasks).split(" · ")[0].split(" "),
    phase: phaseFor(p),
    handIn: HAND_IN_CAPTION[p.handIn],
    steps: p.steps.length ? p.steps : [activityType(p.activityTypeId)?.summary ?? p.title],
  }));
  const hw = getSlot(u, slotKey(cycle, "hw"));
  const homework = hw.pieceIds
    .map((id) => u.pieces.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({ task: activityTitle(p!), badge: badge(p!, u), minutes: p!.minutes, handIn: HAND_IN_CAPTION[p!.handIn] }));
  const total = activities.reduce((a, x) => a + x.minutes, 0);
  return {
    heading: `${s.stream || "Lesson"} · Cycle ${cycle}, lesson ${lesson}`,
    lessonType: practical ? "practical" : "theory",
    // The Compass focus uses the unit plan's own wording for the lesson.
    focus: (s.title || pieces[0].title || lessonTitle(u, key)).toUpperCase(),
    activities,
    packUp: practical ? 10 : 0,
    total,
    target: practical ? 45 : 50,
    homework,
    links: [...s.resources.map((r) => r.name), ...u.resources.map((r) => r.name)],
    notices: [...new Set(s.equipment.map((id) => equipment(id)?.notice).filter(Boolean) as string[])],
  };
}

// ---- HTML for pasting into Compass (inline-styled tables only) ----

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const NAVY = "#001D3E", GREY = "#D9DDE5", CERISE = "#A6214D";
const tag = (t: string) => {
  const bg = t === "ACTIVITY" ? NAVY : t === "FORMATIVE TASK" ? "#FFFFFF" : CERISE;
  const fg = t === "FORMATIVE TASK" ? CERISE : "#FFFFFF";
  return `<span style="display:inline-block;padding:2px 6px;border:1.5px solid ${t === "ACTIVITY" ? NAVY : CERISE};background:${bg};color:${fg};font-size:10px;font-weight:bold;letter-spacing:.04em">${t}</span>`;
};
const chip = (t: string) => `<span style="display:inline-block;padding:1px 5px;margin-right:3px;border:1px solid ${NAVY};font-size:9px;font-weight:bold">${esc(t)}</span>`;
const band = (t: string) => `<tr><td colspan="4" style="background:${NAVY};color:#FFFFFF;font-weight:bold;font-size:13px;padding:6px 10px;letter-spacing:.05em">${t}</td></tr>`;

export function compassHtml(plan: CompassPlan): string {
  const rows = plan.activities.map((a, i) => `<tr>
<td style="width:32px;text-align:center;font-weight:bold;padding:6px;border:1px solid ${GREY}">${i + 1}</td>
<td style="padding:6px 8px;border:1px solid ${GREY}">${a.phase ? `<span style="font-size:10px;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;color:${CERISE}">${esc(a.phase)}</span><br>` : ""}${tag(a.badge)} <b>${esc(a.title)}</b><br>${a.chips.map(chip).join("")}</td>
<td style="width:60px;text-align:center;padding:6px;border:1px solid ${GREY}">${a.minutes} min</td>
<td style="width:150px;text-align:center;font-size:11px;font-weight:bold;padding:6px;border:1px solid ${GREY}">${a.handIn}</td></tr>`).join("");
  const pack = plan.packUp ? `<tr><td style="text-align:center;padding:6px;border:1px solid ${GREY}">${plan.activities.length + 1}</td><td style="padding:6px 8px;border:1px solid ${GREY}"><b>PACK UP AND CLEAN UP</b></td><td style="text-align:center;padding:6px;border:1px solid ${GREY}">${plan.packUp} min</td><td style="border:1px solid ${GREY}"></td></tr>` : "";
  const hw = plan.homework.length
    ? plan.homework.map((h) => `<tr><td colspan="4" style="padding:8px;border:1px solid ${GREY}">${tag(h.badge)} <b>${esc(h.task)}</b><br><span style="font-size:10px"><b>GIVEN</b> ______ &nbsp; <b>DUE</b> before the first lesson of next cycle &nbsp; <b>TIME</b> ${h.minutes} min &nbsp; <b>HAND IN</b> ${h.handIn || "—"}</span></td></tr>`).join("")
    : `<tr><td colspan="4" style="padding:8px;border:1px solid ${GREY}">No homework set. Finish any incomplete classwork before next lesson.</td></tr>`;
  const instructions = plan.activities.map((a, i) => `<tr><td colspan="4" style="padding:8px 10px;border:1px solid ${GREY}"><b>${i + 1}. ${esc(a.title)}</b><ol style="margin:4px 0 0 18px;padding:0">${a.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></td></tr>`).join("");
  return `<table style="width:100%;max-width:900px;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${NAVY}">
<tr><td colspan="4" style="padding:6px 10px;background:${GREY};font-weight:bold">WEEK ______ &nbsp; DAY ______ &nbsp; DATE ______</td></tr>
${band("TODAY'S FOCUS")}
<tr><td colspan="4" style="text-align:center;font-weight:bold;font-size:16px;padding:10px">${esc(plan.focus)}</td></tr>
${plan.notices.length ? `${band("NOTICES")}<tr><td colspan="4" style="background:#F7F4A2;padding:8px 10px">${plan.notices.map(esc).join("<br>")}</td></tr>` : ""}
${band("TODAY'S TASKS")}
${rows}${pack}
${band("HOMEWORK")}
<tr><td colspan="4" style="padding:8px;border:1px solid ${GREY};background:${NAVY};color:#FFFFFF"><b>INCOMPLETE CLASSWORK</b> Finish it at home. <b>DUE</b> BEFORE NEXT LESSON</td></tr>
${hw}
${band("LINKS &amp; RESOURCES")}
<tr><td colspan="4" style="padding:8px;border:1px solid ${GREY}">${plan.links.map((l) => `<b>${esc(l.toUpperCase())}</b> — OPEN`).join("<br>") || "—"}</td></tr>
${band("INSTRUCTIONS")}
${instructions}
</table>`;
}

export function compassHtmlPage(plans: CompassPlan[], title: string) {
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="margin:16px">${plans
    .map((p) => `<h2 style="font-family:Helvetica,Arial,sans-serif;color:${NAVY};font-size:14px">${esc(p.heading)}</h2>${compassHtml(p)}`)
    .join('<hr style="margin:32px 0">')}</body></html>`;
}

// ---- .docx ----

const FONT = "Helvetica";
const t = (text: string, o: { bold?: boolean; color?: string; size?: number } = {}) => new TextRun({ text, bold: o.bold, color: o.color ?? "001D3E", font: FONT, size: o.size ?? 20 });
const W = [600, 6700, 1100, 2238];
const c = (children: Paragraph[], width: number, o: { fill?: string; span?: number } = {}) =>
  new TableCell({ children, width: { size: width, type: WidthType.DXA }, columnSpan: o.span, shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined, margins: { top: 60, bottom: 60, left: 100, right: 100 } });
const bandRow = (text: string) => new TableRow({ children: [c([new Paragraph({ children: [t(text, { bold: true, color: "FFFFFF" })] })], 10638, { fill: "001D3E", span: 4 })] });
const full = (paras: Paragraph[], fill?: string) => new TableRow({ children: [c(paras, 10638, { span: 4, fill })] });

function planTable(plan: CompassPlan) {
  const rows: TableRow[] = [
    full([new Paragraph({ children: [t("WEEK ______   DAY ______   DATE ______", { bold: true })] })], "D9DDE5"),
    bandRow("TODAY'S FOCUS"),
    full([new Paragraph({ alignment: AlignmentType.CENTER, children: [t(plan.focus, { bold: true, size: 32 })] })]),
    ...(plan.notices.length ? [bandRow("NOTICES"), full(plan.notices.map((n) => new Paragraph({ children: [t(n)] })), "F7F4A2")] : []),
    bandRow("TODAY'S TASKS"),
    ...plan.activities.map((a, i) => new TableRow({ children: [
      c([new Paragraph({ alignment: AlignmentType.CENTER, children: [t(String(i + 1), { bold: true })] })], W[0]),
      c([
        ...(a.phase ? [new Paragraph({ children: [t(a.phase.toUpperCase(), { bold: true, color: "A6214D", size: 16 })] })] : []),
        new Paragraph({ children: [t(`${a.badge}  `, { bold: true, color: a.badge === "ACTIVITY" ? "001D3E" : "A6214D", size: 16 }), t(a.title, { bold: true })] }),
        new Paragraph({ children: [t(a.chips.join(" · "), { size: 16 })] }),
      ], W[1]),
      c([new Paragraph({ alignment: AlignmentType.CENTER, children: [t(`${a.minutes} min`)] })], W[2]),
      c([new Paragraph({ alignment: AlignmentType.CENTER, children: [t(a.handIn, { bold: true, size: 16 })] })], W[3]),
    ] })),
    ...(plan.packUp ? [new TableRow({ children: [
      c([new Paragraph({ alignment: AlignmentType.CENTER, children: [t(String(plan.activities.length + 1), { bold: true })] })], W[0]),
      c([new Paragraph({ children: [t("PACK UP AND CLEAN UP", { bold: true })] })], W[1]),
      c([new Paragraph({ alignment: AlignmentType.CENTER, children: [t(`${plan.packUp} min`)] })], W[2]),
      c([new Paragraph("")], W[3]),
    ] })] : []),
    bandRow("HOMEWORK"),
    full([new Paragraph({ children: [t("INCOMPLETE CLASSWORK  ", { bold: true, color: "FFFFFF" }), t("Finish it at home. DUE BEFORE NEXT LESSON", { color: "FFFFFF" })] })], "001D3E"),
    ...(plan.homework.length
      ? plan.homework.map((h) => full([new Paragraph({ children: [t(`${h.badge}  `, { bold: true, size: 16 }), t(h.task, { bold: true })] }), new Paragraph({ children: [t(`GIVEN ______   DUE before next cycle   TIME ${h.minutes} min   HAND IN ${h.handIn || "—"}`, { size: 16 })] })]))
      : [full([new Paragraph({ children: [t("No homework set.")] })])]),
    bandRow("LINKS & RESOURCES"),
    full(plan.links.length ? plan.links.map((l) => new Paragraph({ children: [t(l.toUpperCase(), { bold: true }), t(" — OPEN")] })) : [new Paragraph("—")]),
    bandRow("INSTRUCTIONS"),
    ...plan.activities.map((a, i) => full([
      new Paragraph({ children: [t(`${i + 1}. ${a.title}`, { bold: true })] }),
      ...a.steps.map((s, j) => new Paragraph({ indent: { left: 300 }, children: [t(`${j + 1}. ${s}`)] })),
    ])),
  ];
  return new Table({ width: { size: 10638, type: WidthType.DXA }, columnWidths: W, rows });
}

export async function compassDocx(plans: CompassPlan[], title: string): Promise<Blob> {
  const doc = new Document({
    creator: "Unit Builder",
    title,
    sections: [{
      properties: { page: { margin: { top: 640, bottom: 640, left: 640, right: 640 } } },
      children: plans.flatMap((p, i) => [
        ...(i ? [new Paragraph({ children: [new PageBreak()] })] : []),
        new Paragraph({ spacing: { after: 120 }, children: [t(p.heading, { bold: true, size: 24 })] }),
        planTable(p),
      ]),
    }],
  });
  return Packer.toBlob(doc);
}
