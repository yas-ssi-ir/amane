"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertTriangle size={22} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Erreur de chargement</h2>
        <p className="text-sm text-zinc-400 mt-1">
          {error.message || "Une erreur inattendue est survenue."}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
