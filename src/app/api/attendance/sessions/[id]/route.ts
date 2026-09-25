import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { isAttendanceSessionLocked } from "@/lib/engines/attendance-radar";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;

    const session = await prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        subject: true,
        faculty: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        records: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
          orderBy: { student: { rollNo: "asc" } },
        },
        corrections: true,
      },
    });

    if (!session) return errorResponse("Attendance session not found", 404);

    return successResponse(session);
  } catch (err: any) {
    return errorResponse("Failed to fetch session", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const { records } = body; // Array of { studentId, status, remarks }

    const session = await prisma.attendanceSession.findUnique({ where: { id } });
    if (!session) return errorResponse("Session not found", 404);

    // Enforce Date-Locking Rule: Past date sessions cannot be directly edited by faculty
    const lockCheck = isAttendanceSessionLocked(session.sessionDate);
    if (session.isLocked || (lockCheck.isLocked && user.role !== "SUPER_ADMIN" && user.role !== "ACADEMIC_ADMIN")) {
      return errorResponse(
        lockCheck.reason || "This session is locked. Please submit an Attendance Correction Request.",
        423 // HTTP 423 Locked
      );
    }

    // Atomic transaction updating records
    await prisma.$transaction(
      records.map((r: any) =>
        prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: id,
              studentId: r.studentId,
            },
          },
          update: {
            status: r.status,
            remarks: r.remarks,
          },
          create: {
            sessionId: id,
            studentId: r.studentId,
            status: r.status,
            remarks: r.remarks,
          },
        })
      )
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        entity: "ATTENDANCE",
        entityId: id,
        action: "UPDATE",
        performedBy: user.userId,
        afterState: JSON.stringify({ updatedCount: records.length }),
      },
    });

    return successResponse({ message: "Attendance saved successfully" });
  } catch (err: any) {
    console.error("Attendance Update Error:", err);
    return errorResponse("Failed to update attendance", 500);
  }
}
