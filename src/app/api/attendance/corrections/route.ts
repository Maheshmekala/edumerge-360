import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const corrections = await prisma.attendanceCorrection.findMany({
      include: {
        session: {
          include: {
            subject: true,
            faculty: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Populate student user info
    const enriched = await Promise.all(
      corrections.map(async (c) => {
        const student = await prisma.studentProfile.findUnique({
          where: { id: c.studentId },
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        });
        return {
          ...c,
          studentName: student ? `${student.user.firstName} ${student.user.lastName}` : "Unknown",
          enrollmentNo: student?.enrollmentNo,
          rollNo: student?.rollNo,
        };
      })
    );

    return successResponse(enriched);
  } catch (err: any) {
    return errorResponse("Failed to fetch correction requests", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { sessionId, studentId, requestedStatus, reason } = body;

    if (!sessionId || !studentId || !requestedStatus || !reason) {
      return errorResponse("All fields are required for correction request.", 400);
    }

    const correction = await prisma.attendanceCorrection.create({
      data: {
        sessionId,
        studentId,
        requestedStatus,
        reason,
        status: "PENDING",
        requestedBy: user.userId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        entity: "ATTENDANCE_CORRECTION",
        entityId: correction.id,
        action: "CREATE",
        performedBy: user.userId,
        afterState: JSON.stringify({ sessionId, studentId, requestedStatus, reason }),
      },
    });

    return successResponse(correction, undefined, 201);
  } catch (err: any) {
    return errorResponse("Failed to submit correction request", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    // Only Academic Dean or Super Admin can approve/reject corrections
    if (user.role !== "SUPER_ADMIN" && user.role !== "ACADEMIC_ADMIN") {
      return errorResponse("Only Academic Dean or Super Admin can review attendance corrections.", 403);
    }

    const body = await req.json();
    const { correctionId, decision, reviewRemarks } = body; // decision: "APPROVED" | "REJECTED"

    if (!correctionId || !["APPROVED", "REJECTED"].includes(decision)) {
      return errorResponse("Valid correctionId and decision (APPROVED or REJECTED) required.", 400);
    }

    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: correctionId },
    });

    if (!correction) return errorResponse("Correction request not found", 404);
    if (correction.status !== "PENDING") {
      return errorResponse(`Correction has already been ${correction.status.toLowerCase()}`, 400);
    }

    // Atomic transaction: If approved, update attendance record
    const updated = await prisma.$transaction(async (tx) => {
      const corr = await tx.attendanceCorrection.update({
        where: { id: correctionId },
        data: {
          status: decision,
          reviewedBy: user.userId,
          reviewedAt: new Date(),
          reviewRemarks,
        },
      });

      if (decision === "APPROVED") {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: correction.sessionId,
              studentId: correction.studentId,
            },
          },
          update: {
            status: correction.requestedStatus,
            remarks: `Approved correction by Dean: ${reviewRemarks || "Official Waiver"}`,
          },
          create: {
            sessionId: correction.sessionId,
            studentId: correction.studentId,
            status: correction.requestedStatus,
            remarks: `Approved correction by Dean: ${reviewRemarks || "Official Waiver"}`,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: "ATTENDANCE_CORRECTION",
          entityId: correctionId,
          action: decision,
          performedBy: user.userId,
          afterState: JSON.stringify({ decision, reviewRemarks }),
        },
      });

      return corr;
    });

    return successResponse(updated);
  } catch (err: any) {
    console.error("Correction Decision Error:", err);
    return errorResponse("Failed to update correction decision", 500);
  }
}
