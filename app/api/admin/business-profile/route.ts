import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const MAX_LOGO_BYTES = 4 * 1024 * 1024;

const defaults = {
  legalName: "AkaziConnect",
  displayName: "AkaziConnect",
  description: "A Rwanda-first marketplace connecting customers with trusted sellers and products.",
  phone: "",
  email: "",
  website: "",
  country: "Rwanda",
  city: "Kigali",
  address: "",
  registrationNumber: "",
  taxNumber: "",
  currency: "RWF",
  supportHours: "",
  supportWhatsapp: "",
  payoutAccountName: "",
  payoutBankName: "",
  payoutBankAccount: "",
  momoMerchantName: "",
  momoMerchantPhone: "",
  logoUrl: "",
};

export async function GET() {
  await requireAuth(["ADMIN"]);
  const setting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  return NextResponse.json({
    ...defaults,
    ...(setting?.businessProfile || {}),
    logoUrl: setting?.logoUrl || "",
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  await requireAuth(["ADMIN"]);
  const body = await request.json().catch(() => ({}));
  const profile = {
    legalName: String(body.legalName || "").trim(),
    displayName: String(body.displayName || "").trim(),
    description: String(body.description || "").trim(),
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim(),
    website: String(body.website || "").trim(),
    country: String(body.country || "Rwanda").trim(),
    city: String(body.city || "Kigali").trim(),
    address: String(body.address || "").trim(),
    registrationNumber: String(body.registrationNumber || "").trim(),
    taxNumber: String(body.taxNumber || "").trim(),
    currency: "RWF",
    supportHours: String(body.supportHours || "").trim(),
    supportWhatsapp: String(body.supportWhatsapp || "").trim(),
    payoutAccountName: String(body.payoutAccountName || "").trim(),
    payoutBankName: String(body.payoutBankName || "").trim(),
    payoutBankAccount: String(body.payoutBankAccount || "").trim(),
    momoMerchantName: String(body.momoMerchantName || "").trim(),
    momoMerchantPhone: String(body.momoMerchantPhone || "").trim(),
  };

  if (!profile.legalName || !profile.displayName) {
    return NextResponse.json({ error: "Legal name and display name are required." }, { status: 400 });
  }

  const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() : "";
  if (logoUrl) {
    if (!logoUrl.startsWith("data:image/")) return NextResponse.json({ error: "Logo must be an image upload." }, { status: 400 });
    const base64 = logoUrl.split(",")[1] || "";
    const bytes = Math.ceil((base64.length * 3) / 4);
    if (bytes > MAX_LOGO_BYTES) return NextResponse.json({ error: "Logo must be 4 MB or smaller." }, { status: 400 });
  }

  const updated = await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {
      logoUrl: logoUrl || null,
      businessProfile: profile,
    },
    create: {
      id: "default",
      logoUrl: logoUrl || null,
      businessProfile: profile,
    },
  });

  return NextResponse.json({ ok: true, ...profile, logoUrl: updated.logoUrl || "" });
}
