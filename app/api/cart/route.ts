import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [], authenticated: false });
  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { include: { seller: true, images: { orderBy: { position: "asc" } } } } },
    orderBy: { id: "desc" }
  });
  return NextResponse.json({ authenticated: true, items });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const { productId, quantity = 1 } = await request.json();
  if (!Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
      published: true,
      seller: { status: "APPROVED" },
    },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: session.userId, productId: product.id } },
    select: { quantity: true },
  });
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (product.stock < nextQuantity) {
    return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.userId, productId: product.id } },
    update: { quantity: nextQuantity },
    create: { userId: session.userId, productId: product.id, quantity }
  });
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const { productId, quantity } = await request.json();
  if (!productId || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
  }
  const product = await prisma.product.findFirst({
    where: { id: productId, published: true, seller: { status: "APPROVED" } },
    select: { id: true, stock: true },
  });
  if (!product) return NextResponse.json({ error: "Product not available" }, { status: 404 });
  if (quantity > product.stock) return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
  const item = await prisma.cartItem.updateMany({ where: { userId: session.userId, productId }, data: { quantity } });
  return NextResponse.json({ ok: true, count: item.count });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const { productId } = await request.json();
  await prisma.cartItem.deleteMany({ where: { userId: session.userId, productId } });
  return NextResponse.json({ ok: true });
}
