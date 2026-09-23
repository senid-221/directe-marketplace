import Link from "next/link";
import CheckoutClient from "@/components/CheckoutClient";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CheckoutItem = {
  name: string;
  quantity: number;
  price: number;
};

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) return <main style={{maxWidth:700,margin:"0 auto",padding:"50px 20px"}}><div className="emptyState"><h1>Sign in to checkout</h1><p>Your cart and orders are connected to your AkaziConnect account.</p><Link href="/login?next=/checkout" className="cta">Sign in</Link></div></main>;

  const items = await prisma.cartItem.findMany({
    where: { userId: session.userId },
    include: { product: true, variant: true },
  });
  const subtotal = items.reduce(
    (sum: number, item: (typeof items)[number]) =>
      sum + Number(item.variant?.price ?? item.product.price) * item.quantity,
    0
  );
  const delivery = items.length ? 3000 : 0;
  const total = subtotal + delivery;
  const checkoutItems: CheckoutItem[] = items.map((item: (typeof items)[number]) => ({
    name: item.variant ? item.product.name + " · " + item.variant.name : item.product.name,
    quantity: item.quantity,
    price: Number(item.variant?.price ?? item.product.price),
  }));

  return <main style={{maxWidth:1100,margin:"0 auto",padding:"30px 20px"}}>
    <Link href="/cart" style={{color:"var(--akaziconnect-orange)",fontWeight:700}}>← Back to cart</Link>
    <div className="sectionHeader"><h1>Checkout</h1></div>
    {!items.length ? <div className="emptyState"><h2>Your cart is empty</h2><Link href="/products" className="cta">Shop products</Link></div> :
      <CheckoutClient items={checkoutItems} subtotal={subtotal} delivery={delivery} total={total}/>}
  </main>;
}
