import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ items: [], authenticated: false });
  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: {
      product: { include: { seller: true, images: { orderBy: { position: "asc" } } } },
      variant: true,
    },
    orderBy: { id: "desc" }
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

  const { productId, variantId = null, quantity = 1 } = await request.json();
  if (!productId || !Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const { product, variant } = await resolveProduct(String(productId), variantId ? String(variantId) : null);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (product.variants.length > 0 && variant === undefined) return NextResponse.json({ error: "Select a product option before adding it to the cart." }, { status: 400 });

  const stock = variant ? variant.stock : product.stock;
  const existing = await prisma.cartItem.findFirst({
    where: { userId: session.userId, productId: product.id, variantId: variant?.id ?? null },
    select: { id: true, quantity: true },
  });
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

  const { cartItemId, quantity } = await request.json();
  if (!cartItemId || !Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });

  const current = await prisma.cartItem.findFirst({
    where: { id: String(cartItemId), userId: session.userId },
    include: { product: { include: { variants: true } } },
  });
  if (!current) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  if (!current.product.published || current.product.sellerId.length === 0) return NextResponse.json({ error: "Product not available" }, { status: 404 });

  const variant = current.variantId ? current.product.variants.find((v) => v.id === current.variantId) : null;
  const stock = variant ? variant.stock : current.product.stock;
  if (quantity > stock) return NextResponse.json({ error: "Not enough stock" }, { status: 400 });

  const item = await prisma.cartItem.update({ where: { id: current.id }, data: { quantity } });
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });

  const { cartItemId, productId, variantId = null } = await request.json();
  if (cartItemId) await prisma.cartItem.deleteMany({ where: { id: String(cartItemId), userId: session.userId } });
  else if (productId) await prisma.cartItem.deleteMany({ where: { userId: session.userId, productId: String(productId), variantId: variantId || null } });

  return NextResponse.json({ ok: true });
}
