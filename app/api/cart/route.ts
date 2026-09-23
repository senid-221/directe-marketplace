import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [], authenticated: false });
  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: { include: { seller: true, images: { orderBy: { position: "asc" } } } }, variant: true },
    orderBy: { id: "desc" },
  });
  return NextResponse.json({ authenticated: true, items });
}

async function resolveProduct(productId: string, variantId?: string | null) {
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: productId }, { slug: productId }], published: true, seller: { status: "APPROVED" } },
    include: { variants: true },
  });
  if (!product) return { product: null, variant: null };
  if (!product.variants.length) return { product, variant: null };
  if (!variantId) return { product, variant: undefined };
  return { product, variant: product.variants.find((v) => v.id === variantId) ?? undefined };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const body = await request.json();
  const productId = String(body.productId || "");
  const variantId = body.variantId ? String(body.variantId) : null;
  const quantity = Number(body.quantity ?? 1);
  if (!productId || !Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const { product, variant } = await resolveProduct(productId, variantId);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.variants.length && variant === undefined) return NextResponse.json({ error: "Select a product option before adding it to the cart." }, { status: 400 });
  if (variantId && !variant) return NextResponse.json({ error: "Selected product option was not found." }, { status: 404 });

  const stock = variant ? variant.stock : product.stock;
  const existing = await prisma.cartItem.findFirst({ where: { userId: session.userId, productId: product.id, variantId: variant?.id ?? null } });
  const nextQuantity = (existing?.quantity ?? 0) + quantity;
  if (stock < nextQuantity) return NextResponse.json({ error: "Not enough stock" }, { status: 400 });

  const item = existing
    ? await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } })
    : await prisma.cartItem.create({ data: { userId: session.userId, productId: product.id, variantId: variant?.id ?? null, quantity } });

  return NextResponse.json({ ok: true, item });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const body = await request.json();
  const cartItemId = String(body.cartItemId || "");
  const quantity = Number(body.quantity);
  if (!cartItemId || !Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const current = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId: session.userId },
    include: { product: { include: { seller: true, variants: true } }, variant: true },
  });
  if (!current) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  if (!current.product.published || current.product.seller.status !== "APPROVED") return NextResponse.json({ error: "Product not available" }, { status: 404 });

  const stock = current.variant ? current.variant.stock : current.product.stock;
  if (quantity > stock) return NextResponse.json({ error: "Not enough stock" }, { status: 400 });

  const item = await prisma.cartItem.update({ where: { id: current.id }, data: { quantity } });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const body = await request.json();
  if (body.cartItemId) await prisma.cartItem.deleteMany({ where: { id: String(body.cartItemId), userId: session.userId } });
  else if (body.productId) await prisma.cartItem.deleteMany({ where: { userId: session.userId, productId: String(body.productId), variantId: body.variantId ? String(body.variantId) : null } });
  return NextResponse.json({ ok: true });
}
