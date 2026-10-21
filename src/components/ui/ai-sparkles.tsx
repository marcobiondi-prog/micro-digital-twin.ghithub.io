import { useId, type SVGProps } from "react";
import { cn } from "@/lib/utils";

/** Full-colour AI mark: the Sparkles shape filled with a blue → violet → pink gradient, legible in light and dark themes. */
export function AiSparkles({ className, ...props }: SVGProps<SVGSVGElement>) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-4 shrink-0", className)} {...props}>
      <defs>
        <linearGradient id={`${id}-g`} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="0.5" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id}-g)`} d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4M22 4h-4" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <circle cx="4" cy="20" r="2" fill="#06b6d4" />
    </svg>
  );
}
