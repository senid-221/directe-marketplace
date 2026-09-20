import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import SellerSettingsClient from "@/components/SellerSettingsClient";

export default async function SellerSettingsPage() {
  const session=await requireAuth(["SELLER"]).catch(()=>null);
  if(!session) redirect("/login?next=/seller/settings");
  const seller=await prisma.seller.findUnique({where:{userId:session.userId}});
  if(!seller||seller.status!=="APPROVED") redirect("/seller/apply");
  return <main className="portal"><SellerSidebar active="Store settings"/><section className="portalMain">
    <div className="portalTop"><div><div className="eyebrow">SELLER CENTER</div><h1>Store settings</h1><p className="portalSub">Update the information customers see about your store.</p></div></div>
    <SellerSettingsClient initial={{storeName:seller.storeName,description:seller.description||"",status:seller.status,commission:Number(seller.commission)}}/>
  </section></main>;
}
function SellerSidebar({active}:{active:string}){
  const links=[["Dashboard","/seller"],["Products","/seller/products"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Store settings","/seller/settings"]];
  return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([label,href])=><a key={label} href={href} className={active===label?"portalNavActive":""}>{label}</a>)}</aside>;
}
