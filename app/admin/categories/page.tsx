import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import AdminCategoriesClient from "@/components/AdminCategoriesClient";
export default async function AdminCategoriesPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null);if(!session)redirect("/login?next=/admin/categories");
 const categories=await prisma.category.findMany({include:{_count:{select:{products:true}}},orderBy:{name:"asc"}});
 return <main className="portal"><AdminSidebar active="Categories"/><section className="portalMain"><div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Categories</h1><p className="portalSub">Manage the marketplace catalog structure.</p></div></div><AdminCategoriesClient initial={categories.map((c: (typeof categories)[number])=>({id:c.id,name:c.name,slug:c.slug,count:c._count.products}))}/></section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[["Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
