import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export default async function AdminPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null); if(!session) redirect("/login?next=/admin");
 const [customers,sellers,products,orders,pendingSellers,recentOrders]=await Promise.all([
  prisma.user.count({where:{role:"CUSTOMER"}}),
  prisma.seller.count(),
  prisma.product.count(),
  prisma.order.count(),
  prisma.seller.count({where:{status:"PENDING"}}),
  prisma.order.findMany({include:{user:{select:{name:true,email:true,phone:true}},items:{include:{product:{select:{name:true}}}}},orderBy:{createdAt:"desc"},take:8})
 ]);
 return <main className="portal"><AdminSidebar active="Overview"/><section className="portalMain">
  <div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Marketplace overview</h1><p className="portalSub">AkaziConnect platform management.</p></div><a className="secondaryButton portalButton" href="/admin/products">Manage products</a></div>
  <div className="stats">
   <div className="stat"><span>Customers</span><strong>{customers.toLocaleString()}</strong></div><div className="stat"><span>Sellers</span><strong>{sellers.toLocaleString()}</strong></div><div className="stat"><span>Products</span><strong>{products.toLocaleString()}</strong></div><div className="stat"><span>Orders</span><strong>{orders.toLocaleString()}</strong></div><div className="stat"><span>Pending sellers</span><strong>{pendingSellers.toLocaleString()}</strong></div>
  </div>
  <div className="adminQuickLinks"><a href="/admin/sellers"><span className="material-symbols-outlined">storefront</span><strong>Seller approvals</strong><small>Review and approve sellers</small></a><a href="/admin/products"><span className="material-symbols-outlined">inventory_2</span><strong>Products</strong><small>Control marketplace listings</small></a><a href="/admin/orders"><span className="material-symbols-outlined">shopping_bag</span><strong>Orders</strong><small>Manage order status</small></a><a href="/admin/customers"><span className="material-symbols-outlined">group</span><strong>Customers</strong><small>View customer accounts</small></a><a href="/admin/payments"><span className="material-symbols-outlined">payments</span><strong>Payments</strong><small>Review transaction records</small></a><a href="/admin/categories"><span className="material-symbols-outlined">category</span><strong>Categories</strong><small>Manage catalog structure</small></a><a href="/admin/settings"><span className="material-symbols-outlined">settings</span><strong>Branding</strong><small>Change marketplace logo</small></a><a href="/admin/business-profile"><span className="material-symbols-outlined">business</span><strong>Business Profile</strong><small>Manage AkaziConnect company details</small></a></div>
  <div className="panel"><div className="sectionHeader"><div><h2>Recent orders</h2><p className="portalSub">Latest marketplace activity.</p></div><a href="/admin/orders">View all</a></div><div className="sellerRecentOrders">{recentOrders.map((o: (typeof recentOrders)[number])=><div className="sellerRecentOrder" key={o.id}><div><strong>#{o.id.slice(-8).toUpperCase()}</strong><span>{o.user.name||o.user.phone||o.user.email||"Customer"}</span></div><div><span>{o.items.length} item{o.items.length===1?"":"s"}</span><strong>{o.status}</strong></div></div>)}{!recentOrders.length&&<div className="emptyState">No orders yet.</div>}</div></div>
 </section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[[ "Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"],["Settings","/admin/settings"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
