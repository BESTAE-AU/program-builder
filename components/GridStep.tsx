"use client";

import { useRef, useState } from "react";
import { activityType } from "@/lib/frameworks";
import { coverage, coverage2019, getSlot, loadWarnings, spacedReview, hours, lessonCount, lessonTitle, minutesFor, pieceColours, pieceLabel, placedKey, placePiece, sequenceWarnings, unplacePiece } from "@/lib/rules";
import type { Piece, Slot, Status, Stream, Unit } from "@/lib/types";
import { slotKey, uid } from "@/lib/types";

type Props = { unit: Unit; update: (fn: (u: Unit) => Unit) => void; openLesson: (key: string) => void };

const STREAMS: Stream[] = ["Theory", "Design", "Prac", ""];
const STREAM_STYLE: Record<string, React.CSSProperties> = {
  Theory: { background: "#D9DDE5" }, Design: { background: "#FFF3C2" }, Prac: { background: "#001D3E", color: "#fff" }, "": { background: "#fff" },
};
const STATUSES: Status[] = ["planned", "optional", "at-risk", "missed"];

export default function GridStep({ unit, update, openLesson }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const dragging = useRef<string | null>(null);

  const place = (pieceId: string, key: string) => {
    update((u) => placePiece(u, pieceId, key));
    setSelected(null);
  };
  const setSlot = (key: string, patch: Partial<Slot>) =>
    update((u) => ({ ...u, slots: { ...u.slots, [key]: { ...getSlot(u, key), ...patch } } }));

  const bank = unit.pieces.filter((p) => !placedKey(unit, p.id));
  const warnings = sequenceWarnings(unit);
  const load = loadWarnings(unit);
  const review = spacedReview(unit).filter((r) => r.introduced < unit.cycles);
  const notRevisited = review.filter((r) => !r.revisited.length);
  const addReview = (area: string) => update((u) => {
    let item = u.items.find((i) => i.title === "Review and recall starters");
    const items = item ? u.items : [...u.items, (item = { id: uid(), kind: "theory" as const, title: "Review and recall starters", notes: "Spaced retrieval of earlier content." })];
    const piece = { id: uid(), itemId: item.id, title: `Recall: ${area}`, area: u.pieces.find((x) => x.area.startsWith(area + " – "))?.area ?? "", activityTypeId: "review-and-recall", verb: "", minutes: 5, outcomes: [], points: [], outcomes2019: [], points2019: [], adjustments: {}, tailored: false, steps: [], handIn: "NONE" as const };
    return { ...u, items, pieces: [...u.pieces, piece] };
  });
  const count = lessonCount(unit);
  const h = hours(unit);
  const cov = coverage(unit);
  const cov19 = unit.syllabusMode === "2019+2025" ? coverage2019(unit) : [];
  const max = Math.max(1, ...cov.map((c) => c.n));

  const chip = (p: Piece, inSlot: boolean) => {
    const c = pieceColours(p, unit.tasks);
    return (
      <li
        key={p.id}
        className="chip"
        draggable
        onDragStart={(e) => { dragging.current = p.id; e.dataTransfer.setData("text/plain", p.id); e.dataTransfer.effectAllowed = "move"; }}
        style={{ background: c.bg, color: c.fg }}
      >
        {!inSlot && <span aria-hidden="true">⠿</span>}
        <span style={{ flex: "1 1 auto", minWidth: 0 }}>
          <b>{p.title || "Untitled piece"}</b>
          <small>{inSlot ? "" : `${activityType(p.activityTypeId)?.name} · `}{pieceLabel(p, unit.tasks)} · {p.minutes}m</small>
        </span>
        {inSlot ? (
          <button className="x" aria-label={`Return ${p.title} to the bank`} onClick={() => update((u) => unplacePiece(u, p.id))}>×</button>
        ) : (
          <button className="small" aria-pressed={selected === p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
            style={{ minHeight: 32, background: selected === p.id ? "var(--yellow)" : "transparent", color: selected === p.id ? "var(--navy)" : "inherit", borderColor: "currentColor" }}>
            {selected === p.id ? "Selected" : "Select"}
          </button>
        )}
      </li>
    );
  };

  const slotView = (c: number, l: number | "hw") => {
    const key = slotKey(c, l);
    const hw = l === "hw";
    const s = getSlot(unit, key);
    const pieces = s.pieceIds.map((id) => unit.pieces.find((p) => p.id === id)).filter(Boolean) as Piece[];
    const avail = minutesFor(s.stream, hw);
    const used = pieces.reduce((a, p) => a + p.minutes, 0);
    const risk = s.status === "at-risk" || s.status === "missed";
    return (
      <div
        key={key}
        className={`slot${hw ? " hw" : ""}${risk ? " risk" : ""}${over === key ? " over-drop" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setOver(key); }}
        onDragLeave={() => setOver((o) => (o === key ? null : o))}
        onDrop={(e) => { e.preventDefault(); setOver(null); const id = dragging.current || e.dataTransfer.getData("text/plain"); if (id) place(id, key); dragging.current = null; }}
      >
        <div className="row" style={{ gap: 6 }}>
          {hw ? (
            <span className="stream" style={{ background: "#00B2A2" }}>Homework</span>
          ) : (
            <button className="stream" style={STREAM_STYLE[s.stream]} aria-label={`Stream: ${s.stream || "not set"}. Select to change.`}
              onClick={() => setSlot(key, { stream: STREAMS[(STREAMS.indexOf(s.stream) + 1) % STREAMS.length] })}>
              {s.stream || "—"}
            </button>
          )}
          <span className="muted spacer">{hw ? "Cycle block" : `Lesson ${l}`}{s.register.taught === "taught" ? " ✓" : s.register.taught === "partly" ? " ½" : ""}</span>
          {!hw && (
            <select aria-label={`Status of cycle ${c} lesson ${l}`} value={s.status} onChange={(e) => setSlot(key, { status: e.target.value as Status })}
              style={{ width: "auto", padding: "2px 4px", fontSize: 11, fontWeight: 700, background: risk ? "var(--yellow)" : "transparent", border: risk ? 0 : "1px solid var(--line)" }}>
              {STATUSES.map((x) => <option key={x}>{x}</option>)}
            </select>
          )}
        </div>
        {pieces.length > 0 && !hw && (
          <button className="title" onClick={() => openLesson(key)}>{lessonTitle(unit, key)}</button>
        )}
        <ul className="plain">{pieces.map((p) => chip(p, true))}</ul>
        {!pieces.length && !selected && <span className="muted">Drop pieces here</span>}
        {selected && (
          <button className="small" onClick={() => place(selected, key)} style={{ border: "2px dashed var(--navy)", background: "var(--note-bg)", fontWeight: 700 }}>Place here</button>
        )}
        <span className={`mins${used > avail ? " over" : ""}`}>{pieces.length ? `${used} / ${avail} min${used > avail ? " · over" : ""}` : `${avail} min free`}</span>
      </div>
    );
  };

  return (
    <div className="page">
      <div>
        <h1>Unit grid</h1>
        <p className="lede">Drag pieces from the bank into a lesson, or select a piece and choose <b>Place here</b>. Select a lesson&apos;s stream to change it, and its title to open the lesson.</p>
      </div>
      <div className="layout">
        <main>
          {Array.from({ length: unit.cycles }, (_, i) => i + 1).map((c) => (
            <section key={c} className="cycle">
              <h2>CYCLE {c} <span>Weeks {2 * c - 1}–{2 * c}</span></h2>
              <div className="slots">
                {Array.from({ length: unit.lessonsPerCycle }, (_, j) => slotView(c, j + 1))}
                {slotView(c, "hw")}
              </div>
            </section>
          ))}
        </main>

        <aside>
          <section className="card tight" style={{ border: "2px solid var(--navy)" }}>
            <div className="row"><h2 className="spacer">Bank</h2><span className="muted">{bank.length} to place</span></div>
            {bank.length === 0 ? <p className="muted">Everything is placed. Add more pieces in the Bank step.</p> : <ul className="plain" style={{ gap: 6 }}>{bank.map((p) => chip(p, false))}</ul>}
          </section>

          <section className="card tight">
            <h2>Lesson count</h2>
            <div className="grid-auto" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              <Stat n={count.planned} label="planned" /><Stat n={count.available} label="available" /><Stat n={count.risk} label="at risk or missed" warm />
            </div>
            <span className="muted">{count.available - count.planned - count.risk} lessons still empty.</span>
            <span style={{ fontSize: 14 }}>
              <b>Indicative hours:</b> {h.planned} planned · {h.taught} taught · {h.after} of {h.total} for the course after this unit
            </span>
          </section>

          <section className="card tight">
            <h2>Sequence check</h2>
            {warnings.length === 0 ? (
              <p className="notice ok">No problems. Skills come before they&apos;re assessed, safety comes first and every homework block is introduced.</p>
            ) : (
              warnings.map((w, i) => <p key={i} className="notice warn">⚠ {w.text}</p>)
            )}
          </section>

          <section className="card tight">
            <h2>Cognitive load check</h2>
            {load.length === 0 ? (
              <p className="notice ok">No load problems: demonstrations are chunked, new tools get their own lesson, and skills are practised before independent or assessed work.</p>
            ) : (
              load.map((w, i) => <p key={i} className="notice warn">⚠ {w.text}</p>)
            )}
          </section>

          <section className="card tight">
            <h2>Spaced review</h2>
            <span className="muted">{review.length - notRevisited.length} of {review.length} framework categories come back in a later cycle.</span>
            {notRevisited.slice(0, 12).map((r) => (
              <div key={r.area} className="row" style={{ gap: 6, fontSize: 13 }}>
                <span className="spacer">{r.area} <span className="muted">(Cycle {r.introduced} only)</span></span>
                <button className="small" onClick={() => addReview(r.area)}>+ Recall starter</button>
              </div>
            ))}
            {notRevisited.length > 12 && <span className="muted">and {notRevisited.length - 12} more.</span>}
            <span className="muted">A recall starter is a 5-minute Review and recall piece added to the bank, ready to drag into a later cycle.</span>
          </section>

          <section className="card tight">
            <h2>Assessment timeline</h2>
            <div className="scroll-x">
              <div style={{ display: "grid", gridTemplateColumns: `92px repeat(${unit.cycles}, minmax(22px, 1fr))`, gap: 3, fontSize: 11, alignItems: "center" }}>
                <span />
                {Array.from({ length: unit.cycles }, (_, i) => <b key={i} style={{ textAlign: "center" }}>C{i + 1}</b>)}
                {unit.tasks.map((t) => (
                  <Row key={t.id} name={`${t.code} ${t.name}`}>
                    {Array.from({ length: unit.cycles }, (_, i) => {
                      const c = i + 1, inside = c >= t.setCycle && c <= t.dueCycle;
                      return <span key={i} style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, borderRadius: 3, background: inside ? (t.kind === "Formative" ? "var(--cerise)" : "var(--navy)") : "var(--ground)", color: "#fff" }}>{c === t.setCycle ? "S" : c === t.dueCycle ? "D" : ""}</span>;
                    })}
                  </Row>
                ))}
              </div>
            </div>
            <span className="muted">S = set · D = due · shaded = worked on</span>
          </section>

          <section className="card tight">
            {cov19.length > 0 && (
              <>
                <h2>Outcome coverage: 2019</h2>
                {cov19.map((o) => (
                  <div key={o.code} style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 28px", gap: 8, alignItems: "center", fontSize: 12 }}>
                    <b>{o.code}</b>
                    <span style={{ height: 12, background: "var(--line-soft)", borderRadius: 6, overflow: "hidden" }}><span style={{ display: "block", height: 12, width: `${(o.n / Math.max(1, ...cov19.map((x) => x.n))) * 100}%`, background: "var(--cerise)" }} /></span>
                    <span style={{ textAlign: "right" }}>{o.n}</span>
                  </div>
                ))}
                {cov19.some((o) => !o.n) && <p className="muted">2019 not yet covered: {cov19.filter((o) => !o.n).map((o) => o.code).join(", ")}.</p>}
              </>
            )}
            <h2>Outcome coverage{cov19.length ? ": 2025" : ""}</h2>
            {cov.map((o) => (
              <div key={o.code} style={{ display: "grid", gridTemplateColumns: "92px minmax(0, 1fr) 28px", gap: 8, alignItems: "center", fontSize: 12 }}>
                <b>{o.code}</b>
                <span style={{ height: 12, background: "var(--line-soft)", borderRadius: 6, overflow: "hidden" }}><span style={{ display: "block", height: 12, width: `${(o.n / max) * 100}%`, background: "var(--navy)" }} /></span>
                <span style={{ textAlign: "right" }}>{o.n}</span>
              </div>
            ))}
            {cov.some((o) => !o.n) && <p className="muted">Not yet covered: {cov.filter((o) => !o.n).map((o) => o.code).join(", ")}.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ n, label, warm }: { n: number; label: string; warm?: boolean }) {
  return (
    <div style={{ background: warm ? "#FFF3C2" : "var(--panel)", borderRadius: 8, padding: 10 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{n}</div>
      <div style={{ fontSize: 12 }}>{label}</div>
    </div>
  );
}

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <>
      <span style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>{name}</span>
      {children}
    </>
  );
}
