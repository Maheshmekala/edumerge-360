import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "edumerge_super_secret_jwt_key_2026_enterprise_grade";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

export function signJwt(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Role Hierarchy and RBAC permissions
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ACADEMIC_ADMIN: "ACADEMIC_ADMIN",
  FINANCE_OFFICER: "FINANCE_OFFICER",
  FACULTY: "FACULTY",
  COUNSELLOR: "COUNSELLOR",
  STUDENT: "STUDENT",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export function hasPermission(userRole: string, allowedRoles: string[]): boolean {
  if (userRole === ROLES.SUPER_ADMIN) return true; // Super Admin has all privileges
  return allowedRoles.includes(userRole);
}
