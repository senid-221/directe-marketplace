"use client";
import { useState } from "react";

type Wallet={availableBalance:number;pendingBalance:number;totalSales:number;totalPayouts:number};
type Payout={id:string;amount:number;status:string;phone:string;requestedAt:string};

export default function SellerWalletClient({wallet,payouts}:{wallet:Wallet;payouts:Payout[]}) {
 const [amount,setAmount]=useState("");
 const [busy,setBusy]=useState(false);
 async function payout(){
   const value=Number(amount);
   if(!Number.isFinite(value)||value<=0){alert("Enter a valid payout amount.");return;}
   setBusy(true);
   try{
     const res=await fetch("/api/seller/payout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:value})});
     const data=await res.json();
     if(!res.ok){alert(data.error||"Could not start payout.");return;}
     alert("Payout started.");
     window.location.reload();
   }finally{setBusy(false);}
 }
 return <div className="walletPanel">
   <div className="walletStats">
    <div><span>Available</span><strong>RWF {wallet.availableBalance.toLocaleString()}</strong></div>
    <div><span>Pending</span><strong>RWF {wallet.pendingBalance.toLocaleString()}</strong></div>
    <div><span>Total sales</span><strong>RWF {wallet.totalSales.toLocaleString()}</strong></div>
    <div><span>Total payouts</span><strong>RWF {wallet.totalPayouts.toLocaleString()}</strong></div>
   </div>
   <div className="payoutBox">
    <strong>Withdraw to MTN Mobile Money</strong>
    <p className="portalSub">Payouts remain disabled until an administrator enables your seller payout account.</p>
    <div className="payoutRow"><input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="Amount in RWF"/><button className="cta" onClick={payout} disabled={busy}>{busy?"Starting...":"Request payout"}</button></div>
   </div>
   <div className="panel"><div className="sectionHeader"><div><h2>Payout history</h2><p className="portalSub">Recent seller wallet withdrawals.</p></div></div>{payouts.length?<div className="sellerRecentOrders">{payouts.map(p=><div className="sellerRecentOrder" key={p.id}><div><strong>RWF {p.amount.toLocaleString()}</strong><span>{p.phone}</span></div><div><span>{new Date(p.requestedAt).toLocaleString()}</span><strong>{p.status}</strong></div></div>)}</div>:<div className="emptyState">No payouts yet.</div>}</div>
 </div>;
}