import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import CartClient from "@/components/CartClient";

export const dynamic = "force-dynamic";
export default async function CartPage() {
 const session=await getSession();
 if(!session)return <main style={{maxWidth:700,margin:"0 auto",padding:"50px 20px"}}><div className="emptyState"><h1>Sign in to use your cart</h1><p>Your cart is saved to your AkaziConnect account.</p><Link href="/login?next=/cart" className="cta">Sign in</Link></div></main>;
 const items=await prisma.cartItem.findMany({where:{userId:session.userId},include:{product:{include:{seller:true,images:{orderBy:{position:"asc"}}}},variant:true},orderBy:{id:"desc"}});
 return <main style={{maxWidth:1100,margin:"0 auto",padding:"30px 20px"}}><Link href="/products" style={{color:"var(--akaziconnect-orange)",fontWeight:700}}>← Continue shopping</Link><div className="sectionHeader"><h1>Shopping Cart</h1></div><CartClient initialItems={items.map((i:(typeof items)[number])=>({id:i.id,quantity:i.quantity,product:{id:i.product.id,name:i.product.name,slug:i.product.slug,price:Number(i.variant?.price??i.product.price),stock:i.variant?.stock??i.product.stock,seller:i.product.seller.storeName,image:i.product.images[0]?.url||null,variantName:i.variant?.name||null}}))}/></main>;
}
