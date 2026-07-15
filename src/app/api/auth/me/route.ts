import { getCurrentUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = await getCurrentUser(request);
  if (!user) return apiError("Not authenticated", 401);
  return apiSuccess({
    id: user.id, email: user.email, name: user.name, avatar: user.avatar,
    workspaces: user.members.map((m: any) => ({ id: m.id, name: m.name, slug: m.slug, role: m.role })),
  });
}
