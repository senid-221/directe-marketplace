import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const deliveryLabels: Record<string, string> = {
  PENDING: "Order received",
  ASSIGNED: "Delivery assigned",
  PICKED_UP: "Picked up",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  FAILED: "Delivery issue",
  CANCELLED: "Delivery cancelled",
};

export default async function OrderPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const session=await getSession();
 if(!session) return <main className="emptyState"><h1>Sign in required</h1><Link href="/login" className="cta">Sign in</Link></main>;

 const order=await prisma.order.findFirst({
   where:{id,userId:session.userId},
   include:{items:{include:{product:true}},delivery:true,payment:true}
 });
 if(!order) notFound();

 const delivery = order.delivery;

 return <main style={{maxWidth:900,margin:"0 auto",padding:"40px 20px"}}>
   <div className="sectionHeader"><h1>Order details</h1></div>
   <div className="checkoutCard">
     <h2>Order #{order.id.slice(-8).toUpperCase()}</h2>
     <p>Status: <strong>{order.status}</strong></p>

     {delivery && <div className="deliveryTrackingCard">
       <div className="deliveryTrackingHeader">
         <div>
           <span className="eyebrow">RWANDA DELIVERY</span>
           <h2>{deliveryLabels[delivery.status] || delivery.status}</h2>
         </div>
         <div className="deliveryCode">
           <small>Tracking code</small>
           <strong>{delivery.trackingCode}</strong>
         </div>
       </div>

       <div className="deliverySteps">
         {[
           ["PENDING","Order received"],
           ["ASSIGNED","Rider assigned"],
           ["PICKED_UP","Picked up"],
           ["IN_TRANSIT","On the way"],
           ["DELIVERED","Delivered"],
         ].map(([status,label], index) => {
           const states = ["PENDING","ASSIGNED","PICKED_UP","IN_TRANSIT","DELIVERED"];
           const current = states.indexOf(delivery.status);
           const done = index <= current && !["FAILED","CANCELLED"].includes(delivery.status);
           return <div className={"deliveryStep "+(done?"done":"")} key={status}>
             <span>{done ? "✓" : index + 1}</span>
             <small>{label}</small>
           </div>;
         })}
       </div>

       <div className="deliveryAddress">
         <strong>Delivery address</strong>
         <span>{delivery.recipientName} · {delivery.phone}</span>
         <span>{delivery.province} · {delivery.district} · {delivery.sector}</span>
         <span>{delivery.address}</span>
         <span>Delivery fee: RWF {Number(delivery.deliveryFee).toLocaleString()}</span>
         {delivery.estimatedDate && delivery.status !== "DELIVERED" && (
           <span>Estimated delivery: {new Date(delivery.estimatedDate).toLocaleDateString()}</span>
         )}
       </div>
     </div>}

     {order.items.map((item: (typeof order.items)[number])=>
       <div key={item.id} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid #eee"}}>
         <span>{item.product.name} × {item.quantity}</span>
         <strong>RWF {(Number(item.unitPrice)*item.quantity).toLocaleString()}</strong>
       </div>
     )}

     <div className="grand" style={{marginTop:18}}>
       <span>Total</span><strong>RWF {Number(order.total).toLocaleString()}</strong>
     </div>

     <Link href="/products" className="cta" style={{display:"inline-block",marginTop:20}}>Continue shopping</Link>
   </div>
 </main>;
}
