"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Map,
  ScrollText,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/lib/auth-store";

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function AdminLayout({
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
    if (user.role !== "admin") {
      if (user.role === "medecin") router.replace("/medecin");
      else router.replace("/login");
    }
  }, [hydrated, token, user, router]);

  if (!hydrated || !token) return null;

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-50 selection:bg-violet-400/30">
      {/* ==================== Sidebar (Desktop) ==================== */}
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/50 ring-1 ring-white/[0.06] relative overflow-hidden">
        {/* Layered backdrop */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-violet-500/[0.10] to-transparent pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl bg-violet-500/10 pointer-events-none"
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 ring-1 ring-violet-300/20">
            <ShieldCheck size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-zinc-50">AMANE</p>
            <p className="text-[10px] text-violet-400 uppercase tracking-[0.18em] font-semibold mt-0.5">
              Tableau de bord
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="relative flex-1 px-3 py-4 space-y-0.5"
          aria-label="Navigation principale"
        >
          <NavItem
            href="/admin"
            icon={<LayoutDashboard size={18} />}
            label="Vue d'ensemble"
            active={pathname === "/admin"}
          />
          <NavItem
            href="/admin/map"
            icon={<Map size={18} />}
            label="Carte du Maroc"
            active={pathname === "/admin/map"}
          />
          <NavItem
            href="/admin/audit"
            icon={<ScrollText size={18} />}
            label="Journal d'audit"
            active={pathname === "/admin/audit"}
          />
          <NavItem
            href="/admin/profile"
            icon={<User size={18} />}
            label="Mon profil"
            active={pathname === "/admin/profile"}
          />
        </nav>

        {/* User card + logout */}
        <div className="relative px-3 pb-4 pt-3 border-t border-white/[0.06]">
          <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20 ring-1 ring-violet-300/30">
                <span className="text-white text-sm font-bold">
                  {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-violet-400 ring-2 ring-zinc-950" />
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
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/30">
            <ShieldCheck size={16} className="text-white" strokeWidth={2.5} />
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
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group",
        active
          ? "bg-violet-500/10 text-violet-100 font-semibold ring-1 ring-violet-500/20"
          : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
      ].join(" ")}
    >
      {/* Active indicator pill — uses layoutId for smooth slide */}
      {active && (
        <motion.span
          layoutId="admin-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <span
        className={[
          "transition-colors",
          active ? "text-violet-300" : "text-zinc-500 group-hover:text-zinc-300",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
