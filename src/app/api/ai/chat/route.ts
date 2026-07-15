import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";
import { callAI, config } from "@/lib/config";

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { messages, systemPrompt } = body;

    if (!messages || !Array.isArray(messages)) return apiError("messages array required", 400);

    const aiMessages = [
      ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await callAI(aiMessages);

    return apiSuccess({
      content: response.content,
      usage: response.usage,
      demo: !config.features.aiEnabled,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
