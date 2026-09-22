import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth(["CUSTOMER"]);
    const alerts = await prisma.priceAlert.findMany({
      where: { userId: session.userId, active: true },
      include: { product: { include: { images: { orderBy: { position: "asc" } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(alerts);
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["CUSTOMER"]);
    const body = await request.json();
    const productId = String(body.productId || "");
    const targetPrice = body.targetPrice === null || body.targetPrice === undefined || body.targetPrice === "" ? null : Number(body.targetPrice);
    if (!productId) return NextResponse.json({ error: "productId is required." }, { status: 400 });

    const product = await prisma.product.findFirst({ where: { id: productId, published: true, seller: { status: "APPROVED" } } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const alert = await prisma.priceAlert.upsert({
      where: { userId_productId: { userId: session.userId, productId } },
      update: { active: true, targetPrice, triggeredAt: null },
      create: { userId: session.userId, productId, targetPrice },
    });
    return NextResponse.json(alert, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth(["CUSTOMER"]);
    const productId = new URL(request.url).searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "productId is required." }, { status: 400 });
    await prisma.priceAlert.updateMany({ where: { userId: session.userId, productId }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}
