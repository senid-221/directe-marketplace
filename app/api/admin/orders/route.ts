import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const statuses=["PENDING","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"] as const;
export async function GET(){
  await requireAuth(["ADMIN"]);
  const orders=await prisma.order.findMany({include:{user:{select:{name:true,email:true,phone:true}},items:{include:{product:{select:{name:true,seller:{select:{storeName:true}}}}}}},orderBy:{createdAt:"desc"},take:200});
  return NextResponse.json({orders:orders.map(o=>({id:o.id,total:Number(o.total),status:o.status,createdAt:o.createdAt,user:o.user,items:o.items.map(i=>({id:i.id,quantity:i.quantity,unitPrice:Number(i.unitPrice),product:i.product.name,seller:i.product.seller.storeName}))}))});
}
export async function PATCH(request:Request){
  await requireAuth(["ADMIN"]);
  const body=await request.json(); const id=String(body.id||""); const status=String(body.status||"") as (typeof statuses)[number];
  if(!id||!statuses.includes(status)) return NextResponse.json({error:"Invalid order status."},{status:400});
  const order=await prisma.order.update({where:{id},data:{status}});
  return NextResponse.json({ok:true,status:order.status});
}
