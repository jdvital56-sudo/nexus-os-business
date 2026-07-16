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

export async function PATCH(request: Request) {
  try {
    const payload = requireAuth(request);
    const body = await request.json();
    const { id, name } = body;

    if (!id) return apiError("Workspace id required", 400);

    // Verify user is a member with owner/admin role
    const member = await prisma.member.findFirst({
      where: { userId: payload.userId, workspaceId: id },
    });
    if (!member) return apiError("Not a member of this workspace", 403);
    if (member.role !== "owner" && member.role !== "admin") {
      return apiError("Only owners and admins can update workspace", 403);
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: { ...(name && { name }) },
    });

    return apiSuccess({ id: workspace.id, name: workspace.name, slug: workspace.slug });
  } catch (e) { return handleApiError(e); }
}
