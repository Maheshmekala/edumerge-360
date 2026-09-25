import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateTicketSla } from "@/lib/engines/sla-calculator";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            course: true,
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) return errorResponse("Ticket not found", 404);

    const slaStatus = calculateTicketSla(ticket.id, ticket.slaDueAt, ticket.status, ticket.isEscalated);

    return successResponse({
      ...ticket,
      slaStatus,
    });
  } catch (err: any) {
    return errorResponse("Failed to fetch ticket details", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const { status, comment, isInternal = false, isEscalated } = body;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return errorResponse("Ticket not found", 404);

    const dataToUpdate: any = {};
    if (status) {
      dataToUpdate.status = status;
      if (status === "RESOLVED") dataToUpdate.resolvedAt = new Date();
      if (status === "CLOSED") dataToUpdate.closedAt = new Date();
    }
    if (isEscalated !== undefined) {
      dataToUpdate.isEscalated = isEscalated;
      if (isEscalated) dataToUpdate.escalatedAt = new Date();
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.update({
        where: { id },
        data: dataToUpdate,
      });

      // Add comment if provided
      if (comment) {
        await tx.ticketComment.create({
          data: {
            ticketId: id,
            authorId: user.userId,
            message: comment,
            isInternal,
          },
        });
      }

      // Add activity entry
      if (status && status !== ticket.status) {
        await tx.ticketActivity.create({
          data: {
            ticketId: id,
            actorId: user.userId,
            action: "STATUS_CHANGE",
            fromState: ticket.status,
            toState: status,
            remarks: comment || `Status updated to ${status}`,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          entity: "TICKET",
          entityId: id,
          action: "UPDATE",
          performedBy: user.userId,
          afterState: JSON.stringify({ status, isEscalated }),
        },
      });

      return t;
    });

    return successResponse(updated);
  } catch (err: any) {
    console.error("Update Ticket Error:", err);
    return errorResponse("Failed to update ticket", 500);
  }
}
