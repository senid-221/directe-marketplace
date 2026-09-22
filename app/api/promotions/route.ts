import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const now = new Date();
  const products = await prisma.promotion.findMany({
    where: { active: true, startAt: { lte: now }, endAt: { gt: now } },
    include: { products: { include: { product: { include: { images: { orderBy: { position: "asc" } }, seller: true } } } } },
    orderBy: { endAt: "asc" },
  });
  return NextResponse.json(products);
}
