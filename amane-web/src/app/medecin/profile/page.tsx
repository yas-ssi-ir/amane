"use client";

import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock,
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  Loader2,
  MapPin,
  ShieldX,
  Stethoscope,
  TrendingUp,
  User,
} from "lucide-react";
import { useState } from "react";

import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useQuery } from "@tanstack/react-query";

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function MedecinProfilePage() {
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
      setPwdMsg({ type: "err", text: "Le nouveau mot de passe doit contenir au moins 8 caractères." });
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

  const vstatus = user?.verification_status ?? "not_required";
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
        <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">
          Mon compte
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Profil</h1>
        <p className="text-zinc-400 mt-1 text-sm">Informations personnelles et paramètres de sécurité.</p>
      </motion.div>

      {/* Avatar card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
        className="relative rounded-2xl overflow-hidden border border-white/10 mb-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.12] via-zinc-900 to-teal-500/[0.06]" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 shrink-0">
            <span className="text-white text-3xl font-bold">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-zinc-50 truncate">{user?.full_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-semibold">
                <Stethoscope size={11} strokeWidth={2.5} />
                Médecin
              </span>
              {user?.region && (
                <span className="inline-flex items-center gap-1.5 bg-white/[0.05] text-zinc-400 border border-white/[0.08] rounded-full px-3 py-1 text-xs">
                  <MapPin size={11} />
                  {user.region}
                </span>
              )}
              {/* Verification badge */}
              {vstatus === "approved" && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full px-3 py-1 text-xs font-semibold">
                  <BadgeCheck size={11} strokeWidth={2.5} />
                  Identité vérifiée
                </span>
              )}
              {vstatus === "pending" && (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full px-3 py-1 text-xs font-semibold">
                  <Clock size={11} strokeWidth={2.5} />
                  En attente de vérification
                </span>
              )}
              {vstatus === "rejected" && (
                <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded-full px-3 py-1 text-xs font-semibold">
                  <ShieldX size={11} strokeWidth={2.5} />
                  Compte refusé
                </span>
              )}
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
            <User size={16} className="text-emerald-300" />
            <h3 className="font-semibold text-zinc-100">Informations professionnelles</h3>
          </div>
          <div className="space-y-4">
            <InfoRow label="Nom complet" value={user?.full_name ?? "—"} />
            <InfoRow label="Identifiant" value={user?.username ?? "—"} mono />
            <InfoRow label="Rôle" value="Médecin spécialiste" />
            <InfoRow label="Région" value={user?.region ?? "—"} />
            {user?.credential_number && (
              <InfoRow label="Numéro CNOM" value={user.credential_number} mono accent="emerald" />
            )}
            <InfoRow
              label="ID compte"
              value={user?.id ? `${user.id.slice(0, 8)}…` : "—"}
              mono
              muted
            />
          </div>
        </motion.div>

        {/* Statistiques médicales */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
          className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={16} className="text-emerald-300" />
            <h3 className="font-semibold text-zinc-100">Mon activité médicale</h3>
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
                label="Consultations validées"
                value={String(s?.total_reviews ?? 0)}
                accent="emerald"
              />
              <StatCard
                label="Concordance IA"
                value={`${s?.concordance_rate ?? 0}%`}
                accent="teal"
              />
              <StatCard
                label="Urgences escaladées"
                value={String(s?.urgences_escaladees ?? 0)}
                accent="amber"
              />
              <StatCard
                label="Dernière révision"
                value={
                  s?.last_review_at
                    ? formatDistanceToNow(new Date(s.last_review_at as string), { locale: fr, addSuffix: true })
                    : "—"
                }
                accent="zinc"
                small
              />
            </div>
          )}
        </motion.div>

        {/* Sécurité — changer le mot de passe */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
          className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <KeyRound size={16} className="text-emerald-300" />
            <h3 className="font-semibold text-zinc-100">Sécurité</h3>
          </div>
          <form onSubmit={handleChangePassword} className="grid sm:grid-cols-3 gap-4 max-w-2xl">
            <PasswordField
              label="Mot de passe actuel"
              value={pwdForm.current}
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              onChange={(v) => setPwdForm((f) => ({ ...f, current: v }))}
            />
            <PasswordField
              label="Nouveau mot de passe"
              value={pwdForm.next}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              onChange={(v) => setPwdForm((f) => ({ ...f, next: v }))}
            />
            <PasswordField
              label="Confirmer"
              value={pwdForm.confirm}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              onChange={(v) => setPwdForm((f) => ({ ...f, confirm: v }))}
            />
            <div className="sm:col-span-3 flex items-center gap-4 flex-wrap">
              <button
                type="submit"
                disabled={pwdLoading || !pwdForm.current || !pwdForm.next || !pwdForm.confirm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm transition-colors"
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

      {/* Footer info */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
        className="text-xs text-zinc-600 mt-6 text-center"
      >
        AMANE · Portail médecin · {format(new Date(), "d MMMM yyyy", { locale: fr })}
      </motion.p>
    </div>
  );
}

function InfoRow({
  label, value, mono, muted, accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  accent?: string;
}) {
  const textColor =
    accent === "emerald" ? "text-emerald-300" :
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
  label, value, accent, small,
}: {
  label: string;
  value: string;
  accent: string;
  small?: boolean;
}) {
  const bg: Record<string, string> = {
    emerald: "bg-emerald-500/[0.06] border-emerald-500/20",
    teal: "bg-teal-500/[0.06] border-teal-500/20",
    amber: "bg-amber-500/[0.06] border-amber-500/20",
    zinc: "bg-white/[0.03] border-white/[0.06]",
  };
  const text: Record<string, string> = {
    emerald: "text-emerald-300",
    teal: "text-teal-300",
    amber: "text-amber-300",
    zinc: "text-zinc-400",
  };
  return (
    <div className={`rounded-xl border p-4 ${bg[accent] ?? bg.zinc}`}>
      <p className={`${small ? "text-sm" : "text-2xl"} font-bold ${text[accent] ?? text.zinc} tabular-nums`}>
        {value}
      </p>
      <p className="text-xs text-zinc-500 mt-1 leading-tight">{label}</p>
    </div>
  );
}

function PasswordField({
  label, value, show, onToggle, onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-400 mb-1.5 block uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 pr-9"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
          tabIndex={-1}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}
