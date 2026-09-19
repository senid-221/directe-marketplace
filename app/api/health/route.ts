import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ service: "DIRECTE API", status: "ok", timestamp: new Date().toISOString() });
}
