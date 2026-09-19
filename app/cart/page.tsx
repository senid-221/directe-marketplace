import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const { add } = await searchParams;
  const items = add ? await prisma.product.findMany({
    where: { OR: [{ id: add }, { slug: add }], published: true },
    include: { seller: true, images: { orderBy: { position: "asc" } } }, take: 1
  }) : [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.price), 0);
  const delivery = items.length ? 3000 : 0;
  const total = subtotal + delivery;
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"30px 20px"}}>
    <Link href="/" style={{color:"var(--directe-orange)",fontWeight:700}}>← Continue shopping</Link>
    <div className="sectionHeader"><h1>Shopping Cart</h1></div>
    {!items.length ? <div className="emptyState"><h2>Your cart is empty</h2><p>Choose a product from DIRECTE to add it to your cart.</p><Link href="/products" className="cta">Shop products</Link></div> :
      <div className="cartLayout"><section>{items.map(item => <article className="cartItem" key={item.id}>
        <div className="cartItemImage">{item.images[0] ? <img src={item.images[0].url} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:14}}/> : "🛍️"}</div>
        <div className="cartItemInfo"><strong>{item.name}</strong><div className="cartSeller">{item.seller.storeName}</div><div className="cartPrice">RWF {Number(item.price).toLocaleString()}</div></div>
        <div className="quantity"><button disabled>−</button><span>1</span><button disabled>+</button></div>
        <Link href="/cart" className="remove">Remove</Link>
      </article>)}</section>
      <aside className="summary"><h2>Order summary</h2><div><span>Subtotal</span><strong>RWF {subtotal.toLocaleString()}</strong></div><div><span>Delivery</span><strong>RWF {delivery.toLocaleString()}</strong></div><hr/><div className="grand"><span>Total</span><strong>RWF {total.toLocaleString()}</strong></div><Link href={items[0] ? "/checkout?product="+items[0].slug : "/checkout"} className="cta summaryButton">Proceed to checkout</Link></aside></div>}
  </main>;
}