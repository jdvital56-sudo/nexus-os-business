import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const ws = new URL(request.url).searchParams.get("workspaceId");
    if (!ws) return apiError("workspaceId required", 400);
    const websites = await prisma.website.findMany({ where: { workspaceId: ws }, orderBy: { createdAt: "desc" } });
    return apiSuccess(websites);
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, name, slug, templateId, config } = body;
    if (!workspaceId) return apiError("workspaceId required", 400);
    const website = await prisma.website.create({
      data: {
        workspaceId, name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), templateId,
        config: config || {},
        pages: [{ id: "home", name: "Home", slug: "/", isHome: true, sections: [
          { id: "hero", type: "hero", props: { title: name, subtitle: "Welcome", cta: "Get Started" } },
          { id: "features", type: "features", props: { title: "Our Services" } },
          { id: "contact", type: "contact", props: { title: "Contact Us" } },
        ]}],
      },
    });
    return apiSuccess(website, 201);
  } catch (e) { return handleApiError(e); }
}
