import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ACTIVITY_TYPES, AREAS, activityType } from "@/lib/frameworks";

const client = new Anthropic();

const HOUSE = `You help Britt, a NSW Textiles Technology teacher (Marist Catholic College North Shore), plan units for the NESA Textiles Technology 7–10 Syllabus (2025). Use Australian spelling. Be concrete and classroom-ready. Students have low digital literacy; prefer printed booklets and hands-on work, and give new software or machine skills their own lesson.`;

type Body =
  | { action: "breakdown"; unit: UnitContext; item: { title: string; kind: string; notes: string }; task?: { code: string; kind: string; part?: string } }
  | { action: "tailor"; unit: UnitContext; lesson: string; piece: PieceContext }
  | { action: "steps"; unit: UnitContext; lesson: string; lessonType: string; pieces: PieceContext[] };

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
- Supplementary: targeted scaffolds at particular times (photo step cards, video, word banks, pre-marked lines). Same outcomes, full grade range.
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

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  try {
    if (body.action === "breakdown") return NextResponse.json(await breakdown(body));
    if (body.action === "tailor") return NextResponse.json(await tailor(body));
    if (body.action === "steps") return NextResponse.json(await steps(body));
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
