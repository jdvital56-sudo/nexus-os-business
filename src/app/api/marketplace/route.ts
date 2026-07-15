import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    const category = p.get("category"), type = p.get("type"), search = p.get("search");
    const page = parseInt(p.get("page") || "1"), pageSize = Math.min(parseInt(p.get("pageSize") || "20"), 100);
    const where: any = { status: "published" };
    if (category) where.category = category;
    if (type) where.type = type;
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [items, total] = await Promise.all([
      prisma.marketplaceItem.findMany({ where, orderBy: [{ ratingAvg: "desc" }, { installCount: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
      prisma.marketplaceItem.count({ where }),
    ]);
    return apiSuccess({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) { return handleApiError(e); }
}

export async function POST(request: Request) {
  try {
    const payload = requireAuth(request);
    const body = await request.json();
    const item = await prisma.marketplaceItem.create({
      data: {
        publisherId: payload.userId, type: body.type, name: body.name,
        slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
        description: body.description, category: body.category, tags: body.tags || [],
        priceModel: body.priceModel || "free", priceAmount: body.priceAmount,
        blueprint: body.blueprint || {}, version: "1.0.0", status: "draft",
      },
    });
    return apiSuccess(item, 201);
  } catch (e) { return handleApiError(e); }
}
