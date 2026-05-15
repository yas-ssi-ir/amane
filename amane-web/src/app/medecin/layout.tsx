"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth-store";
import { useConsultations } from "@/lib/queries";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function MedecinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "medecin") {
      if (user.role === "admin") router.replace("/admin");
      else router.replace("/login");
    }
  }, [hydrated, token, user, router]);

  const { data: pending } = useConsultations("ai_analyzed");
  const { data: validated } = useConsultations("validated");

  if (!hydrated || !token) return null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-50 selection:bg-emerald-400/30">
      {/* ==================== Sidebar (Desktop) ==================== */}
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/50 ring-1 ring-white/[0.06] relative overflow-hidden">
        {/* Layered backdrop */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/[0.10] to-transparent pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-emerald-500/10 pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Brand */}
        <div className="relative flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-300/20">
            <ShieldCheck size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-zinc-50">AMANE</p>
            <p className="text-[10px] text-emerald-400 uppercase tracking-[0.18em] font-semibold mt-0.5">
              Portail médecin
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="relative flex-1 px-3 py-4 space-y-0.5"
          aria-label="Navigation principale"
        >
          <NavItem
            href="/medecin"
            icon={<ClipboardList size={18} />}
            label="File d'attente"
            count={pending?.length ?? 0}
            active={pathname === "/medecin"}
            highlight
          />
          <NavItem
            href="/medecin/validated"
            icon={<CheckCircle2 size={18} />}
            label="Validés"
            count={validated?.length ?? 0}
            active={pathname === "/medecin/validated"}
          />
          <NavItem
            href="/medecin/profile"
            icon={<User size={18} />}
            label="Mon profil"
            active={pathname === "/medecin/profile"}
          />
        </nav>

        {/* User card + logout */}
        <div className="relative px-3 pb-4 pt-3 border-t border-white/[0.06]">
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-300/30">
                <span className="text-white text-sm font-bold">
                  {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-100 truncate leading-tight">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-zinc-500 capitalize mt-0.5">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-zinc-400 hover:text-rose-300 bg-white/[0.02] hover:bg-rose-500/10 ring-1 ring-white/5 hover:ring-rose-500/20 transition-all"
            >
              <LogOut size={12} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ==================== Mobile top bar ==================== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-zinc-950/85 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Stethoscope size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-zinc-100">AMANE</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-zinc-400 hover:text-rose-300 rounded-lg p-2 hover:bg-rose-500/10 transition-colors"
          aria-label="Déconnexion"
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* ==================== Main content ==================== */}
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
        className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-x-hidden"
      >
        {children}
      </motion.main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  count,
  active,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
        active
          ? "bg-emerald-500/10 text-emerald-100 font-semibold ring-1 ring-emerald-500/20"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
      ].join(" ")}
    >
      {/* Active indicator pill */}
      {active && (
        <motion.span
          layoutId="medecin-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <span
        className={[
          "transition-colors",
          active
            ? "text-emerald-300"
            : "text-zinc-500 group-hover:text-zinc-300",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={[
            "text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center tabular-nums",
            highlight && active
              ? "bg-emerald-400 text-zinc-950 shadow-sm shadow-emerald-500/40"
              : active
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/20"
                : "bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-zinc-200",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
