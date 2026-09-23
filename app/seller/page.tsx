import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type SellerProductStock = {
  stock: number;
};

export default async function SellerPage() {
  const session = await requireAuth(["SELLER"]).catch(() => null);
  if (!session) redirect("/login?next=/seller");

  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller || seller.status !== "APPROVED") redirect("/seller/apply");

  const [products, orders, recentOrders, sellerItems] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: seller.id }, select: { stock: true } }),
    prisma.order.findMany({ where: { items: { some: { sellerId: seller.id } } }, select: { id: true } }),
    prisma.order.findMany({
      where: { items: { some: { sellerId: seller.id } } },
      include: { user: { select: { name: true, email: true, phone: true } }, items: { where: { sellerId: seller.id }, include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" }, take: 8,
    }),
    prisma.orderItem.findMany({ where: { sellerId: seller.id, order: { status: { notIn: ["CANCELLED", "REFUNDED"] } } }, select: { quantity: true, unitPrice: true } }),
  ]);

  const revenue = sellerItems.reduce((sum: number, item: (typeof sellerItems)[number]) => sum + Number(item.unitPrice) * item.quantity, 0);
  const sellerProducts: SellerProductStock[] = products;
  const lowStock = sellerProducts.filter((product: SellerProductStock) => product.stock <= 5).length;

  return <main className="portal"><SellerSidebar active="Dashboard" /><section className="portalMain">
    <div className="portalTop">
      <div><div className="eyebrow">SELLER CENTER</div><h1>Welcome to your store</h1><p className="portalSub">{seller.storeName}</p></div>
      <a className="cta portalButton" href="/seller/products#add-product">+ Add product</a>
    </div>
    <div className="stats">
      <div className="stat"><span>Orders</span><strong>{orders.length.toLocaleString()}</strong></div>
      <div className="stat"><span>Products</span><strong>{products.length.toLocaleString()}</strong></div>
      <div className="stat"><span>Revenue</span><strong>RWF {Math.round(revenue).toLocaleString()}</strong></div>
      <div className="stat"><span>Low stock</span><strong>{lowStock}</strong></div>
    </div>

    <div className="sellerQuickLinks">
      <a href="/seller/products"><span className="material-symbols-outlined">inventory_2</span><strong>Manage products</strong><small>Add, edit and publish products</small></a>
      <a href="/seller/orders"><span className="material-symbols-outlined">shopping_bag</span><strong>Manage orders</strong><small>Process customer orders</small></a><a href="/seller/coupons"><span className="material-symbols-outlined">confirmation_number</span><strong>Coupons</strong><small>Create discount codes</small></a>
      <a href="/seller/inventory"><span className="material-symbols-outlined">warehouse</span><strong>Inventory</strong><small>Update stock quickly</small></a>
    </div>

    <div className="panel">
      <div className="sectionHeader"><div><h2>Recent orders</h2><p className="portalSub">Orders containing your products.</p></div><a href="/seller/orders">View all</a></div>
      <div className="sellerRecentOrders">{recentOrders.map((order: (typeof recentOrders)[number]) => <div className="sellerRecentOrder" key={order.id}>
        <div><strong>#{order.id.slice(-8).toUpperCase()}</strong><span>{order.user.name || order.user.phone || order.user.email || "Customer"}</span></div>
        <div><span>{order.items.length} item{order.items.length===1?"":"s"}</span><strong>{order.status}</strong></div>
      </div>)}{!recentOrders.length && <div className="emptyState">No orders yet.</div>}</div>
    </div>
  </section></main>;
}

function SellerSidebar({ active }: { active: string }) {
  const links = [["Dashboard","/seller"],["Products","/seller/products"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Store settings","/seller/settings"]];
  return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([label,href])=><a key={label} href={href} className={active===label?"portalNavActive":""}>{label}</a>)}</aside>;
}
