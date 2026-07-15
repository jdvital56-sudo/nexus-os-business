import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const ws = new URL(request.url).searchParams.get("workspaceId");
    if (!ws) return apiError("workspaceId required", 400);
    return apiSuccess(db.automations.findMany({ workspaceId: ws }));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, name, description, trigger, nodes, connections } = body;
    if (!workspaceId) return apiError("workspaceId required", 400);
    const automation = db.automations.create({ workspaceId, name, description, trigger: trigger || {}, nodes: nodes || [], connections: connections || [] });
    return apiSuccess(automation, 201);
  } catch (e) { return handleApiError(e); }
}
