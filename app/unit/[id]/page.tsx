"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { useUnit } from "@/lib/store";
import type { Unit } from "@/lib/types";
import SetupStep from "@/components/SetupStep";
import BankStep from "@/components/BankStep";
import GridStep from "@/components/GridStep";
import LessonStep from "@/components/LessonStep";
import ExportStep from "@/components/ExportStep";

const STEPS = [
  { key: "setup", name: "1 Setup" },
  { key: "bank", name: "2 Bank" },
  { key: "grid", name: "3 Grid" },
  { key: "lesson", name: "4 Lesson" },
  { key: "export", name: "5 Export" },
] as const;
export type StepKey = (typeof STEPS)[number]["key"];

function Builder() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { unit, loading, save } = useUnit(id);
  const step = (params.get("step") as StepKey) || "setup";
  const lesson = params.get("lesson") || "1-1";

  const go = useCallback(
    (next: StepKey, lessonKey?: string) => {
      const q = new URLSearchParams({ step: next });
      if (lessonKey) q.set("lesson", lessonKey);
      router.push(`/unit/${id}?${q}`);
    },
    [id, router],
  );
  const update = useCallback((fn: (u: Unit) => Unit) => unit && save(fn(unit)), [unit, save]);

  if (loading) return <p className="page">Loading…</p>;
  if (!unit)
    return (
      <div className="page">
        <p>This unit isn't saved in this browser.</p>
        <Link href="/">Back to your units</Link>
      </div>
    );

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <small><Link className="home" href="/">Unit Builder</Link></small>
          <b>Unit {unit.unitNumber}: {unit.title || "Untitled unit"}</b>
        </div>
        <nav className="steps" aria-label="Steps">
          {STEPS.map((s) => (
            <button key={s.key} aria-current={step === s.key ? "step" : undefined} onClick={() => go(s.key, s.key === "lesson" ? lesson : undefined)}>
              {s.name}
            </button>
          ))}
        </nav>
      </header>
      {step === "setup" && <SetupStep unit={unit} update={update} next={() => go("bank")} />}
      {step === "bank" && <BankStep unit={unit} update={update} next={() => go("grid")} />}
      {step === "grid" && <GridStep unit={unit} update={update} openLesson={(k) => go("lesson", k)} />}
      {step === "lesson" && <LessonStep unit={unit} update={update} lessonKey={lesson} openLesson={(k) => go("lesson", k)} back={() => go("grid")} />}
      {step === "export" && <ExportStep unit={unit} update={update} />}
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="page">Loading…</p>}>
      <Builder />
    </Suspense>
  );
}
