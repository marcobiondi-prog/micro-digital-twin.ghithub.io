import { useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

/** Independent squash-and-stretch jump preserves the mascot's ongoing happy animations. */
export function TwinMascot({ className = "" }: { className?: string }) {
  const pathname = useLocation({ select: (location) => location.pathname });
  const previousPath = useRef(pathname);
  const turnRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    const frame = turnRef.current;
    if (!frame || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounce = frame.animate(
      [
        { transform: "translateY(0) scale(1, 1)", transformOrigin: "50% 90%", offset: 0 },
        { transform: "translateY(1%) scale(1.16, 0.76)", transformOrigin: "50% 90%", offset: 0.2 },
        { transform: "translateY(-5%) scale(0.93, 1.1)", transformOrigin: "50% 90%", offset: 0.34 },
        { transform: "translateY(-12%) scale(1.02, 1.02)", transformOrigin: "50% 90%", offset: 0.5 },
        { transform: "translateY(-4%) scale(0.97, 1.04)", transformOrigin: "50% 90%", offset: 0.65 },
        { transform: "translateY(0) scale(1.1, 0.86)", transformOrigin: "50% 90%", offset: 0.78 },
        { transform: "translateY(-2%) scale(0.99, 1.03)", transformOrigin: "50% 90%", offset: 0.9 },
        { transform: "translateY(0) scale(1, 1)", transformOrigin: "50% 90%", offset: 1 },
      ],
      { duration: 1500, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
    );
    return () => bounce.cancel();
  }, [pathname]);

  return (
    <span className="twin-turn-stage block h-full w-full">
      <span ref={turnRef} className="twin-turn-frame block h-full w-full">
    <svg viewBox="0 0 512 452" className={`twin-mascot ${className}`} role="img" aria-label="Twin">
      <g className="twin-body-wrap">
        <g className="twin-antenna">
          <path d="M258 125 L262 72" stroke="#3aa99f" strokeWidth="9" strokeLinecap="round" />
          <circle cx="258" cy="48" r="19" fill="#f4fbf6" stroke="#b9dcc8" strokeWidth="8" className="twin-antenna-light" />
        </g>
        <g className="twin-arm twin-arm-left">
          <rect x="38" y="252" width="56" height="118" rx="28" fill="#3aa99f" transform="rotate(28 66 311)" />
        </g>
        <g className="twin-arm twin-arm-right">
          <rect x="418" y="252" width="56" height="118" rx="28" fill="#3aa99f" transform="rotate(-28 446 311)" />
        </g>
        <ellipse cx="256" cy="300" rx="160" ry="110" fill="#3aa99f" />
        <ellipse cx="256" cy="268" rx="162" ry="148" fill="#4cc9bd" />
        <rect x="143" y="176" width="228" height="140" rx="58" fill="#0f2326" stroke="#2c3e44" strokeWidth="6" />
        <g className="twin-eyes">
          <path d="M196 230 Q215 200 236 230 Q215 218 196 230 Z" fill="#fff" />
          <path d="M268 230 Q289 200 310 230 Q289 218 268 230 Z" fill="#fff" />
        </g>
        <ellipse className="twin-mouth" cx="255" cy="284" rx="30" ry="19" fill="#f2806f" />
        <ellipse cx="150" cy="343" rx="22" ry="13" fill="#f2a0a6" opacity=".9" />
        <ellipse cx="362" cy="343" rx="22" ry="13" fill="#f2a0a6" opacity=".9" />
      </g>
    </svg>
      </span>
    </span>
  );
}
