import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const ws = new URL(request.url).searchParams.get("workspaceId");
    if (!ws) return apiError("workspaceId required", 400);
    return apiSuccess(db.aiBots.findMany({ workspaceId: ws }));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, name, type, description, personality, channels, config } = body;
    if (!workspaceId) return apiError("workspaceId required", 400);
    const bot = db.aiBots.create({ workspaceId, name, type: type || "custom", description, personality: personality || {}, channels: channels || [], config: config || {} });
    return apiSuccess(bot, 201);
  } catch (e) { return handleApiError(e); }
}
