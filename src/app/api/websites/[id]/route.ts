import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { requireAuth(request); const { id } = await params; const w = await prisma.website.findUnique({ where: { id } }); if (!w) return apiError("Not found", 404); return apiSuccess(w); } catch (e) { return handleApiError(e); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { requireAuth(request); const { id } = await params; const body = await request.json(); const w = await prisma.website.update({ where: { id }, data: body }); return apiSuccess(w); } catch (e) { return handleApiError(e); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { requireAuth(request); const { id } = await params; await prisma.website.delete({ where: { id } }); return apiSuccess({ deleted: true }); } catch (e) { return handleApiError(e); }
}
