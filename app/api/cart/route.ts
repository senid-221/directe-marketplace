import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
  const items = await prisma.cartItem.findMany({ where: { userId }, include: { product: { include: { images: true, seller: true } } } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.userId || !body.productId) return NextResponse.json({ error: "userId and productId are required" }, { status: 400 });
  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: body.userId, productId: body.productId } },
    update: { quantity: { increment: Number(body.quantity || 1) } },
    create: { userId: body.userId, productId: body.productId, quantity: Number(body.quantity || 1) },
  });
  return NextResponse.json(item, { status: 201 });
}
