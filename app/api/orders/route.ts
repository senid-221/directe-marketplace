import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  const orders = await prisma.order.findMany({ where: { userId }, include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.userId || !Array.isArray(body.items) || !body.items.length) return NextResponse.json({ error: "userId and items are required" }, { status: 400 });

  const productIds = body.items.map((x: { productId: string }) => x.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, published: true } });
  const byId = new Map(products.map(p => [p.id, p]));
  let total = 0;

  const orderItems = body.items.map((x: { productId: string; quantity?: number }) => {
    const product = byId.get(x.productId);
    if (!product) throw new Error("Product not found");
    const quantity = Math.max(1, Number(x.quantity || 1));
    if (product.stock < quantity) throw new Error(`Insufficient stock for ${product.name}`);
    total += Number(product.price) * quantity;
    return { productId: product.id, sellerId: product.sellerId, quantity, unitPrice: product.price };
  });

  const order = await prisma.$transaction(async tx => {
    for (const item of orderItems) {
      const updated = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
      if (updated.count !== 1) throw new Error("Stock changed while ordering");
    }
    return tx.order.create({ data: { userId: body.userId, total, items: { create: orderItems } }, include: { items: true } });
  });

  return NextResponse.json(order, { status: 201 });
}
