import { useEffect, useState, type ReactNode } from "react";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CameraCaptureControl({ mode, recording, disabled, onCapture, left, right, ar = false }: {
  mode: "photo" | "video"; recording: boolean; disabled: boolean; onCapture: () => void;
  left?: ReactNode; right?: ReactNode; ar?: boolean;
}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!recording) { setSeconds(0); return; }
    const started = Date.now();
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [recording]);
  const label = mode === "photo" ? `Scatta foto${ar ? " AR" : ""}` : recording ? "Termina e salva" : `Avvia registrazione${ar ? " AR" : ""}`;
  return <div className="camera-capture-dock" data-camera-controls>
    <div className="camera-capture-status" role="status" hidden={ar && !recording}>
      {recording ? <><span className="camera-rec-dot" />REC · {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</> : mode === "photo" ? "FOTO" : "VIDEO"}
    </div>
    <div className="camera-capture-row">
      <div className="camera-capture-side">{left}</div>
      <Button variant="ghost" size="icon" onClick={onCapture} disabled={disabled} aria-label={label} title={label}
        className="camera-shutter" data-recording={recording} data-mode={mode}>
        {recording ? <Square className="camera-stop" /> : <span className="camera-shutter-core" />}
      </Button>
      <div className="camera-capture-side">{right}</div>
    </div>
    {!ar && <span className="camera-capture-label">{mode === "photo" ? "Scatta" : recording ? "Termina e salva" : "Registra"}</span>}
  </div>;
}
