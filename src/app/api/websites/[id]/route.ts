import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const w = db.websites.findById(id);
    if (!w) return apiError("Not found", 404);
    return apiSuccess(w);
  } catch (e) { return handleApiError(e); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const w = db.websites.update(id, body);
    if (!w) return apiError("Not found", 404);
    return apiSuccess(w);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    db.websites.remove(id);
    return apiSuccess({ deleted: true });
  } catch (e) { return handleApiError(e); }
}
