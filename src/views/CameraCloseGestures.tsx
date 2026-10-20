import { useRef, type ReactNode } from "react";
import { isCameraCloseGesture } from "@/lib/ar-close-swipe";

/** Observe the preview itself rather than invisible edge strips. */
export function CameraCloseGestures({ onClose, children, rotation = 0 }: { onClose: () => void; children: ReactNode; rotation?: number }) {
  const startRef = useRef<{ id: number; x: number; y: number; top: number; height: number } | null>(null);
  const localPoint = (x: number, y: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    if (rotation === 90) return { x: y - rect.top, y: rect.right - x, height: rect.width };
    if (rotation === -90) return { x: rect.bottom - y, y: x - rect.left, height: rect.width };
    if (rotation === 180) return { x: rect.right - x, y: rect.bottom - y, height: rect.height };
    return { x: x - rect.left, y: y - rect.top, height: rect.height };
  };
  return <div className="absolute inset-0 touch-none" data-camera-gestures
    onPointerDownCapture={(event) => {
      const target = event.target;
      if (event.pointerType !== "touch" || !event.isPrimary || !(target instanceof Element) ||
        (target.closest("button, a, input, [data-camera-scroll], [data-camera-controls]") && !target.closest("[data-camera-center-capture]"))) {
        startRef.current = null;
        return;
      }
      const point = localPoint(event.clientX, event.clientY, event.currentTarget);
      startRef.current = { id: event.pointerId, x: point.x, y: point.y, top: 0, height: point.height };
    }}
    onPointerMoveCapture={(event) => {
      const start = startRef.current;
      if (!start || start.id !== event.pointerId) return;
      const point = localPoint(event.clientX, event.clientY, event.currentTarget);
      if (!isCameraCloseGesture(point.x - start.x, point.y - start.y, start.y - start.top, start.height)) return;
      startRef.current = null;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }}
    onPointerUpCapture={(event) => {
      const start = startRef.current;
      startRef.current = null;
      const point = localPoint(event.clientX, event.clientY, event.currentTarget);
      if (!start || start.id !== event.pointerId || !isCameraCloseGesture(point.x - start.x, point.y - start.y, start.y - start.top, start.height)) return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }}
    onPointerCancelCapture={() => { startRef.current = null; }}
  >{children}</div>;
}
