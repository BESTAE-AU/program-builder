// The unit model. A unit is set up (step 1), filled with bank items that are
// broken into pieces (step 2), and the pieces are dropped into lesson slots
// on a cycle grid (step 3). Lessons are refined in step 4 and exported in step 5.

export type Stream = "Theory" | "Design" | "Prac" | "";
export type Status = "planned" | "optional" | "at-risk" | "missed";
export type Level = "supplementary" | "substantial" | "extensive" | "extension" | "life_skills";
export type Stage = "PREPARE" | "PLAN" | "PRODUCE" | "REFINE" | "REFLECT";
export type HandIn = "NONE" | "SHOW" | "PAPER" | "DRIVE" | "CANVAS" | "WAYGROUND" | "BRING" | "SAME";
export type ItemKind = "task" | "skill" | "theory" | "software";

export const LEVELS: { key: Level; name: string }[] = [
  { key: "supplementary", name: "Supplementary" },
  { key: "substantial", name: "Substantial" },
  { key: "extensive", name: "Extensive" },
  { key: "extension", name: "Extension / Newman" },
  { key: "life_skills", name: "Life Skills" },
];

export const ITEM_KINDS: { key: ItemKind; name: string }[] = [
  { key: "task", name: "Assessment task part" },
  { key: "skill", name: "Skills and samples" },
  { key: "theory", name: "Theory topic" },
  { key: "software", name: "Software and design skills" },
];

export type Item = {
  id: string;
  kind: ItemKind;
  title: string;
  notes: string;
  taskId?: string; // the AT or FT this item builds
  partId?: string;
};

export type Piece = {
  id: string;
  itemId: string;
  title: string;
  area: string; // Textiles Framework "Category – Content area"
  activityTypeId: string; // Activities & Tasks Framework activity type
  verb: string; // one of the activity type's verbs, or the task stage verb
  minutes: number;
  // Set when the piece works on a formative or summative task.
  taskId?: string;
  partId?: string;
  stage?: Stage;
  homework?: boolean;
  outcomes: string[];
  points: string[]; // numbered syllabus content points, e.g. "P5.10"
  outcomes2019: string[]; // Textiles Technology 7–10 (2019) outcomes, e.g. "TEX5-10"
  points2019: string[]; // 2019 content points, e.g. "PW-P5"
  adjustments: Partial<Record<Level, string>>;
  tailored: boolean;
  steps: string[]; // student-facing steps for the Compass page
  handIn: HandIn;
  prereq?: string; // piece id that must come first
};

export type Link = { name: string; url: string };
export type Taught = "" | "taught" | "partly" | "not";

export type Slot = {
  stream: Stream;
  status: Status;
  pieceIds: string[];
  title: string; // overrides the first piece's area as the lesson title
  notes: string;
  resources: Link[];
  equipment: string[]; // WHS equipment ids
  capabilities: string[] | null; // null = from the activity types in the lesson
  priorities: string[]; // cross-curriculum priorities, only where relevant
  register: { date: string; taught: Taught; notes: string }; // the annotated register
  intention: string; // learning intention
  success: string; // success criteria, one per line
};

export type UnitRegister = {
  teacherComments: string;
  studentComments: string;
  assessmentComments: string;
  improvements: string;
  newResources: string;
  dateCommenced: string;
  dateCompleted: string;
  signature: string;
  signDate: string;
};

export type TaskPart = { id: string; name: string };

export type Task = {
  id: string;
  kind: "Formative" | "Summative";
  code: string; // AT1, FT1
  name: string;
  parts: TaskPart[];
  outcomes: string[];
  weighting: string;
  setCycle: number;
  dueCycle: number;
  notificationUrl: string;
  rubricUrl: string;
  rehearses?: string; // part id of an AT that this FT rehearses
};

export type Student = { initials: string; level: Level | "qdtp" | "2e" };
export type Resource = { name: string; used: string; holds: string };

export type Unit = {
  id: string;
  course: string;
  year: string;
  stage: string;
  calendarYear: string;
  unitNumber: string;
  title: string;
  product: string;
  overview: string;
  priorKnowledge: string;
  focusAreas: string[];
  outcomes: string[];
  syllabusMode: "2025" | "2019+2025"; // 2019+2025: 2019 is official, 2025 shown alongside
  outcomes2019: string[];
  cycles: number;
  lessonsPerCycle: number;
  frameworks: string[];
  items: Item[];
  pieces: Piece[];
  slots: Record<string, Slot>; // "3-2" = cycle 3 lesson 2; "3-hw" = cycle 3 homework
  tasks: Task[];
  students: Student[];
  diverseLink: string;
  resources: Resource[];
  caseStudy: string;
  brands: { name: string; student: string }[];
  aiNotes: string;
  courseHours: number; // indicative hours for the whole course, e.g. 200 for Years 9–10
  priorHours: number; // hours already completed in earlier units
  register: UnitRegister;
  updatedAt: string;
};

export const emptyRegister = (): UnitRegister => ({
  teacherComments: "", studentComments: "", assessmentComments: "", improvements: "",
  newResources: "", dateCommenced: "", dateCompleted: "", signature: "", signDate: "",
});

export const uid = () => Math.random().toString(36).slice(2, 10);

export const slotKey = (cycle: number, lesson: number | "hw") => `${cycle}-${lesson}`;

export const emptySlot = (): Slot => ({
  stream: "", status: "planned", pieceIds: [], title: "", notes: "",
  resources: [], equipment: [], capabilities: null, priorities: [],
  register: { date: "", taught: "", notes: "" },
  intention: "", success: "",
});

// Units saved before a field existed get its default when loaded.
export function normaliseUnit(u: Unit): Unit {
  const base = newUnit();
  const slots: Record<string, Slot> = {};
  for (const [k, s] of Object.entries(u.slots ?? {})) slots[k] = { ...emptySlot(), ...s, register: { ...emptySlot().register, ...s.register } };
  const pieces = (u.pieces ?? []).map((p) => ({ ...p, outcomes2019: p.outcomes2019 ?? [], points2019: p.points2019 ?? [] }));
  return { ...base, ...u, register: { ...emptyRegister(), ...u.register }, slots, pieces };
}

export function newUnit(): Unit {
  return {
    id: uid(),
    course: "Textiles Technology 7–10 (2025)",
    year: "Year 9",
    stage: "Stage 5",
    calendarYear: String(new Date().getFullYear() + 1),
    unitNumber: "1",
    title: "",
    product: "",
    overview: "",
    priorKnowledge: "",
    focusAreas: [],
    outcomes: [],
    syllabusMode: "2025",
    outcomes2019: [],
    cycles: 9,
    lessonsPerCycle: 5,
    frameworks: ["Textiles Framework", "Activities & Tasks Framework", "General Capabilities Map", "TAS Skills & Content Continuum"],
    items: [],
    pieces: [],
    slots: {},
    tasks: [],
    students: [],
    diverseLink: "",
    resources: [],
    caseStudy: "",
    brands: [],
    aiNotes: "",
    courseHours: 200,
    priorHours: 0,
    register: emptyRegister(),
    updatedAt: new Date().toISOString(),
  };
}
