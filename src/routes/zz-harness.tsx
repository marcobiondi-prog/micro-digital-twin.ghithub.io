import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArCamera } from "@/views/ArCamera";

export const Route = createFileRoute("/zz-harness")({ component: Harness, ssr: false });

function Harness() {
  const [mode, setMode] = useState<"photo" | null>(null);
  return <>
    <button type="button" onClick={() => setMode("photo")}>Apri camera</button>
    <ArCamera mode={mode} kind="urban" context="Test" onCapture={() => {}} onClose={() => setMode(null)} onFallback={() => {}} />
  </>;
}
