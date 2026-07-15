import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try { requireAuth(request); const ws = new URL(request.url).searchParams.get("workspaceId"); if (!ws) return apiError("workspaceId required", 400);
    return apiSuccess(await prisma.aiBot.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } }));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try { requireAuth(request); const body = await request.json(); const { workspaceId, name, type, description, personality, channels, config } = body; if (!workspaceId) return apiError("workspaceId required", 400);
    return apiSuccess(await prisma.aiBot.create({ data: { workspaceId, name, type: type || "custom", description, personality: personality || {}, channels: channels || [], config: config || {} } }), 201);
  } catch (e) { return handleApiError(e); }
}
