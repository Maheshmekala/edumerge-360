import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const requests = await prisma.refundReversalRequest.findMany({
      include: {
        payment: {
          include: {
            invoice: {
              include: {
                student: {
                  include: { user: { select: { firstName: true, lastName: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(requests);
  } catch (err: any) {
    return errorResponse("Failed to fetch refund requests", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { paymentId, type, amountCents, reason } = body;

    if (!paymentId || !type || !amountCents || !reason) {
      return errorResponse("All fields are required.", 400);
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return errorResponse("Payment record not found", 404);
    if (payment.status !== "SUCCESS") {
      return errorResponse("Only successful payments can be refunded or reversed.", 400);
    }

    const request = await prisma.refundReversalRequest.create({
      data: {
        paymentId,
        type, // REFUND or REVERSAL
        amountCents: parseInt(amountCents, 10),
        reason,
        status: "PENDING",
        requestedBy: user.userId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entity: "REFUND_REQUEST",
        entityId: request.id,
        action: "CREATE",
        performedBy: user.userId,
        afterState: JSON.stringify({ paymentId, type, amountCents, reason }),
      },
    });

    return successResponse(request, undefined, 201);
  } catch (err: any) {
    return errorResponse("Failed to submit refund/reversal request", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || user.role !== "SUPER_ADMIN") {
      return errorResponse("Forbidden: Only Finance Director / Super Admin can approve refunds.", 403);
    }

    const body = await req.json();
    const { requestId, decision, notes } = body; // decision: "APPROVED" | "REJECTED"

    if (!requestId || !["APPROVED", "REJECTED"].includes(decision)) {
      return errorResponse("Valid requestId and decision (APPROVED or REJECTED) required.", 400);
    }

    const request = await prisma.refundReversalRequest.findUnique({
      where: { id: requestId },
      include: { payment: { include: { invoice: true } } },
    });

    if (!request) return errorResponse("Request not found", 404);
    if (request.status !== "PENDING") {
      return errorResponse(`Request is already ${request.status.toLowerCase()}`, 400);
    }

    // Atomic transaction: If approved, update payment status and adjust invoice balance
    const updated = await prisma.$transaction(async (tx) => {
      const updatedReq = await tx.refundReversalRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          approvedBy: user.userId,
          notes,
          resolvedAt: new Date(),
        },
      });

      if (decision === "APPROVED") {
        const newPaymentStatus = request.type === "REFUND" ? "REFUNDED" : "REVERSED";

        await tx.payment.update({
          where: { id: request.paymentId },
          data: { status: newPaymentStatus },
        });

        // Deduct paid amount from invoice
        const currentPaid = request.payment.invoice.paidAmountCents;
        const newPaid = Math.max(0, currentPaid - request.amountCents);
        const newInvoiceStatus = newPaid === 0 ? "OVERDUE" : "PARTIALLY_PAID";

        await tx.invoice.update({
          where: { id: request.payment.invoiceId },
          data: {
            paidAmountCents: newPaid,
            status: newInvoiceStatus,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: "REFUND_REQUEST",
          entityId: requestId,
          action: decision,
          performedBy: user.userId,
          afterState: JSON.stringify({ decision, notes, amountCents: request.amountCents }),
        },
      });

      return updatedReq;
    });

    return successResponse(updated);
  } catch (err: any) {
    console.error("Refund Approval Error:", err);
    return errorResponse("Failed to process refund decision", 500);
  }
}
