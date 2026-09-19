import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(["ADMIN"]);
    const { id } = await context.params;
    const seller = await prisma.seller.update({ where: { id }, data: { status: "APPROVED" } });
    return NextResponse.json(seller);
  } catch {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }
}
