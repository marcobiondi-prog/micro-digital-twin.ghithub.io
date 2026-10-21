import { Button } from "@/components/ui/button";
import { useTouchCenterCapture } from "@/lib/tablet-camera";

export function CameraCenterCapture({ onCapture, disabled, label, tabletOnly = false }: {
  onCapture: () => void; disabled: boolean; label: string; tabletOnly?: boolean;
}) {
  const enabled = useTouchCenterCapture(tabletOnly);
  if (!enabled) return null;
  return <Button variant="ghost" aria-label={`${label} al centro dello schermo`}
    data-camera-center-capture data-no-ui-click disabled={disabled} onClick={onCapture}
    className="absolute left-1/2 top-1/2 z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 touch-none rounded-none bg-transparent p-0 hover:bg-transparent active:bg-transparent"
  >
    <span aria-hidden="true" className="camera-viewfinder pointer-events-none relative size-10 text-camera-ink">
      <span className="absolute left-0 top-0 size-3 border-l-2 border-t-2 border-current" />
      <span className="absolute right-0 top-0 size-3 border-r-2 border-t-2 border-current" />
      <span className="absolute bottom-0 left-0 size-3 border-b-2 border-l-2 border-current" />
      <span className="absolute bottom-0 right-0 size-3 border-b-2 border-r-2 border-current" />
      <span className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
    </span>
    <span className="sr-only">{label}</span>
  </Button>;
}
