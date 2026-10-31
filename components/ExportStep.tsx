"use client";

import { useRef, useState } from "react";
import { askAI, download } from "@/lib/ai";
import { summariseResponses } from "@/lib/evaluation";
import { buildProgram } from "@/lib/docx/program";
import { buildPlanning } from "@/lib/docx/planning";
import { compassDocx, compassHtmlPage, compassPlan, type CompassPlan } from "@/lib/docx/compass";
import { getSlot, lessonTitle, sequenceWarnings } from "@/lib/rules";
import { slotKey } from "@/lib/types";
import type { Unit } from "@/lib/types";

type Props = { unit: Unit; update: (fn: (u: Unit) => Unit) => void };

export default function ExportStep({ unit, update }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cycle, setCycle] = useState(1);
  const file = useRef<HTMLInputElement>(null);
  const base = `Unit${unit.unitNumber}_${(unit.title || "Untitled").replace(/[^\w]+/g, "-")}`;
  const warnings = sequenceWarnings(unit);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Export failed."); } finally { setBusy(null); }
  };

  const program = (annotated: boolean) => run(annotated ? "register" : "program", async () => {
    const res = await fetch("/templates/program-template.docx");
    if (!res.ok) throw new Error("Couldn't load the program template. Refresh and try again.");
    download(await buildProgram(unit, await res.arrayBuffer(), annotated), `${base}_${annotated ? "Annotated-Register" : "Program"}.docx`);
  });
  const setRegister = (k: keyof Unit["register"], v: string) => update((u) => ({ ...u, register: { ...u.register, [k]: v } }));
  const taught = Object.entries(unit.slots).filter(([k, s]) => !k.endsWith("hw") && s.register?.taught).length;
  const planning = () => run("planning", async () => download(await buildPlanning(unit), `${base}_Brainstorm-and-Planning.docx`));
  const cyclePlans = () => Array.from({ length: unit.lessonsPerCycle }, (_, i) => compassPlan(unit, cycle, i + 1)).filter(Boolean) as CompassPlan[];
  const compass = (kind: "docx" | "html") => run(`compass-${kind}`, async () => {
    const plans = cyclePlans();
    if (!plans.length) throw new Error(`Cycle ${cycle} has no planned lessons.`);
    const name = `${base}_Cycle${cycle}_Compass`;
    if (kind === "docx") download(await compassDocx(plans, name), `${name}.docx`);
    else download(new Blob([compassHtmlPage(plans, name)], { type: "text/html" }), `${name}.html`);
  });

  const [evalTeacher, setEvalTeacher] = useState("");
  const [evalNote, setEvalNote] = useState("");
  const evalFile = useRef<HTMLInputElement>(null);
  const summariseEval = (f: File) => run("eval", async () => {
    setEvalNote("");
    const summary = summariseResponses(await f.text(), { course: unit.course, unit: unit.unitNumber, teacher: evalTeacher || undefined });
    if (!summary.responses) throw new Error(`No responses found for ${unit.course.split(" ")[0]} Unit ${unit.unitNumber}${evalTeacher ? ` with teacher "${evalTeacher}"` : ""}.`);
    const res = await askAI<{ summary: string; improvements: string[] }>({
      action: "evaluation", unit: { title: unit.title, year: unit.year, product: unit.product, notes: unit.aiNotes }, summary,
    });
    update((u) => ({
      ...u,
      register: {
        ...u.register,
        studentComments: `${res.summary}\n(${summary.responses} responses; overall rating ${summary.ratings["Overall rating"]}/5)`,
        improvements: [u.register.improvements, ...res.improvements].filter(Boolean).join("\n"),
      },
    }));
    setEvalNote(`Summarised ${summary.responses} responses into the register below. Check and edit it before exporting.`);
  });

  const outline = () => {
    const parts = [`Students make:\n${unit.product}`, `Tasks: ${unit.tasks.map((t) => `${t.code} ${t.name} (${t.parts.map((x) => x.name).join("; ")})`).join(" | ")}`];
    for (let c = 1; c <= unit.cycles; c++) {
      const titles: string[] = [];
      for (let l = 1; l <= unit.lessonsPerCycle; l++) {
        const k = slotKey(c, l), s = getSlot(unit, k);
        if (s.pieceIds.length && s.status !== "missed") titles.push(`${s.stream || "Lesson"}: ${lessonTitle(unit, k)} (${s.pieceIds.map((id) => unit.pieces.find((p) => p.id === id)?.title).filter(Boolean).join("; ")})`);
      }
      if (titles.length) parts.push(`Cycle ${c}: ${titles.join(" | ")}`);
    }
    return parts.join("\n");
  };
  const writeOverview = () => run("overview", async () => {
    const res = await askAI<{ overview: string }>({ action: "overview", unit: { title: unit.title, year: unit.year, product: unit.product, notes: unit.aiNotes }, outline: outline() });
    update((u) => ({ ...u, overview: res.overview }));
  });

  const writePedagogy = () => run("pedagogy", async () => {
    const res = await askAI<{ pedagogy: string }>({ action: "pedagogy", unit: { title: unit.title, year: unit.year, product: unit.product, notes: unit.aiNotes }, outline: outline() });
    update((u) => ({ ...u, pedagogy: res.pedagogy }));
  });

  const saveCopy = () => download(new Blob([JSON.stringify(unit, null, 2)], { type: "application/json" }), `${base}.unit.json`);
  const openCopy = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as Unit;
      if (!data.pieces || !data.slots) throw new Error();
      if (!confirm(`Replace this unit with "${data.title}" from ${f.name}?`)) return;
      update(() => ({ ...data, id: unit.id }));
    } catch {
      setError(`${f.name} isn't a saved unit file.`);
    }
  };

  return (
    <div className="page narrow">
      <div>
        <h1>Export</h1>
        <p className="lede">Download Word documents built from this unit. Check the grid&apos;s sequence warnings first.</p>
      </div>
      {warnings.length > 0 && <p className="notice warn">⚠ {warnings.length} sequence warning{warnings.length > 1 ? "s" : ""} on the grid. You can still export.</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <div className="grid-2">
        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="row">
            <h2 className="spacer">Unit overview</h2>
            <button className="small primary" disabled={busy === "overview"} onClick={writeOverview}>{busy === "overview" ? "Writing…" : unit.overview ? "Rewrite from the program" : "Write from the program"}</button>
          </div>
          <p className="muted">Written last, from the lessons, tasks and what students make. It goes at the top of the program. Edit it freely.</p>
          <textarea rows={5} aria-label="Unit overview" value={unit.overview} onChange={(e) => update((u) => ({ ...u, overview: e.target.value }))} />
        </section>
        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="row">
            <h2 className="spacer">Pedagogical approach</h2>
            <button className="small primary" disabled={busy === "pedagogy"} onClick={writePedagogy}>{busy === "pedagogy" ? "Writing…" : unit.pedagogy ? "Rewrite from the program" : "Write from the program"}</button>
          </div>
          <p className="muted">How the unit is taught and why, grounded in information processing and cognitive load theory, with references. Goes in the program&apos;s unit header.</p>
          <textarea rows={6} aria-label="Pedagogical approach" value={unit.pedagogy} onChange={(e) => update((u) => ({ ...u, pedagogy: e.target.value }))} />
        </section>
        <section className="card">
          <h2>Program</h2>
          <p className="muted">Your new-syllabus program template: unit details, Diverse Learning, then one Core / Supported / Extension–Newman / Life Skills block per lesson, cycle by cycle.</p>
          <button className="primary" disabled={busy === "program"} onClick={() => program(false)}>{busy === "program" ? "Building…" : "Download program (.docx)"}</button>
        </section>
        <section className="card">
          <h2>Annotated register</h2>
          <p className="muted">The program with each lesson&apos;s date taught, taught / partly / not taught, and notes, plus the register table below. Ready to upload to the school&apos;s register form. {taught} lessons recorded so far.</p>
          <button className="primary" disabled={busy === "register"} onClick={() => program(true)}>{busy === "register" ? "Building…" : "Download annotated register (.docx)"}</button>
        </section>
        <section className="card">
          <h2>Brainstorm &amp; Planning</h2>
          <p className="muted">Resources, the cycle × Theory / Homework / Design / Prac table, assessment timeline, case study and student allocations.</p>
          <button className="primary" disabled={busy === "planning"} onClick={planning}>{busy === "planning" ? "Building…" : "Download planning doc (.docx)"}</button>
        </section>
        <section className="card">
          <h2>Compass lesson plans</h2>
          <p className="muted">One page per lesson for a whole cycle. Single lessons are on the Lesson step.</p>
          <label className="field">Cycle
            <select value={cycle} onChange={(e) => setCycle(Number(e.target.value))}>
              {Array.from({ length: unit.cycles }, (_, i) => <option key={i} value={i + 1}>Cycle {i + 1} (weeks {2 * i + 1}–{2 * i + 2})</option>)}
            </select>
          </label>
          <div className="row">
            <button className="primary" disabled={busy === "compass-docx"} onClick={() => compass("docx")}>Download cycle (.docx)</button>
            <button disabled={busy === "compass-html"} onClick={() => compass("html")}>Download cycle (HTML)</button>
          </div>
        </section>
        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <h2>Register (end of program)</h2>
          <p className="muted">The school&apos;s register table, printed at the end of the program and the annotated register.</p>
          <div className="grid-2">
            {([
              ["teacherComments", "Teacher's comments"], ["studentComments", "Summary of student comments"],
              ["assessmentComments", "Assessment comments"], ["improvements", "Suggested improvements for course delivery"],
              ["newResources", "Additional / new resources"],
            ] as const).map(([k, label]) => (
              <label key={k} className="field">{label}<textarea rows={3} value={unit.register[k]} onChange={(e) => setRegister(k, e.target.value)} /></label>
            ))}
            <div className="grid-auto">
              <label className="field">Date commenced<input type="date" value={unit.register.dateCommenced} onChange={(e) => setRegister("dateCommenced", e.target.value)} /></label>
              <label className="field">Date completed<input type="date" value={unit.register.dateCompleted} onChange={(e) => setRegister("dateCompleted", e.target.value)} /></label>
              <label className="field">Signature (name)<input value={unit.register.signature} onChange={(e) => setRegister("signature", e.target.value)} /></label>
              <label className="field">Date signed<input type="date" value={unit.register.signDate} onChange={(e) => setRegister("signDate", e.target.value)} /></label>
            </div>
          </div>
        </section>
        <section className="card">
          <h2>Student unit evaluation</h2>
          <p className="muted">In the responses sheet, choose File → Download → CSV, then upload it here. Names and emails are removed in your browser before anything is summarised. The summary fills the register&apos;s student comments and suggested improvements.</p>
          <label className="field">Only responses for this teacher (optional)
            <input value={evalTeacher} placeholder="e.g. Staniforth" onChange={(e) => setEvalTeacher(e.target.value)} />
          </label>
          <div className="row">
            <button className="primary" disabled={busy === "eval"} onClick={() => evalFile.current?.click()}>{busy === "eval" ? "Summarising…" : "Upload responses (.csv)"}</button>
            <input ref={evalFile} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) summariseEval(f); }} />
          </div>
          {evalNote && <p className="notice ok">{evalNote}</p>}
        </section>
        <section className="card">
          <h2>Backup</h2>
          <p className="muted">Units are saved in this browser. Save a copy to keep a backup or move it to another computer.</p>
          <div className="row">
            <button onClick={saveCopy}>Save a copy</button>
            <button onClick={() => file.current?.click()}>Open a copy…</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && openCopy(e.target.files[0])} />
          </div>
        </section>
      </div>
    </div>
  );
}
