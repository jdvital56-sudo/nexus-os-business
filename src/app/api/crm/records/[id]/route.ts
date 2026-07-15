import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const record = db.crmRecords.findById(id);
    if (!record || record.deletedAt) return apiError("Not found", 404);
    return apiSuccess(record);
  } catch (e) { return handleApiError(e); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const record = db.crmRecords.update(id, { data: body.data });
    if (!record) return apiError("Not found", 404);
    return apiSuccess(record);
  } catch (e) { return handleApiError(e); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAuth(request);
    const { id } = await params;
    db.crmRecords.softDelete(id);
    return apiSuccess({ deleted: true });
  } catch (e) { return handleApiError(e); }
}
