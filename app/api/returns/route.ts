import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const allowedStatuses = ["REQUESTED","APPROVED","REJECTED","RECEIVED","REFUNDED","CANCELLED"] as const;

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["CUSTOMER"]);
    const body = await request.json();
    const orderId = String(body.orderId || "");
    const reason = String(body.reason || "").trim();
    const notes = String(body.notes || "").trim() || null;
    const items = Array.isArray(body.items) ? body.items : [];
    if (!orderId || !reason || !items.length) return NextResponse.json({ error: "Order, reason and return items are required." }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.userId, status: "DELIVERED" }, include: { items: true } });
    if (!order) return NextResponse.json({ error: "Only delivered orders can be returned." }, { status: 409 });

    const existing = await prisma.returnRequest.findFirst({ where: { orderId, status: { in: ["REQUESTED","APPROVED","RECEIVED"] } } });
    if (existing) return NextResponse.json({ error: "A return request is already active for this order." }, { status: 409 });

    const orderMap = new Map(order.items.map((item) => [item.productId, item.quantity]));
    for (const item of items) {
      if (!orderMap.has(String(item.productId)) || Number(item.quantity) < 1 || Number(item.quantity) > orderMap.get(String(item.productId))!) {
        return NextResponse.json({ error: "Invalid return item quantity." }, { status: 400 });
      }
    }

    const created = await prisma.returnRequest.create({
      data: {
        orderId,
        userId: session.userId,
        reason,
        notes,
        items: { create: items.map((item: any) => ({ productId: String(item.productId), quantity: Number(item.quantity) })) },
      },
      include: { items: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}

export async function GET() {
  try {
    const session = await requireAuth(["CUSTOMER", "ADMIN"]);
    const where = session.role === "ADMIN" ? {} : { userId: session.userId };
    const returns = await prisma.returnRequest.findMany({ where, include: { items: true, order: true }, orderBy: { requestedAt: "desc" } });
    return NextResponse.json(returns);
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth(["ADMIN"]);
    const body = await request.json();
    const id = String(body.id || "");
    const status = String(body.status || "");
    if (!id || !allowedStatuses.includes(status as any)) return NextResponse.json({ error: "Invalid return update." }, { status: 400 });

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: { status: status as any, resolvedAt: ["REJECTED","REFUNDED","CANCELLED"].includes(status) ? new Date() : undefined },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
}
