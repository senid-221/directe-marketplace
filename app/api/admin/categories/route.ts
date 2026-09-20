import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
export async function GET(){await requireAuth(["ADMIN"]);return NextResponse.json({categories:await prisma.category.findMany({include:{_count:{select:{products:true}}},orderBy:{name:"asc"}})});}
export async function POST(request:Request){await requireAuth(["ADMIN"]);const body=await request.json();const name=String(body.name||"").trim();if(!name)return NextResponse.json({error:"Category name is required."},{status:400});let slug=slugify(name)||"category";let i=2;while(await prisma.category.findUnique({where:{slug}}))slug=slugify(name)+"-"+i++;const category=await prisma.category.create({data:{name,slug}});return NextResponse.json({ok:true,category},{status:201});}
