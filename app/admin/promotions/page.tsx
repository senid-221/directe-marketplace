import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import PromotionForm from "@/components/PromotionForm";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const session = await requireAuth(["ADMIN"]).catch(() => null);
  if (!session) redirect("/login?next=/admin/promotions");
  const [promotions, sellers, products] = await Promise.all([
    prisma.promotion.findMany({ include: { seller: true, products: { include: { product: true } } }, orderBy: { startAt: "desc" } }),
    prisma.seller.findMany({ where: { status: "APPROVED" }, orderBy: { storeName: "asc" } }),
    prisma.product.findMany({ where: { published: true, seller: { status: "APPROVED" } }, include: { seller: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return <main className="portal"><AdminSidebar active="Promotions" /><section className="portalMain">
    <div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Promotions</h1><p className="portalSub">Create and schedule marketplace deals and flash-sale campaigns.</p></div></div>
    <div className="panel">
      <h2>Create promotion</h2>
      <PromotionForm products={products.map((p) => ({ id: p.id, name: p.name, seller: { storeName: p.seller.storeName } }))} sellers={sellers.map((s) => ({ id: s.id, storeName: s.storeName }))} />
    </div>
    <div className="panel">
      <h2>Current promotions</h2>
      {!promotions.length ? <div className="emptyState">No promotions yet.</div> : <div className="sellerRecentOrders">{promotions.map((p) => <div className="sellerRecentOrder" key={p.id}><div><strong>{p.name}</strong><span>{p.scope} · {p.type} · {Number(p.value).toLocaleString()}</span></div><div><span>{new Date(p.startAt).toLocaleDateString()} → {new Date(p.endAt).toLocaleDateString()}</span><strong>{p.active ? "ACTIVE" : "OFF"}</strong></div></div>)}</div>}
    </div>
    <div className="adminQuickLinks"><a href="/admin/products"><span className="material-symbols-outlined">inventory_2</span><strong>Products</strong><small>Select products for promotions</small></a><a href="/admin/sellers"><span className="material-symbols-outlined">storefront</span><strong>Sellers</strong><small>Review seller eligibility</small></a><a href="/admin/settings"><span className="material-symbols-outlined">settings</span><strong>Settings</strong><small>Marketplace controls</small></a></div>
    <div className="panel"><h2>Campaign-ready catalog</h2><p className="portalSub">{products.length} live products from approved sellers are available for promotion campaigns.</p></div>
    </section></main>;
}
function AdminSidebar({active}:{active:string}){const links=[["Overview","/admin"],["Customers","/admin/customers"],["Sellers","/admin/sellers"],["Products","/admin/products"],["Promotions","/admin/promotions"],["Orders","/admin/orders"],["Payments","/admin/payments"],["Categories","/admin/categories"],["Settings","/admin/settings"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
