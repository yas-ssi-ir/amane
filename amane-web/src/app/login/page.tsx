"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="min-h-screen relative bg-zinc-950 text-zinc-50 overflow-hidden">
      {/* Background : grid + radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Top bar */}
      <header className="relative z-10 px-6 lg:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg tracking-tight">AMANE</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Retour au site
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex items-center justify-center px-6 py-8 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            {!selectedRole ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <RoleSelector onSelect={setSelectedRole} />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <LoginForm
                  role={selectedRole}
                  onBack={() => setSelectedRole(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-zinc-500">
            Pour les relais et infirmiers : utilisez l&apos;app mobile AMANE.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function RoleSelector({ onSelect }: { onSelect: (r: AccessRole) => void }) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">Bienvenue</h2>
        <p className="text-zinc-400 mt-2">Choisissez votre profil pour continuer.</p>
      </div>

      <div className="space-y-3">
        <RoleCard
          icon={<Stethoscope size={22} className="text-emerald-400" />}
          title="Médecin spécialiste"
          desc="Examiner les cas remontés du terrain et valider les diagnostics."
          onClick={() => onSelect("medecin")}
          accentRing="ring-emerald-500/30"
          accentBg="from-emerald-500/10"
        />
        <RoleCard
          icon={<LayoutDashboard size={22} className="text-violet-400" />}
          title="Administrateur"
          desc="Superviser l'infrastructure, statistiques et journal d'audit."
          onClick={() => onSelect("admin")}
          accentRing="ring-violet-500/30"
          accentBg="from-violet-500/10"
        />
      </div>
    </div>
  );
}

function RoleCard({
  icon, title, desc, onClick, accentRing, accentBg,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  accentRing: string;
  accentBg: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`group relative w-full text-left bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-5 flex items-center gap-4 transition-all hover:ring-2 ${accentRing} overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accentBg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="relative flex-1 min-w-0">
        <p className="font-semibold text-zinc-50 text-base">{title}</p>
        <p className="text-zinc-400 text-sm mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={18} className="relative text-zinc-500 group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </motion.button>
  );
}

function LoginForm({ role, onBack }: { role: AccessRole; onBack: () => void }) {
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

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100 mb-5 transition-colors"
      >
        <ArrowLeft size={14} />
        Changer de profil
      </button>

      <div className="mb-7">
        <h2 className="text-3xl font-semibold tracking-tight">
          Connexion <span className={isMedecin ? "text-emerald-400" : "text-violet-400"}>{roleLabel}</span>
        </h2>
        <p className="text-zinc-400 mt-2">Identifiez-vous pour accéder à votre portail.</p>
      </div>

      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 backdrop-blur-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-300">Identifiant</Label>
            <Input
              id="username"
              placeholder={isMedecin ? "ex: medecin1" : "ex: admin1"}
              autoComplete="username"
              className="bg-white/[0.04] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-500/40"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-rose-400">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="bg-white/[0.04] border-white/10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-500/40 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className={
              isMedecin
                ? "w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold"
                : "w-full bg-violet-500 hover:bg-violet-400 text-zinc-950 font-semibold"
            }
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Se connecter
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
