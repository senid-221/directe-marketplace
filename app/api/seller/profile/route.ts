import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth(["SELLER"]);
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId }, include: { user: { select: { name:true,email:true,phone:true } } } });
  if (!seller) return NextResponse.json({ error:"SELLER_PROFILE_NOT_FOUND" }, { status:404 });
  return NextResponse.json({ seller:{ id:seller.id,storeName:seller.storeName,description:seller.description||"",status:seller.status,commission:Number(seller.commission),user:seller.user } });
}

export async function PATCH(request: Request) {
  const session = await requireAuth(["SELLER"]);
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller) return NextResponse.json({ error:"SELLER_PROFILE_NOT_FOUND" }, { status:404 });
  const body = await request.json();
  const storeName = String(body.storeName || "").trim();
  const description = String(body.description || "").trim();
  if (!storeName) return NextResponse.json({ error:"Store name is required." }, { status:400 });
  const updated = await prisma.seller.update({ where:{id:seller.id}, data:{storeName,description:description||null} });
  return NextResponse.json({ ok:true,seller:{id:updated.id,storeName:updated.storeName,description:updated.description||"",status:updated.status} });
}
