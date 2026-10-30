"use client";

import { FOCUS_AREAS, OUTCOMES } from "@/lib/frameworks";
import type { Student, Unit } from "@/lib/types";
import { LEVELS } from "@/lib/types";

type Props = { unit: Unit; update: (fn: (u: Unit) => Unit) => void; next: () => void };

const FRAMEWORKS = ["Textiles Framework", "Activities & Tasks Framework", "General Capabilities Map", "TAS Skills & Content Continuum"];

export default function SetupStep({ unit, update, next }: Props) {
  const set = <K extends keyof Unit>(k: K, v: Unit[K]) => update((u) => ({ ...u, [k]: v }));
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const setStudent = (i: number, patch: Partial<Student>) =>
    set("students", unit.students.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="page narrow">
      <div>
        <h1>Set up the unit</h1>
        <p className="lede">What the unit is, what students make, and how many classes you have. The builder page is created from this.</p>
      </div>

      <section className="card">
        <h2>The unit</h2>
        <div className="grid-auto">
          <label className="field">Course
            <select value={unit.course} onChange={(e) => set("course", e.target.value)}>
              <option>Textiles Technology 7–10 (2025)</option>
            </select>
          </label>
          <label className="field">Year
            <select value={unit.year} onChange={(e) => update((u) => ({ ...u, year: e.target.value, stage: e.target.value === "Year 7" || e.target.value === "Year 8" ? "Stage 4" : "Stage 5" }))}>
              {["Year 7", "Year 8", "Year 9", "Year 10"].map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
          <label className="field">Calendar year
            <input value={unit.calendarYear} onChange={(e) => set("calendarYear", e.target.value)} />
          </label>
          <label className="field">Unit number
            <input value={unit.unitNumber} onChange={(e) => set("unitNumber", e.target.value)} />
          </label>
          <label className="field">Unit title
            <input value={unit.title} onChange={(e) => set("title", e.target.value)} />
          </label>
        </div>
        {unit.stage === "Stage 4" && <p className="muted">TT4-ADJ-01: in Stage 4 teachers may adjust the Stage 5 outcomes as appropriate to the needs of students in Years 7 and 8.</p>}
        <label className="field">What students make
          <textarea rows={2} value={unit.product} onChange={(e) => set("product", e.target.value)} />
        </label>
        <label className="field">Unit overview (goes into the program)
          <textarea rows={3} value={unit.overview} onChange={(e) => set("overview", e.target.value)} />
        </label>
        <label className="field">Prior knowledge (what students bring from earlier units or Technology 7–8, one per line)
          <textarea rows={3} value={unit.priorKnowledge} onChange={(e) => set("priorKnowledge", e.target.value)} />
        </label>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Focus areas</h2>
          {FOCUS_AREAS.map((f) => (
            <button key={f.name} className="toggle" aria-pressed={unit.focusAreas.includes(f.name)} onClick={() => set("focusAreas", toggle(unit.focusAreas, f.name))}>
              {unit.focusAreas.includes(f.name) ? "☑" : "☐"} {f.name}
            </button>
          ))}
        </section>
        <section className="card">
          <h2>Outcomes</h2>
          {OUTCOMES.map((o) => (
            <button key={o.code} className="toggle" aria-pressed={unit.outcomes.includes(o.code)} onClick={() => set("outcomes", OUTCOMES.map((x) => x.code).filter((c) => c === o.code ? !unit.outcomes.includes(c) : unit.outcomes.includes(c)))}>
              <b>{unit.outcomes.includes(o.code) ? "☑" : "☐"} {o.code}</b> <span>{o.text}</span>
            </button>
          ))}
        </section>
      </div>

      <section className="card">
        <h2>Timeline</h2>
        <div className="row" style={{ gap: 24, alignItems: "flex-end" }}>
          <Stepper label="Cycles in the unit" value={unit.cycles} onChange={(v) => set("cycles", v)} />
          <Stepper label="Lessons per cycle" value={unit.lessonsPerCycle} onChange={(v) => set("lessonsPerCycle", v)} />
          <div className="card tight" style={{ background: "var(--panel)", border: 0 }}>
            <span className="muted">Classes available</span>
            <b style={{ fontSize: 24 }}>{unit.cycles * unit.lessonsPerCycle}</b>
          </div>
          <label className="field" style={{ width: 170 }}>Course indicative hours
            <input type="number" min={0} value={unit.courseHours} onChange={(e) => set("courseHours", Number(e.target.value) || 0)} />
          </label>
          <label className="field" style={{ width: 170 }}>Hours before this unit
            <input type="number" min={0} value={unit.priorHours} onChange={(e) => set("priorHours", Number(e.target.value) || 0)} />
          </label>
          <p className="muted" style={{ maxWidth: "46ch" }}>Each lesson counts as 1 hour. A cycle is two weeks. You choose each lesson&apos;s stream (Theory, Design, Prac) on the grid. Homework is one block per cycle, plus unfinished class work.</p>
        </div>
      </section>

      <section className="card">
        <h2>Frameworks to draw on</h2>
        <div className="row">
          {FRAMEWORKS.map((f) => (
            <button key={f} className="toggle" style={{ width: "auto" }} aria-pressed={unit.frameworks.includes(f)} onClick={() => set("frameworks", toggle(unit.frameworks, f))}>
              {unit.frameworks.includes(f) ? "☑" : "☐"} {f}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Diverse learning</h2>
        <p className="muted">Initials and NCCD level only. These fill the Diverse Learning table in the program.</p>
        <label className="field">Link to the student adjustments document
          <input value={unit.diverseLink} onChange={(e) => set("diverseLink", e.target.value)} placeholder="https://…" />
        </label>
        <ul className="plain">
          {unit.students.map((s, i) => (
            <li key={i} className="row">
              <label className="field" style={{ width: 120 }}>Initials
                <input value={s.initials} onChange={(e) => setStudent(i, { initials: e.target.value.toUpperCase().slice(0, 6) })} />
              </label>
              <label className="field" style={{ width: 220 }}>Level
                <select value={s.level} onChange={(e) => setStudent(i, { level: e.target.value as Student["level"] })}>
                  <option value="qdtp">QDTP</option>
                  {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.name}</option>)}
                  <option value="2e">Twice Exceptional (2E)</option>
                </select>
              </label>
              <button className="ghost" style={{ alignSelf: "flex-end" }} onClick={() => set("students", unit.students.filter((_, j) => j !== i))}>Remove</button>
            </li>
          ))}
        </ul>
        <div><button onClick={() => set("students", [...unit.students, { initials: "", level: "supplementary" }])}>+ Add student</button></div>
      </section>

      <section className="card">
        <h2>Resources and case study</h2>
        <table className="simple">
          <thead><tr><th>Resource</th><th>Used in</th><th>What it holds</th><th></th></tr></thead>
          <tbody>
            {unit.resources.map((r, i) => (
              <tr key={i}>
                {(["name", "used", "holds"] as const).map((k) => (
                  <td key={k}><input aria-label={k} value={r[k]} onChange={(e) => set("resources", unit.resources.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} /></td>
                ))}
                <td><button className="ghost" onClick={() => set("resources", unit.resources.filter((_, j) => j !== i))}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div><button onClick={() => set("resources", [...unit.resources, { name: "", used: "", holds: "" }])}>+ Add resource</button></div>
        <label className="field">Class case study
          <textarea rows={2} value={unit.caseStudy} onChange={(e) => set("caseStudy", e.target.value)} />
        </label>
        <label className="field">Topics or brands students choose from (one per line)
          <textarea rows={4} value={unit.brands.map((b) => b.name).join("\n")} onChange={(e) => set("brands", e.target.value.split("\n").map((name, i) => ({ name, student: unit.brands[i]?.student ?? "" })))} />
        </label>
      </section>

      <section className="card">
        <h2>Notes for the AI</h2>
        <label className="field">Class, resources and anything that should shape AI suggestions
          <textarea rows={3} value={unit.aiNotes} onChange={(e) => set("aiNotes", e.target.value)} />
        </label>
      </section>

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="primary" onClick={next}>Next: fill the bank →</button>
      </div>
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      <div className="row">
        <button aria-label={`Fewer: ${label}`} onClick={() => onChange(Math.max(1, value - 1))} style={{ width: 44 }}>−</button>
        <b style={{ minWidth: 40, textAlign: "center", fontSize: 24 }}>{value}</b>
        <button aria-label={`More: ${label}`} onClick={() => onChange(value + 1)} style={{ width: 44 }}>+</button>
      </div>
    </div>
  );
}
