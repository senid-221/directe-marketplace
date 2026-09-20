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
    <SellerProductsClient initialProducts={products.map((product: (typeof products)[number]) => ({ id:product.id,name:product.name,description:product.description||"",categoryId:product.categoryId,categoryName:product.category.name,price:Number(product.price),oldPrice:product.oldPrice===null?null:Number(product.oldPrice),stock:product.stock,published:product.published,images:product.images.map((image: (typeof product.images)[number]) => image.url),updatedAt:product.updatedAt.toISOString() }))} categories={categories.map((category: (typeof categories)[number]) => ({id:category.id,name:category.name}))} />
  </section></main>;
}

function SellerSidebar({ active }: { active: string }) {
  const links = [["Dashboard","/seller"],["Products","/seller/products"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Store settings","/seller/settings"]];
  return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([label,href])=><a key={label} href={href} className={active===label?"portalNavActive":""}>{label}</a>)}</aside>;
}
