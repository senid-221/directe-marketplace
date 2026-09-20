"use client";
import { useState } from "react";
type Seller={id:string;storeName:string;status:string;createdAt:string;description:string;productCount:number;user:{name:string|null;email:string|null;phone:string|null}};
const statuses=["PENDING","APPROVED","SUSPENDED","REJECTED"];
export default function AdminSellersClient({initial}:{initial:Seller[]}){
 const [sellers,setSellers]=useState(initial); const [message,setMessage]=useState("");
 async function update(id:string,status:string){const r=await fetch("/api/admin/sellers",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});const d=await r.json();if(!r.ok){setMessage(d.error||"Update failed.");return}setSellers(v=>v.map(s=>s.id===id?{...s,status}:s));setMessage("Seller status updated.");}
 return <div>{message&&<div className="sellerMessage">{message}</div>}<div className="panel"><div className="sectionHeader"><div><h2>Seller applications</h2><p className="portalSub">Approve, suspend or reject marketplace sellers.</p></div></div><div className="adminTableWrap"><table><thead><tr><th>Store</th><th>Owner</th><th>Contact</th><th>Products</th><th>Status</th><th>Action</th></tr></thead><tbody>{sellers.map(s=><tr key={s.id}><td><strong>{s.storeName}</strong><br/><small>{s.description}</small></td><td>{s.user.name||"—"}</td><td>{s.user.phone||s.user.email||"—"}</td><td>{s.productCount}</td><td><span className={"statusPill status-"+s.status.toLowerCase()}>{s.status}</span></td><td><select className="adminStatusSelect" value={s.status} onChange={e=>update(s.id,e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table>{!sellers.length&&<div className="emptyState">No sellers found.</div>}</div></div></div>;
}
