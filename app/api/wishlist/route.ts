import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

async function session() {
  try { return await requireAuth(["CUSTOMER","SELLER"]); } catch { return null; }
}

export async function GET() {
  const s = await session();
  if (!s) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const items = await prisma.wishlist.findMany({
    where: { userId: s.userId },
    orderBy: { createdAt: "desc" },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 }, seller: true } } }
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const s = await session();
  if (!s) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Product is required." }, { status: 400 });
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, published: true } });
  if (!product || !product.published) return NextResponse.json({ error: "Product not available." }, { status: 404 });
  const item = await prisma.wishlist.upsert({
    where: { userId_productId: { userId: s.userId, productId } },
    create: { userId: s.userId, productId },
    update: {}
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request) {
  const s = await session();
  if (!s) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Product is required." }, { status: 400 });
  await prisma.wishlist.deleteMany({ where: { userId: s.userId, productId } });
  return NextResponse.json({ ok: true });
}
