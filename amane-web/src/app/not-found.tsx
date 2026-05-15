import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
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
            "radial-gradient(closest-side, rgba(16,185,129,0.10), transparent)",
        }}
      />

      <div className="relative z-10 text-center max-w-md">
        {/* Huge 404 — silhouette */}
        <div className="relative">
          <p
            className="text-[140px] md:text-[180px] font-bold leading-none tabular-nums select-none bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
            }}
          >
            404
          </p>
          {/* Compass icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20 backdrop-blur-md">
              <Compass
                size={30}
                className="text-emerald-300"
                strokeWidth={2.2}
              />
            </div>
          </div>
        </div>

        {/* Eyebrow */}
        <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.18em] mt-2 mb-3">
          Page introuvable
        </p>

        {/* Title */}
        <h1 className="text-3xl font-semibold tracking-tight leading-tight">
          On dirait que vous êtes perdu
          <span className="text-emerald-400">.</span>
        </h1>

        {/* Message */}
        <p className="mt-3 text-zinc-400 text-sm leading-relaxed">
          La page que vous cherchez n&apos;existe pas, a été déplacée ou
          n&apos;est plus accessible.
        </p>

        {/* Action */}
        <div className="mt-7">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 hover:shadow-emerald-500/40 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/30 transition-shadow"
          >
            <ArrowLeft
              size={14}
              strokeWidth={2.5}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
