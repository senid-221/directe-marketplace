import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import CouponManager from "@/components/CouponManager";

export const dynamic="force-dynamic";
export default async function AdminCouponsPage(){
 const session=await requireAuth(["ADMIN"]).catch(()=>null);if(!session)redirect("/login?next=/admin/coupons");
 const coupons=await prisma.coupon.findMany({include:{seller:true},orderBy:{createdAt:"desc"}});
 return <main className="portal"><aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3><a href="/admin">Overview</a><a href="/admin/sellers">Sellers</a><a href="/admin/products">Products</a><a href="/admin/promotions">Promotions</a><a href="/admin/coupons" className="portalNavActive">Coupons</a><a href="/admin/orders">Orders</a><a href="/admin/payments">Payments</a></aside><section className="portalMain"><div className="portalTop"><div><div className="eyebrow">ADMIN PORTAL</div><h1>Coupons</h1><p className="portalSub">Create and manage marketplace coupon codes.</p></div></div><div className="panel"><CouponManager initialCoupons={coupons.map(c=>({...c,value:Number(c.value)}))}/></div></section></main>;
}
