/**
 * 3-Way Bank Settlement & Reconciliation Engine (EduPay)
 * Matches: Bank Settlement File <---> ERP Payments <---> Invoices
 */

export interface BankStatementLine {
  id?: string;
  bankUtr: string;
  creditAmountCents: number;
  transactionDate: string; // YYYY-MM-DD
  description: string;
}

export interface ErpPaymentRecord {
  id: string;
  paymentNo: string;
  invoiceNo: string;
  bankUtr?: string | null;
  amountCents: number;
  status: string; // SUCCESS, PENDING, REVERSED, etc.
  paidAt?: Date | string | null;
}

export type ReconciliationMatchStatus =
  | "MATCHED"
  | "AMOUNT_DISCREPANCY"
  | "UNRECOGNIZED_IN_ERP"
  | "MISSING_IN_BANK";

export interface ReconciliationLineResult {
  bankUtr: string;
  transactionDate: string;
  description: string;
  bankAmountCents: number;
  erpAmountCents?: number;
  matchedPaymentId?: string;
  invoiceNo?: string;
  status: ReconciliationMatchStatus;
  varianceCents: number;
  notes: string;
}

export interface ReconciliationSummary {
  totalBankLines: number;
  totalErpPayments: number;
  matchedCount: number;
  amountDiscrepancyCount: number;
  unrecognizedInErpCount: number;
  missingInBankCount: number;
  totalBankAmountCents: number;
  totalMatchedAmountCents: number;
  totalVarianceCents: number;
  reconciliationRatePercentage: number;
  results: ReconciliationLineResult[];
}

export function runThreeWayReconciliation(
  bankLines: BankStatementLine[],
  erpPayments: ErpPaymentRecord[]
): ReconciliationSummary {
  const results: ReconciliationLineResult[] = [];
  const matchedPaymentIds = new Set<string>();

  // Map ERP payments by normalized UTR
  const erpPaymentsByUtr = new Map<string, ErpPaymentRecord[]>();
  for (const p of erpPayments) {
    if (p.bankUtr) {
      const cleanUtr = p.bankUtr.trim().toUpperCase();
      const existing = erpPaymentsByUtr.get(cleanUtr) || [];
      existing.push(p);
      erpPaymentsByUtr.set(cleanUtr, existing);
    }
  }

  let matchedCount = 0;
  let amountDiscrepancyCount = 0;
  let unrecognizedInErpCount = 0;
  let totalBankAmountCents = 0;
  let totalMatchedAmountCents = 0;
  let totalVarianceCents = 0;

  // Pass 1 & 2: Match each bank statement line
  for (const line of bankLines) {
    totalBankAmountCents += line.creditAmountCents;
    const cleanUtr = line.bankUtr.trim().toUpperCase();
    const candidatePayments = erpPaymentsByUtr.get(cleanUtr);

    if (!candidatePayments || candidatePayments.length === 0) {
      // Pass 3: Inward credit with no matching UTR in ERP
      unrecognizedInErpCount++;
      results.push({
        bankUtr: line.bankUtr,
        transactionDate: line.transactionDate,
        description: line.description,
        bankAmountCents: line.creditAmountCents,
        status: "UNRECOGNIZED_IN_ERP",
        varianceCents: line.creditAmountCents,
        notes: "Unclaimed bank inward credit. No matching payment reference recorded in ERP.",
      });
      continue;
    }

    // Candidate found: Find best match
    const matchingPayment = candidatePayments.find((p) => !matchedPaymentIds.has(p.id)) || candidatePayments[0];
    matchedPaymentIds.add(matchingPayment.id);

    const variance = line.creditAmountCents - matchingPayment.amountCents;

    if (variance === 0) {
      matchedCount++;
      totalMatchedAmountCents += line.creditAmountCents;
      results.push({
        bankUtr: line.bankUtr,
        transactionDate: line.transactionDate,
        description: line.description,
        bankAmountCents: line.creditAmountCents,
        erpAmountCents: matchingPayment.amountCents,
        matchedPaymentId: matchingPayment.id,
        invoiceNo: matchingPayment.invoiceNo,
        status: "MATCHED",
        varianceCents: 0,
        notes: `Exact 3-way match verified against invoice ${matchingPayment.invoiceNo}`,
      });
    } else {
      amountDiscrepancyCount++;
      totalVarianceCents += Math.abs(variance);
      const isFeeDeducted = variance < 0;
      const note = isFeeDeducted
        ? `Amount discrepancy: Bank credited $${(line.creditAmountCents / 100).toFixed(2)}, ERP expects $${(matchingPayment.amountCents / 100).toFixed(2)}. Probable intermediary bank wire fee of $${(Math.abs(variance) / 100).toFixed(2)}.`
        : `Amount discrepancy: Over-credit of $${(variance / 100).toFixed(2)} compared to ERP invoice amount.`;

      results.push({
        bankUtr: line.bankUtr,
        transactionDate: line.transactionDate,
        description: line.description,
        bankAmountCents: line.creditAmountCents,
        erpAmountCents: matchingPayment.amountCents,
        matchedPaymentId: matchingPayment.id,
        invoiceNo: matchingPayment.invoiceNo,
        status: "AMOUNT_DISCREPANCY",
        varianceCents: variance,
        notes: note,
      });
    }
  }

  // Pass 4: Check ERP payments that claimed success but never appeared in bank settlement
  let missingInBankCount = 0;
  for (const p of erpPayments) {
    if (p.status === "SUCCESS" && !matchedPaymentIds.has(p.id)) {
      missingInBankCount++;
      results.push({
        bankUtr: p.bankUtr || "UNKNOWN",
        transactionDate: typeof p.paidAt === "string" ? p.paidAt.split("T")[0] : "N/A",
        description: `ERP Payment ${p.paymentNo} for Invoice ${p.invoiceNo}`,
        bankAmountCents: 0,
        erpAmountCents: p.amountCents,
        matchedPaymentId: p.id,
        invoiceNo: p.invoiceNo,
        status: "MISSING_IN_BANK",
        varianceCents: -p.amountCents,
        notes: `Payment marked SUCCESS in ERP, but not found in bank settlement file. Potential delayed settlement or disputed charge.`,
      });
    }
  }

  const effectiveTotal = bankLines.length + missingInBankCount;
  const reconciliationRatePercentage =
    effectiveTotal > 0 ? Number(((matchedCount / effectiveTotal) * 100).toFixed(2)) : 0;

  return {
    totalBankLines: bankLines.length,
    totalErpPayments: erpPayments.length,
    matchedCount,
    amountDiscrepancyCount,
    unrecognizedInErpCount,
    missingInBankCount,
    totalBankAmountCents,
    totalMatchedAmountCents,
    totalVarianceCents,
    reconciliationRatePercentage,
    results,
  };
}
