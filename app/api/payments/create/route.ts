import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("250")) return "+" + digits;
  if (digits.startsWith("0")) return "+250" + digits.slice(1);
  return "+" + digits;
}

function getConfig() {
  const apiUser = process.env.MTN_MOMO_API_USER;
  const apiKey = process.env.MTN_MOMO_API_KEY;
  const subscriptionKey = process.env.MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY;
  const baseUrl = (process.env.MTN_MOMO_BASE_URL || "https://sandbox.momodeveloper.mtn.com").replace(/\/$/, "");
  const targetEnvironment = process.env.MTN_MOMO_TARGET_ENVIRONMENT || "sandbox";
  if (!apiUser || !apiKey || !subscriptionKey) return null;
  return { apiUser, apiKey, subscriptionKey, baseUrl, targetEnvironment };
}

async function getAccessToken(config: ReturnType<typeof getConfig>) {
  if (!config) throw new Error("MTN_MOMO_NOT_CONFIGURED");
  const basic = Buffer.from(config.apiUser + ":" + config.apiKey).toString("base64");
  const response = await fetch(config.baseUrl + "/collection/token/", {
    method: "POST",
    headers: {
      Authorization: "Basic " + basic,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) throw new Error("Could not get MTN MoMo access token.");
  return String(data.access_token);
}

export async function POST(request: Request) {
  const session = await requireAuth(["CUSTOMER"]);
  const body = await request.json();

  if (String(body.method || "MOBILE_MONEY") !== "MOBILE_MONEY") {
    return NextResponse.json({ error: "Checkout currently supports MTN Mobile Money." }, { status: 400 });
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
  if (!config) return NextResponse.json({ error: "MTN MoMo API is not configured. Add the collection API credentials." }, { status: 503 });

  const callbackUrl = process.env.MTN_MOMO_CALLBACK_URL;
  if (!callbackUrl) return NextResponse.json({ error: "MTN_MOMO_CALLBACK_URL is not configured." }, { status: 503 });

  const cart = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { include: { seller: true } }, variant: true },
  });
  if (!cart.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  for (const item of cart) {
    const variantCount = await prisma.productVariant.count({ where: { productId: item.productId } });
    const stock = item.variant ? item.variant.stock : item.product.stock;
    if (item.product.seller.status !== "APPROVED") return NextResponse.json({ error: "A seller is no longer approved for this product." }, { status: 409 });
    if (!item.product.published) return NextResponse.json({ error: "A product is no longer available." }, { status: 409 });
    if (variantCount > 0 && !item.variant) return NextResponse.json({ error: "Select a product option before checkout." }, { status: 409 });
    if (stock < item.quantity) return NextResponse.json({ error: item.variant ? "A selected product option is out of stock." : "Some products are out of stock." }, { status: 409 });
  }

  const subtotal = cart.reduce((sum: number, item: (typeof cart)[number]) => sum + Number(item.variant?.price ?? item.product.price) * item.quantity, 0);
  const delivery = 3000;
  const couponCode = String(body.couponCode || "").trim().toUpperCase();
  let discount = 0;
  let couponId: string | null = null;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    const now = new Date();
    if (!coupon || !coupon.active || coupon.type === "FLASH_SALE" || (coupon.startAt && coupon.startAt > now) || (coupon.endAt && coupon.endAt < now)) return NextResponse.json({ error: "Coupon is invalid or expired." }, { status: 400 });
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ error: "Coupon usage limit has been reached." }, { status: 409 });
    if (coupon.minOrderAmount !== null && subtotal < Number(coupon.minOrderAmount)) return NextResponse.json({ error: "Minimum order amount for this coupon has not been reached." }, { status: 400 });
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: session.userId } });
    if (used >= coupon.perUserLimit) return NextResponse.json({ error: "You have already used this coupon." }, { status: 409 });
    discount = coupon.type === "PERCENT" ? subtotal * Number(coupon.value) / 100 : Number(coupon.value);
    if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.max(0, Math.min(discount, subtotal));
    couponId = coupon.id;
  }

  const total = Math.max(0, subtotal - discount + delivery);
  if (!Number.isFinite(total) || total <= 0) return NextResponse.json({ error: "Invalid checkout total." }, { status: 400 });

  const orderId = crypto.randomUUID();
  const referenceId = crypto.randomUUID();
  const trackingCode = "DIR-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString().slice(-5);

  const order = await prisma.order.create({
    data: {
      id: orderId,
      userId: session.userId,
      total,
      status: "PENDING",
      items: { create: cart.map((item: (typeof cart)[number]) => ({
        productId: item.productId,
        sellerId: item.product.sellerId,
        quantity: item.quantity,
        variantId: item.variantId,
        unitPrice: item.variant?.price ?? item.product.price,
      })) },
      delivery: { create: {
        trackingCode, status: "PENDING", recipientName, phone, province, district, sector, address,
        deliveryFee: delivery, estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      } },
      payment: { create: {
        txRef: referenceId, method: "MOBILE_MONEY", amount: total, currency: "RWF", status: "PENDING", provider: "mtn_momo",
      } },
      ...(couponId ? { couponUsage: { create: { couponId, userId: session.userId, discount } } } : {}),
    },
  });

  try {
    const accessToken = await getAccessToken(config);
    const response = await fetch(config.baseUrl + "/collection/v1_0/requesttopay", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": config.targetEnvironment,
        "Ocp-Apim-Subscription-Key": config.subscriptionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: total.toFixed(2),
        currency: "RWF",
        externalId: order.id,
        payer: { partyIdType: "MSISDN", partyId: phone.replace(/\D/g, "") },
        payerMessage: "DIRECTE order " + order.id,
        payeeNote: "DIRECTE marketplace order",
      }),
      cache: "no-store",
    });

    if (!response.ok && response.status !== 202) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Could not start MTN MoMo payment.");
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      txRef: referenceId,
      trackingCode,
      providerStatus: "PENDING",
      message: "Payment request sent. Approve the MTN Mobile Money prompt on your phone.",
    });
  } catch (error) {
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: "FAILED" } });
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await prisma.delivery.update({ where: { orderId: order.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start MTN MoMo payment." }, { status: 502 });
  }
}
