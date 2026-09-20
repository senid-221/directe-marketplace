import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "Product is required." }, { status: 400 });
  const reviews = await prisma.review.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } }
  });
  return NextResponse.json({ reviews });
}

export async function POST(req: Request) {
  let s;
  try { s = await requireAuth(["CUSTOMER","SELLER"]); } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const { productId, rating, comment } = await req.json();
  const score = Number(rating);
  if (!productId || !Number.isInteger(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: "Choose a rating from 1 to 5." }, { status: 400 });
  }
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId: s.userId, status: "DELIVERED" }
    },
    select: { id: true }
  });
  if (!purchased) {
    return NextResponse.json({ error: "You can review this product after a delivered order." }, { status: 403 });
  }

  const text = typeof comment === "string" ? comment.trim().slice(0, 1000) : "";
  const review = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const saved = await tx.review.upsert({
      where: { userId_productId: { userId: s.userId, productId } },
      create: { userId: s.userId, productId, rating: score, comment: text || null },
      update: { rating: score, comment: text || null }
    });
    const aggregate = await tx.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true }
    });
    await tx.product.update({
      where: { id: productId },
      data: { rating: aggregate._avg.rating || 0, reviewCount: aggregate._count._all }
    });
    return saved;
  });
  return NextResponse.json({ review });
}
