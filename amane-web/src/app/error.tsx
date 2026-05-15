"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

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
    <div className="min-h-screen relative bg-zinc-950 text-zinc-50 overflow-hidden isolate flex items-center justify-center px-6">
      {/* Background layers */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(244,63,94,0.14), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOut }}
        className="relative z-10 text-center max-w-md"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 18,
            delay: 0.1,
          }}
          className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-rose-600/20 ring-1 ring-rose-500/30 flex items-center justify-center shadow-2xl shadow-rose-500/20 mb-6"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-3xl ring-2 ring-rose-500/30 animate-ping opacity-40"
          />
          <AlertTriangle
            size={36}
            className="text-rose-300 relative drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
            strokeWidth={2}
          />
        </motion.div>

        {/* Eyebrow */}
        <p className="text-rose-400 text-[10px] font-semibold uppercase tracking-[0.18em] mb-3">
          Erreur système
        </p>

        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight leading-tight">
          Une erreur est survenue<span className="text-rose-400">.</span>
        </h1>

        {/* Message */}
        <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
          {error.message ||
            "Erreur inattendue. Nos équipes ont été notifiées et travaillent à résoudre le problème."}
        </p>

        {/* Digest (debug) */}
        {error.digest && (
          <p className="mt-3 inline-block rounded-md bg-white/[0.04] ring-1 ring-white/10 px-2 py-1 text-[10px] font-mono text-zinc-500">
            ref · {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] ring-1 ring-white/10 hover:ring-white/20 px-4 py-2.5 text-sm text-zinc-300 hover:text-zinc-100 transition-all"
          >
            <ArrowLeft size={14} />
            Accueil
          </Link>
          <motion.button
            onClick={reset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 hover:shadow-rose-500/40 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-shadow"
          >
            <RefreshCw
              size={14}
              strokeWidth={2.5}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
            Réessayer
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
