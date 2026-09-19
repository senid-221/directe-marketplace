import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sellers = await prisma.seller.findMany({
    where: { status: "APPROVED" },
    include: { user: { select: { id: true, name: true, phone: true, email: true } }, _count: { select: { products: true } } },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(sellers);
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["CUSTOMER", "SELLER"]);
    if (session.role === "SELLER" && await prisma.seller.findUnique({ where: { userId: session.userId } })) {
      return NextResponse.json({ error: "Seller account already exists" }, { status: 409 });
    }
    const body = await request.json();
    if (!body.storeName) return NextResponse.json({ error: "storeName is required" }, { status: 400 });
    const seller = await prisma.seller.create({ data: { userId: session.userId, storeName: body.storeName, description: body.description || null } });
    return NextResponse.json(seller, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
