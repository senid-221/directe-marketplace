import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OrderPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params; const session=await getSession(); if(!session) return <main className="emptyState"><h1>Sign in required</h1><Link href="/login" className="cta">Sign in</Link></main>;
 const order=await prisma.order.findFirst({where:{id,userId:session.userId},include:{items:{include:{product:true}}}});
 if(!order) notFound();
 return <main style={{maxWidth:900,margin:"0 auto",padding:"40px 20px"}}><div className="sectionHeader"><h1>Order confirmed</h1></div><div className="checkoutCard"><h2>Order #{order.id.slice(-8).toUpperCase()}</h2><p>Status: <strong>{order.status}</strong></p>{order.items.map((item: (typeof order.items)[number])=><div key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #eee"}}><span>{item.product.name} × {item.quantity}</span><strong>RWF {(Number(item.unitPrice)*item.quantity).toLocaleString()}</strong></div>)}<div className="grand" style={{marginTop:18}}><span>Total</span><strong>RWF {Number(order.total).toLocaleString()}</strong></div><Link href="/products" className="cta" style={{display:"inline-block",marginTop:20}}>Continue shopping</Link></div></main>;
}