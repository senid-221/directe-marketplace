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
  const product = await prisma.product.findFirst({ where: { id: productId, published: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.stock < quantity) return NextResponse.json({ error: "Not enough stock" }, { status: 400 });

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId: session.userId, productId, quantity }
  });
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const { productId, quantity } = await request.json();
  if (!Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
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
