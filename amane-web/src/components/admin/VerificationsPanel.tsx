"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { adminApi } from "@/lib/api";
import type { PendingVerificationUser } from "@/lib/types";

import { Skeleton } from "@/components/ui/skeleton";

import { DocPreviewModal } from "./DocPreviewModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface VerificationsPanelProps {
  onCreateUser: () => void;
}

export function VerificationsPanel({ onCreateUser }: VerificationsPanelProps) {
  const [pendingUsers, setPendingUsers] = useState<PendingVerificationUser[] | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);

  const load = async (force = false) => {
    if (pendingLoaded && !force) return;
    setPendingLoading(true);
    try {
      const data = await adminApi.pendingVerifications("pending");
      setPendingUsers(data);
      setPendingLoaded(true);
    } catch {
      setPendingUsers([]);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleVerify = async (userId: string, status: "approved" | "rejected") => {
    setVerifyingId(userId);
    try {
      await adminApi.verifyUser(userId, status);
      setPendingUsers((prev) => prev?.filter((u) => u.id !== userId) ?? []);
      toast.success(status === "approved" ? "Compte approuvé" : "Compte refusé");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de la vérification");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <>
      {docPreview && <DocPreviewModal url={docPreview} onClose={() => setDocPreview(null)} />}

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck size={16} className="text-amber-300" />
            <h2 className="font-semibold text-zinc-100">Vérifications professionnelles</h2>
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
              infirmier · médecin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateUser}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20 hover:bg-violet-500/20 text-xs font-semibold transition-colors"
            >
              <BadgeCheck size={12} />
              Créer un compte
            </button>
            <button
              onClick={() => { setPendingLoaded(false); load(true); }}
              disabled={pendingLoading}
              className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={pendingLoading ? "animate-spin" : ""} />
              {pendingLoaded ? "Actualiser" : "Charger"}
            </button>
          </div>
        </div>

        {!pendingLoaded ? (
          <div className="text-center py-8">
            <button
              onClick={() => load()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 text-sm font-medium transition-colors"
            >
              <Clock size={14} />
              Voir les demandes en attente
            </button>
          </div>
        ) : pendingLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-white/[0.04]" />)}
          </div>
        ) : pendingUsers && pendingUsers.length > 0 ? (
          <div className="space-y-3">
            {pendingUsers.map((u) => (
              <VerificationRow
                key={u.id}
                user={u}
                verifying={verifyingId === u.id}
                onPreview={(url) => setDocPreview(`${API_URL}${url}`)}
                onVerify={handleVerify}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-6 text-center justify-center">
            <ShieldX size={18} className="text-zinc-500" />
            <p className="text-zinc-500 text-sm">Aucune vérification en attente</p>
          </div>
        )}
      </div>
    </>
  );
}

function VerificationRow({
  user: u, verifying, onPreview, onVerify,
}: {
  user: PendingVerificationUser;
  verifying: boolean;
  onPreview: (url: string) => void;
  onVerify: (id: string, status: "approved" | "rejected") => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-300 flex items-center justify-center font-bold text-base shrink-0">
        {u.full_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 text-sm">{u.full_name}</p>
        <p className="text-xs text-zinc-400">
          {u.username} · <span className="capitalize">{u.role}</span> · {u.region ?? "—"}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <BadgeCheck size={11} className="text-amber-400" />
          <span className="text-xs font-mono text-amber-300">{u.credential_number ?? "—"}</span>
        </div>
      </div>
      {u.credential_doc_url && (
        <button
          onClick={() => onPreview(u.credential_doc_url!)}
          className="shrink-0 group relative"
          title="Voir le document justificatif"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${API_URL}${u.credential_doc_url}`}
            alt="Justificatif"
            className="w-14 h-10 object-cover rounded-lg border border-white/10 group-hover:border-amber-500/40 transition-colors"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
            <span className="text-[9px] text-white font-semibold">Voir</span>
          </div>
        </button>
      )}
      {u.created_at && (
        <span className="text-xs text-zinc-500 shrink-0 hidden sm:block">
          {formatDistanceToNow(new Date(u.created_at), { locale: fr, addSuffix: true })}
        </span>
      )}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onVerify(u.id, "approved")}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <CheckCircle2 size={12} />
          Approuver
        </button>
        <button
          onClick={() => onVerify(u.id, "rejected")}
          disabled={verifying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <XCircle size={12} />
          Refuser
        </button>
      </div>
    </div>
  );
}
