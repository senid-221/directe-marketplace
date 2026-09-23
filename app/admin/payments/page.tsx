import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic="force-dynamic";

export default async function AdminPaymentsPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null);
 if(!session)redirect("/login?next=/admin/payments");

 const payments=await prisma.payment.findMany({
  include:{order:{select:{id:true,total:true,status:true,createdAt:true,user:{select:{name:true,email:true,phone:true}}}}},
  orderBy:{createdAt:"desc"},take:200
 });

 return <main className="portal"><AdminSidebar active="Payments"/><section className="portalMain">
  <div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Payments</h1><p className="portalSub">PawaPay collection records and payment status.</p></div></div>
  <div className="stats">
   <div className="stat"><span>Total payments</span><strong>{payments.length.toLocaleString()}</strong></div>
   <div className="stat"><span>Successful</span><strong>{payments.filter(p=>p.status==="SUCCESSFUL").length.toLocaleString()}</strong></div>
   <div className="stat"><span>Pending</span><strong>{payments.filter(p=>p.status==="PENDING").length.toLocaleString()}</strong></div>
   <div className="stat"><span>Failed</span><strong>{payments.filter(p=>p.status==="FAILED"||p.status==="CANCELLED").length.toLocaleString()}</strong></div>
  </div>
  <div className="panel"><div className="adminTableWrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Provider</th><th>Status</th><th>Transaction</th><th>Date</th></tr></thead><tbody>
   {payments.map((p:(typeof payments)[number])=><tr key={p.id}>
    <td><strong>#{p.order.id.slice(-8).toUpperCase()}</strong></td>
    <td>{p.order.user.name||p.order.user.phone||p.order.user.email||"Customer"}</td>
    <td>RWF {Number(p.amount).toLocaleString()}</td>
    <td>{p.provider}</td>
    <td><span className={"statusPill status-"+p.status.toLowerCase()}>{p.status}</span></td>
    <td>{p.transactionId||p.txRef}</td>
    <td>{p.createdAt.toLocaleString("en-GB")}</td>
   </tr>)}
  </tbody></table>{!payments.length&&<div className="emptyState">No payment records found.</div>}</div></div>
 </section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[["Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"],["Coupons","/admin/coupons"],["Settings","/admin/settings"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
