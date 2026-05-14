"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Layers, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

import { Slider } from "@/components/ui/slider";

interface Props {
  imageUrl?: string;
  heatmapUrl?: string;
}

export function HeatmapImage({ imageUrl, heatmapUrl }: Props) {
  const [opacity, setOpacity] = useState(85);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [zoom, setZoom] = useState(1);

  return (
    <div className="space-y-3">
      {/* Image container */}
      <div className="relative group aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 ring-1 ring-white/[0.04]">
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        >
          {imageUrl && (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          )}
          {showHeatmap && heatmapUrl && (
            <motion.img
              key={`heatmap-${showHeatmap}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: opacity / 100 }}
              transition={{ duration: 0.3 }}
              src={heatmapUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen"
            />
          )}
        </div>

        {/* Subtle vignette */}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5 rounded-2xl" />

        {/* Zoom indicator */}
        {zoom > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 px-2 py-1 rounded-md bg-zinc-950/80 backdrop-blur text-[10px] text-zinc-300 font-mono"
          >
            ×{zoom.toFixed(2)}
          </motion.div>
        )}
      </div>

      {/* Controls — heatmap */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center gap-3">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={[
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            showHeatmap
              ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30"
              : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10",
          ].join(" ")}
        >
          <Layers size={12} />
          {showHeatmap ? <Eye size={12} /> : <EyeOff size={12} />}
          Heatmap
        </button>
        <div className="flex-1">
          <Slider
            value={[opacity]}
            onValueChange={(v) => setOpacity(v[0])}
            max={100}
            step={5}
            disabled={!showHeatmap}
            className="cursor-pointer"
          />
        </div>
        <span className="text-xs text-zinc-500 w-10 text-right tabular-nums">{opacity}%</span>
      </div>

      {/* Controls — zoom */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setZoom(Math.max(1, zoom - 0.25))}
          disabled={zoom <= 1}
          className="rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed p-2 text-zinc-300 transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => setZoom(Math.min(3, zoom + 0.25))}
          disabled={zoom >= 3}
          className="rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed p-2 text-zinc-300 transition-colors"
        >
          <ZoomIn size={14} />
        </button>
        <span className="text-xs text-zinc-500 ml-2">Zoom : ×{zoom.toFixed(2)}</span>
      </div>
    </div>
  );
}
