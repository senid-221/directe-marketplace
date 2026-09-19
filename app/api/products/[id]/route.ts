import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true, seller: true, category: true, reviews: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json();
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      oldPrice: body.oldPrice,
      stock: body.stock,
      published: body.published,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
