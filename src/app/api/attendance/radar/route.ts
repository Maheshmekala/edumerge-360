import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateStudentAttendanceRadar } from "@/lib/engines/attendance-radar";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        course: true,
        attendanceRecords: {
          select: { status: true },
        },
      },
    });

    const radarResults = students.map((s) => {
      const summary = calculateStudentAttendanceRadar(
        {
          id: s.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          enrollmentNo: s.enrollmentNo,
          rollNo: s.rollNo,
        },
        s.attendanceRecords
      );
      return {
        ...summary,
        courseCode: s.course.code,
        semester: s.currentSemester,
        section: s.section,
        email: s.user.email,
      };
    });

    // Grouping
    const criticalDefaulters = radarResults.filter((r) => r.status === "CRITICAL_DEFAULTER");
    const atRisk = radarResults.filter((r) => r.status === "AT_RISK");
    const compliant = radarResults.filter((r) => r.status === "COMPLIANT");

    return successResponse({
      summary: {
        totalStudents: radarResults.length,
        criticalCount: criticalDefaulters.length,
        atRiskCount: atRisk.length,
        compliantCount: compliant.length,
      },
      students: radarResults.sort((a, b) => a.percentage - b.percentage),
    });
  } catch (err: any) {
    return errorResponse("Failed to calculate attendance radar", 500);
  }
}
