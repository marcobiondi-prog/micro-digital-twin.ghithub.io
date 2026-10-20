import { useEffect, useRef } from "react";

/**
 * While `open`, the phone/browser back gesture closes the panel instead of
 * leaving the page: a same-URL history entry is pushed on open and consumed
 * on close.
 */
export function useBackClose(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    let popped = false;
    window.history.pushState({ ...(window.history.state ?? {}), __panel: true }, "");
    const onPop = () => {
      popped = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!popped && window.history.state?.__panel) window.history.back();
    };
  }, [open]);
}
