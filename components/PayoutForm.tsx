"use client";

import { useState } from "react";

export default function PayoutForm({ available, payoutPhone, payoutProvider }: { available:number; payoutPhone:string; payoutProvider:string }) {
  const [amount,setAmount]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function requestPayout() {
    const value=Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > available) { setMessage("Enter a valid payout amount within your available balance."); return; }
    if (!payoutPhone) { setMessage("Add a payout phone number first."); return; }
    setBusy(true); setMessage("");
    try {
      const response=await fetch("/api/seller/payout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:value})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data?.error || "Could not start payout.");
      window.location.reload();
    } catch(error) {
      setMessage(error instanceof Error ? error.message : "Could not start payout.");
    } finally { setBusy(false); }
  }

  return <div className="walletForm">
    <label>Amount (RWF)<input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" min="1" max={Math.floor(available)} step="1" placeholder="e.g. 50000" required /></label>
    <div className="walletFormInfo"><span>Available</span><strong>RWF {Math.round(available).toLocaleString()}</strong></div>
    <div className="walletFormInfo"><span>Provider</span><strong>{payoutProvider}</strong></div>
    <div className="walletFormInfo"><span>Phone</span><strong>{payoutPhone || "Not configured"}</strong></div>
    <button className="cta" type="button" disabled={busy || !available || !payoutPhone} onClick={requestPayout}>{busy ? "Submitting…" : "Request payout"}</button>
    {message && <p className="paymentNote">{message}</p>}
  </div>;
}
