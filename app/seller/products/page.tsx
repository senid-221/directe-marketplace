import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import SellerProductsClient from "@/components/SellerProductsClient";

export default async function SellerProductsPage() {
  const session = await requireAuth(["SELLER"]).catch(() => null);
  if (!session) redirect("/login?next=/seller/products");
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller || seller.status !== "APPROVED") redirect("/seller/apply");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: seller.id }, include: { category: true, images: { orderBy: { position: "asc" } } }, orderBy: { updatedAt: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <main className="portal"><SellerSidebar active="Products" /><section className="portalMain">
    <div className="portalTop"><div><div className="eyebrow">SELLER CENTER</div><h1>Products</h1><p className="portalSub">Manage your catalog, prices and stock.</p></div><a className="cta portalButton" href="#add-product">+ Add product</a></div>
    <SellerProductsClient initialProducts={products.map((p) => ({ id:p.id,name:p.name,description:p.description||"",categoryId:p.categoryId,categoryName:p.category.name,price:Number(p.price),oldPrice:p.oldPrice===null?null:Number(p.oldPrice),stock:p.stock,published:p.published,images:p.images.map(i=>i.url),updatedAt:p.updatedAt.toISOString() }))} categories={categories.map((c)=>({id:c.id,name:c.name}))} />
  </section></main>;
}

function SellerSidebar({ active }: { active: string }) {
  const links = [["Dashboard","/seller"],["Products","/seller/products"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Store settings","/seller/settings"]];
  return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([label,href])=><a key={label} href={href} className={active===label?"portalNavActive":""}>{label}</a>)}</aside>;
}
