import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let database = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  return NextResponse.json({
    service: "DIRECTE API",
    status: database === "ok" ? "ok" : "degraded",
    database,
    timestamp: new Date().toISOString(),
  }, { status: database === "ok" ? 200 : 503 });
}
