"use client";

import Link from "next/link";
import { useState } from "react";

type Item = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    seller: string;
    image: string | null;
    variantName: string | null;
  };
};

export default function CartClient({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState(initialItems);
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const delivery = items.length ? 3000 : 0;
  const total = subtotal + delivery;

  async function update(cartItemId: string, quantity: number) {
    if (quantity < 1) {
      await remove(cartItemId);
      return;
    }

    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity }),
    });
    const data = await response.json();

    if (response.ok) {
      setItems((current) =>
        current.map((item) =>
          item.id === cartItemId ? { ...item, quantity } : item,
        ),
      );
    } else {
      alert(data.error || "Could not update cart");
    }
  }

  async function remove(cartItemId: string) {
    await fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartItemId }),
    });
    setItems((current) => current.filter((item) => item.id !== cartItemId));
  }

  if (!items.length) {
    return (
      <div className="emptyState">
        <h2>Your cart is empty</h2>
        <p>Add products to your cart and they will stay saved in your account.</p>
        <Link href="/products" className="cta">
          Shop products
        </Link>
      </div>
    );
  }

  return (
    <div className="cartLayout">
      <section>
        {items.map((item) => (
          <article className="cartItem" key={item.id}>
            <Link
              href={"/product/" + item.product.slug}
              className="cartItemImage"
            >
              {item.product.image ? (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 14,
                  }}
                />
              ) : (
                "🛍️"
              )}
            </Link>

            <div className="cartItemInfo">
              <Link href={"/product/" + item.product.slug}>
                <strong>{item.product.name}</strong>
              </Link>
              <div className="cartSeller">{item.product.seller}</div>
              {item.product.variantName && (
                <div className="cartSeller">
                  Option: {item.product.variantName}
                </div>
              )}
              <div className="cartPrice">
                RWF{" "}
                {(item.product.price * item.quantity).toLocaleString()}
              </div>
            </div>

            <div className="quantity">
              <button
                onClick={() => update(item.id, item.quantity - 1)}
                type="button"
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() =>
                  update(
                    item.id,
                    Math.min(item.quantity + 1, item.product.stock),
                  )
                }
                disabled={item.quantity >= item.product.stock}
                type="button"
              >
                +
              </button>
            </div>

            <button
              className="remove"
              onClick={() => remove(item.id)}
              type="button"
            >
              Remove
            </button>
          </article>
        ))}
      </section>

      <aside className="summary">
        <h2>Order summary</h2>
        <div>
          <span>Subtotal</span>
          <strong>RWF {subtotal.toLocaleString()}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>RWF {delivery.toLocaleString()}</strong>
        </div>
        <hr />
        <div className="grand">
          <span>Total</span>
          <strong>RWF {total.toLocaleString()}</strong>
        </div>
        <Link href="/checkout" className="cta summaryButton">
          Proceed to checkout
        </Link>
      </aside>
    </div>
  );
}
