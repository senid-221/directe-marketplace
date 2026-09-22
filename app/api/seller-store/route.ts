import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Seller id is required." }, { status: 400 });
  const seller = await prisma.seller.findFirst({
    where: { id, status: "APPROVED" },
    select: { id: true, storeName: true, description: true, status: true },
  });
  if (!seller) return NextResponse.json({ error: "Seller not found." }, { status: 404 });
  return NextResponse.json(seller);
}
