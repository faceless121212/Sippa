"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades its children up when they scroll into view. Content above the fold,
 * or with JS off, or with reduced motion, is never hidden.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      // Start just before the section scrolls in, so fast scrolling never lands on a blank screen.
      { rootMargin: "0px 0px 15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-reveal={state === "idle" ? undefined : state}>
      {children}
    </div>
  );
}
