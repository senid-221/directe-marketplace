import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const sellerStatuses = ["PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const deliveryStatuses = ["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"] as const;

export async function GET() {
  const session = await requireAuth(["SELLER"]);
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller) return NextResponse.json({ error: "SELLER_PROFILE_NOT_FOUND" }, { status: 404 });
  if (seller.status !== "APPROVED") return NextResponse.json({ error: "SELLER_NOT_APPROVED" }, { status: 403 });

  const orders = await prisma.order.findMany({
    where: { items: { some: { sellerId: seller.id } } },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      delivery: true,
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
      delivery: order.delivery,
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
  const deliveryStatus = String(body.deliveryStatus || "") as (typeof deliveryStatuses)[number];
  if (!orderId) return NextResponse.json({ error: "Order ID is required." }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, items: { some: { sellerId: seller.id } } },
    include: { delivery: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (body.deliveryStatus) {
    if (!deliveryStatuses.includes(deliveryStatus)) return NextResponse.json({ error: "Invalid delivery status." }, { status: 400 });
    if (!order.delivery) return NextResponse.json({ error: "Delivery record not found." }, { status: 404 });

    const now = new Date();
    const deliveryData = {\n      status: deliveryStatus,\n      ...(deliveryStatus === "ASSIGNED" ? { assignedAt: now } : {}),\n      ...(deliveryStatus === "PICKED_UP" ? { pickedUpAt: now } : {}),\n      ...(deliveryStatus === "DELIVERED" ? { deliveredAt: now } : {}),\n    };
    if (deliveryStatus === "ASSIGNED") deliveryData.assignedAt = now;
    if (deliveryStatus === "PICKED_UP") deliveryData.pickedUpAt = now;
    if (deliveryStatus === "DELIVERED") deliveryData.deliveredAt = now;

    let orderStatus = order.status;
    if (deliveryStatus === "ASSIGNED") orderStatus = "PROCESSING";
    if (deliveryStatus === "PICKED_UP" || deliveryStatus === "IN_TRANSIT") orderStatus = "SHIPPED";
    if (deliveryStatus === "DELIVERED") orderStatus = "DELIVERED";
    if (deliveryStatus === "CANCELLED") orderStatus = "CANCELLED";

    const updated = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.update({ where: { orderId }, data: deliveryData });
      const updatedOrder = await tx.order.update({ where: { id: orderId }, data: { status: orderStatus } });
      return { delivery, order: updatedOrder };
    });

    return NextResponse.json({ ok: true, deliveryStatus: updated.delivery.status, orderStatus: updated.order.status });
  }

  if (!sellerStatuses.includes(status)) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });
  return NextResponse.json({ ok: true, status: updated.status });
}
