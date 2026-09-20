import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import WishlistClient from "@/components/WishlistClient";

export const dynamic="force-dynamic";

export default async function WishlistPage(){
  const session=await requireAuth(["CUSTOMER","SELLER"]).catch(()=>null);
  if(!session) redirect("/login?next=/wishlist");
  const items=await prisma.wishlist.findMany({
    where:{userId:session.userId},
    orderBy:{createdAt:"desc"},
    include:{product:{include:{images:{orderBy:{position:"asc"},take:1}}}}
  });
  return <WishlistClient initialItems={items}/>;
}
