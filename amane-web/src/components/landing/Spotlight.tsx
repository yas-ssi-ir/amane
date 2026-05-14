"use client";

import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  /** Couleur du spotlight (rgba). Défaut : emerald 15% */
  color?: string;
  /** Taille du cercle en px */
  size?: number;
}

/**
 * Spotlight qui suit le curseur. À placer en absolute dans un parent relative.
 */
export function Spotlight({
  className = "",
  color = "rgba(16, 185, 129, 0.15)",
  size = 600,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId = 0;
    const handle = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const parent = el.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener("mousemove", handle);
    return () => {
      window.removeEventListener("mousemove", handle);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: `radial-gradient(${size}px circle at var(--mx, 50%) var(--my, 50%), ${color}, transparent 40%)`,
      }}
    />
  );
}
