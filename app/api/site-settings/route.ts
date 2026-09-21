import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  const logoUrl = setting?.logoUrl || "/akaziconnect-logo.svg";
  return NextResponse.json(
    { logoUrl },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}
