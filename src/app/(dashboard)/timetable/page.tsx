"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Building,
  User,
  Sliders,
  Play,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/client-auth";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [1, 2, 3, 4, 5];

export default function TimetablePage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [solving, setSolving] = useState(false);
  const [solverResult, setSolverResult] = useState<any>(null);

  // Configuration Form for CSP Solver
  const [semester, setSemester] = useState(5);
  const [section, setSection] = useState("A");
  const [classSize, setClassSize] = useState(55);
  const [periodsPerDay, setPeriodsPerDay] = useState(4);
  const [simulateImpossible, setSimulateImpossible] = useState(false);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timetable/slots?semester=${semester}&section=${section}`);
      const json = await res.json();
      if (json.success) {
        setSlots(json.data.slots);
        setRooms(json.data.rooms);
        setSubjects(json.data.subjects);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [semester, section]);

  const runCspSolver = async () => {
    setSolving(true);
    setSolverResult(null);
    try {
      const payload = {
        semester,
        section,
        // If simulateImpossible is checked, pass classSize of 120 (rooms only seat 80 max) or 2 periods per day (10 total slots for 14 hours) to trigger conflicts
        classSize: simulateImpossible ? 120 : classSize,
        periodsPerDay: simulateImpossible ? 2 : periodsPerDay,
        daysPerWeek: 5,
      };

      const res = await fetch("/api/timetable/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setSolverResult(json.data);

      if (json.data?.success) {
        alert(`Timetable generated successfully in ${json.data.stats?.solveTimeMs}ms!`);
        loadSlots();
      }
    } catch {
      alert("Failed to execute CSP generator.");
    } finally {
      setSolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
              Module 3
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Intelligent Timetable Generator (CSP Solver)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Constraint Satisfaction Problem engine with zero-collision hard constraints and conflict diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runCspSolver}
            disabled={solving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-indigo-200" />
            <span>{solving ? "Solving Constraints..." : "Run CSP Solver Engine"}</span>
          </button>
        </div>
      </div>

      {/* Solver Configuration Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(parseInt(e.target.value, 10))}
                className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs outline-none"
              >
                <option value={5}>Semester 5 (B.Tech CSE)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Division Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs outline-none"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Enrolled Class Size</label>
              <input
                type="number"
                value={classSize}
                onChange={(e) => setClassSize(parseInt(e.target.value, 10))}
                className="w-20 rounded border border-slate-200 px-2 py-1 text-xs outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Periods / Day</label>
              <input
                type="number"
                value={periodsPerDay}
                onChange={(e) => setPeriodsPerDay(parseInt(e.target.value, 10))}
                className="w-16 rounded border border-slate-200 px-2 py-1 text-xs outline-none"
              />
            </div>
          </div>

          {/* Conflict Simulator Checkbox for Evaluation Demo */}
          <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-xs text-amber-900">
            <input
              type="checkbox"
              id="conflictSim"
              checked={simulateImpossible}
              onChange={(e) => setSimulateImpossible(e.target.checked)}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="conflictSim" className="cursor-pointer font-bold">
              Simulate Impossible Constraints (Trigger Explainer)
            </label>
          </div>
        </div>
      </div>

      {/* Solver Diagnostics Report (when conflicts occur or on solve) */}
      {solverResult && (
        <div
          className={`rounded-xl border p-5 shadow-sm ${
            solverResult.success
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-rose-200 bg-rose-50/60"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {solverResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertOctagon className="h-5 w-5 text-rose-600" />
              )}
              <h4 className="font-bold text-slate-900">
                {solverResult.success
                  ? `CSP Feasibility Verified: Collision-Free Timetable Generated (${solverResult.stats?.solveTimeMs}ms)`
                  : "Constraint Satisfaction Bottleneck: Schedule Impossible"}
              </h4>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Requested: {solverResult.stats?.totalRequestedHours}h | Available:{" "}
              {solverResult.stats?.totalSlotsAvailable} slots
            </div>
          </div>

          {/* Conflict Explanations */}
          {solverResult.conflicts && solverResult.conflicts.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-rose-200/60 pt-3">
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Conflict Diagnostics & Suggested Resolutions:
              </p>
              {solverResult.conflicts.map((c: any, idx: number) => (
                <div key={idx} className="rounded-lg bg-white p-3 border border-rose-200 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700">{c.entityName}</span>
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      {c.type}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-700 font-medium">{c.reason}</p>
                  <p className="mt-1 text-slate-500 text-[11px] leading-relaxed">
                    💡 <strong>Suggested Resolution:</strong> {c.suggestedResolution}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive 5-Day Timetable Grid */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">
              Weekly Schedule: B.Tech Computer Science (Sem 5 - Section A)
            </h3>
            <p className="text-xs text-slate-500">
              Guarantees zero professor double-booking, zero room collision, and lab capacity matching.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">{slots.length} Active Slots</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-3.5 border-r border-slate-200 w-28 text-center">Day / Time</th>
                {PERIODS.map((p) => (
                  <th key={p} className="p-3.5 border-r border-slate-200 last:border-r-0 text-center">
                    Period {p} <span className="block text-[10px] font-normal text-slate-400">09:00 - 10:00</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {DAYS.map((dayName, dIdx) => {
                const dayOfWeek = dIdx + 1;
                return (
                  <tr key={dayOfWeek} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-800 bg-slate-50/50 border-r border-slate-200 text-center">
                      {dayName}
                    </td>
                    {PERIODS.map((periodNo) => {
                      const slot = slots.find(
                        (s) => s.dayOfWeek === dayOfWeek && s.periodNo === periodNo
                      );
                      const isLab = slot?.subject?.type === "LAB";

                      return (
                        <td
                          key={periodNo}
                          className="p-2 border-r border-slate-200 last:border-r-0 align-top min-w-[170px]"
                        >
                          {slot ? (
                            <div
                              className={`rounded-lg p-3 transition-all shadow-sm ${
                                isLab
                                  ? "bg-purple-50/80 border border-purple-200 text-purple-950"
                                  : "bg-blue-50/80 border border-blue-200 text-blue-950"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs">{slot.subject.code}</span>
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                    isLab
                                      ? "bg-purple-200 text-purple-800"
                                      : "bg-blue-200 text-blue-800"
                                  }`}
                                >
                                  {isLab ? "LAB" : "THEORY"}
                                </span>
                              </div>
                              <p className="mt-1 font-semibold text-[11px] leading-tight line-clamp-1">
                                {slot.subject.name}
                              </p>

                              <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/50 pt-2 text-[10px]">
                                <span className="flex items-center gap-1 font-medium text-slate-600">
                                  <User className="h-3 w-3 text-slate-400" />
                                  {slot.faculty?.user?.firstName || "Faculty"}
                                </span>
                                <span className="flex items-center gap-1 font-bold text-slate-700 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/50">
                                  <Building className="h-2.5 w-2.5 text-slate-400" />
                                  {slot.room.roomNo}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-[11px] text-slate-400">
                              Free Slot
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
