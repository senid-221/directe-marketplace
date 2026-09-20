import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth(["CUSTOMER", "SELLER"]);
  const seller = await prisma.seller.findUnique({
    where: { userId: session.userId },
    select: { id: true, storeName: true, status: true, plan: true, planAmount: true, paymentStatus: true, paymentMethod: true },
  });
  return NextResponse.json({ seller });
}
