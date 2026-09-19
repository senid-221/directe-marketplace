import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await prisma.user.findFirst({ where: { OR: [body.email ? { email: body.email } : undefined, body.phone ? { phone: body.phone } : undefined].filter(Boolean) as any } });
  if (!user?.password || !verifyPassword(body.password || "", user.password)) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = createSessionToken(user.id, user.role);
  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  response.cookies.set("directe_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
