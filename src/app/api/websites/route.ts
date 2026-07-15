import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    requireAuth(request);
    const ws = new URL(request.url).searchParams.get("workspaceId");
    if (!ws) return apiError("workspaceId required", 400);
    return apiSuccess(db.websites.findMany({ workspaceId: ws }));
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    requireAuth(request);
    const body = await request.json();
    const { workspaceId, name, slug, templateId, config } = body;
    if (!workspaceId) return apiError("workspaceId required", 400);
    const website = db.websites.create({
      workspaceId, name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), templateId,
      config: config || {},
      pages: [{ id: "home", name: "Home", slug: "/", isHome: true, sections: [
        { id: "hero", type: "hero", props: { title: name, subtitle: "Welcome", cta: "Get Started" } },
        { id: "features", type: "features", props: { title: "Our Services", items: [] } },
        { id: "contact", type: "contact", props: { title: "Contact Us" } },
      ]}],
      styles: {}, seo: {},
    });
    return apiSuccess(website, 201);
  } catch (e) { return handleApiError(e); }
}
