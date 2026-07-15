import { db } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    const user = db.users.findByEmail(input.email);
    if (!user) return apiError("Invalid credentials", 401);

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) return apiError("Invalid credentials", 401);

    db.users.update(user.id, { lastLoginAt: new Date().toISOString() });

    const members = db.members.findMany({ userId: user.id });
    const workspaces = members.map((m: any) => {
      const ws = db.workspaces.findById(m.workspaceId);
      return ws ? { id: ws.id, name: ws.name, slug: ws.slug, role: m.role } : null;
    }).filter(Boolean);

    const token = signToken({ userId: user.id, email: user.email });

    return apiSuccess({ token, user: { id: user.id, email: user.email, name: user.name }, workspaces });
  } catch (e) {
    return handleApiError(e);
  }
}
