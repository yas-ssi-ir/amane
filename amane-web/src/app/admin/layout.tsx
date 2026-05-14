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

import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
    // Strict : seul role admin
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
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-zinc-950 to-zinc-900 border-r border-white/[0.06] relative">
        {/* Subtle violet glow at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-violet-500/[0.08] to-transparent pointer-events-none" />

        <div className="relative flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <ShieldCheck size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold leading-tight">AMANE</p>
            <p className="text-[10px] text-violet-400 uppercase tracking-wider font-semibold">
              Tableau de bord
            </p>
          </div>
        </div>

        <nav className="relative flex-1 px-3 py-4 space-y-1">
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

        <div className="relative px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut size={14} />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile top bar — dark theme, cohérent avec le reste */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <span className="font-semibold text-zinc-100">AMANE</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400">
          <LogOut size={14} />
        </Button>
      </div>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
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
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
        active
          ? "bg-violet-500/10 text-violet-100 font-semibold ring-1 ring-violet-500/20"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
      ].join(" ")}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-violet-400" />
      )}
      <span className={active ? "text-violet-300" : "text-zinc-500"}>{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
