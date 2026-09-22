import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await requireAuth(["CUSTOMER"]);
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);
    if (!code) return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    const now = new Date();
    if (!coupon || !coupon.active || (coupon.startAt && coupon.startAt > now) || (coupon.endAt && coupon.endAt < now)) {
      return NextResponse.json({ error: "Coupon is invalid or expired." }, { status: 404 });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit has been reached." }, { status: 409 });
    }
    if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({ error: `Minimum order amount is RWF ${Number(coupon.minOrderAmount).toLocaleString()}.` }, { status: 400 });
    }
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: session.userId } });
    if (used >= coupon.perUserLimit) return NextResponse.json({ error: "You have already used this coupon." }, { status: 409 });

    let discount = coupon.type === "PERCENT" ? subtotal * Number(coupon.value) / 100 : Number(coupon.value);
    if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.max(0, Math.min(discount, subtotal));

    return NextResponse.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discount,
      finalSubtotal: subtotal - discount,
    });
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
}
