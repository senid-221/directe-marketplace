import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import SellerOrdersClient from "@/components/SellerOrdersClient";

export default async function SellerOrdersPage() {
  const session = await requireAuth(["SELLER"]).catch(() => null);
  if (!session) redirect("/login?next=/seller/orders");
  const seller = await prisma.seller.findUnique({ where: { userId: session.userId } });
  if (!seller || seller.status !== "APPROVED") redirect("/seller/apply");

  const orders = await prisma.order.findMany({
    where: { items: { some: { sellerId: seller.id } } },
    include: {
      user: { select: { name:true,email:true,phone:true } },
      delivery: true,
      items: {
        where: { sellerId:seller.id },
        include: { product:{ select:{ name:true, images:{orderBy:{position:"asc"},take:1} } } }
      }
    },
    orderBy: { createdAt:"desc" },
  });

  const safeOrders = orders.map((order: (typeof orders)[number])=>({
    id:order.id,
    total:Number(order.total),
    status:order.status,
    createdAt:order.createdAt.toISOString(),
    customer:order.user,
    delivery: order.delivery ? {
      trackingCode: order.delivery.trackingCode,
      status: order.delivery.status,
      recipientName: order.delivery.recipientName,
      phone: order.delivery.phone,
      province: order.delivery.province,
      district: order.delivery.district,
      sector: order.delivery.sector,
      address: order.delivery.address,
    } : null,
    items:order.items.map((item: (typeof order.items)[number])=>({
      id:item.id,
      quantity:item.quantity,
      unitPrice:Number(item.unitPrice),
      product:{name:item.product.name,image:item.product.images[0]?.url||""}
    }))
  }));
  return <main className="portal"><SellerSidebar active="Orders" /><section className="portalMain">
    <div className="portalTop"><div><div className="eyebrow">SELLER CENTER</div><h1>Orders</h1><p className="portalSub">Track orders and manage Rwanda delivery progress.</p></div></div>
    <SellerOrdersClient initialOrders={safeOrders} />
  </section></main>;
}

function SellerSidebar({ active }: { active: string }) {
  const links = [["Dashboard","/seller"],["Products","/seller/products"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Store settings","/seller/settings"]];
  return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([label,href])=><a key={label} href={href} className={active===label?"portalNavActive":""}>{label}</a>)}</aside>;
}
