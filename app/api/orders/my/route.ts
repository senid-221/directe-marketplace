import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth(["CUSTOMER", "SELLER"]);
  const orders = await prisma.order.findMany({
    where:{userId:session.userId},
    orderBy:{createdAt:"desc"},
    include:{payment:{select:{status:true,method:true,transactionId:true}},items:{include:{product:{select:{name:true,slug:true,images:{orderBy:{position:"asc"},take:1}}}}}}
  });
  return NextResponse.json({orders});
}
