import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const semester = searchParams.get("semester") || "5";
    const section = searchParams.get("section") || "A";

    const slots = await prisma.timetableSlot.findMany({
      where: {
        semester: parseInt(semester, 10),
        section,
      },
      include: {
        subject: true,
        room: true,
        faculty: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { periodNo: "asc" }],
    });

    const rooms = await prisma.room.findMany();
    const subjects = await prisma.subject.findMany({
      where: { semester: parseInt(semester, 10) },
    });

    return successResponse({ slots, rooms, subjects });
  } catch (err: any) {
    return errorResponse("Failed to fetch timetable slots", 500);
  }
}
