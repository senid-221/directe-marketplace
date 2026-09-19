import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product: productSlug } = await searchParams;
  const product = productSlug ? await prisma.product.findUnique({ where: { slug: productSlug }, include: { seller: true } }) : null;
  const subtotal = product ? Number(product.price) : 0;
  const delivery = product ? 3000 : 0;
  const total = subtotal + delivery;
  return <main style={{maxWidth:1100,margin:"0 auto",padding:"30px 20px"}}>
    <Link href={product ? "/product/"+product.slug : "/products"} style={{color:"var(--directe-orange)",fontWeight:700}}>← Back</Link>
    <div className="sectionHeader"><h1>Checkout</h1></div>
    {!product ? <div className="emptyState"><h2>No product selected</h2><p>Select a product before checkout.</p><Link href="/products" className="cta">Shop products</Link></div> :
    <div className="checkoutLayout"><section className="checkoutCard"><h2>Delivery details</h2>
      <div className="formGrid"><label>Full name<input placeholder="Your full name"/></label><label>Phone number<input placeholder="+250 7xx xxx xxx"/></label><label>Province<input placeholder="Kigali City"/></label><label>District<input placeholder="Gasabo"/></label><label>Sector<input placeholder="Kacyiru"/></label><label>Address<input placeholder="Street / village / landmark"/></label></div>
      <h2>Payment method</h2><label className="paymentOption"><input type="radio" name="p" defaultChecked/> Mobile Money</label><label className="paymentOption"><input type="radio" name="p"/> Card</label>
      <button className="cta" style={{marginTop:18,width:"100%"}}>Place order · RWF {total.toLocaleString()}</button></section>
      <aside className="summary"><h2>Your order</h2><div><span>{product.name}</span><strong>RWF {subtotal.toLocaleString()}</strong></div><div><span>Delivery</span><strong>RWF {delivery.toLocaleString()}</strong></div><hr/><div className="grand"><span>Total</span><strong>RWF {total.toLocaleString()}</strong></div></aside></div>}
  </main>;
}