"use client";

import { motion } from "framer-motion";

import { easeOut } from "./constants";

export function ConcordanceGauge({ value }: { value: number }) {
  const radius = 70;
  const stroke = 12;
  const center = radius + stroke;
  const size = (radius + stroke) * 2;
  const arcLength = Math.PI * radius;
  const fillLength = (value / 100) * arcLength;
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#3b82f6" : value >= 40 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <path
          d={`M ${stroke} ${center} A ${radius} ${radius} 0 0 1 ${size - stroke} ${center}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${stroke} ${center} A ${radius} ${radius} 0 0 1 ${size - stroke} ${center}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: arcLength - fillLength }}
          transition={{ duration: 1.4, ease: easeOut }}
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <p className="text-2xl font-semibold text-zinc-100 tabular-nums">{value}%</p>
      </div>
    </div>
  );
}
