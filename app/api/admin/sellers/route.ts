import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(){
  await requireAuth(["ADMIN"]);
  const sellers=await prisma.seller.findMany({
    include:{user:{select:{name:true,email:true,phone:true}},_count:{select:{products:true}}},
    orderBy:{createdAt:"desc"}
  });
  return NextResponse.json({sellers:sellers.map((s: (typeof sellers)[number])=>({
    id:s.id,storeName:s.storeName,description:s.description||"",status:s.status,createdAt:s.createdAt,
    plan:s.plan,planAmount:s.planAmount?Number(s.planAmount):null,paymentStatus:s.paymentStatus,paymentMethod:s.paymentMethod,
    user:s.user,productCount:s._count.products
  }))});
}
export async function PATCH(request:Request){
  await requireAuth(["ADMIN"]);
  const body=await request.json(); const id=String(body.id||""); const status=String(body.status||"");
  if(!id||!["PENDING","APPROVED","SUSPENDED","REJECTED"].includes(status)) return NextResponse.json({error:"Invalid seller status."},{status:400});
  const seller=await prisma.seller.findUnique({where:{id}});
  if(!seller) return NextResponse.json({error:"Seller not found."},{status:404});
  if(status==="APPROVED" && seller.paymentTxRef && seller.paymentStatus!=="SUCCESSFUL") {
    return NextResponse.json({error:"Seller must complete the application payment before approval."},{status:409});
  }
  const updated=await prisma.$transaction(async tx=>{
    const next=await tx.seller.update({where:{id},data:{status:status as "PENDING"|"APPROVED"|"SUSPENDED"|"REJECTED"}});
    if(status==="APPROVED") await tx.user.update({where:{id:seller.userId},data:{role:"SELLER"}});
    if(status==="REJECTED") await tx.user.update({where:{id:seller.userId},data:{role:"CUSTOMER"}});
    return next;
  });
  return NextResponse.json({ok:true,status:updated.status});
}