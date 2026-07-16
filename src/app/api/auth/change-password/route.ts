import { prisma } from "@/lib/db";
import { requireAuth, verifyPassword, hashPassword } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function POST(request: Request) {
  try {
    const payload = requireAuth(request);
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) return apiError("Current and new password required", 400);
    if (newPassword.length < 6) return apiError("Password must be at least 6 characters", 400);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return apiError("User not found", 404);

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) return apiError("Current password is incorrect", 401);

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return apiSuccess({ message: "Password changed successfully" });
  } catch (e) { return handleApiError(e); }
}
