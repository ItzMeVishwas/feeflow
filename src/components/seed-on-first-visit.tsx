"use client";

import { useEffect } from "react";
import { useStore } from "../lib/store";
import { seedDemoData } from "../lib/seed";

// Module-level guard: survives React strict-mode double effects, so seeding runs at most once per page load.
let hasSeeded = false;

function seedIfEmpty() {
  if (hasSeeded) return;

  const { students, invoices, bills } = useStore.getState();
  if (students.length === 0 && invoices.length === 0 && bills.length === 0) {
    hasSeeded = true;
    seedDemoData();
  }
}

// Renders nothing. Seeds demo data on first visit once localStorage state has loaded.
export default function SeedOnFirstVisit() {
  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      seedIfEmpty();
      return;
    }

    const unsubscribe = useStore.persist.onFinishHydration(() => seedIfEmpty());
    return () => unsubscribe();
  }, []);

  return null;
}
