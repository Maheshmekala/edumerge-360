import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { runThreeWayReconciliation } from "@/lib/engines/reconciliation";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const batches = await prisma.bankSettlementBatch.findMany({
      include: {
        records: true,
      },
      orderBy: { uploadedAt: "desc" },
    });

    const records = await prisma.bankSettlementRecord.findMany({
      orderBy: { transactionDate: "desc" },
    });

    return successResponse({ batches, records });
  } catch (err: any) {
    return errorResponse("Failed to fetch reconciliation records", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "FINANCE_OFFICER")) {
      return errorResponse("Forbidden: Only Finance Officers can execute reconciliation.", 403);
    }

    // Fetch existing bank records
    const bankRecords = await prisma.bankSettlementRecord.findMany();
    // Fetch ERP payments
    const erpPayments = await prisma.payment.findMany({
      include: { invoice: true },
    });

    const bankLines = bankRecords.map((r) => ({
      id: r.id,
      bankUtr: r.bankUtr,
      creditAmountCents: r.creditAmountCents,
      transactionDate: r.transactionDate,
      description: r.description,
    }));

    const erpRecords = erpPayments.map((p) => ({
      id: p.id,
      paymentNo: p.paymentNo,
      invoiceNo: p.invoice.invoiceNo,
      bankUtr: p.bankUtr,
      amountCents: p.amountCents,
      status: p.status,
      paidAt: p.paidAt,
    }));

    // Run 3-Way Reconciliation Engine
    const report = runThreeWayReconciliation(bankLines, erpRecords);

    // Update match status in database
    for (const res of report.results) {
      if (res.matchedPaymentId) {
        await prisma.bankSettlementRecord.updateMany({
          where: { bankUtr: res.bankUtr },
          data: {
            matchStatus: res.status,
            matchedPaymentId: res.matchedPaymentId,
            discrepancyNote: res.notes,
          },
        });

        await prisma.payment.update({
          where: { id: res.matchedPaymentId },
          data: { reconciliationStatus: res.status },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        entity: "RECONCILIATION",
        entityId: "BATCH_RUN",
        action: "APPROVE",
        performedBy: user.userId,
        afterState: JSON.stringify({
          matched: report.matchedCount,
          discrepancy: report.amountDiscrepancyCount,
          unrecognized: report.unrecognizedInErpCount,
          rate: report.reconciliationRatePercentage,
        }),
      },
    });

    return successResponse(report);
  } catch (err: any) {
    console.error("Reconciliation Engine Error:", err);
    return errorResponse("Failed to execute reconciliation engine", 500);
  }
}
