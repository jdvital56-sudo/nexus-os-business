import { prisma } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError("Not authenticated", 401);

  return apiSuccess({
    id: user.id, email: user.email, name: user.name, avatar: user.avatar,
    workspaces: user.members.map((m) => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role })),
  });
}

export async function PATCH(request: Request) {
  try {
    const payload = requireAuth(request);
    const body = await request.json();
    const { name } = body;

    if (!name) return apiError("Name required", 400);

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { name },
    });

    return apiSuccess({ id: user.id, email: user.email, name: user.name });
  } catch (e) { return handleApiError(e); }
}
