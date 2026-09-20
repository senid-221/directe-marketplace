import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  return NextResponse.json({ logoUrl: setting?.logoUrl || "/akaziconnect-logo.svg" }, { headers: { "Cache-Control": "no-store" } });
}
