import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const p = new URL(request.url).searchParams;
    const workspaceId = p.get("workspaceId"), entityId = p.get("entityId");
    const page = parseInt(p.get("page") || "1"), pageSize = Math.min(parseInt(p.get("pageSize") || "50"), 200);
    if (!workspaceId || !entityId) return apiError("workspaceId and entityId required", 400);
    const all = db.crmRecords.findMany({ workspaceId, entityId });
    const total = all.length;
    const items = all.slice((page - 1) * pageSize, page * pageSize);
    return apiSuccess({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, entityId, data } = body;
    if (!workspaceId || !entityId) return apiError("workspaceId and entityId required", 400);
    const record = db.crmRecords.create({ workspaceId, entityId, data: data || {} });
    return apiSuccess(record, 201);
  } catch (e) { return handleApiError(e); }
}
