import { db } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const existing = db.users.findByEmail(input.email);
    if (existing) return apiError("Email already registered", 409);

    const passwordHash = await hashPassword(input.password);
    const orgName = input.organizationName || `${input.name}'s Organization`;
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

    const user = db.users.create({ email: input.email, name: input.name, passwordHash, emailVerified: false });
    const org = db.organizations.create({ name: orgName, slug: orgSlug });
    const workspace = db.workspaces.create({ organizationId: org.id, name: "Default Workspace", slug: "default" });
    db.members.create({ workspaceId: workspace.id, userId: user.id, role: "owner", permissions: ["*"] });
    db.subscriptions.create({ organizationId: org.id, plan: "free", status: "active" });

    const token = signToken({ userId: user.id, email: user.email });

    return apiSuccess({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      workspaces: [{ id: workspace.id, name: workspace.name, slug: workspace.slug, role: "owner" }],
    }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
