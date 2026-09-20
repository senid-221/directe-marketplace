import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const sellerStatuses = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export async function GET() {
  const session = await requireAuth(["SELLER"]);
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller) return NextResponse.json({ error: "SELLER_PROFILE_NOT_FOUND" }, { status: 404 });
  if (seller.status !== "APPROVED") return NextResponse.json({ error: "SELLER_NOT_APPROVED" }, { status: 403 });

  const orders = await prisma.order.findMany({
    where: { items: { some: { sellerId: seller.id } } },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        where: { sellerId: seller.id },
        include: { product: { select: { id: true, name: true, slug: true, price: true, images: { orderBy: { position: "asc" }, take: 1 } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    orders: orders.map((order: (typeof orders)[number]) => ({
      id: order.id, total: Number(order.total), status: order.status, createdAt: order.createdAt,
      customer: order.user,
      items: order.items.map((item: (typeof order.items)[number]) => ({
        ...item, unitPrice: Number(item.unitPrice),
        product: { ...item.product, price: Number(item.product.price) },
      })),
    })),
  });
}

export async function PATCH(request: Request) {
  const session = await requireAuth(["SELLER"]);
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller) return NextResponse.json({ error: "SELLER_PROFILE_NOT_FOUND" }, { status: 404 });
  if (seller.status !== "APPROVED") return NextResponse.json({ error: "SELLER_NOT_APPROVED" }, { status: 403 });

  const body = await request.json();
  const orderId = String(body.orderId || "");
  const status = String(body.status || "") as (typeof sellerStatuses)[number];
  if (!orderId || !sellerStatuses.includes(status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id: orderId, items: { some: { sellerId: seller.id } } } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });
  return NextResponse.json({ ok: true, status: updated.status });
}
