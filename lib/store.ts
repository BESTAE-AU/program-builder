"use client";
// Units are saved in this browser for now. Accounts and shared saving come when colleagues join.
import { useCallback, useEffect, useState } from "react";
import { sampleUnit } from "./sample-unit";
import type { Unit } from "./types";
import { normaliseUnit } from "./types";

const KEY = "unit-builder:units";

function readAll(): Unit[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (JSON.parse(raw) as Unit[]).map(normaliseUnit);
  } catch {}
  return [];
}

function writeAll(units: Unit[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(units));
  } catch {}
}

export function useUnits() {
  const [units, setUnits] = useState<Unit[] | null>(null);
  useEffect(() => {
    let all = readAll();
    if (!all.length) {
      all = [sampleUnit()];
      writeAll(all);
    }
    setUnits(all);
  }, []);
  const save = useCallback((u: Unit) => {
    setUnits((prev) => {
      const list = prev ?? [];
      const next = list.some((x) => x.id === u.id)
        ? list.map((x) => (x.id === u.id ? { ...u, updatedAt: new Date().toISOString() } : x))
        : [...list, u];
      writeAll(next);
      return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setUnits((prev) => {
      const next = (prev ?? []).filter((x) => x.id !== id);
      writeAll(next);
      return next;
    });
  }, []);
  return { units, save, remove };
}

export function useUnit(id: string) {
  const { units, save } = useUnits();
  const unit = units?.find((u) => u.id === id) ?? null;
  return { unit, loading: units === null, save };
}
