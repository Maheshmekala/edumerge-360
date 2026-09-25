import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser(req);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        studentProfile: {
          include: {
            course: true,
          },
        },
        facultyProfile: true,
      },
    });

    if (!user) {
      return errorResponse("User not found", 404);
    }

    return successResponse(user);
  } catch (err: any) {
    return errorResponse("Failed to fetch session", 500);
  }
}

export async function POST() {
  // Logout
  const response = successResponse({ message: "Logged out successfully" });
  response.cookies.set("edumerge_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
