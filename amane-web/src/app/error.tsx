"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-5xl font-bold text-red-400">!</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
        <p className="mt-2 text-zinc-400 text-sm">
          {error.message || "Erreur inattendue. Veuillez réessayer."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
