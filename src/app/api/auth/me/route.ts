import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError("Not authenticated", 401);

  return apiSuccess({
    id: user.id, email: user.email, name: user.name, avatar: user.avatar,
    workspaces: user.members.map((m) => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role })),
  });
}
