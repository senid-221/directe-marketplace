import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await requireAuth(["SELLER"]);
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller) return NextResponse.json({ error: "SELLER_PROFILE_NOT_FOUND" }, { status: 404 });
  if (seller.status !== "APPROVED") return NextResponse.json({ error: "SELLER_NOT_APPROVED" }, { status: 403 });

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: { category: true, images: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    products: products.map((product: (typeof products)[number]) => ({
      ...product,
      price: Number(product.price),
      oldPrice: product.oldPrice === null ? null : Number(product.oldPrice),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAuth(["SELLER"]);
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller) return NextResponse.json({ error: "SELLER_PROFILE_NOT_FOUND" }, { status: 404 });
  if (seller.status !== "APPROVED") return NextResponse.json({ error: "SELLER_NOT_APPROVED" }, { status: 403 });

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const categoryId = String(body.categoryId || "").trim();
    const price = Number(body.price);
    const oldPrice = body.oldPrice === "" || body.oldPrice == null ? null : Number(body.oldPrice);
    const stock = Number(body.stock);
    const rawImages = Array.isArray(body.images) ? body.images : String(body.images || "").split(/[,\n]/);
    const images = rawImages.map((url: unknown) => String(url).trim()).filter((url: string) => /^https?:\/\//i.test(url)).slice(0, 8);

    if (!name || !categoryId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Enter a valid product name, category, price and stock." }, { status: 400 });
    }
    if (!(await prisma.category.findUnique({ where: { id: categoryId } }))) {
      return NextResponse.json({ error: "Category not found." }, { status: 400 });
    }

    const baseSlug = slugify(name) || "product";
    let slug = baseSlug;
    let suffix = 2;
    while (await prisma.product.findUnique({ where: { slug } })) slug = baseSlug + "-" + suffix++;

    const product = await prisma.product.create({
      data: {
        sellerId: seller.id, categoryId, name, slug,
        description: description || null, price,
        oldPrice: oldPrice !== null && Number.isFinite(oldPrice) && oldPrice > 0 ? oldPrice : null,
        stock, published: true,
        images: { create: images.map((url: string, index: number) => ({ url, alt: name, position: index })) },
      },
      include: { category: true, images: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json({
      ok: true,
      product: { ...product, price: Number(product.price), oldPrice: product.oldPrice === null ? null : Number(product.oldPrice) },
    }, { status: 201 });
  } catch (error) {
    console.error("AkaziConnect seller product creation failed:", error);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}
