import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get("invoiceId");

    const where: any = {};
    if (invoiceId) where.invoiceId = invoiceId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        receipt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(payments);
  } catch (err: any) {
    return errorResponse("Failed to fetch payments", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const {
      invoiceId,
      amountCents,
      method,
      idempotencyKey,
      bankUtr,
      chequeNo,
      chequeBank,
      chequeDate,
    } = body;

    if (!invoiceId || !amountCents || amountCents <= 0 || !method) {
      return errorResponse("Invalid payment submission parameters.", 400);
    }

    // 1. Idempotency Check: Return existing payment if idempotency key matches
    if (idempotencyKey) {
      const existingPayment = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { receipt: true },
      });
      if (existingPayment) {
        return successResponse(existingPayment, { idempotentReplay: true });
      }
    }

    // 2. Fetch invoice and validate outstanding balance
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: { feeHead: true },
          orderBy: { feeHead: { priorityOrder: "asc" } },
        },
      },
    });

    if (!invoice) return errorResponse("Invoice not found", 404);

    const outstandingCents = invoice.netAmountCents - invoice.paidAmountCents;
    if (amountCents > outstandingCents) {
      return errorResponse(
        `Payment amount ($${(amountCents / 100).toFixed(2)}) exceeds remaining balance of $${(outstandingCents / 100).toFixed(2)}.`,
        400
      );
    }

    // 3. Determine Payment Status
    const isCheque = method === "CHEQUE";
    const paymentStatus = isCheque ? "PENDING" : "SUCCESS";
    const chequeStatus = isCheque ? "DEPOSITED" : null;

    const count = await prisma.payment.count();
    const paymentNo = `PAY-2026-${String(count + 1).padStart(4, "0")}`;

    // 4. Atomic Transaction: Payment + Waterfall Allocation + Invoice Update + Receipt
    const result = await prisma.$transaction(async (tx) => {
      // Create Payment
      const payment = await tx.payment.create({
        data: {
          paymentNo,
          invoiceId,
          amountCents,
          method,
          status: paymentStatus,
          idempotencyKey: idempotencyKey || null,
          bankUtr: bankUtr || (method === "ONLINE_GATEWAY" ? `HDFC${Math.floor(1000000000 + Math.random() * 9000000000)}` : null),
          gatewayOrderId: method === "ONLINE_GATEWAY" ? `order_rzp_${crypto.randomBytes(4).toString("hex")}` : null,
          gatewayPaymentId: method === "ONLINE_GATEWAY" ? `pay_rzp_${crypto.randomBytes(4).toString("hex")}` : null,
          chequeNo: chequeNo || null,
          chequeBank: chequeBank || null,
          chequeDate: chequeDate || null,
          chequeStatus,
          paidAt: paymentStatus === "SUCCESS" ? new Date() : null,
          recordedByUserId: user.userId,
          reconciliationStatus: method === "ONLINE_GATEWAY" || method === "BANK_TRANSFER" ? "MATCHED" : "UNRECONCILED",
        },
      });

      // If Payment was successful, perform waterfall fee head allocation and update Invoice
      if (paymentStatus === "SUCCESS") {
        let remainingToAllocate = amountCents;

        for (const item of invoice.items) {
          if (remainingToAllocate <= 0) break;
          const unpaidOnItem = item.amountCents - item.paidCents;
          if (unpaidOnItem > 0) {
            const allocateToThis = Math.min(unpaidOnItem, remainingToAllocate);
            await tx.invoiceItem.update({
              where: { id: item.id },
              data: { paidCents: item.paidCents + allocateToThis },
            });
            remainingToAllocate -= allocateToThis;
          }
        }

        const newPaidTotal = invoice.paidAmountCents + amountCents;
        const newInvoiceStatus = newPaidTotal >= invoice.netAmountCents ? "PAID" : "PARTIALLY_PAID";

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            paidAmountCents: newPaidTotal,
            status: newInvoiceStatus,
          },
        });

        // Generate Digital Receipt with verification hash
        const rcptCount = await tx.receipt.count();
        const receiptNo = `RCPT-2026-${String(rcptCount + 1).padStart(4, "0")}`;
        const verificationHash = crypto
          .createHash("sha256")
          .update(`${receiptNo}-${payment.id}-${amountCents}-${Date.now()}`)
          .digest("hex");

        await tx.receipt.create({
          data: {
            receiptNo,
            paymentId: payment.id,
            verificationHash,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          entity: "PAYMENT",
          entityId: payment.id,
          action: "CREATE",
          performedBy: user.userId,
          afterState: JSON.stringify({ paymentNo, amountCents, method, status: paymentStatus }),
        },
      });

      return payment;
    });

    const fullPayment = await prisma.payment.findUnique({
      where: { id: result.id },
      include: { receipt: true, invoice: true },
    });

    return successResponse(fullPayment, undefined, 201);
  } catch (err: any) {
    console.error("Payment Processing Error:", err);
    return errorResponse("Failed to process payment transaction", 500);
  }
}
