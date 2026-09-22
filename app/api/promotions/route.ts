import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: { active: true, startAt: { lte: now }, endAt: { gt: now } },
    include: {
      seller: true,
      products: {
        include: {
          product: {
            include: {
              images: { orderBy: { position: "asc" } },
              seller: true,
            },
          },
        },
      },
    },
    orderBy: { endAt: "asc" },
  });
  return NextResponse.json(promotions);
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["ADMIN", "SELLER"]);
    const body = await request.json();
    const name = String(body.name || "").trim();
    const type = String(body.type || "PERCENT");
    const scope = String(body.scope || "PRODUCT");
    const value = Number(body.value);
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    const productIds = Array.isArray(body.productIds) ? body.productIds.map(String) : [];

    if (!name || !["PERCENT", "FIXED", "FLASH_SALE"].includes(type) || !["ORDER", "PRODUCT", "CATEGORY"].includes(scope) || !Number.isFinite(value) || value < 0 || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      return NextResponse.json({ error: "Invalid promotion details." }, { status: 400 });
    }
    if (scope === "PRODUCT" && productIds.length === 0) {
      return NextResponse.json({ error: "Select at least one product." }, { status: 400 });
    }
    if (type === "PERCENT" && value > 100) {
      return NextResponse.json({ error: "Percent discount cannot exceed 100." }, { status: 400 });
    }

    let sellerId: string | null = null;
    if (session.role === "SELLER") {
      const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
      if (!seller || seller.status !== "APPROVED") return NextResponse.json({ error: "Approved seller account required." }, { status: 403 });
      sellerId = seller.id;
    } else if (body.sellerId) {
      const seller = await prisma.seller.findUnique({ where: { id: String(body.sellerId) } });
      if (!seller || seller.status !== "APPROVED") return NextResponse.json({ error: "Approved seller required." }, { status: 400 });
      sellerId = seller.id;
    }

    const products = productIds.length
      ? await prisma.product.findMany({
          where: {
            id: { in: productIds },
            published: true,
            seller: { status: "APPROVED" },
            ...(sellerId ? { sellerId } : {}),
          },
          select: { id: true },
        })
      : [];
    if (scope === "PRODUCT" && products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more selected products are unavailable." }, { status: 400 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        name,
        type: type as "PERCENT" | "FIXED" | "FLASH_SALE",
        scope: scope as "ORDER" | "PRODUCT" | "CATEGORY",
        value,
        startAt,
        endAt,
        sellerId,
        products: products.length ? { create: products.map((p) => ({ productId: p.id })) } : undefined,
      },
      include: { products: true },
    });
    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "UNAUTHENTICATED" ? "Authentication required." : "Unable to create promotion." }, { status: 401 });
  }
}
