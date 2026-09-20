import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import InventoryClient from "@/components/InventoryClient";

export default async function SellerInventoryPage() {
  const session = await requireAuth(["SELLER"]).catch(() => null);
  if (!session) redirect("/login?next=/seller/inventory");
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller || seller.status !== "APPROVED") redirect("/seller/apply");

  const products = await prisma.product.findMany({ where:{sellerId:seller.id},include:{images:{orderBy:{position:"asc"}}},orderBy:{stock:"asc"} });
  return <main className="portal"><SellerSidebar active="Inventory" /><section className="portalMain">
    <div className="portalTop"><div><div className="eyebrow">SELLER CENTER</div><h1>Inventory</h1><p className="portalSub">Keep stock levels up to date.</p></div><a href="/seller/products#add-product" className="cta portalButton">+ Add product</a></div>
    <InventoryClient initialProducts={products.map((p)=>({id:p.id,name:p.name,stock:p.stock,price:Number(p.price),image:p.images[0]?.url||""}))} />
  </section></main>;
}

function SellerSidebar({ active }: { active: string }) {
  const links = [["Dashboard","/seller"],["Products","/seller/products"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Store settings","/seller/settings"]];
  return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([label,href])=><a key={label} href={href} className={active===label?"portalNavActive":""}>{label}</a>)}</aside>;
}
