import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import AdminOrdersClient from "@/components/AdminOrdersClient";

export default async function AdminOrdersPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null); if(!session) redirect("/login?next=/admin/orders");
 const orders=await prisma.order.findMany({
   include:{
     user:{select:{name:true,email:true,phone:true}},
     delivery:true,
     items:{include:{product:{select:{name:true,seller:{select:{storeName:true}}}}}}
   },
   orderBy:{createdAt:"desc"},take:200
 });
 return <main className="portal"><AdminSidebar active="Orders"/><section className="portalMain"><div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Orders</h1><p className="portalSub">Manage customer orders and Rwanda delivery tracking.</p></div></div><AdminOrdersClient initial={orders.map((o: (typeof orders)[number])=>({
   id:o.id,total:Number(o.total),status:o.status,createdAt:o.createdAt.toISOString(),user:o.user,
   delivery:o.delivery?{trackingCode:o.delivery.trackingCode,status:o.delivery.status,recipientName:o.delivery.recipientName,phone:o.delivery.phone,province:o.delivery.province,district:o.delivery.district,sector:o.delivery.sector,address:o.delivery.address}:null,
   items:o.items.map((i: (typeof o.items)[number])=>({id:i.id,quantity:i.quantity,unitPrice:Number(i.unitPrice),product:i.product.name,seller:i.product.seller.storeName}))
 }))}/></section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[["Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
