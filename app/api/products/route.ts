import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const seller = url.searchParams.get("seller");
  const take = Math.min(Number(url.searchParams.get("limit") || 24), 100);

  const products = await prisma.product.findMany({
    where: {
      published: true,
      seller: { status: "APPROVED" },
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(seller ? { seller: { id: seller, status: "APPROVED" } } : {}),
    },
    include: { images: { orderBy: { position: "asc" } }, seller: true, category: true },
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["SELLER", "ADMIN"]);
    const body = await request.json();
    if (!body.categoryId || !body.name || body.price === undefined) {
      return NextResponse.json({ error: "categoryId, name and price are required" }, { status: 400 });
    }
    const seller = session.role === "SELLER"
      ? await prisma.seller.findUnique({ where: { userId: session.userId } })
      : body.sellerId ? await prisma.seller.findUnique({ where: { id: body.sellerId } }) : null;
    if (!seller || (session.role === "SELLER" && seller.status !== "APPROVED")) {
      return NextResponse.json({ error: "Approved seller account required" }, { status: 403 });
    }
    const slug = String(body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: body.categoryId,
        name: body.name,
        slug,
        description: body.description || null,
        price: body.price,
        oldPrice: body.oldPrice || null,
        stock: Number(body.stock || 0),
        published: session.role === "ADMIN" ? Boolean(body.published) : false,
        images: Array.isArray(body.images) && body.images.length
          ? { create: body.images.map((url: string, position: number) => ({ url, position })) }
          : undefined,
      },
      include: { images: true, seller: true, category: true },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error && e.message === "UNAUTHENTICATED" ? "Authentication required" : "Forbidden" }, { status: e instanceof Error && e.message === "UNAUTHENTICATED" ? 401 : 403 });
  }
}
