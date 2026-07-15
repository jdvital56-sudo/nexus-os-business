import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const payload = requireAuth(request);
    const members = await prisma.member.findMany({
      where: { userId: payload.userId },
      include: {
        workspace: {
          include: {
            _count: { select: { crmEntities: true, websites: true, automations: true } },
          },
        },
      },
    });
    const workspaces = members.map((m) => ({
      id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role,
      stats: m.workspace._count,
    }));
    return apiSuccess(workspaces);
  } catch (e) { return handleApiError(e); }
}
