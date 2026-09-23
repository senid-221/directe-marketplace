"use client";

import { useState } from "react";

type Coupon={id:string;code:string;type:string;value:number;usageLimit:number|null;usedCount:number;perUserLimit:number;active:boolean;seller?:{storeName:string}|null};

export default function CouponManager({initialCoupons,isSeller=false}:{initialCoupons:Coupon[];isSeller?:boolean}){
 const [coupons,setCoupons]=useState(initialCoupons);
 const [code,setCode]=useState(""); const [type,setType]=useState("PERCENT"); const [value,setValue]=useState(""); const [usageLimit,setUsageLimit]=useState(""); const [perUserLimit,setPerUserLimit]=useState("1"); const [minOrderAmount,setMinOrderAmount]=useState(""); const [maxDiscount,setMaxDiscount]=useState(""); const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");

 async function create(e:React.FormEvent){
  e.preventDefault();setSaving(true);setMessage("");
  const r=await fetch("/api/coupons",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,type,value:Number(value),usageLimit,perUserLimit,minOrderAmount,maxDiscount})});
  const d=await r.json(); if(!r.ok){setMessage(d.error||"Could not create coupon.");setSaving(false);return;}
  setCoupons([d,...coupons]);setCode("");setValue("");setUsageLimit("");setMessage("Coupon created.");setSaving(false);
 }
 async function toggle(c:Coupon){const r=await fetch("/api/coupons",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:c.id,active:!c.active})});if(r.ok){const d=await r.json();setCoupons(coupons.map(x=>x.id===c.id?d:x));}}
 async function remove(id:string){if(!confirm("Delete this coupon?"))return;const r=await fetch("/api/coupons",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});if(r.ok)setCoupons(coupons.filter(x=>x.id!==id));}
 return <div>
  <form className="formGrid" onSubmit={create}>
   <label>Coupon code<input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" required /></label>
   <label>Type<select value={type} onChange={e=>setType(e.target.value)}><option value="PERCENT">Percent</option><option value="FIXED">Fixed RWF</option></select></label>
   <label>Value<input type="number" min="0" value={value} onChange={e=>setValue(e.target.value)} required /></label>
   <label>Usage limit<input type="number" min="1" value={usageLimit} onChange={e=>setUsageLimit(e.target.value)} placeholder="Optional" /></label>
   <label>Per-user limit<input type="number" min="1" value={perUserLimit} onChange={e=>setPerUserLimit(e.target.value)} /></label>
   <label>Minimum order<input type="number" min="0" value={minOrderAmount} onChange={e=>setMinOrderAmount(e.target.value)} placeholder="RWF" /></label>
   <label>Maximum discount<input type="number" min="0" value={maxDiscount} onChange={e=>setMaxDiscount(e.target.value)} placeholder="Optional" /></label>
   <div style={{display:"flex",alignItems:"end"}}><button className="cta" disabled={saving}>{saving?"Creating...":"Create coupon"}</button></div>
  </form>
  {message&&<p className="paymentNote">{message}</p>}
  <div className="sellerRecentOrders" style={{marginTop:18}}>
   {coupons.map(c=><div className="sellerRecentOrder" key={c.id}><div><strong>{c.code}</strong><span>{c.type} · {Number(c.value).toLocaleString()} · {c.usedCount}/{c.usageLimit??"∞"} uses</span></div><div><span>{c.seller?.storeName||"Marketplace"}</span><div style={{display:"flex",gap:6}}><button className="secondaryButton" onClick={()=>toggle(c)}>{c.active?"Disable":"Enable"}</button><button className="secondaryButton" onClick={()=>remove(c.id)}>Delete</button></div></div></div>)}
   {!coupons.length&&<div className="emptyState">No coupons yet.</div>}
  </div>
 </div>;
}