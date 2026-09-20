import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth(["CUSTOMER", "SELLER"]);
  const addresses = await prisma.address.findMany({where:{userId:session.userId},orderBy:{id:"desc"}});
  return NextResponse.json({addresses});
}

export async function POST(request: Request) {
  const session = await requireAuth(["CUSTOMER", "SELLER"]);
  const body = await request.json();
  const province=String(body.province||"").trim(), district=String(body.district||"").trim(), sector=String(body.sector||"").trim();
  if(!province||!district||!sector) return NextResponse.json({error:"Province, district and sector are required."},{status:400});
  const address=await prisma.address.create({data:{userId:session.userId,province,district,sector,cell:String(body.cell||"").trim()||null,village:String(body.village||"").trim()||null,details:String(body.details||"").trim()||null}});
  return NextResponse.json({ok:true,address},{status:201});
}

export async function DELETE(request: Request) {
  const session = await requireAuth(["CUSTOMER", "SELLER"]);
  const id = String((await request.json()).id || "");
  if(!id) return NextResponse.json({error:"Address id is required."},{status:400});
  const result=await prisma.address.deleteMany({where:{id,userId:session.userId}});
  if(!result.count) return NextResponse.json({error:"Address not found."},{status:404});
  return NextResponse.json({ok:true});
}
