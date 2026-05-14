"use client";

import { XCircle } from "lucide-react";

interface DocPreviewModalProps {
  url: string;
  onClose: () => void;
}

export function DocPreviewModal({ url, onClose }: DocPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-zinc-400 hover:text-white text-sm flex items-center gap-1"
        >
          <XCircle size={16} /> Fermer
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Document justificatif"
          className="w-full rounded-2xl border border-white/10 shadow-2xl"
        />
      </div>
    </div>
  );
}
