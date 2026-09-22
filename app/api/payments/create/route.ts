import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const allowedMethods = ["CARD","MOBILE_MONEY","BANK_TRANSFER"] as const;

export async function POST(request: Request) {
  const session = await requireAuth(["CUSTOMER"]);
  const body = await request.json();
  const method = String(body.method || "CARD") as (typeof allowedMethods)[number];
  if (!allowedMethods.includes(method)) return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });

  const recipientName = String(body.recipientName || "").trim();
  const phone = String(body.phone || "").trim();
  const province = String(body.province || "").trim();
  const district = String(body.district || "").trim();
  const sector = String(body.sector || "").trim();
  const address = String(body.address || "").trim();

  if (!recipientName || !phone || !province || !district || !sector || !address) {
    return NextResponse.json({ error: "Complete all Rwanda delivery details before continuing." }, { status: 400 });
  }

  const secret = process.env.FLW_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!secret || !appUrl) return NextResponse.json({ error: "Payment gateway is not configured. Add FLW_SECRET_KEY and NEXT_PUBLIC_APP_URL." }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Customer account not found." }, { status: 404 });
  if (!user.email) return NextResponse.json({ error: "Add an email address to your account before paying." }, { status: 400 });

  const cart = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { include: { seller: true } } },
  });
  if (!cart.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  for (const item of cart) {
    if (item.product.seller.status !== "APPROVED" || !item.product.published || item.product.stock < item.quantity) {
      return NextResponse.json({ error: item.product.seller.status !== "APPROVED" ? "A seller is no longer approved for this product." : item.product.stock < item.quantity ? "Some products are out of stock." : "A product is no longer available." }, { status: 409 });
    }
  }

  const subtotal = cart.reduce((sum: number, item: (typeof cart)[number]) => sum + Number(item.product.price) * item.quantity, 0);
  const delivery = 3000;

  const couponCode = String(body.couponCode || "").trim().toUpperCase();
  let discount = 0;
  let couponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    const now = new Date();
    if (!coupon || !coupon.active || (coupon.startAt && coupon.startAt > now) || (coupon.endAt && coupon.endAt < now)) {
      return NextResponse.json({ error: "Coupon is invalid or expired." }, { status: 400 });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Coupon usage limit has been reached." }, { status: 409 });
    }
    if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) {
      return NextResponse.json({ error: "Minimum order amount for this coupon has not been reached." }, { status: 400 });
    }
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: session.userId } });
    if (used >= coupon.perUserLimit) {
      return NextResponse.json({ error: "You have already used this coupon." }, { status: 409 });
    }
    discount = coupon.type === "PERCENT" ? subtotal * Number(coupon.value) / 100 : Number(coupon.value);
    if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.max(0, Math.min(discount, subtotal));
    couponId = coupon.id;
  }

  const total = Math.max(0, subtotal - discount + delivery);
  const txRef = "AKZ-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9).toUpperCase();
  const trackingCode = "AKZ-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString().slice(-5);

  const order = await prisma.order.create({
    data: {
      userId: session.userId,
      total,
      status: "PENDING",
      items: { create: cart.map((item: (typeof cart)[number]) => ({ productId: item.productId, sellerId: item.product.sellerId, quantity: item.quantity, unitPrice: item.product.price })) },
      delivery: {
        create: {
          trackingCode,
          status: "PENDING",
          recipientName,
          phone,
          province,
          district,
          sector,
          address,
          deliveryFee: delivery,
          estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      },
      payment: { create: { txRef, method, amount: total, currency: "RWF", status: "PENDING", provider: "flutterwave" } },
      ...(couponId ? { couponUsage: { create: { couponId, userId: session.userId, discount } } } : {}),
    },
  });

  const paymentOptions = method === "MOBILE_MONEY" ? "mobilemoneyrwanda" : method === "BANK_TRANSFER" ? "banktransfer" : "card";
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: total,
      currency: "RWF",
      redirect_url: appUrl.replace(/\/$/, "") + "/payment/callback",
      payment_options: paymentOptions,
      customer: { email: user.email, name: user.name || recipientName, phonenumber: phone },
      customizations: { title: "AkaziConnect", description: "Payment for your AkaziConnect order" },
      meta: { order_id: order.id, payment_method: method, tracking_code: trackingCode },
      configurations: { session_duration: 30, max_retry_attempt: 3 },
    }),
  });

  const data = await response.json();
  if (!response.ok || data.status !== "success" || !data.data?.link) {
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: "FAILED" } });
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await prisma.delivery.update({ where: { orderId: order.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: data.message || "Could not start payment." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, orderId: order.id, txRef, trackingCode, paymentUrl: data.data.link });
}
