import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api-response";
import { routeLeadRoundRobin, calculateLeadAgeingStatus } from "@/lib/engines/lead-router";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (source && source !== "ALL") where.source = source;

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { leadNo: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Populate counsellor names and ageing status
    const enriched = await Promise.all(
      leads.map(async (l) => {
        let counsellorName = "Unassigned";
        if (l.assignedTo) {
          const c = await prisma.user.findUnique({
            where: { id: l.assignedTo },
            select: { firstName: true, lastName: true },
          });
          if (c) counsellorName = `${c.firstName} ${c.lastName}`;
        }
        const ageing = calculateLeadAgeingStatus(l.nextFollowUpAt);
        return {
          ...l,
          counsellorName,
          ageing,
        };
      })
    );

    return successResponse(enriched);
  } catch (err: any) {
    return errorResponse("Failed to fetch leads", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { fullName, email, phone, city, source, interestedCourse, notes } = body;

    if (!fullName || !email || !phone || !source || !interestedCourse) {
      return errorResponse("Missing required lead fields.", 400);
    }

    // Fetch active counsellors and their workloads for Round-Robin assignment
    const counsellors = await prisma.user.findMany({
      where: { role: { in: ["COUNSELLOR", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    const workloads = await Promise.all(
      counsellors.map(async (c) => {
        const count = await prisma.lead.count({
          where: {
            assignedTo: c.id,
            status: { notIn: ["ENROLLED", "LOST", "DISQUALIFIED"] },
          },
        });
        return {
          counsellorId: c.id,
          counsellorName: `${c.firstName} ${c.lastName}`,
          activeLeadCount: count,
          maxCapacity: 40,
          specializedCourse: interestedCourse, // simulate matching specialization
        };
      })
    );

    const assignment = routeLeadRoundRobin(
      { interestedCourse, source },
      workloads.length > 0
        ? workloads
        : [
            {
              counsellorId: user.userId,
              counsellorName: `${user.firstName} ${user.lastName}`,
              activeLeadCount: 0,
              maxCapacity: 40,
            },
          ]
    );

    const count = await prisma.lead.count();
    const leadNo = `LEAD-2026-${String(count + 1).padStart(4, "0")}`;
    const nextFollowUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const lead = await prisma.lead.create({
      data: {
        leadNo,
        fullName,
        email,
        phone,
        city: city || null,
        source,
        interestedCourse,
        status: "NEW",
        assignedTo: assignment.assignedCounsellorId,
        nextFollowUpAt,
        notes,
        activities: {
          create: {
            counsellorId: assignment.assignedCounsellorId,
            activityType: "NOTE",
            notes: `Lead automatically routed: ${assignment.reason}`,
            outcome: "POSITIVE",
          },
        },
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        entity: "LEAD",
        entityId: lead.id,
        action: "CREATE",
        performedBy: user.userId,
        afterState: JSON.stringify({ leadNo, fullName, assignedTo: assignment.assignedCounsellorName }),
      },
    });

    return successResponse(lead, undefined, 201);
  } catch (err: any) {
    console.error("Create Lead Error:", err);
    return errorResponse("Failed to create and route lead", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const { leadId, status, activityType, notes, outcome, nextFollowUpHours } = body;

    if (!leadId) return errorResponse("leadId is required.", 400);

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return errorResponse("Lead not found", 404);

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (nextFollowUpHours) {
      dataToUpdate.nextFollowUpAt = new Date(Date.now() + parseInt(nextFollowUpHours, 10) * 60 * 60 * 1000);
    }
    dataToUpdate.lastFollowUpAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const l = await tx.lead.update({
        where: { id: leadId },
        data: dataToUpdate,
      });

      if (notes) {
        await tx.leadActivity.create({
          data: {
            leadId,
            counsellorId: user.userId,
            activityType: activityType || "NOTE",
            notes,
            outcome: outcome || "POSITIVE",
          },
        });
      }

      await tx.auditLog.create({
        data: {
          entity: "LEAD",
          entityId: leadId,
          action: "UPDATE",
          performedBy: user.userId,
          afterState: JSON.stringify({ status, notes }),
        },
      });

      return l;
    });

    return successResponse(updated);
  } catch (err: any) {
    console.error("Update Lead Error:", err);
    return errorResponse("Failed to update lead", 500);
  }
}
