"use client"

import { useEffect, useState, type ReactNode } from "react"

import { SkeletonPage } from "@/components/skeleton-page"
import { useStore } from "@/lib/store"

// Shows a skeleton until the persisted store has loaded from localStorage.
// Starts as "not hydrated" on both the server and the first client render, so the
// HTML matches. The real state is read in an effect after mount.
export function HydrationGate({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Covers the case where hydration already finished before this effect ran.
    setHydrated(useStore.persist.hasHydrated())
    const unsubscribe = useStore.persist.onFinishHydration(() => setHydrated(true))
    return unsubscribe
  }, [])

  if (!hydrated) return <SkeletonPage />
  return <>{children}</>
}
