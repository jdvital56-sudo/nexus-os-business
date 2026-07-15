import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return apiError("Email already registered", 409);

    const passwordHash = await hashPassword(input.password);
    const orgName = input.organizationName || `${input.name}'s Organization`;
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

    const user = await prisma.user.create({
      data: {
        email: input.email, name: input.name, passwordHash,
        members: {
          create: {
            role: "owner", permissions: ["*"],
            workspace: {
              create: {
                name: "Default Workspace", slug: "default",
                organization: {
                  create: {
                    name: orgName, slug: orgSlug,
                    subscriptions: { create: { plan: "free", status: "active" } },
                  },
                },
              },
            },
          },
        },
      },
      include: { members: { include: { workspace: true } } },
    });

    const token = signToken({ userId: user.id, email: user.email });

    return apiSuccess({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      workspaces: user.members.map((m) => ({ id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role })),
    }, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
