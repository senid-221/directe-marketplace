import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}) {
  const session=await requireAuth(["CUSTOMER","SELLER"]);
  const {id}=await params;
  const order=await prisma.order.findFirst({where:{id,userId:session.userId},include:{payment:{select:{status:true,method:true,transactionId:true}},items:{include:{product:{select:{name:true,slug:true,price:true,images:{orderBy:{position:"asc"},take:1}}}}}}});
  if(!order) return NextResponse.json({error:"ORDER_NOT_FOUND"},{status:404});
  return NextResponse.json({order});
}
