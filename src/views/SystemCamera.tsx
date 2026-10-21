import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { releaseSystemCamera } from "@/lib/system-camera";
import { CameraCloseGestures } from "@/views/CameraCloseGestures";
import { CameraCenterCapture } from "@/views/CameraCenterCapture";
import { CameraCaptureControl } from "@/views/CameraCaptureControl";
import { playCameraSound } from "@/lib/camera-sounds";

/** Live capture for hosts without native HTML capture, such as Windows tablets. */
export function SystemCamera({ mode, onCapture, onClose }: {
  mode: "photo" | "video" | null;
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const activeRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mode) return;
    let wasFullscreen = Boolean(document.fullscreenElement);
    const changed = () => {
      const fullscreen = Boolean(document.fullscreenElement);
      if (wasFullscreen && !fullscreen) onClose();
      wasFullscreen = fullscreen;
    };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, [mode, onClose]);

  useEffect(() => {
    if (!mode) releaseSystemCamera();
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    let cancelled = false;
    activeRef.current = true;
    setError("");
    setReady(false);
    setRecording(false);
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unavailable");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }, audio: mode === "video",
        });
        if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (!cancelled) setReady(true);
      } catch (cause) {
        if (cancelled) return;
        const name = cause instanceof DOMException ? cause.name : "";
        setError(name === "NotAllowedError"
          ? "Consenti l’accesso alla fotocamera nelle impostazioni del dispositivo o del browser."
          : "Fotocamera non disponibile. Apri l’app nel browser e riprova.");
      }
    }
    void start();
    return () => {
      cancelled = true;
      activeRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [mode]);

  function capture() {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!ready || !video || !stream) return;
    if (mode === "photo") {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context || !canvas.width || !canvas.height) return;
      context.drawImage(video, 0, 0);
      playCameraSound("shutter");
      canvas.toBlob((blob) => {
        if (!blob || !activeRef.current) return;
        onCapture(new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" }));
        onClose();
      }, "image/jpeg", 0.92);
      return;
    }
    if (recording) {
      recorderRef.current?.stop();
      playCameraSound("video-stop");
      setRecording(false);
      setReady(false);
      return;
    }
    try {
      if (typeof MediaRecorder === "undefined") throw new Error("unavailable");
      const mimeType = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = () => {
        if (!activeRef.current || !chunks.length) return;
        const type = recorder.mimeType || "video/webm";
        const extension = type.includes("mp4") ? "mp4" : "webm";
        onCapture(new File(chunks, `video-${Date.now()}.${extension}`, { type }));
        onClose();
      };
      recorder.onerror = () => { setError("Registrazione non riuscita. Riprova."); setRecording(false); };
      recorderRef.current = recorder;
      recorder.start(1000);
      playCameraSound("video-start");
      setRecording(true);
    } catch {
      setError("Questo browser non supporta la registrazione video. Usa un browser aggiornato.");
    }
  }

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => { if (!open) onClose(); }} modal>
      <DialogContent data-no-ui-click className="camera-hud inset-0 left-0 top-0 block h-dvh w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 bg-camera-surface p-0 text-camera-ink shadow-none duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none sm:max-h-none sm:overflow-hidden sm:rounded-none [&>button]:hidden" aria-describedby={undefined}>
        <DialogTitle className="sr-only">{mode === "video" ? "Registra video" : "Scatta foto"}</DialogTitle>
        <CameraCloseGestures onClose={onClose}>
        <div className="absolute inset-0">
          <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          {!ready && !error && <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground" role="status">Apertura fotocamera…</p>}
        </div>
        {error && <p role="alert" className="absolute inset-x-6 top-20 mx-auto max-w-lg rounded-md bg-background/90 p-4 text-center text-sm text-destructive">{error}</p>}
        <CameraCenterCapture onCapture={capture} disabled={!ready || !!error} label={mode === "photo" ? "Scatta foto" : recording ? "Termina e salva" : "Avvia registrazione"} />
        <div className="camera-topbar">
          <span className="camera-title"><Camera className="size-4" /> Fotocamera</span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Chiudi fotocamera" title="Chiudi fotocamera" className="camera-tool"><X /></Button>
        </div>
        <div className="camera-bottom">
          <CameraCaptureControl mode={mode ?? "photo"} recording={recording} disabled={!ready || !!error} onCapture={capture} />
        </div>
        </CameraCloseGestures>
      </DialogContent>
    </Dialog>
  );
}