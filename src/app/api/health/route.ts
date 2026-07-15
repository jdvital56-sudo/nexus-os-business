import { apiSuccess } from "@/lib/api-helpers";

export async function GET() {
  return apiSuccess({ status: "healthy", version: "0.1.0", timestamp: new Date().toISOString() });
}
