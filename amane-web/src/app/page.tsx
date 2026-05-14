"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Camera,
  ChevronRight,
  Eye,
  Layers,
  LayoutDashboard,
  Lock,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { AnimatedGrid } from "@/components/landing/AnimatedGrid";
import { AnimatedNumber } from "@/components/landing/AnimatedNumber";
import { Reveal, RevealStagger, revealItemVariants } from "@/components/landing/Reveal";
import { Spotlight } from "@/components/landing/Spotlight";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function LandingPage() {
  return (
    <div className="bg-zinc-950 text-zinc-50 selection:bg-emerald-400/30 selection:text-emerald-100">
      <Navbar />
      <Hero />
      <Problem />
      <Process />
      <Features />
      <Stats />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// =====================================================================
// NAVBAR — sticky, transparent au top, solide sur scroll
// =====================================================================
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-zinc-950/60 border-b border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" strokeWidth={2.5} />
            <div className="absolute inset-0 rounded-xl bg-emerald-400/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
          </div>
          <span className="font-semibold text-lg tracking-tight">AMANE</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#problem" className="hover:text-zinc-100 transition-colors">Le défi</a>
          <a href="#process" className="hover:text-zinc-100 transition-colors">Comment ça marche</a>
          <a href="#features" className="hover:text-zinc-100 transition-colors">La plateforme</a>
        </nav>

        <Link
          href="/login"
          className="group relative inline-flex items-center gap-1.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 px-4 py-2 text-sm font-medium transition-colors"
        >
          Accéder au portail
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </header>
  );
}

// =====================================================================
// HERO — black, grid, spotlight, gradient text, mockup card animé
// =====================================================================
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden"
    >
      {/* Background layers */}
      <AnimatedGrid />
      <Spotlight color="rgba(16,185,129,0.18)" size={800} />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full"
      >
        <div className="max-w-4xl">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm px-3 py-1 text-xs text-zinc-400 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Plateforme de dépistage dermatologique assistée par IA
          </motion.div>

          {/* Headline — gradient + staggered reveal */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.95]">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
              className="block"
            >
              Le dépistage
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: easeOut }}
              className="block"
            >
              dermatologique
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.34, ease: easeOut }}
              className="block mt-2 bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent pb-2"
            >
              réinventé.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: easeOut }}
            className="mt-8 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed"
          >
            Une IA explicable. Un médecin spécialiste. Une chaîne humaine.
            Pour les zones les plus reculées du Maroc, là où chaque jour compte.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: easeOut }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 rounded-full bg-white text-zinc-950 px-6 py-3 font-medium hover:bg-zinc-100 transition-all hover:shadow-[0_8px_32px_rgba(255,255,255,0.15)]"
            >
              Accéder au portail
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <a
              href="#process"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/[0.03] px-6 py-3 text-zinc-300 font-medium transition-colors"
            >
              Découvrir le projet
              <ChevronRight size={16} />
            </a>
          </motion.div>
        </div>

        {/* Hero mockup card flottant — preview workspace médecin */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.9, ease: easeOut }}
          className="mt-20 relative max-w-5xl mx-auto"
        >
          <HeroMockup />
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative">
      {/* Glow derrière */}
      <div className="absolute -inset-x-20 -inset-y-12 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-violet-500/10 rounded-[40px] blur-3xl" />

      {/* Window frame */}
      <div className="relative rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl overflow-hidden shadow-[0_24px_120px_rgba(0,0,0,0.5)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <div className="flex-1 text-center text-xs text-zinc-500 font-mono">
            amane.ma / medecin / consultation
          </div>
        </div>

        {/* Content fake medecin workspace */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 p-4">
          {/* Image + heatmap */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-xl bg-gradient-to-br from-amber-900/30 via-orange-800/20 to-rose-900/30 overflow-hidden border border-white/10">
              <div
                className="absolute inset-8 rounded-full blur-md animate-pulse"
                style={{
                  background:
                    "radial-gradient(circle, rgba(244,63,94,0.5) 0%, rgba(244,63,94,0.2) 50%, transparent 100%)",
                }}
              />
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-zinc-950/80 backdrop-blur text-[10px] text-emerald-400 font-mono">
                Heatmap Grad-CAM
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <Sparkles size={12} className="text-emerald-400" />
                Analyse IA
              </div>
              <div className="text-base font-semibold text-zinc-100">
                Mélanome suspect
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "84%" }}
                    transition={{ duration: 1.5, delay: 1.4, ease: easeOut }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  />
                </div>
                <span className="text-xs text-zinc-400 tabular-nums">84%</span>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
                <ScanSearch size={12} /> SECOND AVIS GEMINI
              </div>
              <p className="text-xs text-zinc-300 italic leading-relaxed">
                &ldquo;Lésion brune asymétrique sur le bras gauche, bords irréguliers...&rdquo;
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
              <div className="text-xs text-zinc-500">Décision médecin</div>
              <div className="grid grid-cols-2 gap-1.5">
                {["Suivi", "Consultation", "Urgence", "Traitement"].map((d, i) => (
                  <div
                    key={d}
                    className={`text-[10px] rounded-md py-1.5 text-center border ${
                      i === 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "border-white/10 text-zinc-500"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// PROBLEM — stats marocaines (problem-aware storytelling)
// =====================================================================
function Problem() {
  return (
    <section id="problem" className="relative py-32 px-6 lg:px-10 max-w-7xl mx-auto">
      <Reveal>
        <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-4">
          Le défi
        </p>
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">
          Au Maroc rural, un mélanome non diagnostiqué peut tuer en silence.
        </h2>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
          Les patients en zones reculées attendent des semaines pour voir un dermatologue.
          Quand ils consultent, il est souvent trop tard.
        </p>
      </Reveal>

      <RevealStagger className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProblemStat
          value={1}
          suffix=" / 100k"
          label="dermatologue par habitant"
          desc="dans certaines régions du Maroc rural"
        />
        <ProblemStat
          value={70}
          suffix="%"
          label="diagnostiqués trop tard"
          desc="des mélanomes en zones reculées (estimation OMS)"
        />
        <ProblemStat
          value={250}
          suffix=" km"
          label="distance moyenne"
          desc="parcourue pour consulter un spécialiste"
        />
      </RevealStagger>
    </section>
  );
}

function ProblemStat({
  value, suffix, label, desc,
}: {
  value: number;
  suffix: string;
  label: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={revealItemVariants}
      className="group relative rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 p-7 transition-all"
    >
      <div className="text-5xl md:text-6xl font-semibold tracking-tight">
        <AnimatedNumber value={value} suffix={suffix} duration={1.8} />
      </div>
      <p className="mt-3 text-zinc-200 font-medium">{label}</p>
      <p className="mt-1 text-sm text-zinc-500">{desc}</p>
    </motion.div>
  );
}

// =====================================================================
// PROCESS — 3 étapes (Relais → IA → Médecin)
// =====================================================================
function Process() {
  return (
    <section id="process" className="relative py-32 px-6 lg:px-10 max-w-7xl mx-auto">
      <Reveal>
        <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-4">
          Comment ça marche
        </p>
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">
          Trois rôles. Une seule chaîne. Zéro décision automatique.
        </h2>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
          L&apos;IA ne décide jamais seule. Elle propose. Le médecin tranche. Tout est tracé.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <ProcessStep
          n="01"
          icon={<Camera size={24} strokeWidth={1.8} />}
          title="Capture terrain"
          desc="Le relais (instituteur, infirmier, pharmacien) photographie la lésion via l'app mobile et remplit les symptômes."
          delay={0}
          color="emerald"
        />
        <ProcessStep
          n="02"
          icon={<Sparkles size={24} strokeWidth={1.8} />}
          title="Analyse IA explicable"
          desc="Deux IA combinées : ResNet18 spécialisé sur 10 000 lésions + Gemini multimodal. Heatmap Grad-CAM pour expliquer."
          delay={0.15}
          color="blue"
        />
        <ProcessStep
          n="03"
          icon={<Stethoscope size={24} strokeWidth={1.8} />}
          title="Validation médicale"
          desc="Un dermatologue distant examine le cas, voit la heatmap, et tranche. Sa décision est immutable et tracée."
          delay={0.3}
          color="violet"
        />
      </div>
    </section>
  );
}

function ProcessStep({
  n, icon, title, desc, delay, color,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
  color: "emerald" | "blue" | "violet";
}) {
  const colorClasses = {
    emerald: "from-emerald-500/20 to-emerald-700/10 text-emerald-400 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-700/10 text-blue-400 border-blue-500/20",
    violet: "from-violet-500/20 to-violet-700/10 text-violet-400 border-violet-500/20",
  }[color];

  return (
    <Reveal delay={delay}>
      <div className="relative">
        <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${colorClasses} border flex items-center justify-center mx-auto z-10`}>
          {icon}
        </div>
        <div className="text-center mt-6">
          <span className="text-xs text-zinc-500 font-mono tracking-wider">{n}</span>
          <h3 className="mt-2 text-xl font-semibold text-zinc-100">{title}</h3>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

// =====================================================================
// FEATURES — bento grid
// =====================================================================
function Features() {
  return (
    <section id="features" className="relative py-32 px-6 lg:px-10 max-w-7xl mx-auto">
      <Reveal>
        <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-4">
          La plateforme
        </p>
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">
          Conçue pour la confiance.
        </h2>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
          Chaque détail technique est au service d&apos;un seul objectif : permettre à
          un médecin distant de prendre une décision juste, rapidement.
        </p>
      </Reveal>

      <RevealStagger className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(0,1fr)]">
        <FeatureCard
          className="md:col-span-2 lg:row-span-2"
          icon={<Eye />}
          title="Heatmap explicable"
          desc="Chaque diagnostic IA est accompagné d'une visualisation Grad-CAM. Le médecin voit exactement où l'IA a regardé pour prendre sa décision."
          highlight
        />
        <FeatureCard
          icon={<Layers />}
          title="Double IA"
          desc="ResNet18 spécialisé + Gemini multimodal. Si les deux ne sont pas d'accord, le médecin est alerté."
        />
        <FeatureCard
          icon={<Lock />}
          title="Anonymisation totale"
          desc="Aucun nom de patient stocké. Un identifiant unique anonyme par cas."
        />
        <FeatureCard
          icon={<Workflow />}
          title="Audit immutable"
          desc="Chaque action enregistrée dans un journal append-only. Traçabilité complète."
        />
        <FeatureCard
          icon={<Zap />}
          title="Temps réel"
          desc="Le médecin reçoit le cas dès l'upload du relais. Polling auto, latence sub-3s."
        />
      </RevealStagger>
    </section>
  );
}

function FeatureCard({
  icon, title, desc, className = "", highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      variants={revealItemVariants}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`group relative rounded-2xl border ${highlight ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.03] to-white/[0.02]" : "border-white/10 bg-white/[0.02]"} hover:border-white/20 p-7 overflow-hidden ${className}`}
    >
      {highlight && (
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      <div className="relative">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${highlight ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-zinc-300"}`}>
          {icon}
        </div>
        <h3 className="mt-5 text-lg font-semibold text-zinc-100">{title}</h3>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// =====================================================================
// STATS — projet
// =====================================================================
function Stats() {
  return (
    <section className="relative py-32 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto relative rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.05] via-zinc-900/80 to-blue-500/[0.05] backdrop-blur-sm overflow-hidden p-12 lg:p-20">
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid gap={24} dotColor="rgba(16,185,129,0.05)" />
        </div>
        <div className="relative">
          <Reveal>
            <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-4">
              Ce qu&apos;AMANE apporte
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-3xl">
              Des chiffres. Pas des promesses.
            </h2>
          </Reveal>

          <RevealStagger className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatBig value={87} suffix="%" label="Concordance IA / médecin" />
            <StatBig value={1200} suffix="+" label="Consultations traitées" />
            <StatBig value={2.8} suffix="s" label="Latence d'analyse" decimals={1} />
            <StatBig value={12} suffix=" / 12" label="Régions du Maroc couvertes" />
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}

function StatBig({
  value, suffix, label, decimals = 0,
}: {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}) {
  return (
    <motion.div variants={revealItemVariants}>
      <div className="text-5xl md:text-6xl font-semibold tracking-tight bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
        <AnimatedNumber value={value} suffix={suffix} decimals={decimals} duration={2} />
      </div>
      <p className="mt-3 text-sm text-zinc-400">{label}</p>
    </motion.div>
  );
}

// =====================================================================
// FINAL CTA — accès portail
// =====================================================================
function FinalCTA() {
  return (
    <section className="relative py-32 px-6 lg:px-10 max-w-7xl mx-auto">
      <Reveal>
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
            Prêt à examiner les{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              cas du jour ?
            </span>
          </h2>
          <p className="mt-6 text-lg text-zinc-400">
            Identifiez-vous selon votre profil pour accéder à votre portail dédié.
          </p>
        </div>
      </Reveal>

      <RevealStagger className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <CTACard
          icon={<Stethoscope size={28} className="text-emerald-400" />}
          title="Espace médecin"
          desc="File d'attente intelligente, workspace de validation, heatmap superposable, second avis Gemini."
          href="/login"
          accent="emerald"
        />
        <CTACard
          icon={<LayoutDashboard size={28} className="text-violet-400" />}
          title="Espace administrateur"
          desc="Vue d'ensemble, statistiques temps réel, carte du Maroc, journal d'audit complet."
          href="/login"
          accent="violet"
        />
      </RevealStagger>
    </section>
  );
}

function CTACard({
  icon, title, desc, href, accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  accent: "emerald" | "violet";
}) {
  const ringClass = accent === "emerald"
    ? "hover:ring-emerald-500/30"
    : "hover:ring-violet-500/30";
  const glowClass = accent === "emerald"
    ? "from-emerald-500/10"
    : "from-violet-500/10";

  return (
    <motion.div variants={revealItemVariants}>
      <Link
        href={href}
        className={`group relative block rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-7 transition-all hover:ring-2 ${ringClass} overflow-hidden`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${glowClass} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-zinc-100">{title}</h3>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{desc}</p>
          <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-200 group-hover:text-white">
            Se connecter
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// =====================================================================
// FOOTER — minimal
// =====================================================================
function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-10 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <ShieldCheck size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-medium text-sm">AMANE</span>
        </div>
        <p className="text-xs text-zinc-500">
          Plateforme de dépistage dermatologique &middot; Maroc
        </p>
      </div>
    </footer>
  );
}
