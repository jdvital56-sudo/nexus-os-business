import { prisma } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { members: { include: { workspace: true } } },
    });
    if (!user) return apiError("Invalid credentials", 401);

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) return apiError("Invalid credentials", 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = signToken({ userId: user.id, email: user.email });

    return apiSuccess({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      workspaces: user.members.map((m) => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
