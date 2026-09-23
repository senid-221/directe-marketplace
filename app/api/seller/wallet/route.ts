import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
 const session=await requireAuth(["SELLER"]);
 const seller=await prisma.seller.findUnique({where:{userId:session.userId},include:{wallet:true,payouts:{orderBy:{requestedAt:"desc"},take:10}}});
 if(!seller) return NextResponse.json({error:"Seller account not found."},{status:404});
 return NextResponse.json({
  seller:{id:seller.id,storeName:seller.storeName,status:seller.status,payoutEnabled:seller.payoutEnabled,payoutPhone:seller.payoutPhone,payoutProvider:seller.payoutProvider},
  wallet:seller.wallet?{availableBalance:Number(seller.wallet.availableBalance),pendingBalance:Number(seller.wallet.pendingBalance),totalSales:Number(seller.wallet.totalSales),totalPayouts:Number(seller.wallet.totalPayouts)}:{availableBalance:0,pendingBalance:0,totalSales:0,totalPayouts:0},
  payouts:seller.payouts.map(p=>({id:p.id,amount:Number(p.amount),status:p.status,phone:p.phone,requestedAt:p.requestedAt})),
 });
}