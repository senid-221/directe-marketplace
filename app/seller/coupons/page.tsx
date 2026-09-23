import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import CouponManager from "@/components/CouponManager";

export const dynamic="force-dynamic";
export default async function SellerCouponsPage(){
 const session=await requireAuth(["SELLER"]).catch(()=>null);if(!session)redirect("/login?next=/seller/coupons");
 const seller=await prisma.seller.findUnique({where:{userId:session.userId}});
 if(!seller||seller.status!=="APPROVED")redirect("/seller/apply");
 const coupons=await prisma.coupon.findMany({where:{sellerId:seller.id},include:{seller:true},orderBy:{createdAt:"desc"}});
 return <main className="portal"><aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3><a href="/seller">Dashboard</a><a href="/seller/products">Products</a><a href="/seller/promotions">Promotions</a><a href="/seller/coupons" className="portalNavActive">Coupons</a><a href="/seller/orders">Orders</a><a href="/seller/inventory">Inventory</a><a href="/seller/settings">Store settings</a></aside><section className="portalMain"><div className="portalTop"><div><div className="eyebrow">SELLER CENTER</div><h1>Coupons</h1><p className="portalSub">Create discount codes for customers who buy your products.</p></div></div><div className="panel"><CouponManager initialCoupons={coupons.map(c=>({...c,value:Number(c.value)}))} isSeller/></div></section></main>;
}
