import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth(["ADMIN","SELLER"]);
  const seller = session.role === "SELLER" ? await prisma.seller.findUnique({ where: { userId: session.userId } }) : null;
  const coupons = await prisma.coupon.findMany({
    where: session.role === "SELLER" ? { sellerId: seller?.id || "__none__" } : {},
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  const session = await requireAuth(["ADMIN","SELLER"]);
  const seller = session.role === "SELLER" ? await prisma.seller.findUnique({ where: { userId: session.userId } }) : null;
  if (session.role === "SELLER" && (!seller || seller.status !== "APPROVED")) {
    return NextResponse.json({ error: "Seller is not approved." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim().toUpperCase();
  const type = String(body.type || "PERCENT");
  const value = Number(body.value);
  const maxDiscount = body.maxDiscount === "" || body.maxDiscount == null ? null : Number(body.maxDiscount);
  const minOrderAmount = body.minOrderAmount === "" || body.minOrderAmount == null ? null : Number(body.minOrderAmount);
  const usageLimit = body.usageLimit === "" || body.usageLimit == null ? null : Number(body.usageLimit);
  const perUserLimit = body.perUserLimit === "" || body.perUserLimit == null ? 1 : Number(body.perUserLimit);
  const startAt = body.startAt ? new Date(String(body.startAt)) : null;
  const endAt = body.endAt ? new Date(String(body.endAt)) : null;

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return NextResponse.json({ error: "Coupon code must be 3–40 characters using letters, numbers, _ or -." }, { status: 400 });
  if (!["PERCENT","FIXED"].includes(type)) return NextResponse.json({ error: "Coupon type must be PERCENT or FIXED." }, { status: 400 });
  if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "Coupon value must be greater than zero." }, { status: 400 });
  if (type === "PERCENT" && value > 100) return NextResponse.json({ error: "Percentage cannot exceed 100." }, { status: 400 });
  if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) return NextResponse.json({ error: "Usage limit must be a positive whole number." }, { status: 400 });
  if (!Number.isInteger(perUserLimit) || perUserLimit <= 0) return NextResponse.json({ error: "Per-user limit must be a positive whole number." }, { status: 400 });
  if (startAt && Number.isNaN(startAt.getTime())) return NextResponse.json({ error: "Invalid start date." }, { status: 400 });
  if (endAt && Number.isNaN(endAt.getTime())) return NextResponse.json({ error: "Invalid end date." }, { status: 400 });
  if (startAt && endAt && startAt >= endAt) return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });

  try {
    const coupon = await prisma.coupon.create({
      data: {
        sellerId: session.role === "SELLER" ? seller!.id : body.sellerId ? String(body.sellerId) : null,
        code,
        type,
        value,
        maxDiscount,
        minOrderAmount,
        usageLimit,
        perUserLimit,
        startAt,
        endAt,
        active: body.active !== false,
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Coupon code already exists." }, { status: 409 });
    return NextResponse.json({ error: "Could not create coupon." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAuth(["ADMIN","SELLER"]);
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Coupon id is required." }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  if (session.role === "SELLER") {
    const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
    if (!seller || coupon.sellerId !== seller.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const active = typeof body.active === "boolean" ? body.active : undefined;
  const updated = await prisma.coupon.update({ where: { id }, data: active === undefined ? {} : { active } });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const session = await requireAuth(["ADMIN","SELLER"]);
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
  if (session.role === "SELLER") {
    const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
    if (!seller || coupon.sellerId !== seller.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
