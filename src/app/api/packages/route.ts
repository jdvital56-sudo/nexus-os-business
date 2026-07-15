import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const ws = new URL(request.url).searchParams.get("workspaceId");
    if (!ws) return apiError("workspaceId required", 400);
    return apiSuccess(db.smartPackages.findMany({ workspaceId: ws }));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, name, description, items, visibility, tags } = body;
    if (!workspaceId) return apiError("workspaceId required", 400);
    const pkg = db.smartPackages.create({ workspaceId, name, description, items: items || [], totalPrice: 0, visibility: visibility || "private", tags: tags || [], version: "1.0.0" });
    return apiSuccess(pkg, 201);
  } catch (e) { return handleApiError(e); }
}
