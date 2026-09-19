import Link from "next/link";
import CheckoutClient from "@/components/CheckoutClient";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) return <main style={{maxWidth:700,margin:"0 auto",padding:"50px 20px"}}><div className="emptyState"><h1>Sign in to checkout</h1><p>Your cart and orders are connected to your DIRECTE account.</p><Link href="/login?next=/checkout" className="cta">Sign in</Link></div></main>;

  const items = await prisma.cartItem.findMany({where:{userId:session.userId},include:{product:true}});
  const subtotal=items.reduce((s,i)=>s+Number(i.product.price)*i.quantity,0);
  const delivery=items.length?3000:0;
  const total=subtotal+delivery;
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"30px 20px"}}>
    <Link href="/cart" style={{color:"var(--directe-orange)",fontWeight:700}}>← Back to cart</Link>
    <div className="sectionHeader"><h1>Checkout</h1></div>
    {!items.length ? <div className="emptyState"><h2>Your cart is empty</h2><Link href="/products" className="cta">Shop products</Link></div> :
      <CheckoutClient items={items.map(i=>({name:i.product.name,quantity:i.quantity,price:Number(i.product.price)}))} subtotal={subtotal} delivery={delivery} total={total}/>}
  </main>;
}
