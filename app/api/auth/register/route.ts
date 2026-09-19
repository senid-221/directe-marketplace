import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.name || (!body.email && !body.phone) || !body.password) {
    return NextResponse.json({ error: "name, email or phone, and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({ where: { OR: [body.email ? { email: body.email } : undefined, body.phone ? { phone: body.phone } : undefined].filter(Boolean) as any } });
  if (existing) return NextResponse.json({ error: "Account already exists" }, { status: 409 });

  const user = await prisma.user.create({
    data: { name: body.name, email: body.email || null, phone: body.phone || null, password: hashPassword(body.password) },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });
  return NextResponse.json(user, { status: 201 });
}
