"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Search, Filter, Clock, Eye, Code } from "lucide-react";
import { useAuth } from "@/lib/auth/client-auth";

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit/logs?entity=${entityFilter}`);
      const json = await res.json();
      if (json.success) setLogs(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [entityFilter]);

  return (
    <div className="space-y-6">
      {/* Title & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-800">
              Forensic Trail
            </span>
            <h2 className="text-xl font-bold text-slate-900">Compliance & Immutable Audit Journal</h2>
          </div>
          <p className="text-xs text-slate-500">
            Cryptographically sealed event ledger capturing actor identity, entity state diffs, timestamps & IPs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Filter Entity:</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm outline-none"
          >
            <option value="ALL">All Entities (360° Trail)</option>
            <option value="ATTENDANCE">Attendance Sessions</option>
            <option value="ATTENDANCE_CORRECTION">Attendance Corrections</option>
            <option value="INVOICE">Fee Invoices</option>
            <option value="PAYMENT">Fee Payments</option>
            <option value="RECONCILIATION">Bank Reconciliation</option>
            <option value="REFUND_REQUEST">Maker-Checker Refunds</option>
            <option value="TIMETABLE">Timetable Solves</option>
            <option value="TICKET">Grievance Tickets</option>
            <option value="LEAD">Admission Leads</option>
          </select>
        </div>
      </div>

      {/* Main Audit Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Logs Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              System Events ({logs.length})
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Append-Only Storage</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor / User</th>
                  <th className="p-3 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`cursor-pointer transition-all ${
                        isSelected ? "bg-blue-50/60 font-semibold" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-bold text-slate-900">{log.entity}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            log.action === "CREATE"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.action === "UPDATE"
                              ? "bg-blue-100 text-blue-800"
                              : log.action === "APPROVE"
                              ? "bg-purple-100 text-purple-800"
                              : log.action === "LOCK"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-800">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"}
                        </p>
                        <p className="text-[10px] text-slate-400">{log.user?.role || "SYSTEM"}</p>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-slate-50"
                        >
                          View Diff
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* State Diff Inspector */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 lg:col-span-1">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Forensic State Inspector</h3>
            <p className="text-xs text-slate-400">Exact snapshot before and after execution</p>
          </div>

          {selectedLog ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                <p>
                  <strong>Entity ID:</strong> <span className="font-mono">{selectedLog.entityId}</span>
                </p>
                <p>
                  <strong>IP Address:</strong>{" "}
                  <span className="font-mono">{selectedLog.ipAddress || "127.0.0.1"}</span>
                </p>
                <p>
                  <strong>Logged At:</strong> {new Date(selectedLog.timestamp).toISOString()}
                </p>
              </div>

              {selectedLog.beforeState && (
                <div>
                  <h4 className="text-[11px] font-bold text-rose-600 uppercase mb-1">
                    Before State (Previous)
                  </h4>
                  <pre className="rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-rose-300 overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.beforeState), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.afterState && (
                <div>
                  <h4 className="text-[11px] font-bold text-emerald-600 uppercase mb-1">
                    After State (New State)
                  </h4>
                  <pre className="rounded-lg bg-slate-900 p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    {JSON.stringify(JSON.parse(selectedLog.afterState), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-xs text-slate-400 text-center p-4">
              Select an audit event from the table to inspect previous and new state JSON diffs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
