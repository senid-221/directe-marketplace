"use client";

import { useEffect, useState } from "react";

type Profile = {
  legalName:string; displayName:string; description:string; phone:string; email:string; website:string;
  country:string; city:string; address:string; registrationNumber:string; taxNumber:string; currency:string;
  supportHours:string; supportWhatsapp:string; payoutAccountName:string; payoutBankName:string;
  payoutBankAccount:string; momoMerchantName:string; momoMerchantPhone:string; logoUrl:string;
};

const empty:Profile={
  legalName:"AkaziConnect",displayName:"AkaziConnect",
  description:"A Rwanda-first marketplace connecting customers with trusted sellers and products.",
  phone:"",email:"",website:"",country:"Rwanda",city:"Kigali",address:"",
  registrationNumber:"",taxNumber:"",currency:"RWF",supportHours:"",supportWhatsapp:"",
  payoutAccountName:"",payoutBankName:"",payoutBankAccount:"",momoMerchantName:"",
  momoMerchantPhone:"",logoUrl:""
};

export default function BusinessProfileClient(){
  const [profile,setProfile]=useState<Profile>(empty);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{
    fetch("/api/admin/business-profile").then(async r=>{
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Could not load business profile.");
      setProfile({...empty,...data});
    }).catch(e=>setError(e instanceof Error?e.message:"Could not load business profile.")).finally(()=>setLoading(false));
  },[]);

  function update(key:keyof Profile,value:string){ setProfile(p=>({...p,[key]:value})); }

  async function save(){
    setSaving(true); setError(""); setMessage("");
    try{
      const r=await fetch("/api/admin/business-profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Could not save business profile.");
      setProfile({...empty,...data});
      setMessage("Business profile saved.");
    }catch(e){setError(e instanceof Error?e.message:"Could not save business profile.");}
    finally{setSaving(false);}
  }

  function uploadLogo(file:File){
    const reader=new FileReader();
    reader.onload=()=>update("logoUrl",String(reader.result||""));
    reader.readAsDataURL(file);
  }

  if(loading) return <div className="panel"><p className="portalSub">Loading business profile…</p></div>;

  return <div className="panel">
    {error&&<div className="sellerMessage">{error}</div>}
    {message&&<div className="paymentNote">{message}</div>}
    <div className="sellerFormTitle"><span className="material-symbols-outlined">business</span><div><h2>Company identity</h2><p className="portalSub">Keep the legal business details separate from the marketplace display name.</p></div></div>
    <div className="sellerFormGrid">
      <label>Legal business name<input value={profile.legalName} onChange={e=>update("legalName",e.target.value)} /></label>
      <label>Marketplace display name<input value={profile.displayName} onChange={e=>update("displayName",e.target.value)} /></label>
      <label>Business phone<input value={profile.phone} onChange={e=>update("phone",e.target.value)} inputMode="tel" placeholder="+250 7xx xxx xxx" /></label>
      <label>Business email<input value={profile.email} onChange={e=>update("email",e.target.value)} type="email" /></label>
      <label>Website<input value={profile.website} onChange={e=>update("website",e.target.value)} placeholder="https://..." /></label>
      <label>Business address<input value={profile.address} onChange={e=>update("address",e.target.value)} /></label>
      <label>City<input value={profile.city} onChange={e=>update("city",e.target.value)} /></label>
      <label>Country<input value={profile.country} onChange={e=>update("country",e.target.value)} /></label>
      <label>Registration number<input value={profile.registrationNumber} onChange={e=>update("registrationNumber",e.target.value)} /></label>
      <label>Tax number / TIN<input value={profile.taxNumber} onChange={e=>update("taxNumber",e.target.value)} /></label>
      <label>Support WhatsApp<input value={profile.supportWhatsapp} onChange={e=>update("supportWhatsapp",e.target.value)} /></label>
      <label>Support hours<input value={profile.supportHours} onChange={e=>update("supportHours",e.target.value)} placeholder="Mon–Sat, 08:00–18:00" /></label>
    </div>
    <label style={{display:"block",marginTop:16}}>Business description<textarea value={profile.description} onChange={e=>update("description",e.target.value)} rows={4}/></label>

    <div className="sellerFormTitle" style={{marginTop:28}}><span className="material-symbols-outlined">payments</span><div><h2>Settlement profile</h2><p className="portalSub">Used for marketplace accounting and future PawaPay settlement configuration.</p></div></div>
    <div className="sellerFormGrid">
      <label>Settlement account name<input value={profile.payoutAccountName} onChange={e=>update("payoutAccountName",e.target.value)} /></label>
      <label>Settlement bank<input value={profile.payoutBankName} onChange={e=>update("payoutBankName",e.target.value)} /></label>
      <label>Settlement bank account<input value={profile.payoutBankAccount} onChange={e=>update("payoutBankAccount",e.target.value)} /></label>
      <label>MoMo merchant name<input value={profile.momoMerchantName} onChange={e=>update("momoMerchantName",e.target.value)} /></label>
      <label>MoMo merchant phone<input value={profile.momoMerchantPhone} onChange={e=>update("momoMerchantPhone",e.target.value)} inputMode="tel" /></label>
      <label>Currency<input value="RWF" readOnly /></label>
    </div>

    <div className="sellerFormTitle" style={{marginTop:28}}><span className="material-symbols-outlined">image</span><div><h2>Business logo</h2><p className="portalSub">Upload the official AkaziConnect logo. AI-generated logos are not used.</p></div></div>
    <div style={{display:"flex",gap:18,alignItems:"center",flexWrap:"wrap"}}>
      {profile.logoUrl?<img src={profile.logoUrl} alt="AkaziConnect logo" style={{width:120,height:80,objectFit:"contain",border:"1px solid var(--border)",borderRadius:12,padding:8}}/>:<div className="emptyState" style={{padding:"18px 24px"}}>No custom logo uploaded.</div>}
      <label className="secondaryButton" style={{cursor:"pointer"}}>Upload logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={e=>{const f=e.target.files?.[0]; if(f) uploadLogo(f);}}/></label>
    </div>

    <button className="cta" onClick={save} disabled={saving} style={{marginTop:28}}>{saving?"Saving…":"Save business profile"}</button>
  </div>;
}
