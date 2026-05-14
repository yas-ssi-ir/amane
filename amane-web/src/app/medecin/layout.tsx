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

import { Button } from "@/components/ui/button";

export default function MedecinLayout({ children }: { children: React.ReactNode }) {
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
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-gradient-to-b from-zinc-950 to-zinc-900 border-r border-white/[0.06] relative">
        {/* Subtle emerald glow at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/[0.08] to-transparent pointer-events-none" />

        <div className="relative flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold leading-tight">AMANE</p>
            <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
              Portail médecin
            </p>
          </div>
        </div>

        <nav className="relative flex-1 px-3 py-4 space-y-1">
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

        <div className="relative px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
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

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-white/[0.06] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
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
  href, icon, label, count, active, highlight,
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
        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
        active
          ? "bg-emerald-500/10 text-emerald-100 font-semibold ring-1 ring-emerald-500/20"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
      ].join(" ")}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-emerald-400" />
      )}
      <span className={active ? "text-emerald-300" : "text-zinc-500"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={[
            "text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center",
            highlight && active
              ? "bg-emerald-400 text-zinc-950"
              : active
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-white/5 text-zinc-400",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
