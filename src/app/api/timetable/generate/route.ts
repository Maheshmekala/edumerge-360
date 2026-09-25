import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateTimetableCSP } from "@/lib/engines/timetable-csp";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ACADEMIC_ADMIN")) {
      return errorResponse("Forbidden: Only Academic Dean or Admin can run timetable generation.", 403);
    }

    const body = await req.json();
    const {
      academicYear = "2025-2026",
      semester = 5,
      section = "A",
      classSize = 55,
      daysPerWeek = 5,
      periodsPerDay = 4,
    } = body;

    // Fetch subjects with faculty
    const subjects = await prisma.subject.findMany({
      where: { semester: parseInt(semester, 10) },
    });

    const faculties = await prisma.facultyProfile.findMany({
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    if (faculties.length === 0) {
      return errorResponse("No faculty profiles available for assignment.", 400);
    }

    // Map subjects to requirements
    const subjectRequirements = subjects.map((sub, idx) => {
      const assignedFac = faculties[idx % faculties.length];
      const isLab = sub.type === "LAB";
      return {
        id: sub.id,
        code: sub.code,
        name: sub.name,
        type: (isLab ? "LAB" : "THEORY") as "LAB" | "THEORY",
        weeklyHours: isLab ? 2 : 4,
        facultyId: assignedFac.id,
        facultyName: `${assignedFac.user.firstName} ${assignedFac.user.lastName}`,
      };
    });

    const rooms = await prisma.room.findMany({
      where: { isActive: true },
    });

    // Run CSP Solver
    const result = generateTimetableCSP({
      academicYear,
      semester: parseInt(semester, 10),
      section,
      classSize: parseInt(classSize, 10),
      daysPerWeek: parseInt(daysPerWeek, 10),
      periodsPerDay: parseInt(periodsPerDay, 10),
      subjects: subjectRequirements,
      rooms: rooms.map((r) => ({
        id: r.id,
        roomNo: r.roomNo,
        type: r.type,
        capacity: r.capacity,
      })),
    });

    if (!result.success) {
      return successResponse(result, {
        message: "Timetable constraints could not be fully satisfied. Detailed diagnostic report returned.",
      });
    }

    // Persist solved timetable to database in an atomic transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing slots for this section
      await tx.timetableSlot.deleteMany({
        where: {
          academicYear,
          semester: parseInt(semester, 10),
          section,
        },
      });

      // Insert new generated slots
      await tx.timetableSlot.createMany({
        data: result.slots.map((s) => ({
          academicYear: s.academicYear,
          semester: s.semester,
          section: s.section,
          dayOfWeek: s.dayOfWeek,
          periodNo: s.periodNo,
          subjectId: s.subjectId,
          facultyId: s.facultyId,
          roomId: s.roomId,
        })),
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          entity: "TIMETABLE",
          entityId: `${academicYear}_SEM${semester}_${section}`,
          action: "CREATE",
          performedBy: user.userId,
          afterState: JSON.stringify({ slotsCount: result.slots.length, solveTime: result.stats.solveTimeMs }),
        },
      });
    });

    return successResponse(result, { message: "Timetable generated and saved successfully!" });
  } catch (err: any) {
    console.error("Timetable Generator Error:", err);
    return errorResponse("Failed to generate timetable", 500);
  }
}
