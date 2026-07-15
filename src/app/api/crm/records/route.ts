import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const p = new URL(request.url).searchParams;
    const workspaceId = p.get("workspaceId"), entityId = p.get("entityId");
    const page = parseInt(p.get("page") || "1"), pageSize = Math.min(parseInt(p.get("pageSize") || "50"), 200);
    if (!workspaceId || !entityId) return apiError("workspaceId and entityId required", 400);
    const where = { workspaceId, entityId, deletedAt: null };
    const [items, total] = await Promise.all([
      prisma.crmRecord.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.crmRecord.count({ where }),
    ]);
    return apiSuccess({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, entityId, data } = body;
    if (!workspaceId || !entityId) return apiError("workspaceId and entityId required", 400);
    const record = await prisma.crmRecord.create({ data: { workspaceId, entityId, data: data || {} } });
    return apiSuccess(record, 201);
  } catch (e) { return handleApiError(e); }
}
