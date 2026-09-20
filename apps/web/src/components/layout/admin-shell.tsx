"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Compass,
  MapPin,
  Building,
  Bus,
  ShieldAlert,
  Server,
  Users,
  Settings,
  HelpCircle,
  Wrench,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { DESIGN_TOKENS } from "@/lib/tokens";

interface NavGroup {
  label: string;
  items: { label: string; href: string; icon: React.ElementType }[];
}

const ADMIN_NAVIGATION: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Editorial Content",
    items: [
      { label: "News & Articles", href: "/admin?tab=articles", icon: Newspaper },
      { label: "Visual Discoveries", href: "/admin?tab=discoveries", icon: Compass },
      { label: "Quizzes", href: "/quiz", icon: HelpCircle },
      { label: "Utilities & Tools", href: "/tools", icon: Wrench },
    ],
  },
  {
    label: "Travel & Places",
    items: [
      { label: "Destinations", href: "/travel", icon: MapPin },
      { label: "Hotels & Stays", href: "/travel/siem-reap", icon: Building },
      { label: "Transit Routes", href: "/travel/transport", icon: Bus },
    ],
  },
  {
    label: "Operations & Systems",
    items: [
      { label: "Security & WAF", href: "/admin/security", icon: ShieldAlert },
      { label: "Infrastructure", href: "/admin/infrastructure", icon: Server },
      { label: "Community Submissions", href: "/travel/suggest", icon: Users },
    ],
  },
];

export interface AdminShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({ title, description, actions, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex flex-col md:flex-row text-slate-900 dark:text-slate-100">
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <span className="font-bold text-sm tracking-tight">Admin Console</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-slate-600 dark:text-slate-300"
          aria-label="Toggle Admin Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 z-30 h-screen w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-700 flex items-center justify-center text-white text-xs font-bold">
              DD
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
              Admin Platform
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
            title="View Public Website"
          >
            Live
            <ExternalLink size={11} />
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {ADMIN_NAVIGATION.map((group) => (
            <div key={group.label}>
              <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {group.label}
              </h4>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <Icon size={16} className={isActive ? "text-teal-700 dark:text-teal-400" : "text-slate-400"} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>v1.2.0 • Production</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="All Services Healthy" />
        </div>
      </aside>

      {/* Main Administrative Workplace */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>

          {/* Body Content */}
          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
