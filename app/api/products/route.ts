import { NextResponse } from "next/server";
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
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(seller ? { seller: { id: seller } } : {}),
    },
    include: { images: { orderBy: { position: "asc" } }, seller: true, category: true },
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  for (const key of ["sellerId", "categoryId", "name", "price"]) {
    if (body[key] === undefined || body[key] === "") return NextResponse.json({ error: `${key} is required` }, { status: 400 });
  }
  const slug = String(body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const product = await prisma.product.create({
    data: {
      sellerId: body.sellerId,
      categoryId: body.categoryId,
      name: body.name,
      slug,
      description: body.description || null,
      price: body.price,
      oldPrice: body.oldPrice || null,
      stock: Number(body.stock || 0),
      published: Boolean(body.published),
      images: Array.isArray(body.images) && body.images.length ? { create: body.images.map((url: string, position: number) => ({ url, position })) } : undefined,
    },
    include: { images: true, seller: true, category: true },
  });
  return NextResponse.json(product, { status: 201 });
}
