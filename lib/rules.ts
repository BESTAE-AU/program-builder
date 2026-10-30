// The unit builder's rules: labels, what happens when a piece is placed, and the checks
// shown beside the grid. Build rules come from Britt's plan-unit skill.
import { activityType, FAMILY_COLOURS, OUTCOMES, STAGES, suggestMapping } from "./frameworks";
import type { Level, Piece, Slot, Stage, Stream, Task, Unit } from "./types";
import { emptySlot, slotKey } from "./types";

export const minutesFor = (stream: Stream, homework: boolean) => (homework ? 60 : stream === "Prac" ? 45 : 50);

export function pieceFamily(p: Piece, tasks: Task[]) {
  const task = p.taskId ? tasks.find((t) => t.id === p.taskId) : undefined;
  if (task) return task.kind;
  return activityType(p.activityTypeId)?.family ?? "Building knowledge";
}

export function pieceColours(p: Piece, tasks: Task[]) {
  return FAMILY_COLOURS[pieceFamily(p, tasks)] ?? FAMILY_COLOURS["Building knowledge"];
}

// Framework labels. Activities: STEP VERB. Tasks: STAGE VERB · TASK · PART (part only for Produce or Refine).
export function pieceLabel(p: Piece, tasks: Task[]) {
  const hw = p.homework ? " · HW" : "";
  const task = p.taskId ? tasks.find((t) => t.id === p.taskId) : undefined;
  if (task && p.stage) {
    const part = task.parts.find((x) => x.id === p.partId);
    const withPart = (p.stage === "PRODUCE" || p.stage === "REFINE") && part;
    return `${p.stage} ${p.verb || p.stage} · ${task.kind === "Formative" ? task.code || "FORMATIVE" : task.code}${withPart ? " · " + part!.name.toUpperCase() : ""}${hw}`;
  }
  const at = activityType(p.activityTypeId);
  return `${at?.step ?? "LEARN"} ${p.verb || at?.verbs[0] || ""}${hw}`.trim();
}

// The framework's "Which stage?" questions, answered from what we know about the piece.
export function suggestStage(p: Pick<Piece, "title" | "activityTypeId">, task: Task | undefined): Stage {
  const t = p.title.toLowerCase();
  if (/feedback|goal|reflect/.test(t)) return "REFLECT";
  if (/refine|revise|redraft|improve|final|quality control|evaluat/.test(t)) return "REFINE";
  if (/brainstorm|plan|sketch|research|experiment|test|draft idea/.test(t)) return "PLAN";
  if (/demonstrat|example|unpack|study/.test(t) || ["demonstration", "worked-example", "instruction"].includes(p.activityTypeId)) return "PREPARE";
  return task ? "PRODUCE" : "PREPARE";
}

export function stageVerbs(stage: Stage) {
  return STAGES.find((s) => s.stage === stage)?.verbs ?? [stage];
}

// What happens when a piece lands in a lesson: the framework adjustments fill in (unless tailored),
// and the syllabus mapping is suggested from its content area (unless already chosen).
export function onPlace(p: Piece): Piece {
  const at = activityType(p.activityTypeId);
  const adjustments = p.tailored || !at ? p.adjustments : { ...at.levels };
  const mapping = p.points.length || p.outcomes.length ? { points: p.points, outcomes: p.outcomes } : suggestMapping(p.area);
  return { ...p, adjustments, ...mapping };
}

export function getSlot(unit: Unit, key: string): Slot {
  return unit.slots[key] ?? emptySlot();
}

export function placedKey(unit: Unit, pieceId: string): string | undefined {
  return Object.entries(unit.slots).find(([, s]) => s.pieceIds.includes(pieceId))?.[0];
}

export function placePiece(unit: Unit, pieceId: string, key: string): Unit {
  const slots: Record<string, Slot> = {};
  for (const [k, s] of Object.entries(unit.slots)) slots[k] = { ...s, pieceIds: s.pieceIds.filter((id) => id !== pieceId) };
  const target = slots[key] ?? emptySlot();
  slots[key] = { ...target, pieceIds: [...target.pieceIds, pieceId] };
  const homework = key.endsWith("-hw");
  const pieces = unit.pieces.map((p) => (p.id === pieceId ? onPlace({ ...p, homework }) : p));
  return { ...unit, slots, pieces };
}

export function unplacePiece(unit: Unit, pieceId: string): Unit {
  const slots: Record<string, Slot> = {};
  for (const [k, s] of Object.entries(unit.slots)) slots[k] = { ...s, pieceIds: s.pieceIds.filter((id) => id !== pieceId) };
  return { ...unit, slots };
}

// Order of a slot in time: cycle, then lesson number; homework sits at the end of its cycle.
export function slotOrder(key: string) {
  const [c, l] = key.split("-");
  return Number(c) * 100 + (l === "hw" ? 99 : Number(l));
}

export function lessonTitle(unit: Unit, key: string) {
  const s = getSlot(unit, key);
  if (s.title) return s.title;
  const first = unit.pieces.find((p) => p.id === s.pieceIds[0]);
  return first ? first.area || first.title : "";
}

export type Warning = { text: string; key?: string };

export function sequenceWarnings(unit: Unit): Warning[] {
  const out: Warning[] = [];
  const at = (id: string) => placedKey(unit, id);
  const byId = new Map(unit.pieces.map((p) => [p.id, p]));

  // 1. A skill is practised before it appears in a summative product.
  for (const p of unit.pieces) {
    const k = at(p.id);
    if (!k) continue;
    const pre = p.prereq ? byId.get(p.prereq) : undefined;
    if (pre) {
      const pk = at(pre.id);
      if (!pk) out.push({ text: `${p.title} is placed, but ${pre.title} isn't in the grid yet.`, key: k });
      else if (slotOrder(pk) >= slotOrder(k)) out.push({ text: `${p.title} comes before ${pre.title}. Practise it first.`, key: k });
    }
  }

  // 2. Safety comes first: no practical lesson before the safety induction.
  const safety = unit.pieces.filter((p) => p.activityTypeId === "safety-induction").map((p) => at(p.id)).filter(Boolean) as string[];
  const firstSafety = safety.length ? Math.min(...safety.map(slotOrder)) : Infinity;
  for (const [k, s] of Object.entries(unit.slots)) {
    if (s.stream === "Prac" && s.pieceIds.length && slotOrder(k) < firstSafety)
      out.push({ text: `A practical lesson (Cycle ${k.split("-")[0]}) comes before the safety induction.`, key: k });
  }

  // 3. Introduce before you set: each homework block needs a theory lesson in its cycle.
  for (const [k, s] of Object.entries(unit.slots)) {
    if (!k.endsWith("-hw") || !s.pieceIds.length) continue;
    const c = k.split("-")[0];
    const intro = Object.entries(unit.slots).some(([k2, s2]) => k2.startsWith(c + "-") && !k2.endsWith("hw") && s2.stream === "Theory" && s2.pieceIds.length);
    if (!intro) out.push({ text: `Cycle ${c} homework has no theory lesson to introduce it.`, key: k });
  }

  // 4. Lessons over time.
  for (const [k, s] of Object.entries(unit.slots)) {
    const used = s.pieceIds.reduce((a, id) => a + (byId.get(id)?.minutes ?? 0), 0);
    const avail = minutesFor(s.stream, k.endsWith("-hw"));
    if (used > avail) out.push({ text: `${k.endsWith("hw") ? "Cycle " + k.split("-")[0] + " homework" : "Cycle " + k.replace("-", ", lesson ")} is ${used - avail} min over.`, key: k });
  }
  return out;
}

export function coverage(unit: Unit) {
  const placed = unit.pieces.filter((p) => placedKey(unit, p.id));
  const wanted = unit.outcomes.length ? unit.outcomes : OUTCOMES.map((o) => o.code);
  return wanted.map((code) => ({ code, n: placed.filter((p) => p.outcomes.includes(code)).length }));
}

export function lessonCount(unit: Unit) {
  let planned = 0, risk = 0;
  for (let c = 1; c <= unit.cycles; c++)
    for (let l = 1; l <= unit.lessonsPerCycle; l++) {
      const s = getSlot(unit, slotKey(c, l));
      if (s.status === "at-risk" || s.status === "missed") risk++;
      else if (s.pieceIds.length) planned++;
    }
  return { planned, available: unit.cycles * unit.lessonsPerCycle, risk };
}

export const levelName: Record<Level, string> = {
  supplementary: "Supplementary",
  substantial: "Substantial",
  extensive: "Extensive",
  extension: "Extension / Newman",
  life_skills: "Life Skills",
};
