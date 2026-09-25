"use client";

import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Send,
  Plus,
  Filter,
  Search,
  User,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/lib/auth/client-auth";

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // New Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("FINANCE");
  const [priority, setPriority] = useState("HIGH");
  const [creating, setCreating] = useState(false);

  // Response Form State
  const [replyMessage, setReplyMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/support/tickets?status=${statusFilter}&category=${categoryFilter}`
      );
      const json = await res.json();
      if (json.success) {
        setTickets(json.data);
        if (json.data.length > 0 && !selectedTicket) {
          loadTicketDetail(json.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (id: string) => {
    const res = await fetch(`/api/support/tickets/${id}`);
    const json = await res.json();
    if (json.success) {
      setSelectedTicket(json.data);
      setNewStatus(json.data.status);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [statusFilter, categoryFilter]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, priority, title, description }),
      });
      const json = await res.json();
      if (res.ok) {
        alert("Grievance ticket created successfully!");
        setShowCreateModal(false);
        setTitle("");
        setDescription("");
        loadTickets();
      } else {
        alert(json.error?.message || "Failed to create ticket");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus !== selectedTicket.status ? newStatus : undefined,
          comment: replyMessage || undefined,
          isInternal,
        }),
      });
      if (res.ok) {
        setReplyMessage("");
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      } else {
        alert("Failed to update ticket.");
      }
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEscalated: true,
          comment: "Managerial escalation triggered for SLA breach review.",
          isInternal: true,
        }),
      });
      if (res.ok) {
        alert("Ticket escalated to Academic Dean / Director!");
        loadTicketDetail(selectedTicket.id);
        loadTickets();
      }
    } catch {
      alert("Escalation failed.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800">
              Module 4
            </span>
            <h2 className="text-xl font-bold text-slate-900">Student Support & SLA Helpdesk</h2>
          </div>
          <p className="text-xs text-slate-500">
            Categorized grievance routing, live SLA countdown timers, auto-escalation, and activity logs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/20 hover:bg-purple-500"
        >
          <Plus className="h-4 w-4" />
          <span>+ Log Grievance Ticket</span>
        </button>
      </div>

      {/* Main Support Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Ticket Queue */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Support Queues
            </h3>
            <span className="text-xs font-semibold text-slate-400">{tickets.length} tickets</span>
          </div>

          {/* Ticket Cards */}
          <div className="space-y-2 overflow-y-auto max-h-[650px] pr-1">
            {tickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const sla = t.slaStatus;
              return (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetail(t.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-50/40 shadow-sm ring-1 ring-purple-500"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{t.ticketNo}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        t.priority === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : t.priority === "HIGH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>

                  <h4 className="mt-1 font-bold text-xs text-slate-900 line-clamp-1">{t.title}</h4>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{t.description}</p>

                  {/* SLA Countdown Pill */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                    <span className="font-bold text-slate-600">{t.category}</span>
                    <div
                      className={`flex items-center gap-1 font-bold ${
                        sla?.isBreached
                          ? "text-rose-600 animate-pulse"
                          : sla?.urgencyLevel === "CRITICAL"
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{sla?.humanCountdown}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Conversation & Action Thread */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          {selectedTicket ? (
            <div className="space-y-6">
              {/* Ticket Top Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-purple-700">
                      {selectedTicket.ticketNo}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {selectedTicket.category}
                    </span>
                    {selectedTicket.isEscalated && (
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> ESCALATED TO DEAN
                      </span>
                    )}
                  </div>

                  {!selectedTicket.isEscalated && (
                    <button
                      onClick={handleEscalate}
                      className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                    >
                      Escalate to Director
                    </button>
                  )}
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900">{selectedTicket.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Logged by: <strong>{selectedTicket.student?.user?.firstName} {selectedTicket.student?.user?.lastName}</strong> ({selectedTicket.student?.rollNo})
                </p>
              </div>

              {/* Description Box */}
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                {selectedTicket.description}
              </div>

              {/* Comments Thread */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Response & Resolution History ({selectedTicket.comments?.length || 0})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedTicket.comments?.map((c: any) => (
                    <div
                      key={c.id}
                      className={`rounded-lg p-3 text-xs ${
                        c.isInternal
                          ? "bg-amber-50/70 border border-amber-200 text-amber-950"
                          : "bg-slate-100/70 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                        <span>{c.isInternal ? "🔒 Internal Staff Note" : "💬 Public Response"}</span>
                        <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="leading-relaxed">{c.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply / Status Transition Form */}
              <form onSubmit={handleUpdateTicket} className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-600">Update Status:</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="WAITING_ON_STUDENT">WAITING_ON_STUDENT</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      id="internalNote"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="h-3.5 w-3.5 rounded"
                    />
                    <label htmlFor="internalNote" className="cursor-pointer text-[11px] font-medium">
                      Internal Staff Note
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Enter resolution notes or student reply..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="absolute right-3 bottom-3 flex items-center gap-1 rounded bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>Post Update</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Select a ticket from the left to view details and SLA metrics.
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Log New Grievance Ticket</h3>
            <p className="mt-1 text-xs text-slate-500">
              Routes directly to the responsible institutional department with SLA tracking.
            </p>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Department Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                >
                  <option value="FINANCE">FINANCE (Fee receipts, bank refunds, scholarships)</option>
                  <option value="ACADEMICS">ACADEMICS (Attendance, syllabus, on-duty leave)</option>
                  <option value="HOSTEL">HOSTEL (Room allocation, mess facilities, Wi-Fi)</option>
                  <option value="EXAM">EXAMINATION (Hall tickets, grade cards, transcripts)</option>
                  <option value="IT">IT SUPPORT (Portal logins, lab workstation errors)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Urgency Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                >
                  <option value="CRITICAL">CRITICAL (12 Hours SLA)</option>
                  <option value="HIGH">HIGH (24 Hours SLA)</option>
                  <option value="MEDIUM">MEDIUM (48 Hours SLA)</option>
                  <option value="LOW">LOW (72 Hours SLA)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Subject / Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Discrepancy in fee receipt generation"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide all relevant details and transaction references..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {creating ? "Submitting..." : "Submit Grievance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
