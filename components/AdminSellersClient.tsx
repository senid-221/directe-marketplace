"use client";
import { useState } from "react";
type Seller={id:string;storeName:string;status:string;createdAt:string;description:string;productCount:number;plan:string|null;planAmount:number|null;paymentStatus:string|null;paymentMethod:string|null;paymentTxRef:string|null;user:{name:string|null;email:string|null;phone:string|null}};
const statuses=["PENDING","APPROVED","SUSPENDED","REJECTED"];
export default function AdminSellersClient({initial}:{initial:Seller[]}){
 const [sellers,setSellers]=useState(initial); const [message,setMessage]=useState("");
 async function update(id:string,status:string){ 
  const r=await fetch("/api/admin/sellers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});
  const d=await r.json(); if(!r.ok){setMessage(d.error||"Update failed.");return}
  setSellers(v=>v.map(s=>s.id===id?{...s,status}:s));setMessage("Seller status updated.");
 }
 return <div>{message&&<div className="sellerMessage">{message}</div>}<div className="panel"><div className="sectionHeader"><div><h2>Seller applications</h2><p className="portalSub">Payment must be successful before an application can be approved.</p></div></div>
 <div className="adminTableWrap"><table><thead><tr><th>Store</th><th>Owner</th><th>Plan</th><th>Payment</th><th>Products</th><th>Status</th><th>Action</th></tr></thead><tbody>
 {sellers.map(s=><tr key={s.id}><td><strong>{s.storeName}</strong><br/><small>{s.description}</small></td><td>{s.user.name||s.user.phone||s.user.email||"—"}</td>
 <td>{s.plan ? <><strong>{s.plan}</strong><br/><small>{s.planAmount?.toLocaleString()} RWF</small></> : "Legacy"}</td>
 <td><span className={"statusPill status-"+(s.paymentStatus||"none").toLowerCase()}>{s.paymentStatus||"N/A"}</span>{s.paymentMethod&&<><br/><small>{s.paymentMethod}</small></>}</td>
 <td>{s.productCount}</td><td><span className={"statusPill status-"+s.status.toLowerCase()}>{s.status}</span></td>
 <td><select className="adminStatusSelect" value={s.status} onChange={e=>update(s.id,e.target.value)}>{statuses.map(x=><option key={x} disabled={x==="APPROVED" && !!s.paymentTxRef && s.paymentStatus!=="SUCCESSFUL"}>{x}</option>)}</select></td></tr>)}
 </tbody></table>{!sellers.length&&<div className="emptyState">No sellers found.</div>}</div></div></div>;
}
