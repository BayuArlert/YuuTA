"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, FileText, Plus, LogOut, Sparkles, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/providers/ThemeProvider";

interface SidebarProps {
  user: { name: string; email: string; image?: string };
}

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/documents",
    icon: FileText,
    label: "Dokumen Riset",
  },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-r border-sky-100 dark:border-slate-800/90 z-30 transition-colors duration-300 shadow-xs">
      {/* Brand Logo */}
      <div className="p-5 border-b border-sky-100/70 dark:border-slate-800/80 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            Y
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
              Yuu<span className="text-sky-600 dark:text-sky-400">TA</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Asisten Akademik</p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Menu Utama
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-sky-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4">
          <Link
            href="/documents/new"
            id="sidebar-new-doc"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-primary-sky shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Dokumen Baru</span>
          </Link>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-3.5 rounded-2xl bg-sky-50/70 dark:bg-slate-800/50 border border-sky-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-sky-800 dark:text-sky-300 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
            <span>Format Standar</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            Mendukung Skripsi (BAB I-V) & Jurnal ilmiah (IMRaD). AI memandu struktur tanpa menuliskan konten secara penuh.
          </p>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-sky-100/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {user.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user.name || "Peneliti"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <button
          id="btn-logout"
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </aside>
  );
}
