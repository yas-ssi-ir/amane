"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  LayoutDashboard,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/auth-store";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import type { UserRole } from "@/lib/types";

type AccessRole = "medecin" | "admin";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [selectedRole, setSelectedRole] = useState<AccessRole | null>(null);

  useEffect(() => {
    if (!hydrated || !token || !user) return;
    if (user.role === "medecin") router.replace("/medecin");
    else if (user.role === "admin") router.replace("/admin");
  }, [hydrated, token, user, router]);

  return (
    <div className="min-h-screen relative bg-zinc-950 text-zinc-50 overflow-hidden isolate">
      {/* === Multi-layer background === */}
      {/* Layer 1 : dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
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
      {/* Layer 2 : ambient emerald glow (top-center) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[440px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(16,185,129,0.18), transparent)",
        }}
      />
      {/* Layer 3 : violet glow (bottom-right) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,92,246,0.10), transparent)",
        }}
      />
      {/* Layer 4 : aurora line */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scaleX: 0.6 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.3, ease: easeOut }}
        className="pointer-events-none absolute inset-x-0 top-[22%] h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent origin-center"
      />

      {/* === Header === */}
      <header className="relative z-10 px-6 lg:px-10 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="AMANE — Accueil"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-300/20 group-hover:shadow-emerald-500/50 transition-shadow">
            <ShieldCheck size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <span className="font-semibold text-lg tracking-tight block">
              AMANE
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-medium mt-0.5">
              Plateforme médicale
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-white/[0.04] ring-1 ring-transparent hover:ring-white/10"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Retour au site</span>
        </Link>
      </header>

      {/* === Main === */}
      <main className="relative z-10 flex items-center justify-center px-6 py-8 lg:py-12 min-h-[calc(100vh-90px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <RoleSelector onSelect={setSelectedRole} />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <LoginForm
                  role={selectedRole}
                  onBack={() => setSelectedRole(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 flex items-center justify-center gap-4 text-[11px] text-zinc-500"
          >
            <span className="inline-flex items-center gap-1.5">
              <Lock size={11} strokeWidth={2.2} />
              Connexion chiffrée
            </span>
            <span className="w-px h-3 bg-white/10" />
            <span className="inline-flex items-center gap-1.5">
              <Fingerprint size={11} strokeWidth={2.2} />
              Données anonymisées
            </span>
          </motion.div>

          <p className="mt-4 text-center text-xs text-zinc-600">
            Pour les relais et infirmiers : utilisez l&apos;app mobile AMANE.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

// ============================================================================
// Role Selector
// ============================================================================

function RoleSelector({ onSelect }: { onSelect: (r: AccessRole) => void }) {
  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300"
        >
          <Sparkles size={10} />
          Portail sécurisé
        </motion.span>
        <h1 className="text-4xl font-semibold tracking-tight leading-[1.1]">
          Bienvenue<span className="text-emerald-400">.</span>
        </h1>
        <p className="text-zinc-400 text-[15px] leading-relaxed">
          Choisissez votre profil pour accéder au tableau de bord.
        </p>
      </div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
        }}
        className="space-y-3"
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <RoleCard
            icon={
              <Stethoscope
                size={22}
                className="text-emerald-300"
                strokeWidth={2.2}
              />
            }
            title="Médecin spécialiste"
            desc="Examiner les cas remontés du terrain et valider les diagnostics."
            onClick={() => onSelect("medecin")}
            accent="emerald"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4, ease: easeOut }}
        >
          <RoleCard
            icon={
              <LayoutDashboard
                size={22}
                className="text-violet-300"
                strokeWidth={2.2}
              />
            }
            title="Administrateur"
            desc="Superviser l'infrastructure, statistiques et journal d'audit."
            onClick={() => onSelect("admin")}
            accent="violet"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  desc,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  accent: "emerald" | "violet";
}) {
  const colors =
    accent === "emerald"
      ? {
          glow: "from-emerald-500/15",
          ring: "group-hover:ring-emerald-500/30",
          iconRing:
            "ring-emerald-500/20 group-hover:ring-emerald-500/40 group-hover:shadow-emerald-500/30",
          chevron: "group-hover:text-emerald-300",
        }
      : {
          glow: "from-violet-500/15",
          ring: "group-hover:ring-violet-500/30",
          iconRing:
            "ring-violet-500/20 group-hover:ring-violet-500/40 group-hover:shadow-violet-500/30",
          chevron: "group-hover:text-violet-300",
        };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={[
        "group relative w-full text-left rounded-2xl p-5 overflow-hidden",
        "bg-white/[0.03] hover:bg-white/[0.05]",
        "ring-1 ring-white/10 hover:ring-2",
        "backdrop-blur-md transition-all duration-300",
        colors.ring,
      ].join(" ")}
    >
      {/* Hover gradient flood */}
      <div
        className={[
          "absolute inset-0 bg-gradient-to-br to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          colors.glow,
        ].join(" ")}
      />
      {/* Top highlight */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center gap-4">
        <div
          className={[
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            "bg-white/5 ring-1 transition-all duration-300",
            "shadow-lg shadow-transparent",
            colors.iconRing,
          ].join(" ")}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-50 text-base tracking-tight">
            {title}
          </p>
          <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{desc}</p>
        </div>
        <ChevronRight
          size={18}
          className={[
            "text-zinc-500 transition-all duration-300 flex-shrink-0",
            "group-hover:translate-x-1",
            colors.chevron,
          ].join(" ")}
        />
      </div>
    </motion.button>
  );
}

// ============================================================================
// Login Form
// ============================================================================

function LoginForm({
  role,
  onBack,
}: {
  role: AccessRole;
  onBack: () => void;
}) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const roleLabel = role === "medecin" ? "Médecin" : "Administrateur";
  const expectedRole: UserRole = role;
  const isMedecin = role === "medecin";

  const onSubmit = async (data: LoginInput) => {
    try {
      const u = await login(data.username, data.password);
      if (u.role !== expectedRole) {
        toast.error("Mauvais profil", {
          description: `Ce compte est de type ${u.role}, pas ${roleLabel}.`,
        });
        logout();
        return;
      }
      if (u.role === "medecin") router.replace("/medecin");
      else if (u.role === "admin") router.replace("/admin");
    } catch (e) {
      toast.error("Échec de connexion", {
        description: e instanceof Error ? e.message : "Identifiants incorrects",
      });
    }
  };

  const accentText = isMedecin ? "text-emerald-400" : "text-violet-400";
  const accentRingFocus = isMedecin
    ? "focus-within:ring-emerald-500/40"
    : "focus-within:ring-violet-500/40";
  const submitGradient = isMedecin
    ? "from-emerald-400 via-emerald-500 to-emerald-600 shadow-emerald-500/30 hover:shadow-emerald-500/50"
    : "from-violet-400 via-violet-500 to-violet-600 shadow-violet-500/30 hover:shadow-violet-500/50";

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 mb-6 transition-colors group"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Changer de profil
      </button>

      <div className="mb-7 space-y-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${
            isMedecin
              ? "bg-emerald-500/10 ring-emerald-500/20 text-emerald-300"
              : "bg-violet-500/10 ring-violet-500/20 text-violet-300"
          }`}
        >
          {isMedecin ? (
            <Stethoscope size={10} />
          ) : (
            <LayoutDashboard size={10} />
          )}
          Portail {roleLabel}
        </span>
        <h2 className="text-3xl font-semibold tracking-tight leading-[1.1]">
          Identifiez-vous<span className={accentText}>.</span>
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Vos identifiants sont chiffrés de bout en bout.
        </p>
      </div>

      <div className="relative rounded-2xl bg-zinc-900/40 ring-1 ring-white/10 p-6 backdrop-blur-md shadow-2xl shadow-black/40">
        {/* Top inner highlight */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 block"
            >
              Identifiant
            </label>
            <div
              className={`relative rounded-xl bg-white/[0.04] ring-1 ring-white/10 focus-within:ring-2 ${accentRingFocus} transition-all`}
            >
              <input
                id="username"
                placeholder={isMedecin ? "ex: medecin1" : "ex: admin1"}
                autoComplete="username"
                className="w-full bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 px-4 py-3 text-sm rounded-xl"
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-0.5">
                <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400 block"
            >
              Mot de passe
            </label>
            <div
              className={`relative rounded-xl bg-white/[0.04] ring-1 ring-white/10 focus-within:ring-2 ${accentRingFocus} transition-all`}
            >
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-transparent border-0 outline-none text-zinc-100 placeholder:text-zinc-500 px-4 py-3 pr-11 text-sm rounded-xl"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-white/[0.04]"
                tabIndex={-1}
                aria-label={
                  showPwd
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-0.5">
                <span className="inline-block w-1 h-1 rounded-full bg-rose-400" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit — premium gradient + sheen */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`group relative w-full overflow-hidden rounded-xl font-semibold text-zinc-950 px-5 py-3.5 bg-gradient-to-br ${submitGradient} shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-shadow duration-300`}
          >
            <span className="relative flex items-center justify-center gap-2 text-sm">
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Accéder au portail
                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </span>
            {/* Sheen overlay */}
            <span
              aria-hidden
              className="absolute inset-y-0 -left-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-[400%] transition-transform duration-1000 ease-out skew-x-12"
            />
          </motion.button>
        </form>
      </div>
    </div>
  );
}
