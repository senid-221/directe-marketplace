import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const MAX_LOGO_BYTES = 4 * 1024 * 1024;

export async function GET() {
  await requireAuth(["ADMIN"]);
  const setting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  return NextResponse.json({ logoUrl: setting?.logoUrl || "/akaziconnect-logo.svg" });
}

export async function PUT(request: Request) {
  await requireAuth(["ADMIN"]);
  const body = await request.json();
  const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() : "";
  if (!logoUrl) return NextResponse.json({ error: "Logo is required." }, { status: 400 });
  if (!logoUrl.startsWith("data:image/")) return NextResponse.json({ error: "Please upload an image file." }, { status: 400 });

  const base64 = logoUrl.split(",")[1] || "";
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_LOGO_BYTES) return NextResponse.json({ error: "Logo must be 4 MB or smaller." }, { status: 400 });

  const updated = await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: { logoUrl },
    create: { id: "default", logoUrl },
  });
  return NextResponse.json({ ok: true, logoUrl: updated.logoUrl });
}

export async function DELETE() {
  await requireAuth(["ADMIN"]);
  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: { logoUrl: null },
    create: { id: "default", logoUrl: null },
  });
  return NextResponse.json({ ok: true, logoUrl: "/akaziconnect-logo.svg" });
}
