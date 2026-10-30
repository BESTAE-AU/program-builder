// Typed access to the frameworks copied from Britt's artifacts:
// - activities.json: Activities & Tasks Framework, activity types (step, verbs, NCCD adjustments)
// - tasks.json: the framework's formative and summative task types
// - textiles.json: Textiles Framework strands → categories → content areas → numbered syllabus points,
//   plus the NESA Textiles Technology 7–10 (2025) Stage 5 outcomes and content.
import activitiesData from "./activities.json";
import tasksData from "./tasks.json";
import textilesData from "./textiles.json";
import type { Level, Stage } from "../types";

export type ActivityType = {
  id: string;
  kind: string;
  family: string;
  name: string;
  summary: string;
  step: string;
  verbs: string[];
  mode: string;
  ways: string[];
  levels: Record<Level, string>;
  capabilities: { name: string; detail: string }[];
};

export const CROSS_CURRICULUM = [
  "Aboriginal and Torres Strait Islander Histories and Cultures",
  "Asia and Australia's Engagement with Asia",
  "Sustainability",
];

export type TaskType = { kind: string; family: string; name: string; summary: string };

export const ACTIVITY_TYPES = activitiesData as ActivityType[];
export const TASK_TYPES = tasksData as TaskType[];
export const activityType = (id: string) => ACTIVITY_TYPES.find((a) => a.id === id);

// Family colours follow the framework's BESTAE colours. Jazzberry (formative) is swapped for
// MCCNS cerise and summative uses MCCNS navy, as the MCCNS README asks for MCCNS-framed work.
export const FAMILY_COLOURS: Record<string, { bg: string; fg: string; tint: string }> = {
  "Building knowledge": { bg: "#514689", fg: "#FFFFFF", tint: "#EEEBF6" },
  "Investigating and analysing": { bg: "#FF585D", fg: "#001D3E", tint: "#FDECEC" },
  "Developing ideas": { bg: "#F19C49", fg: "#001D3E", tint: "#FFF3E6" },
  "Practical skills and performance": { bg: "#326295", fg: "#FFFFFF", tint: "#EAF0F7" },
  "Safety, sustainability and ethics": { bg: "#00B2A2", fg: "#001D3E", tint: "#E6F7F5" },
  "Documenting and communicating": { bg: "#F3EA5D", fg: "#001D3E", tint: "#FDFBE3" },
  "Planning and managing": { bg: "#C5E86C", fg: "#001D3E", tint: "#F4FAE6" },
  "Evaluating, reflecting and collaborating": { bg: "#E56DB1", fg: "#001D3E", tint: "#FBEAF4" },
  Formative: { bg: "#A6214D", fg: "#FFFFFF", tint: "#F8E9EE" },
  Summative: { bg: "#001D3E", fg: "#FFFFFF", tint: "#E8EBF0" },
};

export const STAGES: { stage: Stage; marked: boolean; verbs: string[]; meaning: string }[] = [
  { stage: "PREPARE", marked: false, verbs: ["PREPARE", "UNPACK", "EXPLORE", "STUDY", "REVIEW", "REHEARSE"], meaning: "Learning how, with sample content." },
  { stage: "PLAN", marked: false, verbs: ["PLAN", "BRAINSTORM", "RESEARCH", "SKETCH", "OUTLINE", "EXPERIMENT", "TEST", "DEVELOP"], meaning: "Own project, not handed in." },
  { stage: "PRODUCE", marked: true, verbs: ["PRODUCE", "CREATE", "MAKE", "WRITE", "CONSTRUCT", "PRESENT", "PERFORM", "SEW", "CUT"], meaning: "Making the marked work." },
  { stage: "REFINE", marked: true, verbs: ["REFINE", "REVISE", "EDIT", "IMPROVE", "REDRAFT", "FINALISE", "SUBMIT"], meaning: "Improving marked work after feedback." },
  { stage: "REFLECT", marked: false, verbs: ["REFLECT", "RESPOND", "REVIEW FEEDBACK", "SET GOALS"], meaning: "After the task comes back." },
];

export const LEARNING_SEQUENCE = [
  { n: 1, phase: "Review", types: ["review-and-recall", "warm-up-and-connection", "learning-games", "check-for-understanding", "revision"] },
  { n: 2, phase: "Model", types: ["instruction", "demonstration", "worked-example", "vocabulary-and-terminology", "reading-and-comprehension", "listening-and-viewing"] },
  { n: 3, phase: "Guided practice", types: ["guided-practice", "tutorial", "discussion", "exploration", "note-making-and-summarising", "speaking-and-conversation"] },
  { n: 4, phase: "Independent practice", types: ["skill-practice", "problem-solving", "research", "investigation", "source-and-data-work", "analysis", "structured-writing", "composing-and-creating", "production", "rehearsal-and-performance"] },
  { n: 5, phase: "Formative task", types: [] },
  { n: 6, phase: "Act on feedback", types: ["feedback-and-conferencing", "peer-self-assessment", "reflection", "design-development", "goal-setting-and-study-skills"] },
  { n: 7, phase: "Summative task", types: [] },
];

// ---- Textiles ----

type TextilesData = {
  outcomes: { code: string; text: string }[];
  focusAreas: Record<string, { name: string; outcomes: string[] }>;
  points: Record<string, { focusArea: string; heading: string; text: string; example: string }>;
  strands: { strand: string; categories: { category: string; areas: { name: string; points: string[] }[] }[] }[];
};
const T = textilesData as TextilesData;

export const OUTCOMES = T.outcomes;
export const FOCUS_AREAS = Object.values(T.focusAreas);
export const POINTS = T.points;
export const STRANDS = T.strands;
export const outcomeText = (code: string) => OUTCOMES.find((o) => o.code === code)?.text ?? "";

export const LIFE_SKILLS_OUTCOMES = [
  ["TTLS-PRD-01", "recognises textile products used in everyday life"],
  ["TTLS-DES-01", "participates in developing design ideas"],
  ["TTLS-PMP-01", "participates in planning and managing textile projects"],
  ["TTLS-SAF-01", "demonstrates safe work practices in textile design or production"],
  ["TTLS-COM-01", "communicates ideas and information in textile contexts"],
  ["TTLS-EVL-01", "identifies purposes and design features of a range of textile products"],
  ["TTLS-EVL-02", "participates in activities to test textile designs or products"],
  ["TTLS-IVT-01", "identifies how technologies are used in textile design or production"],
  ["TTLS-IVT-02", "engages with ways to promote textile products"],
  ["TTLS-USE-01", "selects and uses materials, tools or equipment for textile design or production"],
  ["TTLS-MEA-01", "uses numbers or measurements when planning or producing textile products"],
  ["TTLS-CDT-01", "develops skills in using construction and decorative techniques when creating textile products"],
  ["TTLS-MAT-01", "identifies properties of textile materials used in design or production"],
  ["TTLS-ENV-01", "identifies sustainable practices used in textile design or production"],
  ["TTLS-IND-01", "engages with community activities, careers and/or industries in technology"],
] as const;

// "Category – Content area" labels, the lesson naming convention from plan-unit.
export const AREAS = STRANDS.flatMap((s) =>
  s.categories.flatMap((c) => c.areas.map((a) => ({ strand: s.strand, label: `${c.category} – ${a.name}`, points: a.points }))),
);

// The outcome each numbered content point most directly serves, within its focus area's outcomes.
// NESA lists outcomes per focus area, not per point, so this is a suggestion to check.
const SAF = "TT5-SAF-01", COM = "TT5-COM-01", EVL = "TT5-EVL-01", IVT = "TT5-IVT-01",
  CDT = "TT5-CDT-01", MAT = "TT5-MAT-01", ENV = "TT5-ENV-01";
const POINT_OUTCOME: Record<string, string[]> = {
  L1: [EVL, EVL, MAT, EVL, EVL, EVL, SAF],
  L2: [EVL, EVL, IVT, ENV, EVL, EVL, EVL],
  L3: [MAT, IVT, ENV, IVT, IVT, ENV, IVT, IVT, IVT, ENV, ENV, ENV, ENV],
  D1: [EVL, IVT, IVT, IVT, EVL, COM],
  D2: [MAT, IVT, MAT, MAT, MAT, ENV, MAT],
  D3: [COM, COM, EVL, EVL, EVL, EVL, COM, SAF, IVT, COM, EVL],
  D4: [IVT, IVT, IVT, ENV, COM, SAF],
  P1: [EVL, EVL, EVL, MAT],
  P2: [EVL, EVL, EVL, EVL, SAF],
  P3: [COM, COM, COM, COM, ENV, COM],
  P4: [CDT, CDT, CDT, CDT, MAT, MAT, COM],
  P5: [SAF, SAF, SAF, SAF, ENV, ENV, MAT, CDT, CDT, CDT, CDT, SAF, CDT],
};
export const pointOutcome = (code: string) => {
  const [group, n] = code.split(".");
  return POINT_OUTCOME[group]?.[Number(n) - 1] ?? "";
};

// Suggest syllabus points and 1–3 outcomes for a framework content area.
export function suggestMapping(area: string): { points: string[]; outcomes: string[] } {
  const found = AREAS.find((a) => a.label === area);
  if (!found) return { points: [], outcomes: [] };
  const tally = new Map<string, number>();
  for (const p of found.points) {
    const o = pointOutcome(p);
    if (o) tally.set(o, (tally.get(o) ?? 0) + 1);
  }
  const outcomes = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([o]) => o);
  return { points: found.points, outcomes };
}

export const GENERAL_CAPABILITIES = [
  "Critical and creative thinking",
  "Literacy",
  "Numeracy",
  "Digital literacy",
  "Ethical understanding",
  "Intercultural understanding",
  "Personal and social capability",
];
