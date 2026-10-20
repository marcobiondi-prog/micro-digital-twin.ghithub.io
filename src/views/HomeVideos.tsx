// ============= Full file contents =============

import { useEffect, useRef, useState, type RefObject } from "react";
import { flushSync } from "react-dom";
import { Film, Play, Pause, Maximize, Volume2, VolumeX, X, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { syncAppOrientation } from "@/lib/ar-orientation";
// Static files served from public/videos (see public/videos/LEGGIMI.txt).
const promo = { url: "/videos/promo.mp4" };
const tutorial = { url: "/videos/tutorial.mp4" };
const promoPoster = { url: "/videos/promo.jpg" };
const tutorialPoster = { url: "/videos/tutorial.jpg" };
const promoWebm = { url: "/videos/promo.webm" };
const tutorialWebm = { url: "/videos/tutorial.webm" };

type VideoKind = "promo" | "tutorial";

type WebKitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };
type WebKitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type WebKitDocument = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> | void };

/** Request fullscreen on the mounted player, never its out-of-portal ancestor. */
function enterPlayerFullscreen(player: HTMLElement | null) {
  if (!player) return;
  const video = player.querySelector<WebKitVideo>("video");
  const nativeFullscreen = () => {
    try { video?.webkitEnterFullscreen?.(); } catch { /* Keep edge-to-edge playback. */ }
  };
  try {
    const target = player as WebKitElement;
    const request = target.requestFullscreen ?? target.webkitRequestFullscreen;
    if (!request) { nativeFullscreen(); return; }
    void Promise.resolve(request.call(target)).then(() => syncAppOrientation()).catch(nativeFullscreen);
  } catch { nativeFullscreen(); }
}

export function HomeVideos() {
  const [selected, setSelected] = useState<VideoKind | null>(null);
  // Phones (short side < 600 px) play edge-to-edge; tablets and desktops play inside the page.
  const [phone, setPhone] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<VideoKind | null>(null);
  // Fullscreen and the slide/dialog mount the player in different places, so the position carries over.
  const resumeRef = useRef<{ kind: VideoKind; time: number }>({ kind: "promo", time: 0 });
  // Tablet and desktop: the tutorial starts by itself inside the page, muted as browsers
  // require for autoplay. Phones never autoplay: the user picks a video and it opens fullscreen.
  useEffect(() => {
    const phoneLayout = Math.min(window.innerWidth, window.innerHeight) < 600;
    setPhone(phoneLayout);
    if (phoneLayout || new URLSearchParams(location.search).has("scenario")) return;
    selectedRef.current = "tutorial";
    resumeRef.current = { kind: "tutorial", time: 0 };
    setAutoStarted(true);
    setSelected("tutorial");
  }, []);
  const close = () => {
    const player = playerRef.current;
    // Hide footage before either fullscreen exit or portrait restoration can paint.
    if (player) player.hidden = true;
    selectedRef.current = null;
    setAutoStarted(false);
    // Reopening a closed video starts from the beginning again.
    resumeRef.current = { kind: resumeRef.current.kind, time: 0 };
    const doc = document as WebKitDocument;
    if (player && (doc.fullscreenElement ?? doc.webkitFullscreenElement) === player) {
      try { void Promise.resolve((doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc)).catch(() => {}); } catch { /* Already exited. */ }
    }
    flushSync(() => setSelected(null));
  };
  // Leaving fullscreen shrinks back to the slide/dialog; hosts that drop fullscreen instantly keep playing.
  useEffect(() => {
    const onChange = () => {
      const doc = document as WebKitDocument;
      const active = playerRef.current !== null && (doc.fullscreenElement ?? doc.webkitFullscreenElement) === playerRef.current;
      setFullscreen(active);
      if (active) void syncAppOrientation();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  const open = (kind: VideoKind) => {
    if (selectedRef.current === kind) {
      close();
      return;
    }
    selectedRef.current = kind;
    setAutoStarted(false);
    if (phone) {
      // Like the AI camera: edge-to-edge without browser fullscreen, so no
      // security banner and no system rotation; CSS draws the video landscape.
      document.documentElement.setAttribute("data-home-video", "");
      flushSync(() => setSelected(kind));
      return;
    }
    // Tablet/desktop: the video stays in its hero slide and never enters browser fullscreen.
    // Fullscreen happens only if the user taps the expand control inside the player.
    flushSync(() => setSelected(kind));
  };
  const desktopSlide = selected !== null && !phone;
  const inShell = desktopSlide;
  const modalOpen = selected !== null && !desktopSlide;
  useEffect(() => {
    if (!phone || selected === null) return;
    document.documentElement.setAttribute("data-home-video", "");
    return () => {
      document.documentElement.removeAttribute("data-home-video");
    };
  }, [phone, selected]);
  // Phone players already fill the screen; tablet/desktop offer browser fullscreen on request.
  const expand = phone ? undefined : () => enterPlayerFullscreen(playerRef.current);
  return <div className="home-videos">
    <div className="home-video-buttons flex flex-wrap items-center gap-2">
      <Button className="rounded-full" variant={selected === "tutorial" ? "default" : "outline"} aria-pressed={selected === "tutorial"} onClick={() => open("tutorial")}><Play />Video tutorial</Button>
      <Button className="rounded-full" variant={selected === "promo" ? "default" : "outline"} aria-pressed={selected === "promo"} onClick={() => open("promo")}><Film />Video promozionale</Button>
    </div>
    {inShell && selected && <section className="home-promo-slide" aria-label={selected === "tutorial" ? "Video tutorial" : "Video promozionale"}><VideoPlayer key={selected} playerRef={playerRef} kind={selected} autoStart={autoStarted} onClose={close} fullscreen={fullscreen} onExpand={expand} startAt={resumeRef.current.kind === selected ? resumeRef.current.time : 0} onProgress={(value) => { resumeRef.current = { kind: selected, time: value }; }} /></section>}
    <Dialog modal open={modalOpen} onOpenChange={(openState) => { if (!openState) close(); }}>
      <DialogContent className={`home-video-dialog ${phone ? "home-video-touch left-0 top-0 translate-x-0 translate-y-0" : ""}`} overlayClassName="home-video-overlay">
        <DialogTitle className="sr-only">{selected === "tutorial" ? "Video tutorial" : "Video promozionale"}</DialogTitle>
        <DialogDescription className="sr-only">MICRO DIGITAL TWIN</DialogDescription>
        {selected && !desktopSlide && <VideoPlayer key={selected} playerRef={playerRef} kind={selected} onClose={close} fullscreen={fullscreen} onExpand={expand} startAt={resumeRef.current.kind === selected ? resumeRef.current.time : 0} onProgress={(value) => { resumeRef.current = { kind: selected, time: value }; }} />}
      </DialogContent>
    </Dialog>
  </div>;
}

function VideoPlayer({ kind, onClose, fullscreen, onExpand, playerRef, startAt = 0, onProgress, autoStart = false }: { kind: VideoKind; autoStart?: boolean; onClose: () => void; fullscreen: boolean; onExpand?: (() => void) | undefined; playerRef: RefObject<HTMLDivElement | null>; startAt?: number; onProgress?: (time: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Autoplay without a user gesture is only allowed muted; the volume button turns sound on.
  const [muted, setMuted] = useState(autoStart);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [touch] = useState(() => typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const formatTime = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
  // Touch: controls auto-hide after 3s of playback, like YouTube fullscreen; a tap brings them back.
  useEffect(() => {
    if (!touch) return;
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (controlsVisible && playing) hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000);
    return () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); };
  }, [touch, controlsVisible, playing]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = autoStart;
    video.volume = 1;
    void video.play().catch(() => { setLoading(false); setPlaying(false); });
    return () => {
      video.pause();
    };
  }, []);
  const controlsHidden = touch && !controlsVisible;
  return <div ref={playerRef} className="home-video-player" data-kind={kind} data-paused={!playing && !loading ? "" : undefined} data-controls-hidden={controlsHidden ? "" : undefined}
    onTouchStart={(event) => {
      if ((event.target as HTMLElement).closest("button, input, .home-video-controls")) return;
      const point = event.touches[0];
      swipeStart.current = point ? { x: point.clientX, y: point.clientY } : null;
    }}
    onTouchCancel={() => { swipeStart.current = null; }}
    onTouchEnd={(event) => {
      const start = swipeStart.current;
      swipeStart.current = null;
      const end = event.changedTouches[0];
      if (!start || !end) return;
      const dx = end.clientX - start.x, dy = end.clientY - start.y;
      const sideways = document.documentElement.hasAttribute("data-home-video") && window.innerHeight > window.innerWidth;
      if ((dy < -70 && Math.abs(dy) > Math.abs(dx) * 1.3) || (sideways && dx > 70 && Math.abs(dx) > Math.abs(dy) * 1.3)) onClose();
    }}>
    <div className="home-video-surface">
    <video ref={videoRef} poster={kind === "promo" ? promoPoster.url : tutorialPoster.url}
      playsInline muted={muted} preload="metadata"
      onClick={() => { if (touch) setControlsVisible((visible) => !visible); }}
      onLoadedMetadata={(event) => { if (startAt > 0) event.currentTarget.currentTime = startAt; }}
      onTimeUpdate={(event) => { setTime(event.currentTarget.currentTime); onProgress?.(event.currentTarget.currentTime); }}
      onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onLoadedData={() => { setLoading(false); setError(false); }} onWaiting={() => setLoading(true)}
      onPlaying={() => { setLoading(false); setError(false); setPlaying(true); }} onPause={() => setPlaying(false)}
      onError={() => { setLoading(false); setError(true); }} onEnded={onClose}>
      <source src={kind === "promo" ? promo.url : tutorial.url} type="video/mp4" />
      {/* With <source> children a missing file fires error on the last source, not on <video>. */}
      <source src={kind === "promo" ? promoWebm.url : tutorialWebm.url} type="video/webm" onError={() => { setLoading(false); setError(true); }} />
    </video>
    <div className="home-video-toolbar">
        <Button variant="ghost" size="icon" aria-label="Chiudi video" title="Chiudi video" onClick={onClose}><X /></Button>
    </div>
    <div className="home-video-controls">
        <Button variant="ghost" size="icon" disabled={error} aria-label={playing ? "Pausa" : "Riproduci"} title={playing ? "Pausa" : "Riproduci"} onClick={() => { const video = videoRef.current; if (!video) return; if (video.paused) void video.play().catch(() => {}); else video.pause(); }}>{playing ? <Pause /> : <Play />}</Button>
        <span className="home-video-time">{formatTime(time)} / {formatTime(duration)}</span>
        <input className="home-video-seek" type="range" aria-label="Avanzamento video" min={0} max={duration || 1} step={0.1} value={time} disabled={!duration} onChange={(event) => { const video = videoRef.current; if (!video) return; video.currentTime = Number(event.target.value); setTime(video.currentTime); }} />
        <Button variant="ghost" size="icon" aria-label={muted ? "Attiva audio" : "Disattiva audio"} title={muted ? "Attiva audio" : "Disattiva audio"} onClick={() => setMuted(!muted)}>{muted ? <VolumeX /> : <Volume2 />}</Button>
        {!fullscreen && onExpand && <Button variant="ghost" size="icon" aria-label="Espandi video" title="Espandi video" onClick={onExpand}><Maximize /></Button>}
    </div>
    {loading && !error && <div className="home-video-status" role="status"><LoaderCircle className="size-7 animate-spin motion-reduce:animate-none" /><span>Caricamento video…</span></div>}
    {error ? <div className="home-video-status" role="alert"><span>Video non disponibile</span><Button variant="secondary" onClick={() => { setError(false); setLoading(true); videoRef.current?.load(); }}>Riprova</Button></div>
      : !playing && !loading && <Button className="home-video-play" size="lg" onClick={() => void videoRef.current?.play().catch(() => {})}><Play />Riproduci</Button>}
    </div>
  </div>;
}
