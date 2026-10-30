"use client";

import { useRef, useState } from "react";
import { download } from "@/lib/ai";
import { buildProgram } from "@/lib/docx/program";
import { buildPlanning } from "@/lib/docx/planning";
import { compassDocx, compassHtmlPage, compassPlan, type CompassPlan } from "@/lib/docx/compass";
import { sequenceWarnings } from "@/lib/rules";
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

  const program = () => run("program", async () => {
    const res = await fetch("/templates/program-template.docx");
    if (!res.ok) throw new Error("Couldn't load the program template. Refresh and try again.");
    download(await buildProgram(unit, await res.arrayBuffer()), `${base}_Program.docx`);
  });
  const planning = () => run("planning", async () => download(await buildPlanning(unit), `${base}_Brainstorm-and-Planning.docx`));
  const cyclePlans = () => Array.from({ length: unit.lessonsPerCycle }, (_, i) => compassPlan(unit, cycle, i + 1)).filter(Boolean) as CompassPlan[];
  const compass = (kind: "docx" | "html") => run(`compass-${kind}`, async () => {
    const plans = cyclePlans();
    if (!plans.length) throw new Error(`Cycle ${cycle} has no planned lessons.`);
    const name = `${base}_Cycle${cycle}_Compass`;
    if (kind === "docx") download(await compassDocx(plans, name), `${name}.docx`);
    else download(new Blob([compassHtmlPage(plans, name)], { type: "text/html" }), `${name}.html`);
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
        <section className="card">
          <h2>Program</h2>
          <p className="muted">Your new-syllabus program template: unit details, Diverse Learning, then one Core / Supported / Extension–Newman / Life Skills block per lesson, cycle by cycle.</p>
          <button className="primary" disabled={busy === "program"} onClick={program}>{busy === "program" ? "Building…" : "Download program (.docx)"}</button>
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
