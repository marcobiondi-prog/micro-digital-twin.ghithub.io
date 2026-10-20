/** A capped preview loop; hidden pages do no composition or GPU rendering. */
export function startArFrameLoop(draw: () => void, clock: {
  request: (callback: FrameRequestCallback) => number;
  cancel: (id: number) => void;
  hidden: () => boolean;
  listen: (callback: () => void) => () => void;
}) {
  let frame: number | null = null;
  let last = -Infinity;
  let stopped = false;
  const tick = (time: number) => {
    frame = null;
    if (stopped || clock.hidden()) return;
    if (time - last >= 1000 / 30 - 0.5) {
      last = time;
      draw();
    }
    frame = clock.request(tick);
  };
  const sync = () => {
    if (frame !== null) clock.cancel(frame);
    frame = null;
    last = -Infinity;
    if (!stopped && !clock.hidden()) frame = clock.request(tick);
  };
  const unlisten = clock.listen(sync);
  sync();
  return () => {
    stopped = true;
    if (frame !== null) clock.cancel(frame);
    unlisten();
  };
}