"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notice = { id:string; title:string; message:string; link:string|null; readAt:string|null; createdAt:string; type:string };

export default function NotificationCenter(){
  const [items,setItems]=useState<Notice[]>([]);
  const [loading,setLoading]=useState(true);
  const [count,setCount]=useState(0);

  async function load(){
    try{
      const r=await fetch("/api/notifications",{cache:"no-store"});
      if(!r.ok) return;
      const d=await r.json();
      setItems(d.notifications||[]);
      setCount(Number(d.unreadCount||0));
    } finally { setLoading(false); }
  }
  useEffect(()=>{load()},[]);

  async function mark(id?:string){
    await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(id?{id}:{})});
    await load();
  }

  return <section className="notificationPage">
    <div className="accountHeader">
      <div><div className="eyebrow">NOTIFICATIONS</div><h1>Your notifications</h1><p>{count ? count + " unread notification" + (count===1?"":"s") + "." : "You're all caught up."}</p></div>
      {count>0&&<button className="secondaryButton" onClick={()=>mark()}>Mark all as read</button>}
    </div>
    <div className="notificationList">
      {loading ? <div className="accountCard">Loading notifications…</div> : items.map(item=><article className={"notificationItem "+(!item.readAt?"unread":"")} key={item.id}>
        <div className="notificationIcon"><span className="material-symbols-outlined">{item.type==="PAYMENT"?"payments":item.type==="ORDER"?"shopping_bag":item.type==="DELIVERY"?"local_shipping":item.type==="PROMOTION"?"local_offer":"notifications"}</span></div>
        <div className="notificationBody"><div className="notificationTop"><strong>{item.title}</strong><time>{new Date(item.createdAt).toLocaleString("en-GB")}</time></div><p>{item.message}</p><div className="notificationActions">{item.link&&<Link href={item.link} className="secondaryButton">Open</Link>}{!item.readAt&&<button className="secondaryButton" onClick={()=>mark(item.id)}>Mark read</button>}</div></div>
      </article>)}
      {!loading&&!items.length&&<div className="accountCard"><h2>No notifications</h2><p>Order, payment and promotion updates will appear here.</p><Link href="/products" className="cta">Continue shopping</Link></div>}
    </div>
  </section>;
}