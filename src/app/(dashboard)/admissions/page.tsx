"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth/client-auth";

export default function AdmissionsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Lead Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [source, setSource] = useState("WEBSITE");
  const [interestedCourse, setInterestedCourse] = useState("BTECH-CSE");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Follow-up Activity Form State
  const [activityType, setActivityType] = useState("CALL");
  const [activityNotes, setActivityNotes] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [nextFollowUpHours, setNextFollowUpHours] = useState("24");
  const [updating, setUpdating] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admissions/leads");
      const json = await res.json();
      if (json.success) {
        setLeads(json.data);
        if (json.data.length > 0 && !selectedLead) {
          setSelectedLead(json.data[0]);
          setLeadStatus(json.data[0].status);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          city,
          source,
          interestedCourse,
          notes,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert(
          `Lead intake successful! Automatically assigned to counsellor via round-robin workload balancing.`
        );
        setShowCreateModal(false);
        setFullName("");
        setEmail("");
        setPhone("");
        setNotes("");
        loadLeads();
      } else {
        alert(json.error?.message || "Failed to intake lead");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admissions/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedLead.id,
          status: leadStatus,
          activityType,
          notes: activityNotes,
          nextFollowUpHours,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert("Follow-up logged and next touchpoint scheduled!");
        setActivityNotes("");
        loadLeads();
      } else {
        alert("Failed to log activity.");
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              Module 5
            </span>
            <h2 className="text-xl font-bold text-slate-900">Admission Lead Management CRM</h2>
          </div>
          <p className="text-xs text-slate-500">
            Weighted round-robin routing, counsellor workload balancing, follow-up scheduler & conversion funnel.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-500"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Inbound Lead Intake</span>
        </button>
      </div>

      {/* Main CRM Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Lead Pipeline List */}
        <div className="space-y-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Prospects ({leads.length})
            </h3>
            <span className="text-xs font-semibold text-slate-400">Pipeline</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[650px] pr-1">
            {leads.map((l) => {
              const isSelected = selectedLead?.id === l.id;
              const isOverdue = l.ageing?.isOverdue;
              return (
                <div
                  key={l.id}
                  onClick={() => {
                    setSelectedLead(l);
                    setLeadStatus(l.status);
                  }}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/40 shadow-sm ring-1 ring-amber-500"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{l.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{l.leadNo} • {l.city || "Direct"}</p>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        l.status === "ENROLLED"
                          ? "bg-emerald-100 text-emerald-800"
                          : l.status === "QUALIFIED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] font-semibold text-slate-700">
                    Course: <span className="text-indigo-600">{l.interestedCourse}</span>
                  </div>

                  {/* Follow-up Ageing */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                    <span className="text-slate-400">Counsellor: {l.counsellorName}</span>
                    <div
                      className={`flex items-center gap-1 font-bold ${
                        isOverdue ? "text-rose-600 animate-pulse" : "text-slate-600"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span>{l.ageing?.statusLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Lead Detail & Follow-up Logger */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          {selectedLead ? (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-700">
                    {selectedLead.leadNo}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                    Source: {selectedLead.source}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{selectedLead.fullName}</h3>
                <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {selectedLead.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {selectedLead.phone}
                  </span>
                  <span>Interested in: <strong>{selectedLead.interestedCourse}</strong></span>
                </div>
              </div>

              {/* Counsellor Notes */}
              <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                <strong>Intake Profile Notes:</strong> {selectedLead.notes || "No notes recorded."}
              </div>

              {/* Activity History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Follow-Up Touchpoint Log ({selectedLead.activities?.length || 0})
                </h4>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedLead.activities?.map((a: any) => (
                    <div key={a.id} className="rounded-lg border border-slate-100 bg-white p-3 text-xs shadow-sm">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span className="font-bold text-slate-700">{a.activityType}</span>
                        <span>{new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{a.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log Next Touchpoint */}
              <form onSubmit={handleUpdateActivity} className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900">Record Follow-up & Move Funnel</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Channel</label>
                    <select
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="CALL">Phone Call</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="EMAIL">Email Brochure</option>
                      <option value="CAMPUS_VISIT">Campus Tour</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Stage</label>
                    <select
                      value={leadStatus}
                      onChange={(e) => setLeadStatus(e.target.value)}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-bold outline-none"
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="COUNSELLING">COUNSELLING</option>
                      <option value="APPLICATION_STARTED">APPLICATION_STARTED</option>
                      <option value="ENROLLED">ENROLLED (Converted)</option>
                      <option value="LOST">LOST</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Next Follow-Up</label>
                    <select
                      value={nextFollowUpHours}
                      onChange={(e) => setNextFollowUpHours(e.target.value)}
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="6">In 6 Hours</option>
                      <option value="24">In 24 Hours</option>
                      <option value="48">In 2 Days</option>
                      <option value="120">In 5 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    required
                    value={activityNotes}
                    onChange={(e) => setActivityNotes(e.target.value)}
                    placeholder="Enter call outcome, scholarship queries, or parent concerns..."
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updating}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "Log Activity"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">
              Select a lead from the left to view touchpoint logs.
            </div>
          )}
        </div>
      </div>

      {/* New Inbound Lead Intake Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Inbound Lead Intake</h3>
            <p className="mt-1 text-xs text-slate-500">
              Executes weighted round-robin algorithm matching course specialists and lowest active workload.
            </p>

            <form onSubmit={handleCreateLead} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@gmail.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Phone</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                  >
                    <option value="WEBSITE">Website Form</option>
                    <option value="WALK_IN">Campus Walk-in</option>
                    <option value="PHONE">Inbound Call</option>
                    <option value="EDUCATION_FAIR">Education Expo</option>
                    <option value="REFERRAL">Student Referral</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Course Preference</label>
                  <select
                    value={interestedCourse}
                    onChange={(e) => setInterestedCourse(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none"
                  >
                    <option value="BTECH-CSE">B.Tech Computer Science</option>
                    <option value="MBA-FIN">MBA Finance</option>
                    <option value="BTECH-ECE">B.Tech Electronics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Counsellor Discovery Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Scored 91% in 12th board exams. Inquired about merit scholarship."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none"
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
                  disabled={submitting}
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {submitting ? "Routing..." : "Intake & Auto-Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
