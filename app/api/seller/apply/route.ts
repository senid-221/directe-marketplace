import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const plans = {
  starter: { name: "Starter", amount: 50000 },
  business: { name: "Business", amount: 150000 },
  plus: { name: "Plus", amount: 250000 },
} as const;

const methods = ["CARD", "MOBILE_MONEY", "BANK_TRANSFER"] as const;

export async function POST(request: Request) {
  const session = await requireAuth(["CUSTOMER"]);
  const body = await request.json();
  const planId = String(body.plan || "");
  const method = String(body.paymentMethod || "") as (typeof methods)[number];
  const storeName = String(body.storeName || "").trim();
  const description = String(body.description || "").trim();
  const phone = String(body.phone || "").trim();

  const plan = plans[planId as keyof typeof plans];
  if (!plan) return NextResponse.json({ error: "Choose a valid seller plan." }, { status: 400 });
  if (!methods.includes(method)) return NextResponse.json({ error: "Choose a valid payment method." }, { status: 400 });
  if (!storeName) return NextResponse.json({ error: "Store name is required." }, { status: 400 });

  const secret = process.env.FLW_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (!secret || !appUrl) return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (!user.email) return NextResponse.json({ error: "Add an email address to your account before applying." }, { status: 400 });

  const existing = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (existing?.status === "APPROVED") return NextResponse.json({ error: "Your seller account is already approved." }, { status: 409 });
  if (existing?.paymentStatus === "PENDING" && existing.paymentTxRef) return NextResponse.json({ error: "You already have a pending seller payment. Complete it before starting another application." }, { status: 409 });

  const txRef = "AKZ-SELLER-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9).toUpperCase();

  const seller = existing
    ? await prisma.seller.update({
        where: { id: existing.id },
        data: { storeName, description: description || null, plan: plan.name, planAmount: plan.amount, paymentStatus: "PENDING", paymentMethod: method, paymentTxRef: txRef, paymentTxnId: null, status: "PENDING" },
      })
    : await prisma.seller.create({
        data: { userId: session.userId, storeName, description: description || null, plan: plan.name, planAmount: plan.amount, paymentStatus: "PENDING", paymentMethod: method, paymentTxRef: txRef, status: "PENDING" },
      });

  if (phone && !user.phone) await prisma.user.update({ where: { id: user.id }, data: { phone } });

  const paymentOptions = method === "MOBILE_MONEY" ? "mobilemoneyrwanda" : method === "BANK_TRANSFER" ? "banktransfer" : "card";
  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: plan.amount,
      currency: "RWF",
      redirect_url: appUrl.replace(/\/$/, "") + "/payment/callback",
      payment_options: paymentOptions,
      customer: { email: user.email, name: user.name || storeName, phonenumber: phone || user.phone || undefined },
      customizations: { title: "AkaziConnect Seller Program", description: plan.name + " seller plan" },
      meta: { seller_id: seller.id, plan: plan.name, payment_method: method, type: "seller_application" },
      configurations: { session_duration: 30, max_retry_attempt: 3 },
    }),
  });

  const data = await response.json();
  if (!response.ok || data.status !== "success" || !data.data?.link) {
    await prisma.seller.update({ where: { id: seller.id }, data: { paymentStatus: "FAILED" } });
    return NextResponse.json({ error: data.message || "Could not start seller payment." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sellerId: seller.id, txRef, paymentUrl: data.data.link });
}
