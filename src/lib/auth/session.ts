import { NextRequest } from "next/server";
import { verifyJwt, TokenPayload } from "./jwt";

export async function getCurrentUser(req: NextRequest): Promise<TokenPayload | null> {
  // 1. Try Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const payload = verifyJwt(token);
    if (payload) return payload;
  }

  // 2. Try cookie
  const cookieToken = req.cookies.get("edumerge_token")?.value;
  if (cookieToken) {
    const payload = verifyJwt(cookieToken);
    if (payload) return payload;
  }

  return null;
}
