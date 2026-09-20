import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import AdminProductsClient from "@/components/AdminProductsClient";

export default async function AdminProductsPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null); if(!session) redirect("/login?next=/admin/products");
 const products=await prisma.product.findMany({include:{seller:{select:{storeName:true}},category:{select:{name:true}},images:{orderBy:{position:"asc"},take:1}},orderBy:{updatedAt:"desc"}});
 return <main className="portal"><AdminSidebar active="Products"/><section className="portalMain"><div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Products</h1><p className="portalSub">Manage marketplace product visibility.</p></div></div><AdminProductsClient initial={products.map(p=>({id:p.id,name:p.name,price:Number(p.price),stock:p.stock,published:p.published,seller:p.seller.storeName,category:p.category.name,image:p.images[0]?.url||"",updatedAt:p.updatedAt.toISOString()}))}/></section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[["Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
