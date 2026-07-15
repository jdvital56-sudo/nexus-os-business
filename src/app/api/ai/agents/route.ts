import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try { requireAuth(request); const ws = new URL(request.url).searchParams.get("workspaceId"); if (!ws) return apiError("workspaceId required", 400);
    return apiSuccess(await prisma.aiAgent.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } }));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try { requireAuth(request); const body = await request.json(); const { workspaceId, name, role, description, systemPrompt, personality, tools, capabilities, config } = body; if (!workspaceId) return apiError("workspaceId required", 400);
    return apiSuccess(await prisma.aiAgent.create({ data: { workspaceId, name, role, description, systemPrompt, personality: personality || {}, tools: tools || [], capabilities: capabilities || [], config: config || {} } }), 201);
  } catch (e) { return handleApiError(e); }
}
