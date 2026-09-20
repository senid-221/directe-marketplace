"use client";
import { useState } from "react";

type Delivery = {
  trackingCode:string; status:string; recipientName:string; phone:string;
  province:string; district:string; sector:string; address:string;
};
type Order={
 id:string;total:number;status:string;createdAt:string;
 user:{name:string|null;email:string|null;phone:string|null};
 delivery:Delivery|null;
 items:{id:string;quantity:number;unitPrice:number;product:string;seller:string}[]
};
const statuses=["PENDING","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"];
const deliveryStatuses=["PENDING","ASSIGNED","PICKED_UP","IN_TRANSIT","DELIVERED","FAILED","CANCELLED"];

export default function AdminOrdersClient({initial}:{initial:Order[]}){
 const [orders,setOrders]=useState(initial); const [message,setMessage]=useState("");

 async function update(id:string,status:string){
   const r=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
   const d=await r.json(); if(!r.ok){setMessage(d.error||"Update failed.");return}
   setOrders(v=>v.map(o=>o.id===id?{...o,status:d.status}:o));setMessage("Order status updated.");
 }
 async function updateDelivery(id:string,deliveryStatus:string){
   const r=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,deliveryStatus})});
   const d=await r.json(); if(!r.ok){setMessage(d.error||"Delivery update failed.");return}
   setOrders(v=>v.map(o=>o.id===id?{...o,status:d.orderStatus||o.status,delivery:o.delivery?{...o.delivery,status:d.deliveryStatus}:o.delivery}:o));
   setMessage("Delivery status updated.");
 }
 return <div>{message&&<div className="sellerMessage">{message}</div>}<div className="sellerOrderCards">{orders.map(o=><article className="sellerOrderCard" key={o.id}>
   <div className="sellerOrderTop"><div><strong>#{o.id.slice(-8).toUpperCase()}</strong><small>{new Date(o.createdAt).toLocaleString("en-GB")}</small></div><span className={"statusPill status-"+o.status.toLowerCase()}>{o.status}</span></div>
   <div className="sellerOrderCustomer"><strong>{o.user.name||"Customer"}</strong><span>{o.user.phone||o.user.email||"No contact"}</span></div>
   {o.delivery&&<div className="sellerDeliveryBox">
     <div className="sellerDeliveryHead"><div><small>RWANDA DELIVERY</small><strong>{o.delivery.trackingCode}</strong></div><span className={"statusPill delivery-"+o.delivery.status.toLowerCase()}>{o.delivery.status.replace("_"," ")}</span></div>
     <div className="sellerDeliveryAddress"><strong>{o.delivery.recipientName} · {o.delivery.phone}</strong><span>{o.delivery.province}, {o.delivery.district}, {o.delivery.sector}</span><span>{o.delivery.address}</span></div>
   </div>}
   <div className="sellerOrderItems">{o.items.map(i=><div className="sellerOrderItem" key={i.id}><div><strong>{i.product}</strong><small>{i.quantity} × {i.unitPrice.toLocaleString()} FRW · {i.seller}</small></div></div>)}</div>
   <div className="sellerOrderBottom"><strong>{o.total.toLocaleString()} FRW</strong><div className="sellerOrderControls">
     <label>Order<select value={o.status} onChange={e=>update(o.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
     {o.delivery&&<label>Delivery<select value={o.delivery.status} onChange={e=>updateDelivery(o.id,e.target.value)}>{deliveryStatuses.map(s=><option key={s} value={s}>{s.replace("_"," ")}</option>)}</select></label>}
   </div></div>
 </article>)}{!orders.length&&<div className="emptyState">No orders found.</div>}</div></div>;
}
