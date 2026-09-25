import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const semester = searchParams.get("semester");
    const section = searchParams.get("section");

    const where: any = {};
    if (semester) where.semester = parseInt(semester, 10);
    if (section) where.section = section;

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        subject: true,
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        _count: {
          select: { records: true, corrections: true },
        },
      },
      orderBy: [{ sessionDate: "desc" }, { periodNumber: "asc" }],
      take: 50,
    });

    return successResponse(sessions);
  } catch (err: any) {
    return errorResponse("Failed to fetch attendance sessions", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { subjectId, semester, section, sessionDate, periodNumber } = body;

    if (!subjectId || !semester || !section || !sessionDate || !periodNumber) {
      return errorResponse("Missing required fields", 400);
    }

    // Find faculty profile
    const faculty = await prisma.facultyProfile.findFirst({
      where: { userId: user.userId },
    });

    if (!faculty && user.role !== "SUPER_ADMIN") {
      return errorResponse("Only faculty can create an attendance session", 403);
    }

    const facultyId = faculty ? faculty.id : (await prisma.facultyProfile.findFirst())?.id;
    if (!facultyId) return errorResponse("No faculty profile found", 400);

    // Create session
    const session = await prisma.attendanceSession.create({
      data: {
        subjectId,
        facultyId,
        semester: parseInt(semester, 10),
        section,
        sessionDate,
        periodNumber: parseInt(periodNumber, 10),
      },
      include: {
        subject: true,
      },
    });

    // Auto-create blank PRESENT records for all enrolled students in section
    const students = await prisma.studentProfile.findMany({
      where: {
        currentSemester: parseInt(semester, 10),
        section,
      },
    });

    if (students.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: students.map((s) => ({
          sessionId: session.id,
          studentId: s.id,
          status: "PRESENT",
        })),
      });
    }

    return successResponse(session, undefined, 201);
  } catch (err: any) {
    if (err.code === "P2002") {
      return errorResponse("An attendance session already exists for this subject, date and period.", 409);
    }
    return errorResponse("Failed to create attendance session", 500);
  }
}
