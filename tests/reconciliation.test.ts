import { describe, it, expect } from "vitest";
import {
  runThreeWayReconciliation,
  BankStatementLine,
  ErpPaymentRecord,
} from "../src/lib/engines/reconciliation";

describe("3-Way Bank Reconciliation Engine", () => {
  it("should correctly identify an exact 3-way match", () => {
    const bankLines: BankStatementLine[] = [
      {
        bankUtr: "HDFC9982410884",
        creditAmountCents: 300000,
        transactionDate: "2026-09-22",
        description: "CMS E-COLLECT INV-2026-0001",
      },
    ];

    const erpPayments: ErpPaymentRecord[] = [
      {
        id: "pay-1",
        paymentNo: "PAY-2026-0001",
        invoiceNo: "INV-2026-0001",
        bankUtr: "HDFC9982410884",
        amountCents: 300000,
        status: "SUCCESS",
      },
    ];

    const result = runThreeWayReconciliation(bankLines, erpPayments);

    expect(result.matchedCount).toBe(1);
    expect(result.amountDiscrepancyCount).toBe(0);
    expect(result.unrecognizedInErpCount).toBe(0);
    expect(result.results[0].status).toBe("MATCHED");
    expect(result.results[0].varianceCents).toBe(0);
    expect(result.reconciliationRatePercentage).toBe(100);
  });

  it("should flag AMOUNT_DISCREPANCY when bank statement amount differs from ERP expected amount", () => {
    const bankLines: BankStatementLine[] = [
      {
        bankUtr: "AXIS123456789",
        creditAmountCents: 498500, // $4,985 ($15 wire charge deducted)
        transactionDate: "2026-09-23",
        description: "WIRE INWARD",
      },
    ];

    const erpPayments: ErpPaymentRecord[] = [
      {
        id: "pay-2",
        paymentNo: "PAY-2026-0002",
        invoiceNo: "INV-2026-0002",
        bankUtr: "AXIS123456789",
        amountCents: 500000, // $5,000
        status: "SUCCESS",
      },
    ];

    const result = runThreeWayReconciliation(bankLines, erpPayments);

    expect(result.matchedCount).toBe(0);
    expect(result.amountDiscrepancyCount).toBe(1);
    expect(result.results[0].status).toBe("AMOUNT_DISCREPANCY");
    expect(result.results[0].varianceCents).toBe(-1500); // -$15.00
    expect(result.results[0].notes).toContain("$15.00");
  });

  it("should flag UNRECOGNIZED_IN_ERP when bank statement contains unknown inward credit", () => {
    const bankLines: BankStatementLine[] = [
      {
        bankUtr: "UNKNOWN_UTR_999",
        creditAmountCents: 250000,
        transactionDate: "2026-09-24",
        description: "DIRECT CASH DEPOSIT AT BRANCH",
      },
    ];

    const erpPayments: ErpPaymentRecord[] = [];

    const result = runThreeWayReconciliation(bankLines, erpPayments);

    expect(result.unrecognizedInErpCount).toBe(1);
    expect(result.results[0].status).toBe("UNRECOGNIZED_IN_ERP");
  });

  it("should flag MISSING_IN_BANK when ERP payment marked SUCCESS has not settled in bank", () => {
    const bankLines: BankStatementLine[] = [];

    const erpPayments: ErpPaymentRecord[] = [
      {
        id: "pay-ghost",
        paymentNo: "PAY-2026-0099",
        invoiceNo: "INV-2026-0099",
        bankUtr: "UTR_NEVER_SETTLED",
        amountCents: 100000,
        status: "SUCCESS",
        paidAt: "2026-09-20",
      },
    ];

    const result = runThreeWayReconciliation(bankLines, erpPayments);

    expect(result.missingInBankCount).toBe(1);
    expect(result.results[0].status).toBe("MISSING_IN_BANK");
  });
});
