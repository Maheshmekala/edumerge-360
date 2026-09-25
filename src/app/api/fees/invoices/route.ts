import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;

    // If student, restrict to their own invoices
    if (user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.userId },
      });
      if (studentProfile) {
        where.studentId = studentProfile.id;
      }
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { student: { user: { firstName: { contains: search } } } },
        { student: { user: { lastName: { contains: search } } } },
        { student: { enrollmentNo: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            course: true,
          },
        },
        items: {
          include: { feeHead: true },
        },
        payments: {
          select: {
            id: true,
            paymentNo: true,
            amountCents: true,
            method: true,
            status: true,
            paidAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(invoices);
  } catch (err: any) {
    return errorResponse("Failed to fetch invoices", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "FINANCE_OFFICER")) {
      return errorResponse("Forbidden: Only Finance Officers can generate invoices.", 403);
    }

    const body = await req.json();
    const { studentId, academicYear, semester, dueDate, items } = body;

    if (!studentId || !academicYear || !semester || !dueDate || !items || items.length === 0) {
      return errorResponse("All fields including itemized fee heads are required.", 400);
    }

    // Check for applicable concession
    const concession = await prisma.studentConcession.findFirst({
      where: { studentId, academicYear, semester: parseInt(semester, 10) },
    });

    const concessionCents = concession ? concession.amountCents : 0;
    const totalAmountCents = items.reduce((sum: number, it: any) => sum + parseInt(it.amountCents, 10), 0);
    const netAmountCents = Math.max(0, totalAmountCents - concessionCents);

    const count = await prisma.invoice.count();
    const invoiceNo = `INV-2026-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        studentId,
        academicYear,
        semester: parseInt(semester, 10),
        dueDate,
        totalAmountCents,
        concessionCents,
        netAmountCents,
        paidAmountCents: 0,
        status: "ISSUED",
        items: {
          create: items.map((it: any) => ({
            feeHeadId: it.feeHeadId,
            amountCents: parseInt(it.amountCents, 10),
            paidCents: 0,
          })),
        },
      },
      include: { items: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entity: "INVOICE",
        entityId: invoice.id,
        action: "CREATE",
        performedBy: user.userId,
        afterState: JSON.stringify({ invoiceNo, netAmountCents, studentId }),
      },
    });

    return successResponse(invoice, undefined, 201);
  } catch (err: any) {
    console.error("Generate Invoice Error:", err);
    return errorResponse("Failed to generate invoice", 500);
  }
}
