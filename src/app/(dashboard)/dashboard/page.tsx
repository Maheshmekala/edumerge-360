"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  CalendarCheck,
  Grid,
  LifeBuoy,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/client-auth";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 w-full animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const feeData = stats?.fees || {};
  const attData = stats?.attendance || {};
  const supportData = stats?.support || {};
  const crmData = stats?.admissions || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Pre-Drive Unified Solution Architecture</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Welcome back, {user?.firstName} {user?.lastName}
          </h2>
          <p className="mt-1 text-sm text-blue-100/90 leading-relaxed">
            All 5 institutional business engines are fully synchronized in real-time. Review pending
            reconciliations, date-locked attendance sessions, constraint-solved schedules, and SLA
            escalations.
          </p>
        </div>
        {/* Background decorative glow */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Cross-Domain KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Fee Collection Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Module 2 • Fees
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ${((feeData.totalCollectedCents || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Collected of ${( (feeData.totalProjectedCents || 0) / 100 ).toLocaleString("en-US", { minimumFractionDigits: 2 })} projected
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-emerald-600">{feeData.collectionRate}% Realized</span>
            <Link href="/fees" className="font-medium text-blue-600 hover:underline flex items-center gap-0.5">
              Reconcile <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Smart Attendance Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Module 1 • Attendance
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{attData.overallAttendanceRate}%</div>
            <p className="mt-1 text-xs text-slate-500">Campus-wide average attendance</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-amber-600">
              {attData.pendingCorrections} Pending Corrections
            </span>
            <Link href="/attendance" className="font-medium text-blue-600 hover:underline flex items-center gap-0.5">
              Radar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* SLA Support Desk Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Module 4 • Support SLA
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <LifeBuoy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{supportData.openTickets} Open</div>
            <p className="mt-1 text-xs text-slate-500">Student grievance tickets</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {supportData.escalatedTickets} Escalated
            </span>
            <Link href="/support" className="font-medium text-blue-600 hover:underline flex items-center gap-0.5">
              Queues <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Admissions CRM Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Module 5 • Admissions
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{crmData.conversionRate}%</div>
            <p className="mt-1 text-xs text-slate-500">{crmData.enrolledLeads} of {crmData.totalLeads} Enrolled</p>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-rose-600">
              {crmData.overdueFollowUps} Overdue Follow-ups
            </span>
            <Link href="/admissions" className="font-medium text-blue-600 hover:underline flex items-center gap-0.5">
              Funnel <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5-Domain Architecture Quick Nav Showcase */}
      <div>
        <h3 className="mb-4 text-base font-bold text-slate-900">
          Integrated Solution Showcase (All 5 Challenge Modules)
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Module 1 Box */}
          <Link
            href="/attendance"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600">
                  1. Smart Attendance
                </h4>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Daily class session marking, automatic date locking at 23:59, formal maker-checker
              corrections, and real-time &lt;75% low-attendance early warning radar.
            </p>
          </Link>

          {/* Module 2 Box */}
          <Link
            href="/fees"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-600">
                  2. Fees & 3-Way Rec
                </h4>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Multi-state payment lifecycle, counter cash/cheque clearance, idempotent online
              checkout, automated 3-way bank CSV reconciliation, and maker-checker refunds.
            </p>
          </Link>

          {/* Module 3 Box */}
          <Link
            href="/timetable"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-indigo-50 p-2 text-indigo-600">
                  <Grid className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600">
                  3. Timetable CSP Solver
                </h4>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Constraint Satisfaction Problem solver with zero-tolerance hard collision rules (faculty,
              room, capacity) and conflict explanation engine for impossible schedules.
            </p>
          </Link>

          {/* Module 4 Box */}
          <Link
            href="/support"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-purple-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-purple-50 p-2 text-purple-600">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-purple-600">
                  4. SLA Support Desk
                </h4>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600" />
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Student grievance ticketing with category routing, live countdown SLA timers, automated
              escalation triggers, and complete activity history audits.
            </p>
          </Link>

          {/* Module 5 Box */}
          <Link
            href="/admissions"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-amber-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-amber-50 p-2 text-amber-600">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-amber-600">
                  5. Admissions CRM
                </h4>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600" />
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Inbound prospect funnel, weighted round-robin counsellor assignment balancing active
              workloads, overdue follow-up tracking, and source ROI attribution.
            </p>
          </Link>

          {/* Auditability Box */}
          <Link
            href="/audit"
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-slate-700">
                  Compliance & Audit
                </h4>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
            </div>
            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Tamper-proof event journal tracking who executed every action, exact before/after state
              JSON diffs, timestamps, and IP addresses across all 5 modules.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
