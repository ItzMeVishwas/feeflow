"use client";

import dynamic from "next/dynamic";
import type { AssistantOrbProps } from "./assistant-orb";

const SIZE = 80;

const AssistantOrb = dynamic(
  () => import("./assistant-orb").then((m) => m.AssistantOrb),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="rounded-full"
        style={{
          width: SIZE,
          height: SIZE,
          background:
            "radial-gradient(circle at 35% 30%, #F2A93B, #8B5CF6 55%, #3DD9A8 100%)",
        }}
      />
    ),
  },
);

export function AssistantOrbLazy(props: AssistantOrbProps) {
  return <AssistantOrb {...props} />;
}
