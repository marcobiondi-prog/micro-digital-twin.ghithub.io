import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { groundRegionAt, type GroundSurvey } from "@/models/ar-recognition";

import { select } from "d3-selection";
import { zoom, zoomIdentity, type D3ZoomEvent } from "d3-zoom";
import { fitArMapTransform, getArMapTransform, saveArMapTransform } from "@/lib/ar-map-viewport";

export function ArGroundMap({ image, survey, planting, points, onPlace, plantImage, scanPoint }: {
  image: string; survey: GroundSurvey; planting: boolean;
  points: { x: number; y: number }[]; onPlace: (x: number, y: number) => void;
  /** Ritaglio fotografico reale dell'ultima pianta scansionata, mostrato sui punti agganciati. */
  plantImage?: string | null;
  /** Punto in cui la pianta è stata rilevata nell'ultimo fotogramma, prima di qualsiasi posizionamento. */
  scanPoint?: { x: number; y: number } | null;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const viewport = viewportRef.current, content = contentRef.current;
    if (!viewport || !content) return;
    const selected = select(viewport);
    let restoring = false;
    const behavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.4, 1.5])
      .touchable(() => navigator.maxTouchPoints > 0 || "ontouchstart" in window)
      .clickDistance(6)
      .on("zoom", (event: D3ZoomEvent<HTMLDivElement, unknown>) => {
        const { x, y, k } = event.transform;
        content.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
        if (!restoring) saveArMapTransform({ x, y, k });
      });
    selected.call(behavior).on("dblclick.zoom", null);
    const restore = () => {
      const rect = viewport.getBoundingClientRect();
      const fitted = fitArMapTransform(getArMapTransform(), {
        left: rect.left, top: rect.top, width: content.offsetWidth, height: content.offsetHeight,
        viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
      });
      restoring = true;
      selected.call(behavior.transform, zoomIdentity.translate(fitted.x, fitted.y).scale(fitted.k));
      restoring = false;
    };
    restore();
    const observer = new ResizeObserver(restore);
    observer.observe(content);
    window.addEventListener("resize", restore);
    return () => { observer.disconnect(); window.removeEventListener("resize", restore); selected.on(".zoom", null); };
  }, []);
  const [imageRatio, setImageRatio] = useState(1);
  return <div ref={viewportRef} className="ar-ground-map-viewport" data-camera-controls data-camera-scroll
    onPointerDown={e => e.stopPropagation()} onPointerUp={e => e.stopPropagation()}
    onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
    <section ref={contentRef} className="ar-ground-map touch-none" aria-label="Mappa virtuale del terreno">
    <div className="ar-ground-map-handle">
      <Move className="size-3.5" aria-hidden="true" /><span>Mappa del terreno</span>
    </div>
    <div className="ar-ground-map-image">
      <div className="ar-ground-map-frame" style={{ "--map-image-ratio": imageRatio } as React.CSSProperties}>
      <img src={image} alt="Terreno dell’ultimo fotogramma analizzato" draggable={false}
        onLoad={(e) => { const img = e.currentTarget; if (img.naturalHeight > 0) setImageRatio(img.naturalWidth / img.naturalHeight); }} />
      <div className="ar-ground-map-cells">
        {Array.from({ length: 24 }, (_, i) => {
          const x = (i % 6 + 0.5) / 6, y = 0.48 + (Math.floor(i / 6) + 0.5) / 4 * 0.52;
          const region = groundRegionAt(survey, x, y);
          const occupied = points.some((p) => Math.abs(p.x - x) < 1 / 12 && Math.abs(p.y - y) < 0.52 / 8);
          return <Button key={i} variant="ghost" size="icon" className="ar-ground-cell" data-exposure={region?.exposure ?? "incerta"}
            disabled={!planting || !region?.plantable} onClick={() => onPlace(x, y)}
            aria-label={`${region?.label ?? "Terreno incerto"}, ${region?.exposure ?? "incerta"}, zona ${i + 1}`}>
            {occupied ? "●" : ""}
          </Button>;
        })}
      </div>
      {plantImage && points.map((p, i) => (
        <img key={i} src={plantImage} alt="" aria-hidden="true" draggable={false}
          className="ar-ground-plant" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />
      ))}
      {plantImage && points.length === 0 && scanPoint && (
        <img src={plantImage} alt="Pianta scansionata rilevata in questo punto" draggable={false}
          className="ar-ground-plant ar-ground-plant-scan" style={{ left: `${scanPoint.x * 100}%`, top: `${scanPoint.y * 100}%` }} />
      )}
      </div>
    </div>
    <p>Mappa del fotogramma · non in scala</p>
    <div className="ar-ground-legend"><span data-exposure="ombra">Ombra</span><span data-exposure="mista">Mista</span><span data-exposure="esposta">Esposta</span></div>
  </section></div>;
}
