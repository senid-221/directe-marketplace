import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "LOGIN_REQUIRED" }, { status: 401 });

  try {
    const order = await prisma.$transaction(async tx => {
      const cart = await tx.cartItem.findMany({
        where: { userId: session.userId },
        include: { product: true }
      });
      if (!cart.length) throw new Error("EMPTY_CART");

      for (const item of cart) {
        if (!item.product.published || item.product.stock < item.quantity) throw new Error("STOCK_CHANGED");
      }

      const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0) + 3000;
      const created = await tx.order.create({
        data: {
          userId: session.userId,
          total,
          status: "PENDING",
          items: { create: cart.map(item => ({
            productId: item.productId,
            sellerId: item.product.sellerId,
            quantity: item.quantity,
            unitPrice: item.product.price
          })) }
        },
        include: { items: true }
      });

      for (const item of cart) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }
      await tx.cartItem.deleteMany({ where: { userId: session.userId } });
      return created;
    });

    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "EMPTY_CART") return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    if (message === "STOCK_CHANGED") return NextResponse.json({ error: "One of your products is no longer available in that quantity." }, { status: 409 });
    console.error("DIRECTE order creation failed:", error);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
