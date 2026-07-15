import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "nexus-os-dev-secret-change-in-production";
const TOKEN_EXPIRY = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string) {
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = db.users.findById(payload.userId);
  if (!user) return null;
  const members = db.members.findMany({ userId: user.id });
  const workspaces = members.map((m: any) => {
    const ws = db.workspaces.findById(m.workspaceId);
    return ws ? { ...ws, role: m.role, permissions: m.permissions } : null;
  }).filter(Boolean);
  return { ...user, members: workspaces };
}

export function getCurrentUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return getUserFromToken(authHeader.slice(7));
}

export function requireAuth(request: Request): JwtPayload {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) {
    throw new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }
  return payload;
}
