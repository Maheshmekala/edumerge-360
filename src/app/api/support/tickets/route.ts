import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateTicketSla } from "@/lib/engines/sla-calculator";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (category && category !== "ALL") where.category = category;

    // If student, view only own tickets
    if (user.role === "STUDENT") {
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { userId: user.userId },
      });
      if (studentProfile) where.studentId = studentProfile.id;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = tickets.map((t) => {
      const sla = calculateTicketSla(t.id, t.slaDueAt, t.status, t.isEscalated);
      return {
        ...t,
        slaStatus: sla,
      };
    });

    return successResponse(enriched);
  } catch (err: any) {
    return errorResponse("Failed to fetch support tickets", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { category, priority, title, description } = body;

    if (!category || !priority || !title || !description) {
      return errorResponse("All ticket fields are required.", 400);
    }

    // Determine student ID
    let studentId = "";
    if (user.role === "STUDENT") {
      const sp = await prisma.studentProfile.findUnique({ where: { userId: user.userId } });
      if (!sp) return errorResponse("Student profile not found", 400);
      studentId = sp.id;
    } else {
      const firstStudent = await prisma.studentProfile.findFirst();
      studentId = firstStudent?.id || "";
    }

    // Determine SLA hours based on priority
    let slaHours = 48; // default MEDIUM
    if (priority === "CRITICAL") slaHours = 12;
    else if (priority === "HIGH") slaHours = 24;
    else if (priority === "LOW") slaHours = 72;

    const slaDueAt = new Date(Date.now() + slaHours * 60 * 60 * 1000);
    const count = await prisma.ticket.count();
    const ticketNo = `TICK-2026-${String(count + 1).padStart(4, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNo,
        studentId,
        category,
        priority,
        status: "OPEN",
        title,
        description,
        slaHours,
        slaDueAt,
        activities: {
          create: {
            actorId: user.userId,
            action: "CREATE",
            toState: "OPEN",
            remarks: "Ticket created by user",
          },
        },
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        entity: "TICKET",
        entityId: ticket.id,
        action: "CREATE",
        performedBy: user.userId,
        afterState: JSON.stringify({ ticketNo, category, priority, slaHours }),
      },
    });

    return successResponse(ticket, undefined, 201);
  } catch (err: any) {
    console.error("Create Ticket Error:", err);
    return errorResponse("Failed to create ticket", 500);
  }
}
