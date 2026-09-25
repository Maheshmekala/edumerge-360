import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            course: true,
            concessions: true,
          },
        },
        items: {
          include: { feeHead: true },
          orderBy: { feeHead: { priorityOrder: "asc" } },
        },
        payments: {
          include: { receipt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!invoice) return errorResponse("Invoice not found", 404);

    return successResponse(invoice);
  } catch (err: any) {
    return errorResponse("Failed to fetch invoice details", 500);
  }
}
