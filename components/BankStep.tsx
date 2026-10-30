"use client";

import { useState } from "react";
import { askAI } from "@/lib/ai";
import { activityType } from "@/lib/frameworks";
import { pieceColours, pieceLabel, placedKey } from "@/lib/rules";
import type { Item, ItemKind, Piece, Stage, Task, Unit } from "@/lib/types";
import { ITEM_KINDS, uid } from "@/lib/types";
import PieceEditor from "./PieceEditor";

type Props = { unit: Unit; update: (fn: (u: Unit) => Unit) => void; next: () => void };

type Suggested = { title: string; area: string; activityTypeId: string; minutes: number; stage: string; verb: string };

export default function BankStep({ unit, update, next }: Props) {
  const [tab, setTab] = useState<ItemKind | "all">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);

  const setItem = (id: string, patch: Partial<Item>) => update((u) => ({ ...u, items: u.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  const setPiece = (p: Piece) => update((u) => ({ ...u, pieces: u.pieces.map((x) => (x.id === p.id ? p : x)) }));
  const addItem = () => {
    const kind: ItemKind = tab === "all" ? "theory" : tab;
    const item: Item = { id: uid(), kind, title: "", notes: "" };
    update((u) => ({ ...u, items: [...u.items, item] }));
    setEditing(item.id);
  };
  const removeItem = (it: Item) => {
    if (!confirm(`Delete "${it.title || "this item"}" and its pieces? Pieces already in the grid are removed too.`)) return;
    update((u) => {
      const gone = new Set(u.pieces.filter((p) => p.itemId === it.id).map((p) => p.id));
      const slots = Object.fromEntries(Object.entries(u.slots).map(([k, s]) => [k, { ...s, pieceIds: s.pieceIds.filter((id) => !gone.has(id)) }]));
      return { ...u, items: u.items.filter((i) => i.id !== it.id), pieces: u.pieces.filter((p) => !gone.has(p.id)), slots };
    });
  };
  const blankPiece = (it: Item): Piece => ({
    id: uid(), itemId: it.id, title: "", area: "", activityTypeId: it.taskId ? "production" : "instruction", verb: "", minutes: 45,
    taskId: it.taskId, partId: it.partId, stage: it.taskId ? "PRODUCE" : undefined, outcomes: [], points: [],
    adjustments: {}, tailored: false, steps: [], handIn: "NONE",
  });

  const breakdown = async (it: Item) => {
    setBusy(it.id);
    setError((e) => ({ ...e, [it.id]: "" }));
    try {
      const task = unit.tasks.find((t) => t.id === it.taskId);
      const res = await askAI<{ pieces: Suggested[] }>({
        action: "breakdown",
        unit: { title: unit.title, year: unit.year, product: unit.product, notes: unit.aiNotes },
        item: { title: it.title, kind: ITEM_KINDS.find((k) => k.key === it.kind)?.name ?? it.kind, notes: it.notes },
        task: task ? { code: task.code, kind: task.kind, part: task.parts.find((p) => p.id === it.partId)?.name } : undefined,
      });
      const pieces: Piece[] = res.pieces.map((s) => ({
        ...blankPiece(it), title: s.title, area: s.area, activityTypeId: s.activityTypeId, minutes: s.minutes,
        stage: it.taskId && s.stage ? (s.stage as Stage) : undefined, verb: s.verb,
      }));
      update((u) => ({ ...u, pieces: [...u.pieces, ...pieces] }));
    } catch (e) {
      setError((x) => ({ ...x, [it.id]: e instanceof Error ? e.message : "Breakdown failed." }));
    } finally {
      setBusy(null);
    }
  };

  const shown = unit.items.filter((i) => tab === "all" || i.kind === tab);

  return (
    <div className="page narrow">
      <div className="row">
        <div className="spacer">
          <h1>Bank</h1>
          <p className="lede">Everything the unit needs to teach. Break each big item into pieces, then drag the pieces into lessons on the grid.</p>
        </div>
        <button onClick={addItem}>+ Add item</button>
        <button className="primary" onClick={next}>Go to grid →</button>
      </div>

      <TasksPanel unit={unit} update={update} />

      <div className="row" role="tablist" aria-label="Item kinds">
        {[{ key: "all" as const, name: "All" }, ...ITEM_KINDS].map((k) => (
          <button key={k.key} role="tab" aria-selected={tab === k.key} className={tab === k.key ? "primary" : ""} style={{ borderRadius: 999 }} onClick={() => setTab(k.key)}>
            {k.name} ({k.key === "all" ? unit.items.length : unit.items.filter((i) => i.kind === k.key).length})
          </button>
        ))}
      </div>

      {shown.length === 0 && <p className="muted">No items here yet. Add an assessment task part, skill, theory topic or software skill.</p>}

      {shown.map((it) => {
        const pieces = unit.pieces.filter((p) => p.itemId === it.id);
        const placed = pieces.filter((p) => placedKey(unit, p.id)).length;
        const open = editing === it.id;
        const task = unit.tasks.find((t) => t.id === it.taskId);
        return (
          <article key={it.id} className="card" style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            <div className="row" style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-soft)" }}>
              <span className="pill" style={{ background: it.kind === "task" ? "var(--navy)" : "var(--panel)", color: it.kind === "task" ? "#fff" : "var(--navy)" }}>
                {ITEM_KINDS.find((k) => k.key === it.kind)?.name}
              </span>
              <h2 className="spacer">{it.title || "Untitled item"}</h2>
              <span className="muted">{pieces.length ? `${placed} of ${pieces.length} placed` : "Not broken down yet"}</span>
              <button className="small" onClick={() => setEditing(open ? null : it.id)}>{open ? "Done" : "Edit"}</button>
              <button className="small primary" disabled={busy === it.id || !it.title} onClick={() => breakdown(it)}>
                {busy === it.id ? "Breaking down…" : pieces.length ? "Suggest more pieces" : "Break down with AI"}
              </button>
            </div>
            {open && (
              <div className="grid-auto" style={{ padding: 16, borderBottom: "1px solid var(--line-soft)" }}>
                <label className="field">Item
                  <input value={it.title} onChange={(e) => setItem(it.id, { title: e.target.value })} />
                </label>
                <label className="field">Kind
                  <select value={it.kind} onChange={(e) => setItem(it.id, { kind: e.target.value as ItemKind })}>
                    {ITEM_KINDS.map((k) => <option key={k.key} value={k.key}>{k.name}</option>)}
                  </select>
                </label>
                <label className="field">Builds task
                  <select value={it.taskId ?? ""} onChange={(e) => { const t = unit.tasks.find((x) => x.id === e.target.value); setItem(it.id, { taskId: t?.id, partId: t?.parts[0]?.id }); }}>
                    <option value="">None</option>
                    {unit.tasks.map((t) => <option key={t.id} value={t.id}>{t.code} {t.name}</option>)}
                  </select>
                </label>
                {task && (
                  <label className="field">Part
                    <select value={it.partId ?? ""} onChange={(e) => setItem(it.id, { partId: e.target.value })}>
                      {task.parts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                )}
                <label className="field" style={{ gridColumn: "1 / -1" }}>Notes for the breakdown (steps, materials, what must come first)
                  <textarea rows={2} value={it.notes} onChange={(e) => setItem(it.id, { notes: e.target.value })} />
                </label>
                <div><button className="danger" onClick={() => removeItem(it)}>Delete item</button></div>
              </div>
            )}
            {busy === it.id && <p className="notice info" style={{ margin: 12 }}>Breaking this into lesson-sized pieces using your Textiles Framework and Activities &amp; Tasks Framework…</p>}
            {error[it.id] && <p className="error" role="alert" style={{ margin: 12 }}>{error[it.id]}</p>}
            <ol className="plain" style={{ padding: 12, gap: 8 }}>
              {pieces.map((p) => <PieceRow key={p.id} unit={unit} piece={p} onChange={setPiece} onRemove={() => update((u) => ({ ...u, pieces: u.pieces.filter((x) => x.id !== p.id), slots: Object.fromEntries(Object.entries(u.slots).map(([k, s]) => [k, { ...s, pieceIds: s.pieceIds.filter((id) => id !== p.id) }])) }))} />)}
              <li><button className="small" onClick={() => { const p = blankPiece(it); update((u) => ({ ...u, pieces: [...u.pieces, p] })); }}>+ Add piece by hand</button></li>
            </ol>
          </article>
        );
      })}
    </div>
  );
}

function PieceRow({ unit, piece, onChange, onRemove }: { unit: Unit; piece: Piece; onChange: (p: Piece) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(!piece.title);
  const c = pieceColours(piece, unit.tasks);
  const placed = placedKey(unit, piece.id);
  return (
    <li style={{ border: "1px solid var(--line-soft)", borderRadius: 8, background: c.tint }}>
      <div className="row" style={{ padding: "8px 10px" }}>
        <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: "1 1 220px" }}>
          <b style={{ fontSize: 15 }}>{piece.title || "New piece"}</b>
          <span className="muted">{piece.area || "No content area yet"}</span>
        </span>
        <span className="pill" style={{ background: c.bg, color: c.fg }}>{activityType(piece.activityTypeId)?.name}</span>
        <span className="label">{pieceLabel(piece, unit.tasks)}</span>
        <span className="muted" style={{ minWidth: 56, textAlign: "right" }}>{piece.minutes} min</span>
        <span className="muted" style={{ minWidth: 90 }}>{placed ? `Cycle ${placed.split("-")[0]}` : "Not placed"}</span>
        <button className="small" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Close" : "Edit"}</button>
        <button className="small ghost" aria-label={`Delete ${piece.title}`} onClick={() => confirm(`Delete "${piece.title || "this piece"}"?`) && onRemove()}>Delete</button>
      </div>
      {open && <div style={{ padding: "4px 10px 12px" }}><PieceEditor unit={unit} piece={piece} onChange={onChange} /></div>}
    </li>
  );
}

function TasksPanel({ unit, update }: { unit: Unit; update: (fn: (u: Unit) => Unit) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const setTask = (id: string, patch: Partial<Task>) => update((u) => ({ ...u, tasks: u.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const add = (kind: Task["kind"]) => {
    const n = unit.tasks.filter((t) => t.kind === kind).length + 1;
    const t: Task = { id: uid(), kind, code: kind === "Summative" ? `AT${n}` : `FT${n}`, name: "", parts: [{ id: uid(), name: "Part A" }], outcomes: [], weighting: "", setCycle: 1, dueCycle: unit.cycles, notificationUrl: "", rubricUrl: "" };
    update((u) => ({ ...u, tasks: [...u.tasks, t] }));
    setOpen(t.id);
  };
  const ats = unit.tasks.filter((t) => t.kind === "Summative");
  return (
    <section className="card">
      <div className="row">
        <h2 className="spacer">Assessment tasks</h2>
        <button className="small" onClick={() => add("Summative")}>+ Assessment task</button>
        <button className="small" onClick={() => add("Formative")}>+ Formative task</button>
      </div>
      {unit.tasks.length === 0 && <p className="muted">Add tasks whenever they come up. Pieces can then be linked to a task part.</p>}
      <ul className="plain" style={{ gap: 8 }}>
        {unit.tasks.map((t) => (
          <li key={t.id} style={{ border: "1px solid var(--line-soft)", borderRadius: 8 }}>
            <div className="row" style={{ padding: "8px 10px" }}>
              <span className="pill" style={{ background: t.kind === "Summative" ? "var(--navy)" : "var(--cerise)", color: "#fff" }}>{t.code}</span>
              <b className="spacer">{t.name || "Untitled task"}</b>
              <span className="muted">Set Cycle {t.setCycle} · due Cycle {t.dueCycle}{t.weighting ? ` · ${t.weighting}` : ""}</span>
              <button className="small" onClick={() => setOpen(open === t.id ? null : t.id)}>{open === t.id ? "Done" : "Edit"}</button>
            </div>
            {open === t.id && (
              <div className="grid-auto" style={{ padding: "4px 10px 12px" }}>
                <label className="field">Code<input value={t.code} onChange={(e) => setTask(t.id, { code: e.target.value })} /></label>
                <label className="field">Name<input value={t.name} onChange={(e) => setTask(t.id, { name: e.target.value })} /></label>
                <label className="field">Weighting<input value={t.weighting} onChange={(e) => setTask(t.id, { weighting: e.target.value })} placeholder="e.g. 30%" /></label>
                <label className="field">Set in cycle<input type="number" min={1} max={unit.cycles} value={t.setCycle} onChange={(e) => setTask(t.id, { setCycle: Number(e.target.value) })} /></label>
                <label className="field">Due in cycle<input type="number" min={1} max={unit.cycles} value={t.dueCycle} onChange={(e) => setTask(t.id, { dueCycle: Number(e.target.value) })} /></label>
                {t.kind === "Formative" && (
                  <label className="field">Rehearses
                    <select value={t.rehearses ?? ""} onChange={(e) => setTask(t.id, { rehearses: e.target.value || undefined })}>
                      <option value="">Choose an AT part…</option>
                      {ats.flatMap((a) => a.parts.map((p) => <option key={p.id} value={p.id}>{a.code} {p.name}</option>))}
                    </select>
                  </label>
                )}
                <label className="field">Notification link<input value={t.notificationUrl} onChange={(e) => setTask(t.id, { notificationUrl: e.target.value })} /></label>
                <label className="field">Rubric link<input value={t.rubricUrl} onChange={(e) => setTask(t.id, { rubricUrl: e.target.value })} /></label>
                <label className="field" style={{ gridColumn: "1 / -1" }}>Parts and sections (one per line)
                  <textarea rows={3} value={t.parts.map((p) => p.name).join("\n")} onChange={(e) => setTask(t.id, { parts: e.target.value.split("\n").map((name, i) => ({ id: t.parts[i]?.id ?? uid(), name })) })} />
                </label>
                <fieldset style={{ gridColumn: "1 / -1", border: "1px solid var(--line)", borderRadius: 6 }}>
                  <legend style={{ fontSize: 13, fontWeight: 700 }}>Outcomes assessed</legend>
                  <div className="row">
                    {unit.outcomes.map((o) => (
                      <label key={o} className="row" style={{ gap: 4, fontSize: 14 }}>
                        <input type="checkbox" style={{ width: "auto" }} checked={t.outcomes.includes(o)} onChange={() => setTask(t.id, { outcomes: t.outcomes.includes(o) ? t.outcomes.filter((x) => x !== o) : [...t.outcomes, o] })} /> {o}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div><button className="danger" onClick={() => confirm(`Delete ${t.code}?`) && update((u) => ({ ...u, tasks: u.tasks.filter((x) => x.id !== t.id) }))}>Delete task</button></div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
