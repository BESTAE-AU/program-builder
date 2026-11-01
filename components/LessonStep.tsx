"use client";

import { useState } from "react";
import { askAI, download } from "@/lib/ai";
import { activityType, AREAS, CROSS_CURRICULUM, OUTCOMES, outcomeText, POINTS, pointOutcome } from "@/lib/frameworks";
import { EQUIPMENT } from "@/lib/frameworks/whs";
import { OUTCOMES_2019, POINTS_2019, point2019 } from "@/lib/frameworks/textiles2019";
import { getSlot, lessonCapabilities, levelName, lessonTitle, minutesFor, pieceColours, pieceLabel, slotOrder } from "@/lib/rules";
import { compassDocx, compassHtml, compassHtmlPage, compassPlan } from "@/lib/docx/compass";
import type { Level, Piece, Slot, Taught, Unit } from "@/lib/types";
import { LEVELS } from "@/lib/types";
import PieceEditor from "./PieceEditor";
import { buildSheet } from "@/lib/docx/sheet";

const SHEET_TYPES = ["demonstration", "worked-example"];

type Props = { unit: Unit; update: (fn: (u: Unit) => Unit) => void; lessonKey: string; openLesson: (k: string) => void; back: () => void };

const LEVEL_BG: Record<Level, string> = { supplementary: "#E8F6C4", substantial: "#FFDFB4", extensive: "#F5DADF", extension: "#DCD3E7", life_skills: "#D7EFE7" };

export default function LessonStep({ unit, update, lessonKey, openLesson, back }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const keys = Object.entries(unit.slots).filter(([k, s]) => !k.endsWith("hw") && s.pieceIds.length).map(([k]) => k).sort((a, b) => slotOrder(a) - slotOrder(b));
  const idx = keys.indexOf(lessonKey);
  const [cycle, lesson] = lessonKey.split("-").map(Number);
  const slot = getSlot(unit, lessonKey);
  const pieces = slot.pieceIds.map((id) => unit.pieces.find((p) => p.id === id)).filter(Boolean) as Piece[];
  const target = minutesFor(slot.stream, false);
  const used = pieces.reduce((a, p) => a + p.minutes, 0);
  const title = lessonTitle(unit, lessonKey);
  const unitCtx = { title: unit.title, year: unit.year, product: unit.product, notes: unit.aiNotes };

  const setSlot = (patch: Partial<Slot>) => update((u) => ({ ...u, slots: { ...u.slots, [lessonKey]: { ...getSlot(u, lessonKey), ...patch } } }));
  const setPiece = (p: Piece) => update((u) => ({ ...u, pieces: u.pieces.map((x) => (x.id === p.id ? p : x)) }));
  const move = (i: number, d: number) => {
    const ids = [...slot.pieceIds];
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setSlot({ pieceIds: ids });
  };

  const tailor = async (p: Piece) => {
    setBusy(p.id); setError("");
    try {
      const adj = await askAI<Record<Level, string>>({ action: "tailor", unit: unitCtx, lesson: title, piece: { title: p.title, area: p.area, activityTypeId: p.activityTypeId, minutes: p.minutes, label: pieceLabel(p, unit.tasks) } });
      setPiece({ ...p, adjustments: adj, tailored: true });
    } catch (e) { setError(e instanceof Error ? e.message : "Tailoring failed."); } finally { setBusy(null); }
  };

  const writeSteps = async () => {
    setBusy("steps"); setError("");
    try {
      const res = await askAI<{ activities: { steps: string[] }[] }>({
        action: "steps", unit: unitCtx, lesson: title, lessonType: slot.stream === "Prac" ? "practical, 45 min plus pack-up" : "theory, 50 min",
        pieces: pieces.map((p) => ({ title: p.title, area: p.area, activityTypeId: p.activityTypeId, minutes: p.minutes, label: pieceLabel(p, unit.tasks) })),
      });
      update((u) => ({ ...u, pieces: u.pieces.map((x) => { const i = slot.pieceIds.indexOf(x.id); return i >= 0 && res.activities[i] ? { ...x, steps: res.activities[i].steps } : x; }) }));
    } catch (e) { setError(e instanceof Error ? e.message : "Writing steps failed."); } finally { setBusy(null); }
  };

  const draftIntentions = async () => {
    setBusy("li"); setError("");
    try {
      const points = [...new Set(pieces.flatMap((p) => p.points))].filter((c) => POINTS[c]).map((c) => POINTS[c].text);
      const res = await askAI<{ intention: string; success: string[] }>({
        action: "intentions", unit: unitCtx, lesson: title, content: points,
        pieces: pieces.map((p) => ({ title: p.title, area: p.area, activityTypeId: p.activityTypeId, minutes: p.minutes, label: pieceLabel(p, unit.tasks) })),
      });
      setSlot({ intention: res.intention, success: res.success.join("\n") });
    } catch (e) { setError(e instanceof Error ? e.message : "Drafting failed."); } finally { setBusy(null); }
  };

  const draftSheet = async (p: Piece) => {
    setBusy(`sheet-${p.id}`); setError("");
    try {
      const res = await askAI<NonNullable<Piece["sheet"]>>({ action: "sheet", unit: unitCtx, piece: { title: p.title, area: p.area, activityTypeId: p.activityTypeId, minutes: p.minutes, label: pieceLabel(p, unit.tasks) } });
      setPiece({ ...p, sheet: res });
    } catch (e) { setError(e instanceof Error ? e.message : "Drafting failed."); } finally { setBusy(null); }
  };

  const plan = compassPlan(unit, cycle, lesson);
  const fileBase = `Unit${unit.unitNumber}_C${cycle}L${lesson}_${(slot.title || title).replace(/[^\w]+/g, "-").slice(0, 40)}`;

  if (!pieces.length)
    return (
      <div className="page narrow">
        <button onClick={back}>← Back to grid</button>
        <p>Cycle {cycle}, lesson {lesson} has no pieces yet. Place pieces on the grid first.</p>
        {keys.length > 0 && <div><button className="primary" onClick={() => openLesson(keys[0])}>Open the first planned lesson</button></div>}
      </div>
    );

  const allOutcomes = [...new Set(pieces.flatMap((p) => p.outcomes))];
  const allPoints = [...new Set(pieces.flatMap((p) => p.points))];

  return (
    <div className="page">
      <div className="row">
        <button onClick={back}>← Back to grid</button>
        <span className="spacer" />
        <button disabled={idx <= 0} onClick={() => openLesson(keys[idx - 1])}>← Previous lesson</button>
        <button disabled={idx < 0 || idx >= keys.length - 1} onClick={() => openLesson(keys[idx + 1])}>Next lesson →</button>
      </div>

      <section className="card">
        <span style={{ fontSize: 13, fontWeight: 700 }}>{(slot.stream || "LESSON").toUpperCase()} · CYCLE {cycle} · LESSON {lesson} · {target} min{slot.stream === "Prac" ? " + 10 min pack-up" : ""}</span>
        <label className="field">Lesson title (Category – Content area, or your own wording)
          <input value={slot.title} placeholder={title} onChange={(e) => setSlot({ title: e.target.value })} list="areas" />
          <datalist id="areas">{AREAS.map((a) => <option key={a.label} value={a.label} />)}</datalist>
        </label>
        <div className="grid-auto">
          <label className="field">Stream
            <select value={slot.stream} onChange={(e) => setSlot({ stream: e.target.value as Slot["stream"] })}>
              <option>Theory</option><option>Design</option><option>Prac</option><option value="">Not set</option>
            </select>
          </label>
          <label className="field">Status
            <select value={slot.status} onChange={(e) => setSlot({ status: e.target.value as Slot["status"] })}>
              <option>planned</option><option>optional</option><option>at-risk</option><option>missed</option>
            </select>
          </label>
        </div>
        <label className="field">Teacher notes (never printed on the student page)
          <textarea rows={2} value={slot.notes} onChange={(e) => setSlot({ notes: e.target.value })} />
        </label>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      <section className="card">
        <div className="row">
          <h2 className="spacer">Learning intention and success criteria</h2>
          <button className="small primary" disabled={busy === "li"} onClick={draftIntentions}>{busy === "li" ? "Drafting…" : "Draft with AI"}</button>
        </div>
        <label className="field">Learning intention
          <input value={slot.intention} placeholder="We are learning to…" onChange={(e) => setSlot({ intention: e.target.value })} />
        </label>
        <label className="field">Success criteria (one per line)
          <textarea rows={3} value={slot.success} placeholder={"I can…\nI can…"} onChange={(e) => setSlot({ success: e.target.value })} />
        </label>
      </section>

      <div className="layout">
        <main>
          <section className="card">
            <div className="row">
              <h2 className="spacer">Learning sequence</h2>
              <b style={{ color: used === target ? "inherit" : "var(--cerise)" }}>{used} / {target} min</b>
              <button className="small primary" disabled={busy === "steps"} onClick={writeSteps}>{busy === "steps" ? "Writing…" : "Write student steps with AI"}</button>
            </div>
            {used !== target && <p className="notice warn">Compass plans need activities to total exactly {target} minutes ({slot.stream === "Prac" ? "practical: 45 plus pack-up" : "theory: 50"}). Adjust the minutes below.</p>}
            <ol className="plain" style={{ gap: 10 }}>
              {pieces.map((p, i) => {
                const c = pieceColours(p, unit.tasks);
                const at = activityType(p.activityTypeId);
                return (
                  <li key={p.id} style={{ border: "1px solid var(--line-soft)", borderRadius: 8, background: "#F7F8FA", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="row">
                      <b style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{i + 1}</b>
                      <span className="pill" style={{ background: c.bg, color: c.fg }}>{at?.name}</span>
                      <span className="label">{pieceLabel(p, unit.tasks)}</span>
                      <b className="spacer">{p.title}</b>
                      <label className="row" style={{ gap: 4, fontSize: 13 }}>
                        <input type="number" aria-label="Minutes" min={5} step={5} value={p.minutes} onChange={(e) => setPiece({ ...p, minutes: Number(e.target.value) || 0 })} style={{ width: 70 }} /> min
                      </label>
                      <button className="small" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                      <button className="small" aria-label="Move down" disabled={i === pieces.length - 1} onClick={() => move(i, 1)}>↓</button>
                      <button className="small" onClick={() => setEditing(editing === p.id ? null : p.id)}>{editing === p.id ? "Done" : "Edit"}</button>
                    </div>
                    {editing === p.id && <PieceEditor unit={unit} piece={p} onChange={setPiece} />}
                    <label className="field">Student steps (one per line)
                      <textarea rows={Math.max(2, p.steps.length)} value={p.steps.join("\n")} placeholder={at?.summary} onChange={(e) => setPiece({ ...p, steps: e.target.value.split("\n") })} />
                    </label>
                    {SHEET_TYPES.includes(p.activityTypeId) && (
                      <div style={{ borderTop: "1px dashed var(--line)", paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div className="row">
                          <b className="spacer" style={{ fontSize: 14 }}>Demonstration sheet</b>
                          <button className="small primary" disabled={busy === `sheet-${p.id}`} onClick={() => draftSheet(p)}>{busy === `sheet-${p.id}` ? "Drafting…" : p.sheet ? "Redraft with AI" : "Draft with AI"}</button>
                          {p.sheet && <button className="small" onClick={async () => download(await buildSheet(p, `Unit ${unit.unitNumber}: ${unit.title}`), `Demo-sheet_${p.title.replace(/[^\w]+/g, "-").slice(0, 40)}.docx`)}>Download sheet (.docx)</button>}
                        </div>
                        {p.sheet && (
                          <div className="grid-2" style={{ gap: 8 }}>
                            <label className="field">Steps with blanks (one per line)
                              <textarea rows={Math.max(3, p.sheet.steps.length)} value={p.sheet.steps.join("\n")} onChange={(e) => setPiece({ ...p, sheet: { ...p.sheet!, steps: e.target.value.split("\n") } })} />
                            </label>
                            <div>
                              <label className="field">Diagram labels (one per line)
                                <textarea rows={3} value={p.sheet.labels.join("\n")} onChange={(e) => setPiece({ ...p, sheet: { ...p.sheet!, labels: e.target.value.split("\n") } })} />
                              </label>
                              <label className="field">Word bank (comma separated)
                                <input value={p.sheet.keyWords.join(", ")} onChange={(e) => setPiece({ ...p, sheet: { ...p.sheet!, keyWords: e.target.value.split(/,\s*/) } })} />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="card">
            <h2>Adjustments by level</h2>
            {pieces.map((p) => (
              <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
                <div className="row">
                  <b className="spacer">{p.title}</b>
                  <span className="muted">{p.tailored ? "Tailored for this lesson" : `From the framework: ${activityType(p.activityTypeId)?.name}`}</span>
                  {p.tailored && <button className="small" onClick={() => setPiece({ ...p, tailored: false, adjustments: { ...activityType(p.activityTypeId)?.levels } })}>Use framework text</button>}
                  <button className="small primary" disabled={busy === p.id} onClick={() => tailor(p)}>{busy === p.id ? "Tailoring…" : "Tailor with AI"}</button>
                </div>
                <dl className="levels">
                  {LEVELS.filter((l) => l.key !== "life_skills").map((l) => (
                    <div key={l.key} style={{ display: "contents" }}>
                      <dt style={{ background: LEVEL_BG[l.key] }}>{levelName[l.key]}</dt>
                      <dd><textarea rows={2} aria-label={`${l.name} adjustment for ${p.title}`} value={p.adjustments[l.key] ?? ""} onChange={(e) => setPiece({ ...p, adjustments: { ...p.adjustments, [l.key]: e.target.value }, tailored: true })} /></dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <p className="muted">Life Skills: students follow the separate Life Skills program; the program says so in each lesson.</p>
            {unit.students.length > 0 && <p className="muted">On this program: {unit.students.map((s) => `${s.initials} – ${s.level}`).join(" · ")}</p>}
          </section>

          <section className="card">
            <h2>Resources</h2>
            <p className="muted">Named links, printed under this lesson&apos;s activities and on the Compass page.</p>
            {slot.resources.map((r, i) => (
              <div key={i} className="grid-auto" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr) auto", alignItems: "end" }}>
                <label className="field">Name<input value={r.name} placeholder="Construction workbooklet p.12 – Open seams" onChange={(e) => setSlot({ resources: slot.resources.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /></label>
                <label className="field">Link<input value={r.url} placeholder="https://…" onChange={(e) => setSlot({ resources: slot.resources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} /></label>
                <button className="ghost" onClick={() => setSlot({ resources: slot.resources.filter((_, j) => j !== i) })}>Remove</button>
              </div>
            ))}
            <div><button className="small" onClick={() => setSlot({ resources: [...slot.resources, { name: "", url: "" }] })}>+ Add resource</button></div>
          </section>

          <section className="card">
            <h2>WHS: equipment used</h2>
            <p className="muted">Hazards and controls come from the SCS TAS Safety Handbook (your ref-whs skill) and print in the program. Students must be assessed competent on each item first.</p>
            <div className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 6 }}>
              {EQUIPMENT.map((e) => {
                const on = slot.equipment.includes(e.id);
                const tooYoung = Number(unit.year.replace(/\D/g, "")) < e.fromYear;
                return (
                  <label key={e.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 6, fontSize: 14 }}>
                    <input type="checkbox" style={{ width: "auto" }} checked={on} onChange={() => setSlot({ equipment: on ? slot.equipment.filter((x) => x !== e.id) : [...slot.equipment, e.id] })} />
                    <span>{e.name}{tooYoung && <b style={{ color: "var(--cerise)" }}> (Year {e.fromYear}+)</b>}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="card">
            <div className="row">
              <h2 className="spacer">General capabilities</h2>
              <span className="muted">{slot.capabilities ? "Edited" : "From the framework's activity types"}</span>
              {slot.capabilities && <button className="small" onClick={() => setSlot({ capabilities: null })}>Use framework</button>}
            </div>
            <textarea rows={Math.max(2, lessonCapabilities(unit, lessonKey).length)} aria-label="General capabilities, one per line" value={lessonCapabilities(unit, lessonKey).join("\n")} onChange={(e) => setSlot({ capabilities: e.target.value.split("\n") })} />
            <h3>Cross-curriculum priorities <span className="muted">(only where the content calls for them)</span></h3>
            {CROSS_CURRICULUM.map((c) => {
              const on = slot.priorities.includes(c);
              return (
                <label key={c} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 6, fontSize: 14 }}>
                  <input type="checkbox" style={{ width: "auto" }} checked={on} onChange={() => setSlot({ priorities: on ? slot.priorities.filter((x) => x !== c) : [...slot.priorities, c] })} />
                  <span>{c}</span>
                </label>
              );
            })}
          </section>

          <section className="card" style={{ borderColor: "var(--navy)" }}>
            <h2>Register</h2>
            <p className="muted">Fill this in as you teach. It prints in the annotated register export.</p>
            <div className="grid-auto">
              <label className="field">Date taught<input type="date" value={slot.register.date} onChange={(e) => setSlot({ register: { ...slot.register, date: e.target.value } })} /></label>
              <label className="field">Taught?
                <select value={slot.register.taught} onChange={(e) => setSlot({ register: { ...slot.register, taught: e.target.value as Taught } })}>
                  <option value="">Not recorded</option><option value="taught">Taught</option><option value="partly">Partly taught</option><option value="not">Not taught</option>
                </select>
              </label>
            </div>
            <label className="field">Notes and variations
              <textarea rows={2} value={slot.register.notes} placeholder="What changed, what moved to next lesson, what to fix next time" onChange={(e) => setSlot({ register: { ...slot.register, notes: e.target.value } })} />
            </label>
          </section>
        </main>

        <aside>
          {unit.syllabusMode === "2019+2025" && (
            <section className="card tight" style={{ border: "2px solid var(--navy)" }}>
              <h2>2019 syllabus <span className="muted">(official until 2027, suggested, check)</span></h2>
              {OUTCOMES_2019.map((o) => {
                const on = pieces.some((p) => (p.outcomes2019 ?? []).includes(o.code));
                return (
                  <label key={o.code} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 6, alignItems: "start", fontSize: 14 }}>
                    <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={on}
                      onChange={() => update((u) => ({ ...u, pieces: u.pieces.map((x) => (slot.pieceIds.includes(x.id) ? { ...x, outcomes2019: on ? (x.outcomes2019 ?? []).filter((c) => c !== o.code) : x.id === slot.pieceIds[0] ? [...(x.outcomes2019 ?? []), o.code] : x.outcomes2019 } : x)) }))} />
                    <span><b>{o.code}</b> {on ? o.text : ""}</span>
                  </label>
                );
              })}
              <h3>Content</h3>
              {[...new Set(pieces.flatMap((p) => p.points2019 ?? []))].map(point2019).filter(Boolean).map((pt) => (
                <div key={pt!.code} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 6, fontSize: 14 }}>
                  <span><b>{pt!.area}:</b> {pt!.text} <span className="muted">({pt!.outcome})</span></span>
                  <button className="small ghost" aria-label={`Remove ${pt!.code}`} onClick={() => update((u) => ({ ...u, pieces: u.pieces.map((x) => (slot.pieceIds.includes(x.id) ? { ...x, points2019: (x.points2019 ?? []).filter((y) => y !== pt!.code) } : x)) }))}>×</button>
                </div>
              ))}
              <select aria-label="Add 2019 content" value="" onChange={(e) => { const code = e.target.value; if (code) update((u) => ({ ...u, pieces: u.pieces.map((x) => (x.id === slot.pieceIds[0] ? { ...x, points2019: [...new Set([...(x.points2019 ?? []), code])] } : x)) })); }}>
                <option value="">+ Add 2019 content…</option>
                {POINTS_2019.map((pt) => <option key={pt.code} value={pt.code}>{pt.area} – {pt.text}</option>)}
              </select>
            </section>
          )}
          <section className="card tight">
            <h2>Outcomes{unit.syllabusMode === "2019+2025" ? " 2025" : ""} <span className="muted">(suggested, check)</span></h2>
            {OUTCOMES.map((o) => {
              const on = allOutcomes.includes(o.code);
              return (
                <label key={o.code} style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 6, alignItems: "start", fontSize: 14 }}>
                  <input type="checkbox" style={{ width: "auto", marginTop: 3 }} checked={on}
                    onChange={() => update((u) => ({ ...u, pieces: u.pieces.map((x) => (slot.pieceIds.includes(x.id) ? { ...x, outcomes: on ? x.outcomes.filter((c) => c !== o.code) : x.id === slot.pieceIds[0] ? [...x.outcomes, o.code] : x.outcomes } : x)) }))} />
                  <span><b>{o.code}</b> {on ? outcomeText(o.code) : ""}</span>
                </label>
              );
            })}
          </section>
          <section className="card tight">
            <h2>Syllabus content{unit.syllabusMode === "2019+2025" ? " (2025)" : ""}</h2>
            {allPoints.length === 0 && <p className="muted">Choose a content area for each piece to suggest syllabus content.</p>}
            {allPoints.filter((c) => POINTS[c]).map((c) => (
              <div key={c} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "start", gap: 6, fontSize: 14 }}>
                <span><b>{c}</b> {POINTS[c].text} <span className="muted">({pointOutcome(c)})</span></span>
                <button className="small ghost" aria-label={`Remove ${c}`} onClick={() => update((u) => ({ ...u, pieces: u.pieces.map((x) => (slot.pieceIds.includes(x.id) ? { ...x, points: x.points.filter((y) => y !== c) } : x)) }))}>×</button>
              </div>
            ))}
          </section>
          <section className="card tight" style={{ background: "var(--panel)", border: 0 }}>
            <h2>Compass lesson plan</h2>
            {plan ? (
              <>
                <button className="primary" onClick={async () => download(await compassDocx([plan], fileBase), `${fileBase}.docx`)}>Download .docx</button>
                <button onClick={() => download(new Blob([compassHtmlPage([plan], fileBase)], { type: "text/html" }), `${fileBase}.html`)}>Download HTML</button>
                <button onClick={async () => { await navigator.clipboard.writeText(compassHtml(plan)); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "Copied" : "Copy HTML for Compass"}</button>
              </>
            ) : (
              <p className="muted">At-risk and missed lessons don&apos;t get a lesson plan.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
