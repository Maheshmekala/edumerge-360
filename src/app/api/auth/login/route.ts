import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { comparePassword, signJwt } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        studentProfile: true,
        facultyProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse("Invalid credentials or account inactive.", 401);
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse("Invalid credentials.", 401);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const token = signJwt(tokenPayload);

    // Audit log login
    await prisma.auditLog.create({
      data: {
        entity: "USER",
        entityId: user.id,
        action: "LOGIN",
        performedBy: user.id,
        afterState: JSON.stringify({ role: user.role, email: user.email }),
      },
    });

    const response = successResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        studentProfile: user.studentProfile,
        facultyProfile: user.facultyProfile,
      },
      token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set("edumerge_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("Login API Error:", err);
    return errorResponse("Authentication server error", 500);
  }
}
