import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ACTIVITY_TYPES, AREAS, activityType } from "@/lib/frameworks";

const client = new Anthropic();

const HOUSE = `You help Britt, a NSW Textiles Technology teacher (Marist Catholic College North Shore), plan units for the NESA Textiles Technology 7–10 Syllabus (2025). Use Australian spelling. Be concrete and classroom-ready. Students have low digital literacy; prefer printed booklets and hands-on work, and give new software or machine skills their own lesson.`;

type Body =
  | { action: "breakdown"; unit: UnitContext; item: { title: string; kind: string; notes: string }; task?: { code: string; kind: string; part?: string } }
  | { action: "tailor"; unit: UnitContext; lesson: string; piece: PieceContext }
  | { action: "steps"; unit: UnitContext; lesson: string; lessonType: string; pieces: PieceContext[] }
  | { action: "intentions"; unit: UnitContext; lesson: string; content: string[]; pieces: PieceContext[] }
  | { action: "evaluation"; unit: UnitContext; summary: unknown }
  | { action: "tidy"; unit: UnitContext; field: string; text: string }
  | { action: "overview"; unit: UnitContext; outline: string }
  | { action: "pedagogy"; unit: UnitContext; outline: string }
  | { action: "sheet"; unit: UnitContext; piece: PieceContext };

type UnitContext = { title: string; year: string; product: string; notes: string };
type PieceContext = { title: string; area: string; activityTypeId: string; minutes: number; label: string };

const unitLine = (u: UnitContext) =>
  `Unit: ${u.title} (${u.year}). Students make: ${u.product || "(not given)"}. Teacher notes: ${u.notes || "(none)"}`;

async function ask<T>(system: string, prompt: string, schema: Record<string, unknown>): Promise<T> {
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 32000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new Error("The AI declined this request. Try rewording it.");
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("The AI returned nothing. Try again.");
  return JSON.parse(text.text) as T;
}

function breakdown(b: Extract<Body, { action: "breakdown" }>) {
  const acts = ACTIVITY_TYPES.map((a) => `${a.id}: ${a.name} (${a.family}; step ${a.step}; verbs ${a.verbs.join(", ")})`).join("\n");
  const system = `${HOUSE}

You break a unit item into lesson-sized pieces that will be dragged into lessons on a cycle grid. Follow Britt's build rules:
- Teach or model, then practise, then the task. A skill is practised (activity or formative sample) before it appears in the summative product.
- Safety induction comes before any equipment use.
- A piece is 10–50 minutes in class (theory 50, practical 45), or about 20 minutes for one homework task.
- Name each piece plainly, as Britt would in her planning doc (e.g. "Zipper flap, first side", "Open seam and closed seam").
- Choose the Textiles Framework content area and the Activities & Tasks Framework activity type that fit best.
- For pieces that work on an assessment or formative task, give the task stage: PREPARE (learning how, not marked), PLAN (own project, not handed in), PRODUCE (making the marked work), REFINE (improving marked work after feedback), REFLECT (after it comes back). Otherwise leave stage empty.
- verb: one verb from the activity type's verbs, or the stage verb (e.g. SEW, WRITE, CUT, CREATE).

Activity types:
${acts}`;
  const prompt = `${unitLine(b.unit)}
Item to break down: ${b.item.title} (${b.item.kind})${b.task ? `, part of ${b.task.code} (${b.task.kind})${b.task.part ? ", " + b.task.part : ""}` : ""}
Notes: ${b.item.notes || "(none)"}`;
  return ask<{ pieces: unknown[] }>(system, prompt, {
    type: "object",
    properties: {
      pieces: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            area: { type: "string", enum: AREAS.map((a) => a.label) },
            activityTypeId: { type: "string", enum: ACTIVITY_TYPES.map((a) => a.id) },
            minutes: { type: "integer" },
            stage: { type: "string", enum: ["", "PREPARE", "PLAN", "PRODUCE", "REFINE", "REFLECT"] },
            verb: { type: "string" },
          },
          required: ["title", "area", "activityTypeId", "minutes", "stage", "verb"],
          additionalProperties: false,
        },
      },
    },
    required: ["pieces"],
    additionalProperties: false,
  });
}

function tailor(b: Extract<Body, { action: "tailor" }>) {
  const at = activityType(b.piece.activityTypeId);
  const system = `${HOUSE}

You rewrite NCCD adjustments for one lesson activity so they name the actual content, materials and equipment. Keep each to one or two sentences and keep the level's intent:
- Supplementary: targeted scaffolds at particular times (photo step cards, video, word banks, pre-marked lines), plus one executive function support for organisation (step checklist, labelled tray, booklet routine, chunked task tracker). Same outcomes, full grade range.
- Substantial: frequent modification (reduced load, pre-cut or pre-pinned samples, sentence starters, LSO support). Same outcomes.
- Extensive: highly individualised, one-to-one (hand-over-hand, slow machine speed, picture cards, one simplified task).
- Extension / Newman: removes practice already mastered and raises depth and complexity inside the same task.
- Life Skills: start with a TTLS outcome code and a colon, then one concrete, age-respectful activity on the same topic.`;
  const prompt = `${unitLine(b.unit)}
Lesson: ${b.lesson}
Activity: ${b.piece.title} (${at?.name ?? b.piece.activityTypeId}, ${b.piece.minutes} min, ${b.piece.label}). Content area: ${b.piece.area}.

The framework's starting adjustments for ${at?.name ?? "this activity type"}:
${at ? Object.entries(at.levels).map(([k, v]) => `${k}: ${v}`).join("\n") : "(none)"}`;
  return ask<Record<string, string>>(system, prompt, {
    type: "object",
    properties: {
      supplementary: { type: "string" }, substantial: { type: "string" }, extensive: { type: "string" },
      extension: { type: "string" }, life_skills: { type: "string" },
    },
    required: ["supplementary", "substantial", "extensive", "extension", "life_skills"],
    additionalProperties: false,
  });
}

function steps(b: Extract<Body, { action: "steps" }>) {
  const system = `${HOUSE}

You write the numbered student steps for a Compass lesson page. Students read these, so:
- 1–4 short steps per activity, second person, one action each.
- Start each step with one of the activity type's own verbs (e.g. Demonstration: watch, observe, note; Skill practice: practise, repeat, check).
- Name the real equipment and materials. No outcome codes, no teacher notes.`;
  const prompt = `${unitLine(b.unit)}
Lesson (${b.lessonType}): ${b.lesson}
Activities, in order:
${b.pieces.map((p, i) => `${i + 1}. ${p.title} — ${activityType(p.activityTypeId)?.name ?? p.activityTypeId} (verbs: ${activityType(p.activityTypeId)?.verbs.join(", ")}), ${p.minutes} min`).join("\n")}`;
  return ask<{ activities: { steps: string[] }[] }>(system, prompt, {
    type: "object",
    properties: {
      activities: {
        type: "array",
        items: { type: "object", properties: { steps: { type: "array", items: { type: "string" } } }, required: ["steps"], additionalProperties: false },
      },
    },
    required: ["activities"],
    additionalProperties: false,
  });
}

function intentions(b: Extract<Body, { action: "intentions" }>) {
  const system = `${HOUSE}

You write one learning intention and 2–4 success criteria for a lesson.
- Learning intention: "We are learning to …", one sentence, about the learning, not the activity.
- Success criteria: "I can …" statements students can check themselves, observable and specific to the content and techniques.`;
  const prompt = `${unitLine(b.unit)}
Lesson: ${b.lesson}
Syllabus content: ${b.content.join("; ") || "(none listed)"}
Activities: ${b.pieces.map((p) => `${p.title} (${p.label})`).join("; ")}`;
  return ask<{ intention: string; success: string[] }>(system, prompt, {
    type: "object",
    properties: { intention: { type: "string" }, success: { type: "array", items: { type: "string" } } },
    required: ["intention", "success"],
    additionalProperties: false,
  });
}

function evaluation(b: Extract<Body, { action: "evaluation" }>) {
  const system = `${HOUSE}

You summarise a class's Student Unit Evaluation for the "Summary of Student Comments" box of the school's program register. Write 4–6 plain sentences: overall rating and engagement, whether students finished in time and felt they got feedback, what they enjoyed, what held them back, and the most common recommendations. Use counts and averages from the data. No student names. Then give 2–4 short suggested improvements for course delivery based on the responses.`;
  const prompt = `${unitLine(b.unit)}
Evaluation data (names removed):
${JSON.stringify(b.summary, null, 1)}`;
  return ask<{ summary: string; improvements: string[] }>(system, prompt, {
    type: "object",
    properties: { summary: { type: "string" }, improvements: { type: "array", items: { type: "string" } } },
    required: ["summary", "improvements"],
    additionalProperties: false,
  });
}

function tidy(b: Extract<Body, { action: "tidy" }>) {
  const system = `${HOUSE}

Britt types rough notes into her unit planner. Turn them into clean, concise dot points for a teaching program. Keep every idea she wrote and her terminology; fix spelling and grammar; don't add new content. Each point is a short phrase or sentence with no bullet character.`;
  return ask<{ points: string[] }>(system, `${unitLine(b.unit)}\nField: ${b.field}\nRough notes:\n${b.text}`, {
    type: "object", properties: { points: { type: "array", items: { type: "string" } } }, required: ["points"], additionalProperties: false,
  });
}

function overview(b: Extract<Body, { action: "overview" }>) {
  const system = `${HOUSE}

Write the Unit Overview for the front of a teaching program, from the finished program outline. One paragraph of 4–6 sentences: what students investigate and learn, what they make, how the unit is assessed, and the key skills and knowledge developed. Third person ("Students …"), present tense, no outcome codes, no headings.`;
  return ask<{ overview: string }>(system, `${unitLine(b.unit)}\n\nProgram outline:\n${b.outline}`, {
    type: "object", properties: { overview: { type: "string" } }, required: ["overview"], additionalProperties: false,
  });
}

function pedagogy(b: Extract<Body, { action: "pedagogy" }>) {
  const system = `${HOUSE}

Write the "Pedagogical approach" section for the front of a teaching program, from the program outline. One or two short paragraphs (6–9 sentences) explaining how the unit is taught and why, grounded in information processing and cognitive load theory as Britt applies it:
- explicit teaching in small chunks, with demonstrations broken into steps and fill-in demonstration sheets (dual coding, generative learning: Fiorella & Mayer, 2016; Mayer, 2024);
- managing working memory load (Paas & van Merriënboer, 2020; Sweller, 2016) and load reduction instruction (Martin & Evans, 2018);
- worked examples and practice samples before independent project work, with support faded as expertise grows (Chen, Kalyuga & Sweller, 2017; Kirschner & Hendrick, 2020);
- retrieval practice and spaced review (Agarwal, Nunes & Blunt, 2021);
- printed booklets over screens for reading and organisation (Delgado et al., 2018), and explicit support for developing executive function (Zelazo & Carlson, 2020).
Only mention strategies the outline actually uses. Cite with author–year in brackets. Third person, present tense, no headings.`;
  return ask<{ pedagogy: string }>(system, `${unitLine(b.unit)}\n\nProgram outline:\n${b.outline}`, {
    type: "object", properties: { pedagogy: { type: "string" } }, required: ["pedagogy"], additionalProperties: false,
  });
}

function sheet(b: Extract<Body, { action: "sheet" }>) {
  const system = `${HOUSE}

You write a fill-in demonstration sheet students complete while watching a teacher demonstration, then keep in their booklet as a reference (generative learning and dual coding: they write, label and sketch as they watch).
- steps: 4–8 numbered steps in order, second person, each with one key word or measurement replaced by "_____" for students to fill in.
- labels: 3–6 parts of a diagram for students to label (equipment parts, fabric features or construction details).
- keyWords: the 4–8 words that fill the blanks and labels, for a word bank.
Use correct textiles terminology and real measurements (e.g. 1.5 cm seam allowance).`;
  return ask<{ steps: string[]; labels: string[]; keyWords: string[] }>(system, `${unitLine(b.unit)}\nDemonstration: ${b.piece.title} (content area: ${b.piece.area}, ${b.piece.minutes} min)`, {
    type: "object",
    properties: { steps: { type: "array", items: { type: "string" } }, labels: { type: "array", items: { type: "string" } }, keyWords: { type: "array", items: { type: "string" } } },
    required: ["steps", "labels", "keyWords"], additionalProperties: false,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  try {
    if (body.action === "breakdown") return NextResponse.json(await breakdown(body));
    if (body.action === "tailor") return NextResponse.json(await tailor(body));
    if (body.action === "steps") return NextResponse.json(await steps(body));
    if (body.action === "intentions") return NextResponse.json(await intentions(body));
    if (body.action === "evaluation") return NextResponse.json(await evaluation(body));
    if (body.action === "tidy") return NextResponse.json(await tidy(body));
    if (body.action === "overview") return NextResponse.json(await overview(body));
    if (body.action === "pedagogy") return NextResponse.json(await pedagogy(body));
    if (body.action === "sheet") return NextResponse.json(await sheet(body));
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError || (error instanceof Error && /api key|apiKey|authentication/i.test(error.message)))
      return NextResponse.json({ error: "AI isn't set up yet. Add ANTHROPIC_API_KEY to .env.local and restart." }, { status: 503 });
    if (error instanceof Anthropic.RateLimitError)
      return NextResponse.json({ error: "Too many requests right now. Wait a minute and try again." }, { status: 429 });
    if (error instanceof Anthropic.APIError)
      return NextResponse.json({ error: `AI service error (${error.status}). Try again shortly.` }, { status: 502 });
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 502 });
    throw error;
  }
}
