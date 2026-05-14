"use client";

import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Clock } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { AuditLogEntry } from "@/lib/types";

import { ACTION_LABELS } from "./constants";

interface RecentActivityProps {
  data: AuditLogEntry[] | undefined;
  isLoading: boolean;
}

export function RecentActivity({ data, isLoading }: RecentActivityProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-violet-300" />
          <h2 className="font-semibold text-zinc-100">Activité récente</h2>
        </div>
        <a href="/admin/audit" className="text-xs text-violet-300 hover:text-violet-200">
          Voir tout →
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg bg-white/[0.04]" />)}
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-1">
          {data.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200">
                  <span className="font-semibold">{ACTION_LABELS[log.action] ?? log.action}</span>
                  <span className="text-zinc-500"> · </span>
                  <span className="text-zinc-400">{log.actor_role ?? "système"}</span>
                </p>
                {log.timestamp && (
                  <p className="text-xs text-zinc-500">
                    {formatDistanceToNow(new Date(log.timestamp), { locale: fr, addSuffix: true })}
                  </p>
                )}
              </div>
              {log.timestamp && (
                <span className="text-xs text-zinc-500 font-mono tabular-nums">
                  {format(new Date(log.timestamp), "HH:mm:ss")}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <Clock size={20} className="text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm">Aucune activité récente</p>
        </div>
      )}
    </div>
  );
}
