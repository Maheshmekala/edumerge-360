"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  Grid,
  LifeBuoy,
  Users,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/auth/client-auth";

const navItems = [
  { label: "Executive 360", href: "/dashboard", icon: LayoutDashboard },
  { label: "Smart Attendance", href: "/attendance", icon: CalendarCheck, badge: "Mod 1" },
  { label: "Fee & Reconciliation", href: "/fees", icon: CreditCard, badge: "Mod 2" },
  { label: "Timetable CSP Solver", href: "/timetable", icon: Grid, badge: "Mod 3" },
  { label: "SLA Support Desk", href: "/support", icon: LifeBuoy, badge: "Mod 4" },
  { label: "Admissions CRM", href: "/admissions", icon: Users, badge: "Mod 5" },
  { label: "Audit & Compliance", href: "/audit", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, switchRole, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-slate-900">Edumerge</span>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
              360
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500">Enterprise Campus OS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Enterprise Modules
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    isActive ? "bg-blue-200/60 text-blue-800" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Evaluator Quick Role Switcher */}
      <div className="border-t border-slate-200 bg-slate-50/80 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Evaluator Role Switch</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">RBAC</span>
        </div>
        <select
          value={user?.role || "SUPER_ADMIN"}
          onChange={(e) => switchRole(e.target.value)}
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {Object.entries(DEMO_CREDENTIALS).map(([roleKey, data]) => (
            <option key={roleKey} value={roleKey}>
              {data.label}
            </option>
          ))}
        </select>
      </div>

      {/* User Card */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900">
              {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
            </p>
            <p className="truncate text-[11px] font-medium text-slate-500">{user?.role}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
          >
            <span className="text-xs font-bold">Exit</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
