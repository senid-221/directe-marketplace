"use client";

import { useState } from "react";

type Product = { id: string; name: string; seller: { storeName: string } };

export default function PromotionForm({ products, sellers, isSeller = false }: { products: Product[]; sellers: { id: string; storeName: string }[]; isSeller?: boolean }) {
  const [name,setName]=useState("");
  const [type,setType]=useState("PERCENT");
  const [scope,setScope]=useState("PRODUCT");
  const [value,setValue]=useState("");
  const [startAt,setStartAt]=useState("");
  const [endAt,setEndAt]=useState("");
  const [sellerId,setSellerId]=useState("");
  const [selected,setSelected]=useState<string[]>([]);
  const [status,setStatus]=useState<string | null>(null);
  const [saving,setSaving]=useState(false);

  function toggle(id:string){setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);}

  async function submit(e:React.FormEvent){
    e.preventDefault(); setSaving(true); setStatus(null);
    try{
      const res=await fetch("/api/promotions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,type,scope,value:Number(value),startAt,endAt,sellerId:isSeller?undefined:sellerId,productIds:selected})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok){setStatus(data.error||"Unable to create promotion."); return;}
      setStatus("Promotion created successfully.");
      setName(""); setValue(""); setStartAt(""); setEndAt(""); setSelected([]);
    }catch{setStatus("Unable to create promotion.");}
    finally{setSaving(false);}
  }

  const available= sellerId && !isSeller ? products.filter(p=>sellers.some(s=>s.id===sellerId && s.storeName===p.seller.storeName)) : products;
  return <form onSubmit={submit} className="formGrid" style={{marginTop:18}}>
    <label>Campaign name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Weekend sale" required /></label>
    {!isSeller && <label>Seller<select value={sellerId} onChange={e=>{setSellerId(e.target.value);setSelected([])}} required><option value="">Select seller</option>{sellers.map(s=><option value={s.id} key={s.id}>{s.storeName}</option>)}</select></label>}
    <label>Discount type<select value={type} onChange={e=>setType(e.target.value)}><option value="PERCENT">Percent</option><option value="FIXED">Fixed RWF</option><option value="FLASH_SALE">Flash sale</option></select></label>
    <label>Scope<select value={scope} onChange={e=>setScope(e.target.value)}><option value="PRODUCT">Product</option><option value="ORDER">Order</option></select></label>
    <label>Value<input type="number" min="0" value={value} onChange={e=>setValue(e.target.value)} required /></label>
    <label>Start<input type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} required /></label>
    <label>End<input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} required /></label>
    {scope==="PRODUCT" && <div style={{gridColumn:"1 / -1"}}>
      <strong>Select products</strong>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8,marginTop:8}}>
        {available.map(p=><label key={p.id} style={{display:"flex",gap:8,alignItems:"center",border:"1px solid var(--akazi-border)",padding:9,borderRadius:9}}><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id)} /><span>{p.name}</span></label>)}
      </div>
    </div>}
    <div style={{gridColumn:"1 / -1",display:"flex",alignItems:"center",gap:12}}>
      <button className="cta" disabled={saving}>{saving?"Creating...":"Create promotion"}</button>
      {status && <span>{status}</span>}
    </div>
  </form>;
}