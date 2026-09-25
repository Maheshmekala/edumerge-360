"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RotateCcw,
  Upload,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Receipt,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth/client-auth";

export default function FeesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"invoices" | "reconciliation" | "refunds">("invoices");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [reconciliationData, setReconciliationData] = useState<any>(null);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE_GATEWAY" | "CASH" | "CHEQUE">("ONLINE_GATEWAY");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [chequeNo, setChequeNo] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [invRes, recRes, refRes] = await Promise.all([
        fetch("/api/fees/invoices"),
        fetch("/api/fees/reconciliation"),
        fetch("/api/fees/refunds"),
      ]);

      const invJson = await invRes.json();
      const recJson = await recRes.json();
      const refJson = await refRes.json();

      if (invJson.success) setInvoices(invJson.data);
      if (recJson.success) setReconciliationData(recJson.data);
      if (refJson.success) setRefundRequests(refJson.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const openPaymentForInvoice = (inv: any) => {
    setSelectedInvoice(inv);
    const remainingCents = inv.netAmountCents - inv.paidAmountCents;
    setPaymentAmount((remainingCents / 100).toFixed(2));
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setProcessingPayment(true);
    try {
      const amountCents = Math.round(parseFloat(paymentAmount) * 100);
      const idempotencyKey = `idemp_${selectedInvoice.id}_${Date.now()}`;

      const res = await fetch("/api/fees/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amountCents,
          method: paymentMethod,
          idempotencyKey,
          chequeNo: paymentMethod === "CHEQUE" ? chequeNo : undefined,
          chequeBank: paymentMethod === "CHEQUE" ? chequeBank : undefined,
          chequeDate: paymentMethod === "CHEQUE" ? new Date().toISOString().split("T")[0] : undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        alert(
          `Payment of $${paymentAmount} processed successfully! Receipt: ${json.data.receipt?.receiptNo || "Generated"}`
        );
        setShowPaymentModal(false);
        loadAllData();
      } else {
        alert(json.error?.message || "Payment transaction failed.");
      }
    } finally {
      setProcessingPayment(false);
    }
  };

  const runReconciliationEngine = async () => {
    try {
      const res = await fetch("/api/fees/reconciliation", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        alert(
          `Reconciliation Complete!\nMatched: ${json.data.matchedCount}\nDiscrepancies: ${json.data.amountDiscrepancyCount}\nRate: ${json.data.reconciliationRatePercentage}%`
        );
        loadAllData();
      } else {
        alert(json.error?.message || "Reconciliation failed.");
      }
    } catch {
      alert("Network error running reconciliation.");
    }
  };

  const submitRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/fees/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: refundPaymentId,
          type: "REFUND",
          amountCents: Math.round(parseFloat(refundAmount) * 100),
          reason: refundReason,
        }),
      });
      if (res.ok) {
        alert("Refund request submitted to Finance Director for maker-checker approval!");
        setShowRefundModal(false);
        setRefundReason("");
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Failed to submit refund");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleRefundDecision = async (id: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/fees/refunds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          decision,
          notes: decision === "APPROVED" ? "Approved by Finance Director" : "Rejected after policy review",
        }),
      });
      if (res.ok) {
        alert(`Refund request ${decision.toLowerCase()}! Invoice balance adjusted.`);
        loadAllData();
      } else {
        const err = await res.json();
        alert(err.error?.message || "Decision update failed");
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
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              Module 2
            </span>
            <h2 className="text-xl font-bold text-slate-900">Fee Collection & 3-Way Reconciliation</h2>
          </div>
          <p className="text-xs text-slate-500">
            Lifecycle invoicing, counter & gateway payments, automated bank statement matching, and maker-checker refunds.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "invoices"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Student Invoices
          </button>
          <button
            onClick={() => setActiveTab("reconciliation")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "reconciliation"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>3-Way Bank Reconciliation</span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800 font-bold">
              Automated
            </span>
          </button>
          <button
            onClick={() => setActiveTab("refunds")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "refunds"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Maker-Checker Refunds</span>
            {refundRequests.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                {refundRequests.filter((r) => r.status === "PENDING").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: INVOICES & PAYMENTS */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Semester Fee Master Ledger</h3>
                <p className="text-xs text-slate-500">
                  Exact integer currency tracking with waterfall fee allocation (Tuition &gt; Exam &gt; Lab &gt; Hostel).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">{invoices.length} Invoices</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Gross & Concession</th>
                    <th className="p-3">Net Payable</th>
                    <th className="p-3">Paid Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const remainingCents = inv.netAmountCents - inv.paidAmountCents;
                    const isPaid = inv.status === "PAID";
                    const isOverdue = inv.status === "OVERDUE";
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-900">{inv.invoiceNo}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">
                            {inv.student.user.firstName} {inv.student.user.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {inv.student.rollNo} • Sem {inv.semester}
                          </p>
                        </td>
                        <td className="p-3 font-medium text-slate-600">{inv.dueDate}</td>
                        <td className="p-3">
                          <span className="text-slate-800 font-semibold">
                            ${(inv.totalAmountCents / 100).toFixed(2)}
                          </span>
                          {inv.concessionCents > 0 && (
                            <span className="block text-[10px] text-emerald-600 font-bold">
                              -${(inv.concessionCents / 100).toFixed(2)} (Scholarship)
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-black text-slate-900">
                          ${(inv.netAmountCents / 100).toFixed(2)}
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          ${(inv.paidAmountCents / 100).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : isOverdue
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {!isPaid ? (
                            <button
                              onClick={() => openPaymentForInvoice(inv)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-sm"
                            >
                              Collect / Pay
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-emerald-600 font-semibold text-[11px]">
                              <CheckCircle2 className="h-4 w-4" /> Paid in Full
                            </div>
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

      {/* TAB 2: 3-WAY RECONCILIATION */}
      {activeTab === "reconciliation" && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">3-Way Automated Bank Statement Reconciliation</h3>
                <p className="text-xs text-slate-500">
                  Matches Bank Statement CSV &lt;---&gt; Gateway Payments &lt;---&gt; ERP Student Invoices.
                </p>
              </div>
              <button
                onClick={runReconciliationEngine}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
              >
                <Sparkles className="h-4 w-4 text-emerald-200" />
                <span>Execute 3-Way Matcher Algorithm</span>
              </button>
            </div>

            {/* Reconciliation Legend */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">MATCHED (100% Exact)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="font-semibold text-slate-700">AMOUNT_DISCREPANCY (Wire Fee)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="font-semibold text-slate-700">UNRECOGNIZED_IN_ERP (Unclaimed Inward)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="font-semibold text-slate-700">MISSING_IN_BANK (Delayed Settlement)</span>
              </div>
            </div>
          </div>

          {/* Settlement Records Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-900">Ingested Bank Settlement Line Items</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Txn Date</th>
                    <th className="p-3">Bank UTR / Ref</th>
                    <th className="p-3">Bank Description</th>
                    <th className="p-3">Credit Amount</th>
                    <th className="p-3">Reconciliation Status</th>
                    <th className="p-3">Discrepancy Audit Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reconciliationData?.records?.map((r: any) => {
                    const isMatched = r.matchStatus === "MATCHED";
                    const isDiscrepancy = r.matchStatus === "AMOUNT_DISCREPANCY";
                    const isUnrecognized = r.matchStatus === "UNRECOGNIZED_IN_ERP";
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-600">{r.transactionDate}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{r.bankUtr}</td>
                        <td className="p-3 text-slate-700 max-w-xs truncate" title={r.description}>
                          {r.description}
                        </td>
                        <td className="p-3 font-black text-slate-900">
                          ${(r.creditAmountCents / 100).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isMatched
                                ? "bg-emerald-100 text-emerald-800"
                                : isDiscrepancy
                                ? "bg-amber-100 text-amber-800"
                                : isUnrecognized
                                ? "bg-purple-100 text-purple-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {r.matchStatus}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 text-[11px] max-w-md leading-relaxed">
                          {r.discrepancyNote || "Matches verified ERP Payment transaction."}
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

      {/* TAB 3: MAKER-CHECKER REFUNDS */}
      {activeTab === "refunds" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900">Maker-Checker Refund & Reversal Approval Queue</h3>
                <p className="text-xs text-slate-500">
                  Staff initiate refund request with audit reason; Finance Director reviews and approves.
                </p>
              </div>
              <button
                onClick={() => {
                  const successPayment = invoices.flatMap((i) => i.payments).find((p) => p.status === "SUCCESS");
                  if (successPayment) {
                    setRefundPaymentId(successPayment.id);
                    setRefundAmount((successPayment.amountCents / 100).toFixed(2));
                    setShowRefundModal(true);
                  } else {
                    alert("No successful payment found to refund.");
                  }
                }}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
              >
                + Initiate Refund Request
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Payment No</th>
                    <th className="p-3">Student & Invoice</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Justification Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Director Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundRequests.map((req) => {
                    const isPending = req.status === "PENDING";
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {req.payment?.paymentNo}
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">
                            {req.payment?.invoice?.student?.user?.firstName}{" "}
                            {req.payment?.invoice?.student?.user?.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Invoice: {req.payment?.invoice?.invoiceNo}
                          </p>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{req.type}</td>
                        <td className="p-3 font-black text-rose-600">
                          ${(req.amountCents / 100).toFixed(2)}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : req.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRefundDecision(req.id, "APPROVED")}
                                className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRefundDecision(req.id, "REJECTED")}
                                className="rounded bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">{req.notes || "Finalized"}</span>
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

      {/* Collect / Pay Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Collect / Settle Payment: {selectedInvoice.invoiceNo}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Student: {selectedInvoice.student.user.firstName} {selectedInvoice.student.user.lastName} (
              {selectedInvoice.student.rollNo})
            </p>

            <form onSubmit={handleProcessPayment} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Payment Channel</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(["ONLINE_GATEWAY", "CASH", "CHEQUE"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`rounded-lg border p-2 text-xs font-bold transition-all ${
                        paymentMethod === m
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m === "ONLINE_GATEWAY" ? "Gateway / UPI" : m === "CASH" ? "Counter Cash" : "Bank Cheque"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Amount to Collect ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {paymentMethod === "CHEQUE" && (
                <div className="space-y-3 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Cheque Number</label>
                    <input
                      type="text"
                      required
                      value={chequeNo}
                      onChange={(e) => setChequeNo(e.target.value)}
                      placeholder="e.g. CHQ-994102"
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Bank Branch</label>
                    <input
                      type="text"
                      required
                      value={chequeBank}
                      onChange={(e) => setChequeBank(e.target.value)}
                      placeholder="e.g. State Bank of India"
                      className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {processingPayment ? "Recording Payment..." : "Confirm & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Initiate Fee Refund Request</h3>
            <p className="mt-1 text-xs text-slate-500">
              Maker-checker protocol: Requires Finance Director sign-off before balance is reversed.
            </p>

            <form onSubmit={submitRefundRequest} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Refund Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Audit Justification</label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Student cancelled hostel accommodation before start of term; refundable deposit reversed."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
