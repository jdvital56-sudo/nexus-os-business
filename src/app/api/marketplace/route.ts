import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    const category = p.get("category"), type = p.get("type"), search = p.get("search");
    const page = parseInt(p.get("page") || "1"), pageSize = Math.min(parseInt(p.get("pageSize") || "20"), 100);

    let items = db.marketplaceItems.findMany({ status: "published" });
    if (category) items = items.filter((i: any) => i.category === category);
    if (type) items = items.filter((i: any) => i.type === type);
    if (search) items = items.filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase()));
    items.sort((a: any, b: any) => b.ratingAvg - a.ratingAvg);

    const total = items.length;
    const sliced = items.slice((page - 1) * pageSize, page * pageSize);
    return apiSuccess({ items: sliced, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    const payload = requireAuth(request);
    const body = await request.json();
    const item = db.marketplaceItems.create({
      publisherId: payload.userId, type: body.type, name: body.name,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
      description: body.description, category: body.category, tags: body.tags || [],
      priceModel: body.priceModel || "free", priceAmount: body.priceAmount,
      blueprint: body.blueprint || {}, version: "1.0.0", status: "draft",
    });
    return apiSuccess(item, 201);
  } catch (e) { return handleApiError(e); }
}
