import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(){
  await requireAuth(["ADMIN"]);
  const products=await prisma.product.findMany({include:{seller:{select:{storeName:true}},category:{select:{name:true}},images:{orderBy:{position:"asc"},take:1}},orderBy:{updatedAt:"desc"}});
  return NextResponse.json({products:products.map((p: (typeof products)[number])=>({id:p.id,name:p.name,price:Number(p.price),stock:p.stock,published:p.published,seller:p.seller.storeName,category:p.category.name,image:p.images[0]?.url||"",updatedAt:p.updatedAt}))});
}
export async function PATCH(request:Request){
  await requireAuth(["ADMIN"]);
  const body=await request.json(); const id=String(body.id||""); const published=Boolean(body.published);
  if(!id) return NextResponse.json({error:"Product id is required."},{status:400});
  const product=await prisma.product.update({where:{id},data:{published}});
  return NextResponse.json({ok:true,published:product.published});
}
