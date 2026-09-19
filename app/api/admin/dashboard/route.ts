import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAuth(["ADMIN"]);
    const [customers, sellers, products, orders, pendingSellers] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.seller.count({ where: { status: "APPROVED" } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.seller.count({ where: { status: "PENDING" } }),
    ]);
    return NextResponse.json({ customers, sellers, products, orders, pendingSellers });
  } catch {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }
}
