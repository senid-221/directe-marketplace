import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireAuth(["CUSTOMER", "SELLER", "ADMIN"]);
    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ notifications, unreadCount: notifications.filter((n) => !n.readAt).length });
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth(["CUSTOMER", "SELLER", "ADMIN"]);
    const body = await request.json();
    if (body.all) {
      await prisma.notification.updateMany({ where: { userId: session.userId, readAt: null }, data: { readAt: new Date() } });
    } else if (body.id) {
      await prisma.notification.updateMany({ where: { id: String(body.id), userId: session.userId }, data: { readAt: new Date() } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}
