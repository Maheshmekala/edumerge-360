"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/client-auth";
import { ShieldAlert, Bell, CheckCircle2 } from "lucide-react";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Executive Operations Overview", subtitle: "Unified cross-module institutional health metrics" },
  "/attendance": { title: "Smart Attendance Management", subtitle: "Daily biometric/class marking, date-locking & low-attendance radar" },
  "/fees": { title: "Fee Collection & 3-Way Reconciliation", subtitle: "Invoices, installment payments, bank CSV matcher & maker-checker refunds" },
  "/timetable": { title: "Intelligent Timetable Generator", subtitle: "Constraint Satisfaction Solver with hard collision avoidance & diagnostics" },
  "/support": { title: "Student Support & Helpdesk", subtitle: "Category routing, SLA countdown timers & escalation workflows" },
  "/admissions": { title: "Admission Lead Management CRM", subtitle: "Weighted round-robin routing, follow-up scheduler & conversion funnel" },
  "/audit": { title: "Compliance & Audit Trail", subtitle: "Immutable forensic event log with before/after state diffs" },
};

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();

  const currentMeta = pageTitles[pathname] || {
    title: "Enterprise Campus OS",
    subtitle: "Unified Institutional Administration",
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "ACADEMIC_ADMIN":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "FINANCE_OFFICER":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FACULTY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "COUNSELLOR":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur-md">
      <div>
        <h1 className="text-base font-bold text-slate-900">{currentMeta.title}</h1>
        <p className="text-xs text-slate-500">{currentMeta.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Academic Session */}
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AY 2025–26 (Semester 5)</span>
        </div>

        {/* Role Pill */}
        <div
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getRoleBadge(
            user?.role
          )}`}
        >
          <span>{user?.role || "GUEST"}</span>
        </div>

        {/* Notification bell mock */}
        <div className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </div>
      </div>
    </header>
  );
}
