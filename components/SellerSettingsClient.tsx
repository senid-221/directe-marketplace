"use client";

import { FormEvent, useState } from "react";

export default function SellerSettingsClient({ initial }: { initial: { storeName:string; description:string; status:string; commission:number } }) {
  const [storeName,setStoreName]=useState(initial.storeName);
  const [description,setDescription]=useState(initial.description);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  async function submit(event:FormEvent){
    event.preventDefault();setSaving(true);setMessage("");
    const response=await fetch("/api/seller/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({storeName,description})});
    const data=await response.json();
    setMessage(response.ok?"Store settings saved.":data.error||"Could not save settings.");
    setSaving(false);
  }

  return <div className="panel sellerSettingsPanel">
    {message&&<div className="sellerMessage">{message}</div>}
    <form className="sellerSettingsForm" onSubmit={submit}>
      <label>Store name<input required value={storeName} onChange={(e)=>setStoreName(e.target.value)}/></label>
      <label>Store description<textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Tell customers about your store..."/></label>
      <div className="sellerSettingsMeta"><span>Status</span><strong>{initial.status}</strong><span>Commission</span><strong>{initial.commission}%</strong></div>
      <button className="cta" type="submit" disabled={saving}>{saving?"Saving...":"Save store settings"}</button>
    </form>
  </div>;
}
