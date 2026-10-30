"use client";

import { ACTIVITY_TYPES, STRANDS } from "@/lib/frameworks";
import { stageVerbs, suggestStage } from "@/lib/rules";
import type { HandIn, Piece, Stage, Unit } from "@/lib/types";
import { HAND_IN_CAPTION } from "@/lib/docx/compass";

const FAMILIES = [...new Set(ACTIVITY_TYPES.map((a) => a.family))];
const HAND_INS = Object.keys(HAND_IN_CAPTION) as HandIn[];

// Edits one piece's framework details: area, activity type, minutes, task stage and hand-in.
export default function PieceEditor({ unit, piece, onChange }: { unit: Unit; piece: Piece; onChange: (p: Piece) => void }) {
  const set = (patch: Partial<Piece>) => onChange({ ...piece, ...patch });
  const at = ACTIVITY_TYPES.find((a) => a.id === piece.activityTypeId);
  const task = unit.tasks.find((t) => t.id === piece.taskId);
  const verbs = task && piece.stage ? stageVerbs(piece.stage) : at?.verbs ?? [];

  return (
    <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
      <label className="field" style={{ gridColumn: "1 / -1" }}>Piece
        <input value={piece.title} onChange={(e) => set({ title: e.target.value })} />
      </label>
      <label className="field">Content area (Textiles Framework)
        <select value={piece.area} onChange={(e) => set({ area: e.target.value, points: [], outcomes: [] })}>
          <option value="">Choose…</option>
          {STRANDS.map((s) => (
            <optgroup key={s.strand} label={s.strand}>
              {s.categories.flatMap((c) => c.areas.map((a) => {
                const label = `${c.category} – ${a.name}`;
                return <option key={label} value={label}>{label}</option>;
              }))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="field">Activity type
        <select value={piece.activityTypeId} onChange={(e) => set({ activityTypeId: e.target.value, verb: "", tailored: false })}>
          {FAMILIES.map((f) => (
            <optgroup key={f} label={f}>
              {ACTIVITY_TYPES.filter((a) => a.family === f).map((a) => <option key={a.id} value={a.id}>{a.name} ({a.step})</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="field">Minutes
        <input type="number" min={5} step={5} value={piece.minutes} onChange={(e) => set({ minutes: Number(e.target.value) || 0 })} />
      </label>
      <label className="field">Task
        <select value={piece.taskId ?? ""} onChange={(e) => {
          const t = unit.tasks.find((x) => x.id === e.target.value);
          set({ taskId: t?.id, partId: t?.parts[0]?.id, stage: t ? suggestStage(piece, t) : undefined, verb: "" });
        }}>
          <option value="">None (activity)</option>
          {unit.tasks.map((t) => <option key={t.id} value={t.id}>{t.code} {t.name}</option>)}
        </select>
      </label>
      {task && (
        <>
          <label className="field">Part
            <select value={piece.partId ?? ""} onChange={(e) => set({ partId: e.target.value })}>
              {task.parts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="field">Stage (suggested: {suggestStage(piece, task)})
            <select value={piece.stage ?? ""} onChange={(e) => set({ stage: e.target.value as Stage, verb: "" })}>
              {(["PREPARE", "PLAN", "PRODUCE", "REFINE", "REFLECT"] as Stage[]).map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </>
      )}
      <label className="field">Verb
        <select value={piece.verb} onChange={(e) => set({ verb: e.target.value })}>
          <option value="">{verbs[0] ?? "—"} (default)</option>
          {verbs.map((v) => <option key={v}>{v}</option>)}
        </select>
      </label>
      <label className="field">Hand in
        <select value={piece.handIn} onChange={(e) => set({ handIn: e.target.value as HandIn })}>
          {HAND_INS.map((h) => <option key={h} value={h}>{HAND_IN_CAPTION[h] || (h === "NONE" ? "Nothing collected" : "Same as classwork")}</option>)}
        </select>
      </label>
      <label className="field">Must come after
        <select value={piece.prereq ?? ""} onChange={(e) => set({ prereq: e.target.value || undefined })}>
          <option value="">Nothing</option>
          {unit.pieces.filter((p) => p.id !== piece.id).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </label>
    </div>
  );
}
