import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const categoryId = url.searchParams.get("categoryId");
  const sellerId = url.searchParams.get("sellerId");
  const take = Math.min(Number(url.searchParams.get("limit") || 12), 30);

  if (!productId && !categoryId && !sellerId) {
    const products = await prisma.product.findMany({
      where: { published: true, seller: { status: "APPROVED" }, stock: { gt: 0 } },
      include: { images: { orderBy: { position: "asc" }, take: 1 }, seller: true },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }],
      take,
    });
    return NextResponse.json(products);
  }

  const source = productId
    ? await prisma.product.findFirst({ where: { id: productId, published: true }, select: { categoryId: true, sellerId: true } })
    : null;

  const cat = categoryId || source?.categoryId;
  const seller = sellerId || source?.sellerId;

  const products = await prisma.product.findMany({
    where: {
      published: true,
      seller: { status: "APPROVED" },
      stock: { gt: 0 },
      ...(cat ? { categoryId: cat } : {}),
      ...(seller ? { sellerId: seller } : {}),
      ...(productId ? { id: { not: productId } } : {}),
    },
    include: { images: { orderBy: { position: "asc" }, take: 1 }, seller: true },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }],
    take,
  });

  return NextResponse.json(products);
}
