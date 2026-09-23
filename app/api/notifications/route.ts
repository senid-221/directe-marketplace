import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth(["CUSTOMER", "SELLER", "ADMIN"]);
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unreadCount = await prisma.notification.count({ where: { userId: session.userId, readAt: null } });
  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await requireAuth(["CUSTOMER", "SELLER", "ADMIN"]);
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  await prisma.notification.updateMany({
    where: { userId: session.userId, ...(id ? { id } : { readAt: null }) },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
