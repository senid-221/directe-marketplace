import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sellers = await prisma.seller.findMany({ include: { user: { select: { id: true, name: true, phone: true, email: true } }, _count: { select: { products: true } } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(sellers);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.userId || !body.storeName) return NextResponse.json({ error: "userId and storeName are required" }, { status: 400 });
  const seller = await prisma.seller.create({ data: { userId: body.userId, storeName: body.storeName, description: body.description || null } });
  return NextResponse.json(seller, { status: 201 });
}
