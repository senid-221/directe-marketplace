import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth(["CUSTOMER", "SELLER"]);
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id:true,name:true,email:true,phone:true,createdAt:true } });
  if (!user) return NextResponse.json({ error:"ACCOUNT_NOT_FOUND" }, {status:404});
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await requireAuth(["CUSTOMER", "SELLER"]);
  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase() || null;
  const phone = String(body.phone || "").trim() || null;
  if (!name) return NextResponse.json({error:"Name is required."},{status:400});
  try {
    const user = await prisma.user.update({ where:{id:session.userId}, data:{name,email,phone}, select:{id:true,name:true,email:true,phone:true,createdAt:true} });
    return NextResponse.json({ok:true,user});
  } catch {
    return NextResponse.json({error:"Email or phone is already in use."},{status:409});
  }
}
