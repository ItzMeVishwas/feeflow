"use client";

import dynamic from "next/dynamic";

const FlowFieldLazy = dynamic(() => import("./flow-field"), { ssr: false });

export default FlowFieldLazy;
