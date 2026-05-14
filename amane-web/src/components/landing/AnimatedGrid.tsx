interface Props {
  className?: string;
  /** Espacement entre points en px (default 32) */
  gap?: number;
  /** Couleur des points (default rgba blanc 6%) */
  dotColor?: string;
  /** Active le mask radial pour fade des bords */
  mask?: boolean;
}

/** Grid de points minimal en arrière-plan (CSS pur, ultra léger). */
export function AnimatedGrid({
  className = "",
  gap = 32,
  dotColor = "rgba(255,255,255,0.06)",
  mask = true,
}: Props) {
  const maskStyle = mask
    ? {
        maskImage:
          "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, black 30%, transparent 80%)",
      }
    : {};
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
        backgroundSize: `${gap}px ${gap}px`,
        ...maskStyle,
      }}
    />
  );
}
