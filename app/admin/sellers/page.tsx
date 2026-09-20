import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import AdminSellersClient from "@/components/AdminSellersClient";

export default async function AdminSellersPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null); if(!session) redirect("/login?next=/admin/sellers");
 const sellers=await prisma.seller.findMany({include:{user:{select:{name:true,email:true,phone:true}},_count:{select:{products:true}}},orderBy:{createdAt:"desc"}});
 return <main className="portal"><AdminSidebar active="Sellers"/><section className="portalMain"><div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Sellers</h1><p className="portalSub">Review paid seller applications and approve accounts.</p></div></div><AdminSellersClient initial={sellers.map(s=>({id:s.id,storeName:s.storeName,status:s.status,createdAt:s.createdAt.toISOString(),description:s.description||"",productCount:s._count.products,plan:s.plan,planAmount:s.planAmount?Number(s.planAmount):null,paymentStatus:s.paymentStatus,paymentMethod:s.paymentMethod,user:s.user}))}/></section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[["Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
