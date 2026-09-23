import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return "+" + digits;
  if (digits.startsWith("0")) return "+250" + digits.slice(1);
  return "+" + digits;
}

function getConfig() {
  const token = process.env.PAWAPAY_API_TOKEN;
  const baseUrl = (process.env.PAWAPAY_API_URL || "https://api.sandbox.pawapay.io").replace(/\/$/, "");
  if (!token) return null;
  return { token, baseUrl };
}

export async function POST(request: Request) {
  const session = await requireAuth(["CUSTOMER"]);
  const body = await request.json();

  if (String(body.method || "MOBILE_MONEY") !== "MOBILE_MONEY") {
    return NextResponse.json({ error: "PawaPay checkout currently supports MTN Mobile Money." }, { status: 400 });
  }

  const recipientName = String(body.recipientName || "").trim();
  const phone = normalizePhone(String(body.phone || "").trim());
  const province = String(body.province || "").trim();
  const district = String(body.district || "").trim();
  const sector = String(body.sector || "").trim();
  const address = String(body.address || "").trim();

  if (!recipientName || phone.length < 12 || !province || !district || !sector || !address) {
    return NextResponse.json({ error: "Complete all Rwanda delivery details before continuing." }, { status: 400 });
  }

  const config = getConfig();
  const callbackUrl = process.env.PAWAPAY_CALLBACK_URL;
  if (!config || !callbackUrl) {
    return NextResponse.json({ error: "PawaPay is not configured. Add PAWAPAY_API_TOKEN and PAWAPAY_CALLBACK_URL." }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Customer account not found." }, { status: 404 });

  const cart = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { include: { seller: true } }, variant: true },
  });
  if (!cart.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  for (const item of cart) {
    const variantCount = await prisma.productVariant.count({ where: { productId: item.productId } });
    const stock = item.variant ? item.variant.stock : item.product.stock;
    if (item.product.seller.status !== "APPROVED") {
      return NextResponse.json({ error: "A seller is no longer approved for this product." }, { status: 409 });
    }
    if (!item.product.published) {
      return NextResponse.json({ error: "A product is no longer available." }, { status: 409 });
    }
    if (variantCount > 0 && !item.variant) {
      return NextResponse.json({ error: "Select a product option before checkout." }, { status: 409 });
    }
    if (stock < item.quantity) {
      return NextResponse.json({
        error: item.variant ? "A selected product option is out of stock." : "Some products are out of stock.",
      }, { status: 409 });
    }
  }

  const subtotal = cart.reduce((sum: number, item: (typeof cart)[number]) => sum + Number(item.variant?.price ?? item.product.price) * item.quantity, 0);
  const delivery = 3000;

  const couponCode = String(body.couponCode || "").trim().toUpperCase();
  let discount = 0;
  let couponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    const now = new Date();
    if (!coupon || !coupon.active || coupon.type === "FLASH_SALE" || (coupon.startAt && coupon.startAt > now) || (coupon.endAt && coupon.endAt < now)) {
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
  if (!Number.isFinite(total) || total <= 0) return NextResponse.json({ error: "Invalid checkout total." }, { status: 400 });
  const depositId = crypto.randomUUID();
  const trackingCode = "DIR-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString().slice(-5);

  const order = await prisma.order.create({
    data: {
      userId: session.userId,
      total,
      status: "PENDING",
      items: {
        create: cart.map((item: (typeof cart)[number]) => ({
          productId: item.productId,
          sellerId: item.product.sellerId,
          quantity: item.quantity,
          variantId: item.variantId,
          unitPrice: item.variant?.price ?? item.product.price,
        })),
      },
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
      payment: {
        create: {
          txRef: depositId,
          method: "MOBILE_MONEY",
          amount: total,
          currency: "RWF",
          status: "PENDING",
          provider: "pawapay",
        },
      },
      ...(couponId ? { couponUsage: { create: { couponId, userId: session.userId, discount } } } : {}),
    },
  });

  try {
    const response = await fetch(config.baseUrl + "/v2/deposits", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        depositId,
        amount: total.toFixed(2),
        currency: "RWF",
        payer: {
          type: "MMO",
          accountDetails: {
            phoneNumber: phone,
            provider: "MTN_MOMO_RWA",
          },
        },
        customerMessage: "DIRECTE order " + order.id,
        clientReferenceId: order.id,
        callbackUrl,
        metadata: [
          { fieldName: "orderId", fieldValue: order.id },
          { fieldName: "customerId", fieldValue: session.userId },
        ],
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || "Could not start PawaPay payment.");

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      txRef: depositId,
      depositId,
      trackingCode,
      providerStatus: data?.status || "ACCEPTED",
      message: "Payment request sent. Approve the MTN Mobile Money prompt on your phone.",
    });
  } catch (error) {
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: "FAILED" } });
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await prisma.delivery.update({ where: { orderId: order.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start PawaPay payment." }, { status: 502 });
  }
}
