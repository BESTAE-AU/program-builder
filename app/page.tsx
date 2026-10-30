"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUnits } from "@/lib/store";
import { sampleUnit } from "@/lib/sample-unit";
import { newUnit } from "@/lib/types";

export default function Home() {
  const { units, save, remove } = useUnits();
  const router = useRouter();

  const create = () => {
    const u = newUnit();
    save(u);
    router.push(`/unit/${u.id}`);
  };
  const addSample = () => save(sampleUnit());

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <small>Unit Builder</small>
          <b>Your units</b>
        </div>
      </header>
      <div className="page narrow">
        <div className="row">
          <div className="spacer">
            <h1>Units</h1>
            <p className="lede">Build a unit step by step: set it up, fill the bank, place pieces on the grid, then export the program, planning doc and Compass lesson plans.</p>
          </div>
          <button className="primary" onClick={create}>+ New unit</button>
        </div>
        {units === null ? (
          <p className="muted">Loading…</p>
        ) : units.length === 0 ? (
          <div className="card">
            <p>No units yet.</p>
            <div className="row">
              <button className="primary" onClick={create}>Start a new unit</button>
              <button onClick={addSample}>Load the Tote-ally Textiles example</button>
            </div>
          </div>
        ) : (
          <div className="grid-2">
            {units.map((u) => (
              <article key={u.id} className="card">
                <span className="muted">{u.course} · {u.year}</span>
                <h2>Unit {u.unitNumber}: {u.title || "Untitled unit"}</h2>
                <p className="muted">{u.cycles} cycles × {u.lessonsPerCycle} lessons · {u.pieces.length} pieces · updated {new Date(u.updatedAt).toLocaleDateString("en-AU")}</p>
                <div className="row">
                  <Link className="btn primary" href={`/unit/${u.id}`}>Open</Link>
                  <button className="danger" onClick={() => confirm(`Delete "${u.title || "Untitled unit"}"? This can't be undone.`) && remove(u.id)}>Delete unit</button>
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="muted">Units are saved in this browser. Use Export → Save a copy to keep a backup file.</p>
      </div>
    </>
  );
}
