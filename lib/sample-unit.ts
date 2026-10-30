// Unit 1: Tote-ally Textiles, transcribed from "Unit 1 - Brainstorm and Planning.docx"
// (2028 New Syllabus folder). Titles and order are Britt's; framework areas and activity
// types are mapped to her Textiles and Activities & Tasks frameworks.
import { onPlace } from "./rules";
import type { HandIn, Item, ItemKind, Piece, Slot, Stream, Task, Unit } from "./types";
import { emptySlot, newUnit, slotKey } from "./types";

type P = {
  id: string; item: string; title: string; area: string; act: string; mins: number;
  task?: string; part?: string; stage?: Piece["stage"]; verb?: string; prereq?: string; handIn?: HandIn;
};

const ITEMS: [string, ItemKind, string, string?, string?][] = [
  ["safety", "skill", "Safety induction and OnGuard"],
  ["theory", "theory", "Textiles theory: end use, aesthetics, fibres, yarns, fabrics, industry"],
  ["design", "software", "Design communication: colour, type, InDesign, Photoshop, Illustrator"],
  ["samples", "skill", "Skills folder samples (FT1)", "ft1", "folder"],
  ["magazine", "task", "AT1 Part A — Research magazine", "at1", "s1"],
  ["tote", "task", "AT1 Part B — Tote bag", "at1", "tote"],
];

const PIECES: P[] = [
  // Cycle 1
  { id: "intro", item: "theory", title: "Introduction to Textiles", area: "Design Inspiration – Focus Area & End Use", act: "instruction", mins: 50 },
  { id: "induct", item: "safety", title: "Introduction to the Textiles room: layout, storage, routines and hazards", area: "Production, Safety & Quality – Safe Work Practices", act: "safety-induction", mins: 25 },
  { id: "setup", item: "safety", title: "Demonstration: setting up and packing away a machine", area: "Equipment & Technologies – Sewing Equipment", act: "demonstration", mins: 20 },
  { id: "onguard", item: "safety", title: "OnGuard safety modules", area: "Production, Safety & Quality – Safe Work Practices", act: "safety-induction", mins: 60, handIn: "CANVAS" },
  { id: "paper", item: "samples", title: "Paper sewing challenge", area: "Equipment & Technologies – Sewing Equipment", act: "skill-practice", mins: 45 },
  // Cycle 2
  { id: "enduse", item: "theory", title: "End use, aesthetic, functional and appropriate criteria", area: "Design Analysis & Considerations – Function", act: "instruction", mins: 50 },
  { id: "colour", item: "design", title: "Colour, typography and types of communication", area: "Design Communication – Visual", act: "instruction", mins: 50 },
  { id: "thread", item: "samples", title: "Threading the machine", area: "Equipment & Technologies – Sewing Equipment", act: "skill-practice", mins: 45 },
  { id: "aes", item: "theory", title: "Design styles, trends, elements and principles of design", area: "Design Analysis & Considerations – Aesthetics", act: "instruction", mins: 50 },
  { id: "stitch", item: "samples", title: "Stitch sample", area: "Construction – Stitches", act: "skill-practice", mins: 45, task: "ft1", part: "folder", stage: "PRODUCE", verb: "SEW", handIn: "PAPER" },
  { id: "hw1", item: "magazine", title: "AT1 Section 1: Brand profile (3 × 20 min)", area: "Designers – Local Designers", act: "research", mins: 60, task: "at1", part: "s1", stage: "PRODUCE", verb: "WRITE", handIn: "DRIVE" },
  // Cycle 3
  { id: "props", item: "theory", title: "Properties and performance", area: "Properties & Performance – Durability", act: "instruction", mins: 50 },
  { id: "indesign", item: "design", title: "Introduction to InDesign", area: "Equipment & Technologies – Digital Technologies", act: "tutorial", mins: 50 },
  { id: "seams", item: "samples", title: "Open seam and closed seam", area: "Construction – Seams", act: "skill-practice", mins: 45, task: "ft1", part: "folder", stage: "PRODUCE", verb: "SEW", handIn: "PAPER" },
  { id: "fibres", item: "theory", title: "Fibres: classification and structure", area: "Fibres – Classification", act: "instruction", mins: 50 },
  { id: "corner", item: "samples", title: "Corner seams (inside and external corner)", area: "Construction – Seams", act: "skill-practice", mins: 45, task: "ft1", part: "folder", stage: "PRODUCE", verb: "SEW", handIn: "PAPER" },
  { id: "hw2", item: "magazine", title: "AT1 Section 2: End use analysis and fibres (3 × 20 min)", area: "Testing, End Use & Selection – End Use & Suitability", act: "research", mins: 60, task: "at1", part: "s2", stage: "PRODUCE", verb: "WRITE", handIn: "DRIVE" },
  // Cycle 4
  { id: "yarns", item: "theory", title: "Yarns: types, production and structure", area: "Yarns – Types", act: "instruction", mins: 50 },
  { id: "photoshop", item: "design", title: "Visual communication: Photoshop cut-outs", area: "Design Communication – Visual", act: "tutorial", mins: 50 },
  { id: "bound", item: "samples", title: "Bound seam", area: "Construction – Finishes", act: "skill-practice", mins: 45, task: "ft1", part: "folder", stage: "PRODUCE", verb: "SEW", handIn: "PAPER" },
  { id: "illustrator", item: "design", title: "Graphic communication: Illustrator icons and infographics", area: "Design Communication – Graphic", act: "tutorial", mins: 50 },
  { id: "zipsam", item: "samples", title: "Zipper sample", area: "Construction – Openings, Closings & Fastenings", act: "skill-practice", mins: 45, task: "ft1", part: "folder", stage: "PRODUCE", verb: "SEW", handIn: "PAPER" },
  { id: "hw3", item: "magazine", title: "AT1 Section 3: Yarns (3 × 20 min)", area: "Yarns – Structure & Characteristics", act: "research", mins: 60, task: "at1", part: "s3", stage: "PRODUCE", verb: "WRITE", handIn: "DRIVE" },
  // Cycle 5
  { id: "fabrics", item: "theory", title: "Fabrics: woven, knitted and non-woven", area: "Fabrics – Woven", act: "instruction", mins: 50 },
  { id: "layout1", item: "magazine", title: "Laying out the brand profile and fibres", area: "Design Communication – Graphic", act: "production", mins: 50, task: "at1", part: "s1", stage: "PRODUCE", verb: "CREATE" },
  { id: "cut", item: "tote", title: "Production planning: cutting out", area: "Production, Safety & Quality – Production Planning", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "CUT" },
  { id: "finishes", item: "theory", title: "Colouration, decoration, finishes and selecting materials", area: "Testing, End Use & Selection – Selection & Justification", act: "instruction", mins: 50 },
  { id: "zip1", item: "tote", title: "Zipper flap, first side", area: "Construction – Openings, Closings & Fastenings", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "zipsam" },
  { id: "hw4", item: "magazine", title: "AT1 Section 4: Fabrics, colouration, finishes and justification (3 × 20 min)", area: "Testing, End Use & Selection – Selection & Justification", act: "research", mins: 60, task: "at1", part: "s4", stage: "PRODUCE", verb: "WRITE", handIn: "DRIVE" },
  // Cycle 6
  { id: "culture", item: "theory", title: "Culture and society, consumers and markets", area: "Culture & Society – Historical Perspectives", act: "instruction", mins: 50 },
  { id: "layout2", item: "magazine", title: "Laying out fibres, yarns and fabrics", area: "Design Communication – Graphic", act: "production", mins: 50, task: "at1", part: "s2", stage: "PRODUCE", verb: "CREATE" },
  { id: "zip2", item: "tote", title: "Zipper flap, second side and finishing", area: "Construction – Openings, Closings & Fastenings", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "zipsam" },
  { id: "components", item: "theory", title: "Production and manufacture: components and construction of a bag", area: "Production, Safety & Quality – Process Selection", act: "worked-example", mins: 50 },
  { id: "lining", item: "tote", title: "Attach main to lining", area: "Construction – Structural Support", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "seams" },
  { id: "hw5", item: "magazine", title: "AT1 Section 5: Tote bag design analysis (3 × 20 min)", area: "Design Analysis & Considerations – Construction & Manufacture", act: "research", mins: 60, task: "at1", part: "s5", stage: "PRODUCE", verb: "WRITE", handIn: "DRIVE" },
  // Cycle 7
  { id: "sustain", item: "theory", title: "Textile industry, sustainability and ethics", area: "Sustainability & Ethics – Environmental Impacts", act: "instruction", mins: 50 },
  { id: "layout3", item: "magazine", title: "Laying out the tote bag design analysis", area: "Design Communication – Graphic", act: "production", mins: 50, task: "at1", part: "s5", stage: "PRODUCE", verb: "CREATE" },
  { id: "straps", item: "tote", title: "Attach straps", area: "Construction – Seams", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "seams" },
  { id: "infographic", item: "magazine", title: "Life cycle infographic and hand in", area: "Design Communication – Graphic", act: "production", mins: 50, task: "at1", part: "s6", stage: "REFINE", verb: "SUBMIT", handIn: "CANVAS" },
  { id: "fbb", item: "tote", title: "Front to bottom to back", area: "Construction – Seams", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "seams" },
  { id: "hw6", item: "magazine", title: "AT1 Section 6: Life cycle, sustainability and ethics (3 × 20 min)", area: "Sustainability & Ethics – Environmental Impacts", act: "research", mins: 60, task: "at1", part: "s6", stage: "PRODUCE", verb: "WRITE", handIn: "DRIVE" },
  // Cycle 8
  { id: "label", item: "theory", title: "Elements and principles of design: tote bag label", area: "Elements of Design – Shape", act: "idea-generation", mins: 50 },
  { id: "sides", item: "tote", title: "Attach sides", area: "Construction – Seams", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "corner" },
  { id: "bind1", item: "tote", title: "Bind seams", area: "Construction – Finishes", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "bound" },
  // Cycle 9
  { id: "bind2", item: "tote", title: "Bind seams and finishing", area: "Construction – Finishes", act: "production", mins: 45, task: "at1", part: "tote", stage: "PRODUCE", verb: "SEW", prereq: "bound" },
  { id: "qc", item: "tote", title: "Quality control and evaluation", area: "Evaluation – Strengths, Limitations & Improvements", act: "reflection", mins: 45, task: "at1", part: "tote", stage: "REFINE", verb: "FINALISE", handIn: "PAPER" },
];

// [cycle, lesson or "hw", stream, pieces, status]
const PLACEMENT: [number, number | "hw", Stream, string[], Slot["status"]?][] = [
  [1, 1, "Theory", ["intro"]], [1, 2, "Prac", ["induct", "setup"]], [1, 3, "Prac", ["paper"], "optional"], [1, "hw", "", ["onguard"]],
  [2, 1, "Theory", ["enduse"]], [2, 2, "Design", ["colour"]], [2, 3, "Prac", ["thread"]], [2, 4, "Theory", ["aes"]], [2, 5, "Prac", ["stitch"]], [2, "hw", "", ["hw1"]],
  [3, 1, "Theory", ["props"]], [3, 2, "Design", ["indesign"]], [3, 3, "Prac", ["seams"]], [3, 4, "Theory", ["fibres"]], [3, 5, "Prac", ["corner"]], [3, "hw", "", ["hw2"]],
  [4, 1, "Theory", ["yarns"]], [4, 2, "Design", ["photoshop"]], [4, 3, "Prac", ["bound"]], [4, 4, "Design", ["illustrator"]], [4, 5, "Prac", ["zipsam"]], [4, "hw", "", ["hw3"]],
  [5, 1, "Theory", ["fabrics"]], [5, 2, "Design", ["layout1"]], [5, 3, "Prac", ["cut"]], [5, 4, "Theory", ["finishes"]], [5, 5, "Prac", ["zip1"]], [5, "hw", "", ["hw4"]],
  [6, 1, "Theory", ["culture"]], [6, 2, "Design", ["layout2"]], [6, 3, "Prac", ["zip2"]], [6, 4, "Theory", ["components"]], [6, 5, "Prac", ["lining"]], [6, "hw", "", ["hw5"]],
  [7, 1, "Theory", ["sustain"]], [7, 2, "Design", ["layout3"]], [7, 3, "Prac", ["straps"]], [7, 4, "Design", ["infographic"]], [7, 5, "Prac", ["fbb"]], [7, "hw", "", ["hw6"]],
  [8, 1, "Theory", ["label"], "optional"], [8, 2, "Prac", ["sides"]], [8, 3, "Theory", [], "at-risk"], [8, 4, "Prac", ["bind1"]],
  [9, 1, "Theory", [], "at-risk"], [9, 2, "Prac", ["bind2"]], [9, 3, "Theory", [], "at-risk"], [9, 4, "Prac", ["qc"]],
];

const TASKS: Task[] = [
  {
    id: "at1", kind: "Summative", code: "AT1", name: "Research magazine and tote bag",
    parts: [
      { id: "s1", name: "Section 1 Brand profile" }, { id: "s2", name: "Section 2 End use and fibres" },
      { id: "s3", name: "Section 3 Yarns" }, { id: "s4", name: "Section 4 Fabrics" },
      { id: "s5", name: "Section 5 Tote bag design analysis" }, { id: "s6", name: "Section 6 Life cycle" },
      { id: "tote", name: "Part B Tote bag" },
    ],
    outcomes: ["TT5-SAF-01", "TT5-COM-01", "TT5-EVL-01", "TT5-CDT-01", "TT5-MAT-01", "TT5-ENV-01"],
    weighting: "", setCycle: 1, dueCycle: 9, notificationUrl: "", rubricUrl: "",
  },
  {
    id: "ft1", kind: "Formative", code: "FT1", name: "Skills folder",
    parts: [{ id: "folder", name: "Skills samples" }],
    outcomes: ["TT5-CDT-01", "TT5-SAF-01"], weighting: "", setCycle: 2, dueCycle: 4,
    notificationUrl: "", rubricUrl: "", rehearses: "tote",
  },
];

export function sampleUnit(): Unit {
  const u = newUnit();
  const items: Item[] = ITEMS.map(([id, kind, title, taskId, partId]) => ({ id, kind, title, notes: "", taskId, partId }));
  let pieces: Piece[] = PIECES.map((p) => ({
    id: p.id, itemId: p.item, title: p.title, area: p.area, activityTypeId: p.act, verb: p.verb ?? "",
    minutes: p.mins, taskId: p.task, partId: p.part, stage: p.stage, outcomes: [], points: [],
    adjustments: {}, tailored: false, steps: [], handIn: p.handIn ?? "NONE", prereq: p.prereq,
  }));
  const slots: Record<string, Slot> = {};
  for (const [c, l, stream, ids, status] of PLACEMENT) {
    const prac = stream === "Prac" && ids.length > 0;
    const equipment = !prac ? [] : c === 1 ? ["sewing-machine", "scissors"] : c >= 3 ? ["sewing-machine", "overlocker", "iron", "scissors"] : ["sewing-machine", "iron", "scissors"];
    slots[slotKey(c, l)] = { ...emptySlot(), stream, status: status ?? "planned", pieceIds: ids, equipment };
    pieces = pieces.map((p) => (ids.includes(p.id) ? onPlace({ ...p, homework: l === "hw" }) : p));
  }
  return {
    ...u,
    year: "Year 9", calendarYear: "2028", unitNumber: "1", title: "Tote-ally Textiles",
    product: "A lined tote bag with a zipper flap, bound seams and straps (AT1 Part B), and a research magazine on an Australian bag brand (AT1 Part A).",
    overview: "Students research an Australian bag designer or brand and present their findings as a magazine, while developing construction skills through a skills folder and making a lined tote bag.",
    focusAreas: ["Local and global textile perspectives", "Textile design and product development", "Textile project work"],
    outcomes: ["TT5-SAF-01", "TT5-COM-01", "TT5-EVL-01", "TT5-IVT-01", "TT5-CDT-01", "TT5-MAT-01", "TT5-ENV-01"],
    items, pieces, slots, tasks: TASKS,
    resources: [
      { name: "Theory workbooklet", used: "Theory lessons", holds: "Content and class activities for each theory lesson, including the tables started in class" },
      { name: "Research workbooklet (AT1)", used: "Homework, then design lessons", holds: "The six magazine sections, each set out as three 20 minute homework tasks, with the written, visual and graphic communication options" },
      { name: "Construction workbooklet", used: "Prac lessons (tote bag)", holds: "Step by step instructions with video recordings for each construction step" },
      { name: "Skills folder templates (printed on card)", used: "Prac lessons (skills samples)", holds: "A card template for mounting and annotating each skills sample (formative)" },
    ],
    caseStudy: "Kollab is the class case study. The teacher models each research section on Kollab before students complete the same section for their own brand.",
    brands: ["Bon Maxie", "Murph&Murph", "Stassh Society", "State of Escape", "Ela&Earth", "July", "Oroton", "A-Esque", "Sans Beast", "Mimmi", "Maison de Sabre", "Status Anxiety", "Country Road", "Louenhide", "Bambi Bags", "PAKD", "Orbitkey", "Nere Travel", "Tottie", "Willow Bay", "Olivia Jean", "The Somewhere Co", "Project 10", "Madison Accessories"].map((name) => ({ name, student: "" })),
    courseHours: 200,
    aiNotes: "Year 9 Textiles, mixed ability with low digital literacy. Printed booklets over screens. Theory lessons introduce each cycle's homework.",
  };
}
