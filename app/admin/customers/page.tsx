import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
export default async function AdminCustomersPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null);if(!session)redirect("/login?next=/admin/customers");
 const users=await prisma.user.findMany({where:{role:"CUSTOMER"},include:{_count:{select:{orders:true,reviews:true}}},orderBy:{createdAt:"desc"}});
 return <main className="portal"><AdminSidebar active="Customers"/><section className="portalMain"><div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Customers</h1><p className="portalSub">View customer accounts and activity.</p></div></div><div className="panel"><div className="adminTableWrap"><table><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Orders</th><th>Reviews</th><th>Joined</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td><strong>{u.name||"Customer"}</strong></td><td>{u.phone||"—"}</td><td>{u.email||"—"}</td><td>{u._count.orders}</td><td>{u._count.reviews}</td><td>{u.createdAt.toLocaleDateString("en-GB")}</td></tr>)}</tbody></table>{!users.length&&<div className="emptyState">No customers found.</div>}</div></div></section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[["Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
