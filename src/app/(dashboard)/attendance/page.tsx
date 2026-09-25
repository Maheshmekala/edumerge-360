"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  Sparkles,
  Send,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth/client-auth";

export default function AttendancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"sessions" | "radar" | "corrections">("sessions");
  const [sessions, setSessions] = useState<any[]>([]);
  const [radar, setRadar] = useState<any>(null);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionDetail, setSessionDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionStudent, setCorrectionStudent] = useState<any>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionStatus, setCorrectionStatus] = useState("PRESENT");

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessRes, radarRes, corrRes] = await Promise.all([
        fetch("/api/attendance/sessions"),
        fetch("/api/attendance/radar"),
        fetch("/api/attendance/corrections"),
      ]);

      const sessJson = await sessRes.json();
      const radarJson = await radarRes.json();
      const corrJson = await corrRes.json();

      if (sessJson.success) setSessions(sessJson.data);
      if (radarJson.success) setRadar(radarJson.data);
      if (corrJson.success) setCorrections(corrJson.data);

      if (sessJson.data && sessJson.data.length > 0 && !selectedSession) {
        loadSessionDetail(sessJson.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetail = async (id: string) => {
    const res = await fetch(`/api/attendance/sessions/${id}`);
    const json = await res.json();
    if (json.success) {
      setSelectedSession(json.data);
      setSessionDetail(json.data);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = (studentId: string, newStatus: string) => {
    if (!sessionDetail) return;
    const updatedRecords = sessionDetail.records.map((r: any) =>
      r.studentId === studentId ? { ...r, status: newStatus } : r
    );
    setSessionDetail({ ...sessionDetail, records: updatedRecords });
  };

  const saveAttendance = async () => {
    if (!sessionDetail) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/attendance/sessions/${sessionDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: sessionDetail.records.map((r: any) => ({
            studentId: r.studentId,
            status: r.status,
            remarks: r.remarks,
          })),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        alert("Attendance updated successfully!");
        loadData();
      } else {
        alert(json.error?.message || "Failed to update attendance.");
      }
    } finally {
      setSaving(false);
    }
  };

  const submitCorrectionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDetail || !correctionStudent) return;
    try {
      const res = await fetch("/api/attendance/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionDetail.id,
          studentId: correctionStudent.id,
          requestedStatus: correctionStatus,
          reason: correctionReason,
        }),
      });
      if (res.ok) {
        alert("Correction request submitted to Dean for maker-checker review.");
        setShowCorrectionModal(false);
        setCorrectionReason("");
        loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Failed to submit request");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleCorrectionDecision = async (id: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/attendance/corrections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctionId: id,
          decision,
          reviewRemarks: decision === "APPROVED" ? "Verified official duty request" : "Insufficient justification",
        }),
      });
      if (res.ok) {
        alert(`Correction request ${decision.toLowerCase()}!`);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Action failed");
      }
    } catch {
      alert("Network error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
              Module 1
            </span>
            <h2 className="text-xl font-bold text-slate-900">Smart Attendance Management</h2>
          </div>
          <p className="text-xs text-slate-500">
            Session marking, date-locking verification, formal maker-checker corrections, and low-attendance radar.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "sessions"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Marking Sheet
          </button>
          <button
            onClick={() => setActiveTab("radar")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "radar"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>&lt;75% Warning Radar</span>
            {radar?.summary?.criticalCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white">
                {radar.summary.criticalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("corrections")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "corrections"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Correction Requests</span>
            {corrections.filter((c) => c.status === "PENDING").length > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                {corrections.filter((c) => c.status === "PENDING").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: SESSIONS & MARKING SHEET */}
      {activeTab === "sessions" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Sessions List */}
          <div className="space-y-3 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Attendance Sessions
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {sessions.length} recorded
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {sessions.map((s) => {
                const isSelected = selectedSession?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => loadSessionDetail(s.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50/40 shadow-sm ring-1 ring-blue-500"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{s.subject.code}</span>
                          <span className="text-xs text-slate-500">• Period {s.periodNumber}</span>
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-slate-600 truncate max-w-[200px]">
                          {s.subject.name}
                        </p>
                      </div>
                      {s.isLocked ? (
                        <div
                          className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                          title="Locked at 23:59 on session day"
                        >
                          <Lock className="h-3 w-3 text-slate-500" />
                          <span>Locked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Unlock className="h-3 w-3" />
                          <span>Open</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                      <span>{s.sessionDate}</span>
                      <span>Section {s.section}</span>
                      <span>{s.faculty?.user?.firstName || "Faculty"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Active Marking Sheet */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            {sessionDetail ? (
              <div className="space-y-5">
                {/* Session Header */}
                <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {sessionDetail.subject.name} ({sessionDetail.subject.code})
                      </h3>
                      {sessionDetail.isLocked && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Locked at 23:59
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Date: <strong className="text-slate-700">{sessionDetail.sessionDate}</strong> |
                      Period: <strong className="text-slate-700">{sessionDetail.periodNumber}</strong> |
                      Semester: <strong className="text-slate-700">{sessionDetail.semester}</strong> |
                      Section: <strong className="text-slate-700">{sessionDetail.section}</strong>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveAttendance}
                      disabled={saving || sessionDetail.isLocked}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-40"
                    >
                      {saving ? "Saving..." : sessionDetail.isLocked ? "Session Locked" : "Save Attendance"}
                    </button>
                  </div>
                </div>

                {/* Locked Banner Warning */}
                {sessionDetail.isLocked && (
                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Date-Locking Policy Active</p>
                      <p className="mt-0.5 text-[11px] text-amber-700 leading-relaxed">
                        This session is from a prior calendar date and was automatically locked at 23:59. Direct
                        faculty modification is blocked to prevent tampering. Click <strong>"Request Correction"</strong> beside
                        a student to submit an on-duty waiver for Dean approval.
                      </p>
                    </div>
                  </div>
                )}

                {/* Attendance Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionDetail.records?.map((rec: any) => {
                        const s = rec.student;
                        return (
                          <tr key={rec.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-semibold text-slate-800">{s.rollNo}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">
                                {s.user.firstName} {s.user.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400">{s.enrollmentNo}</p>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((st) => {
                                  const isCurrent = rec.status === st;
                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      disabled={sessionDetail.isLocked}
                                      onClick={() => handleStatusChange(s.id, st)}
                                      className={`rounded px-2 py-1 text-[10px] font-bold transition-all ${
                                        isCurrent
                                          ? st === "PRESENT"
                                            ? "bg-emerald-600 text-white"
                                            : st === "ABSENT"
                                            ? "bg-rose-600 text-white"
                                            : st === "LATE"
                                            ? "bg-amber-500 text-white"
                                            : "bg-indigo-600 text-white"
                                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="p-3 text-right">
                              {sessionDetail.isLocked ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCorrectionStudent(s);
                                    setShowCorrectionModal(true);
                                  }}
                                  className="rounded border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                  Request Correction
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400">Direct Entry</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-xs text-slate-400">
                Select an attendance session from the left to view the marking sheet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOW ATTENDANCE EARLY WARNING RADAR */}
      {activeTab === "radar" && (
        <div className="space-y-6">
          {/* Radar Metric Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-slate-400">Total Evaluated Cohort</span>
              <p className="mt-1 text-2xl font-black text-slate-900">{radar?.summary?.totalStudents || 0}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
              <span className="text-xs font-semibold text-rose-600">Critical Defaulters (&lt;65%)</span>
              <p className="mt-1 text-2xl font-black text-rose-700">{radar?.summary?.criticalCount || 0}</p>
              <p className="mt-0.5 text-[10px] text-rose-500 font-medium">Automatic Exam Hall Ticket Hold</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <span className="text-xs font-semibold text-amber-600">At-Risk Students (65%–74.9%)</span>
              <p className="mt-1 text-2xl font-black text-amber-700">{radar?.summary?.atRiskCount || 0}</p>
              <p className="mt-0.5 text-[10px] text-amber-600 font-medium">Warning letter to parents</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <span className="text-xs font-semibold text-emerald-600">Compliant (≥75%)</span>
              <p className="mt-1 text-2xl font-black text-emerald-700">{radar?.summary?.compliantCount || 0}</p>
              <p className="mt-0.5 text-[10px] text-emerald-500 font-medium">University statutory eligible</p>
            </div>
          </div>

          {/* Radar Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
              <h3 className="font-bold text-slate-900">Student Attendance Radar & Recovery Deficit</h3>
              <p className="text-xs text-slate-500">
                Sorted by lowest attendance. Identifies the exact consecutive classes needed to cross the statutory 75% threshold.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3.5">Roll No</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Course & Section</th>
                    <th className="p-3.5">Attendance Stats</th>
                    <th className="p-3.5">Percentage</th>
                    <th className="p-3.5">Regulatory Status</th>
                    <th className="p-3.5 text-right">Recovery Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {radar?.students?.map((s: any) => {
                    const isCritical = s.status === "CRITICAL_DEFAULTER";
                    const isAtRisk = s.status === "AT_RISK";
                    return (
                      <tr key={s.studentId} className={isCritical ? "bg-rose-50/30" : isAtRisk ? "bg-amber-50/20" : ""}>
                        <td className="p-3.5 font-bold text-slate-800">{s.rollNo}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{s.studentName}</p>
                          <p className="text-[10px] text-slate-400">{s.email}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-700">{s.courseCode}</span>
                          <span className="text-[10px] text-slate-400"> (Sem {s.semester} - {s.section})</span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-emerald-600">{s.presentCount}P</span> /{" "}
                          <span className="font-bold text-rose-600">{s.absentCount}A</span> /{" "}
                          <span className="text-slate-400">{s.totalSessions} Total</span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${
                                  isCritical ? "bg-rose-500" : isAtRisk ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, s.percentage)}%` }}
                              />
                            </div>
                            <span className="font-black text-slate-800">{s.percentage}%</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {isCritical ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              CRITICAL DEFAULTER
                            </span>
                          ) : isAtRisk ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              AT RISK (&lt;75%)
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              COMPLIANT
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-semibold">
                          {s.classesNeededFor75 > 0 ? (
                            <span className="text-rose-600">
                              +{s.classesNeededFor75} consecutive classes needed
                            </span>
                          ) : (
                            <span className="text-emerald-600">Requirement Met</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CORRECTION REQUESTS (MAKER-CHECKER) */}
      {activeTab === "corrections" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Attendance Maker-Checker Approval Queue</h3>
                <p className="text-xs text-slate-500">
                  Faculty submit waiver justification; Academic Dean reviews and applies atomic database updates.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {corrections.length} total requests
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Session & Date</th>
                    <th className="p-3">Requested Status</th>
                    <th className="p-3">Justification Reason</th>
                    <th className="p-3">Workflow State</th>
                    <th className="p-3 text-right">Dean Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {corrections.map((c) => {
                    const isPending = c.status === "PENDING";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{c.studentName}</p>
                          <p className="text-[10px] text-slate-400">{c.rollNo} • {c.enrollmentNo}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{c.session.subject.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {c.session.sessionDate} • Period {c.session.periodNumber}
                          </p>
                        </td>
                        <td className="p-3 font-bold text-blue-600">{c.requestedStatus}</td>
                        <td className="p-3 max-w-xs text-slate-600 truncate" title={c.reason}>
                          {c.reason}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              c.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : c.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleCorrectionDecision(c.id, "APPROVED")}
                                className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleCorrectionDecision(c.id, "REJECTED")}
                                className="rounded bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Reviewed ({c.reviewRemarks || "Decision finalized"})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Formal Correction Request Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Submit Attendance Correction Request
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              This request routes to Academic Dean for approval before modifying the locked ledger.
            </p>

            <form onSubmit={submitCorrectionRequest} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Student</label>
                <input
                  type="text"
                  disabled
                  value={`${correctionStudent?.user?.firstName} ${correctionStudent?.user?.lastName} (${correctionStudent?.rollNo})`}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Requested Status</label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="PRESENT">PRESENT (Official Duty / Medical Waiver)</option>
                  <option value="EXCUSED">EXCUSED (Approved Leave of Absence)</option>
                  <option value="ABSENT">ABSENT (Correction of erroneous entry)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Justification Reason</label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Student represented college at Smart India Hackathon finals with prior Dean approval letter."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                >
                  Submit to Dean
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
