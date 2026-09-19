import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ where: { parentId: null }, include: { children: true }, orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    await requireAuth(["ADMIN"]);
    const body = await request.json();
    if (!body.name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const slug = String(body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const category = await prisma.category.create({ data: { name: body.name, slug, parentId: body.parentId || null } });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }
}
