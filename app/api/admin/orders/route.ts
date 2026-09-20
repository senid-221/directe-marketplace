import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

const statuses=["PENDING","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"] as const;
const deliveryStatuses=["PENDING","ASSIGNED","PICKED_UP","IN_TRANSIT","DELIVERED","FAILED","CANCELLED"] as const;

export async function GET(){
  await requireAuth(["ADMIN"]);
  const orders=await prisma.order.findMany({
    include:{
      user:{select:{name:true,email:true,phone:true}},
      delivery:true,
      items:{include:{product:{select:{name:true,seller:{select:{storeName:true}}}}}}
    },
    orderBy:{createdAt:"desc"},take:200
  });
  return NextResponse.json({orders:orders.map((o: (typeof orders)[number])=>({
    id:o.id,total:Number(o.total),status:o.status,createdAt:o.createdAt,user:o.user,delivery:o.delivery,
    items:o.items.map((i: (typeof o.items)[number])=>({id:i.id,quantity:i.quantity,unitPrice:Number(i.unitPrice),product:i.product.name,seller:i.product.seller.storeName}))
  }))});
}

export async function PATCH(request:Request){
  await requireAuth(["ADMIN"]);
  const body=await request.json();
  const id=String(body.id||"");
  if(!id) return NextResponse.json({error:"Order ID is required."},{status:400});

  const order=await prisma.order.findUnique({where:{id},include:{delivery:true}});
  if(!order) return NextResponse.json({error:"Order not found."},{status:404});

  if(body.deliveryStatus){
    const deliveryStatus=String(body.deliveryStatus) as (typeof deliveryStatuses)[number];
    if(!deliveryStatuses.includes(deliveryStatus)) return NextResponse.json({error:"Invalid delivery status."},{status:400});
    if(!order.delivery) return NextResponse.json({error:"Delivery record not found."},{status:404});

    const now=new Date();
    const deliveryData={
      status:deliveryStatus,
      ...(deliveryStatus==="ASSIGNED"?{assignedAt:now}:{}),
      ...(deliveryStatus==="PICKED_UP"?{pickedUpAt:now}:{}),
      ...(deliveryStatus==="DELIVERED"?{deliveredAt:now}:{}),
    };

    let orderStatus=order.status;
    if(deliveryStatus==="ASSIGNED") orderStatus="PROCESSING";
    if(deliveryStatus==="PICKED_UP"||deliveryStatus==="IN_TRANSIT") orderStatus="SHIPPED";
    if(deliveryStatus==="DELIVERED") orderStatus="DELIVERED";
    if(deliveryStatus==="CANCELLED") orderStatus="CANCELLED";

    const updated=await prisma.$transaction(async tx=>{
      const delivery=await tx.delivery.update({where:{orderId:id},data:deliveryData});
      const updatedOrder=await tx.order.update({where:{id},data:{status:orderStatus}});
      return {delivery,order:updatedOrder};
    });
    return NextResponse.json({ok:true,deliveryStatus:updated.delivery.status,orderStatus:updated.order.status});
  }

  const status=String(body.status||"") as (typeof statuses)[number];
  if(!statuses.includes(status)) return NextResponse.json({error:"Invalid order status."},{status:400});
  const updated=await prisma.order.update({where:{id},data:{status}});
  return NextResponse.json({ok:true,status:updated.status});
}
