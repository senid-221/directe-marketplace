import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const seller = await prisma.seller.update({ where: { id }, data: { status: "APPROVED" } });
  return NextResponse.json(seller);
}
