import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({ status: "healthy", version: "0.1.0", database: "connected", timestamp: new Date().toISOString() });
  } catch {
    return apiError("Database connection failed", 503);
  }
}
