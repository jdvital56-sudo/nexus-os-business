import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const ws = new URL(request.url).searchParams.get("workspaceId");
    if (!ws) return apiError("workspaceId required", 400);
    const entities = db.crmEntities.findMany({ workspaceId: ws });
    const result = entities.map((e: any) => ({
      ...e, recordCount: db.crmRecords.count({ workspaceId: ws, entityId: e.id }),
    }));
    return apiSuccess(result);
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, name, displayName, icon, color, fields } = body;
    if (!workspaceId) return apiError("workspaceId required", 400);
    const existing = db.crmEntities.findByName(workspaceId, name);
    if (existing) return apiError("Entity already exists", 409);
    const entity = db.crmEntities.create({ workspaceId, name, displayName, icon: icon || "database", color: color || "#6366f1", fields: fields || [] });
    return apiSuccess(entity, 201);
  } catch (e) { return handleApiError(e); }
}
