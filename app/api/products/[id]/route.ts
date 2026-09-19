import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true, seller: true, category: true, reviews: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["SELLER", "ADMIN"]);
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id }, include: { seller: true } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (session.role === "SELLER" && product.seller.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        price: body.price,
        oldPrice: body.oldPrice,
        stock: body.stock,
        published: session.role === "ADMIN" && body.published !== undefined ? body.published : undefined,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(["SELLER", "ADMIN"]);
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id }, include: { seller: true } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (session.role === "SELLER" && product.seller.userId !== session.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
