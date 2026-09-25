import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");

    const where: any = {};
    if (entity && entity !== "ALL") where.entity = entity;
    if (action && action !== "ALL") where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    return successResponse(logs);
  } catch (err: any) {
    return errorResponse("Failed to fetch audit logs", 500);
  }
}
