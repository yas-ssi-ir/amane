"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function AdminProfilePage() {
  const user = useAuthStore((s) => s.user);
  const initial = user?.full_name?.charAt(0).toUpperCase() ?? "?";

  const stats = useQuery({
    queryKey: ["me", "stats"],
    queryFn: () => authApi.myStats(),
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdMsg({ type: "err", text: "Les nouveaux mots de passe ne correspondent pas." });
      return;
    }
    if (pwdForm.next.length < 8) {
      setPwdMsg({ type: "err", text: "Minimum 8 caractères requis." });
      return;
    }
    setPwdLoading(true);
    try {
      await authApi.changePassword(pwdForm.current, pwdForm.next);
      setPwdMsg({ type: "ok", text: "Mot de passe mis à jour avec succès." });
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors du changement de mot de passe.";
      setPwdMsg({ type: "err", text: msg });
    } finally {
      setPwdLoading(false);
    }
  };

  const s = stats.data as Record<string, unknown> | undefined;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="mb-8"
      >
        <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-1">
          Mon compte
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Profil administrateur</h1>
        <p className="text-zinc-400 mt-1 text-sm">Informations du compte et paramètres de sécurité.</p>
      </motion.div>

      {/* Avatar hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
        className="relative rounded-2xl overflow-hidden border border-white/10 mb-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.12] via-zinc-900 to-purple-500/[0.06]" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/20 shrink-0">
            <span className="text-white text-3xl font-bold">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-zinc-50 truncate">{user?.full_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full px-3 py-1 text-xs font-semibold">
                <ShieldCheck size={11} strokeWidth={2.5} />
                Administrateur
              </span>
              {user?.region && (
                <span className="inline-flex items-center gap-1.5 bg-white/[0.05] text-zinc-400 border border-white/[0.08] rounded-full px-3 py-1 text-xs">
                  <MapPin size={11} />
                  {user.region}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/20 rounded-full px-3 py-1 text-xs font-semibold">
                <ShieldCheck size={11} strokeWidth={2.5} />
                Accès total
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Informations du compte */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={16} className="text-violet-300" />
            <h3 className="font-semibold text-zinc-100">Informations du compte</h3>
          </div>
          <div className="space-y-4">
            <InfoRow label="Nom complet" value={user?.full_name ?? "—"} />
            <InfoRow label="Identifiant" value={user?.username ?? "—"} mono />
            <InfoRow label="Rôle" value="Administrateur système" />
            <InfoRow label="Région" value={user?.region ?? "—"} />
            <InfoRow label="Permissions" value="Accès total" accent="violet" />
            <InfoRow label="ID compte" value={user?.id ? `${user.id.slice(0, 8)}…` : "—"} mono muted />
          </div>
        </motion.div>

        {/* Statistiques système */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList size={16} className="text-violet-300" />
            <h3 className="font-semibold text-zinc-100">Vue système</h3>
          </div>
          {stats.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-white/[0.04] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Consultations totales"
                value={String(s?.total_consultations ?? 0)}
                accent="violet"
                icon={<ClipboardList size={14} />}
              />
              <StatCard
                label="Utilisateurs enregistrés"
                value={String(s?.total_users ?? 0)}
                accent="purple"
                icon={<Users size={14} />}
              />
              <StatCard
                label="Décisions médicales"
                value={String(s?.total_reviews ?? 0)}
                accent="indigo"
                icon={<ShieldCheck size={14} />}
              />
              <StatCard
                label="Vérifications en attente"
                value={String(s?.pending_verifications ?? 0)}
                accent={Number(s?.pending_verifications ?? 0) > 0 ? "amber" : "zinc"}
                icon={<Users size={14} />}
              />
            </div>
          )}
        </motion.div>

        {/* Sécurité */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
          className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <KeyRound size={16} className="text-violet-300" />
            <h3 className="font-semibold text-zinc-100">Changer le mot de passe</h3>
          </div>
          <form onSubmit={handleChangePassword} className="grid sm:grid-cols-3 gap-4 max-w-2xl">
            <PasswordField
              label="Mot de passe actuel"
              value={pwdForm.current}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              onChange={(v) => setPwdForm((f) => ({ ...f, current: v }))}
              accent="violet"
            />
            <PasswordField
              label="Nouveau mot de passe"
              value={pwdForm.next}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              onChange={(v) => setPwdForm((f) => ({ ...f, next: v }))}
              accent="violet"
            />
            <PasswordField
              label="Confirmer"
              value={pwdForm.confirm}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              onChange={(v) => setPwdForm((f) => ({ ...f, confirm: v }))}
              accent="violet"
            />
            <div className="sm:col-span-3 flex items-center gap-4 flex-wrap">
              <button
                type="submit"
                disabled={pwdLoading || !pwdForm.current || !pwdForm.next || !pwdForm.confirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
              >
                {pwdLoading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Mettre à jour
              </button>
              {pwdMsg && (
                <p className={`text-sm ${pwdMsg.type === "ok" ? "text-emerald-300" : "text-red-300"}`}>
                  {pwdMsg.text}
                </p>
              )}
            </div>
          </form>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
        className="text-xs text-zinc-600 mt-6 text-center"
      >
        AMANE · Administration · {format(new Date(), "d MMMM yyyy", { locale: fr })}
      </motion.p>
    </div>
  );
}

function InfoRow({
  label, value, mono, muted, accent,
}: {
  label: string; value: string; mono?: boolean; muted?: boolean; accent?: string;
}) {
  const textColor =
    accent === "violet" ? "text-violet-300" :
    muted ? "text-zinc-500" : "text-zinc-100";
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.05] last:border-0">
      <span className="text-xs text-zinc-500 uppercase tracking-wider shrink-0">{label}</span>
      <span className={`text-sm ${mono ? "font-mono" : "font-medium"} ${textColor} truncate text-right`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label, value, accent, icon,
}: {
  label: string; value: string; accent: string; icon: React.ReactNode;
}) {
  const styles: Record<string, { bg: string; text: string }> = {
    violet: { bg: "bg-violet-500/[0.06] border-violet-500/20", text: "text-violet-300" },
    purple: { bg: "bg-purple-500/[0.06] border-purple-500/20", text: "text-purple-300" },
    indigo: { bg: "bg-indigo-500/[0.06] border-indigo-500/20", text: "text-indigo-300" },
    amber:  { bg: "bg-amber-500/[0.06] border-amber-500/20",   text: "text-amber-300"  },
    zinc:   { bg: "bg-white/[0.03] border-white/[0.06]",        text: "text-zinc-400"   },
  };
  const style = styles[accent] ?? styles.zinc;
  return (
    <div className={`rounded-xl border p-4 ${style.bg}`}>
      <div className={`${style.text} mb-2`}>{icon}</div>
      <p className={`text-2xl font-bold ${style.text} tabular-nums`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1 leading-tight">{label}</p>
    </div>
  );
}

function PasswordField({
  label, value, show, onToggle, onChange, accent,
}: {
  label: string; value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void; accent?: string;
}) {
  const focus = accent === "violet" ? "focus:border-violet-500/50" : "focus:border-emerald-500/50";
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className={`w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none ${focus} pr-9`}
        />
        <button type="button" onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200" tabIndex={-1}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}
