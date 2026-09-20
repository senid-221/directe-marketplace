import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(){
  await requireAuth(["ADMIN"]);
  const sellers=await prisma.seller.findMany({include:{user:{select:{name:true,email:true,phone:true}},_count:{select:{products:true}}},orderBy:{createdAt:"desc"}});
  return NextResponse.json({sellers:sellers.map(s=>({id:s.id,storeName:s.storeName,description:s.description||"",status:s.status,createdAt:s.createdAt,user:s.user,productCount:s._count.products}))});
}
export async function PATCH(request:Request){
  await requireAuth(["ADMIN"]);
  const body=await request.json(); const id=String(body.id||""); const status=String(body.status||"");
  if(!id||!["PENDING","APPROVED","SUSPENDED","REJECTED"].includes(status)) return NextResponse.json({error:"Invalid seller status."},{status:400});
  const seller=await prisma.seller.update({where:{id},data:{status:status as "PENDING"|"APPROVED"|"SUSPENDED"|"REJECTED"}});
  if(status==="APPROVED") await prisma.user.update({where:{id:seller.userId},data:{role:"SELLER"}});
  return NextResponse.json({ok:true,status:seller.status});
}
