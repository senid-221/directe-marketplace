import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SellerPromotionsPage() {
  const session = await requireAuth(["SELLER"]).catch(() => null);
  if (!session) redirect("/login?next=/seller/promotions");
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller || seller.status !== "APPROVED") redirect("/seller/apply");
  const promotions = await prisma.promotion.findMany({ where: { sellerId: seller.id }, include: { products: { include: { product: true } } }, orderBy: { startAt: "desc" } });
  return <main className="portal"><SellerSidebar active="Promotions" /><section className="portalMain">
    <div className="portalTop"><div><div className="eyebrow">SELLER CENTER</div><h1>Promotions</h1><p className="portalSub">See your scheduled deals and promotion campaigns.</p></div></div>
    <div className="panel"><h2>Your campaigns</h2>{!promotions.length ? <div className="emptyState"><h3>No promotion campaigns</h3><p>Promotion creation can be enabled from your seller tools.</p></div> : <div className="sellerRecentOrders">{promotions.map((p)=><div className="sellerRecentOrder" key={p.id}><div><strong>{p.name}</strong><span>{p.products.length} product(s) · {p.type} {Number(p.value).toLocaleString()}</span></div><div><span>{new Date(p.startAt).toLocaleDateString()} → {new Date(p.endAt).toLocaleDateString()}</span><strong>{p.active ? "ACTIVE" : "OFF"}</strong></div></div>)}</div>}</div>
  </section></main>;
}
function SellerSidebar({active}:{active:string}){const links=[["Dashboard","/seller"],["Products","/seller/products"],["Promotions","/seller/promotions"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Store settings","/seller/settings"]];return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([l,h])=><a key={l} href={h} className={active===l?"portalNavActive":""}>{l}</a>)}</aside>;}
