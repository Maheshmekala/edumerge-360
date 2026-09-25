import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 1. Fee Metrics
    const invoices = await prisma.invoice.findMany({
      select: {
        totalAmountCents: true,
        paidAmountCents: true,
        netAmountCents: true,
        status: true,
      },
    });

    let totalProjectedCents = 0;
    let totalCollectedCents = 0;
    let totalOverdueCents = 0;

    for (const inv of invoices) {
      totalProjectedCents += inv.netAmountCents;
      totalCollectedCents += inv.paidAmountCents;
      if (inv.status === "OVERDUE") {
        totalOverdueCents += inv.netAmountCents - inv.paidAmountCents;
      }
    }

    const unreconciledBankRecords = await prisma.bankSettlementRecord.count({
      where: { matchStatus: { not: "MATCHED" } },
    });

    // 2. Attendance Metrics
    const totalRecords = await prisma.attendanceRecord.count();
    const presentRecords = await prisma.attendanceRecord.count({
      where: { status: { in: ["PRESENT", "EXCUSED"] } },
    });
    const overallAttendanceRate =
      totalRecords > 0 ? Number(((presentRecords / totalRecords) * 100).toFixed(1)) : 100;

    const pendingCorrections = await prisma.attendanceCorrection.count({
      where: { status: "PENDING" },
    });

    // 3. Timetable Metrics
    const totalSlots = await prisma.timetableSlot.count();
    const totalRooms = await prisma.room.count();

    // 4. Support Tickets Metrics
    const openTickets = await prisma.ticket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_STUDENT"] } },
    });
    const escalatedTickets = await prisma.ticket.count({
      where: { isEscalated: true, status: { notIn: ["RESOLVED", "CLOSED"] } },
    });

    // 5. Admission CRM Metrics
    const totalLeads = await prisma.lead.count();
    const enrolledLeads = await prisma.lead.count({
      where: { status: "ENROLLED" },
    });
    const conversionRate =
      totalLeads > 0 ? Number(((enrolledLeads / totalLeads) * 100).toFixed(1)) : 0;

    const now = new Date();
    const overdueFollowUps = await prisma.lead.count({
      where: {
        nextFollowUpAt: { lt: now },
        status: { notIn: ["ENROLLED", "LOST", "DISQUALIFIED"] },
      },
    });

    return successResponse({
      fees: {
        totalProjectedCents,
        totalCollectedCents,
        totalOverdueCents,
        collectionRate:
          totalProjectedCents > 0
            ? Number(((totalCollectedCents / totalProjectedCents) * 100).toFixed(1))
            : 0,
        unreconciledBankRecords,
      },
      attendance: {
        overallAttendanceRate,
        pendingCorrections,
        totalSessions: await prisma.attendanceSession.count(),
      },
      timetable: {
        totalSlots,
        totalRooms,
      },
      support: {
        openTickets,
        escalatedTickets,
      },
      admissions: {
        totalLeads,
        enrolledLeads,
        conversionRate,
        overdueFollowUps,
      },
    });
  } catch (err: any) {
    console.error("Dashboard Stats Error:", err);
    return errorResponse("Failed to calculate dashboard statistics", 500);
  }
}
