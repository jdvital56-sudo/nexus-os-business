import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const payload = requireAuth(request);
    const members = db.members.findMany({ userId: payload.userId });
    const workspaces = members.map((m: any) => {
      const ws = db.workspaces.findById(m.workspaceId);
      if (!ws) return null;
      const entities = db.crmEntities.findMany({ workspaceId: ws.id }).length;
      const websites = db.websites.findMany({ workspaceId: ws.id }).length;
      const automations = db.automations.findMany({ workspaceId: ws.id }).length;
      return { id: ws.id, name: ws.name, slug: ws.slug, role: m.role, stats: { entities, websites, automations } };
    }).filter(Boolean);
    return apiSuccess(workspaces);
  } catch (e) { return handleApiError(e); }
}
