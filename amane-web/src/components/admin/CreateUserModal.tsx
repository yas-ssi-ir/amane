"use client";

import { motion } from "framer-motion";
import { BadgeCheck, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminApi } from "@/lib/api";

interface CreateUserModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

const EMPTY_FORM = {
  username: "",
  password: "",
  full_name: "",
  role: "medecin" as const,
  region: "",
  speciality: "",
  phone: "",
};

export function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await adminApi.createUser({
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        region: form.region || undefined,
        speciality: form.speciality || undefined,
        phone: form.phone || undefined,
      });
      toast.success(`Compte créé pour ${form.full_name}`);
      onCreated?.();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 rounded-2xl border border-white/10 p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-violet-300" />
            <h2 className="font-semibold text-zinc-100">Créer un compte</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            <XCircle size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Nom complet *</label>
              <input
                value={form.full_name} onChange={field("full_name")}
                placeholder="Dr. Nom Prénom"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Identifiant *</label>
              <input
                value={form.username} onChange={field("username")}
                placeholder="medecin_xxx"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Mot de passe *</label>
              <input
                type="password" value={form.password} onChange={field("password")}
                placeholder="Min. 8 caractères"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Rôle *</label>
              <select
                value={form.role} onChange={field("role")}
                className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50"
              >
                <option value="medecin">Médecin</option>
                <option value="relais">Relais de santé</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Région</label>
              <input
                value={form.region} onChange={field("region")}
                placeholder="Casablanca-Settat"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Spécialité</label>
              <input
                value={form.speciality} onChange={field("speciality")}
                placeholder="Dermatologie"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.username || !form.password || !form.full_name}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
              Créer le compte
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
