"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function BuyNowButton({productId,variantId}:{productId:string;variantId?:string|null}){const [busy,setBusy]=useState(false);const router=useRouter();async function buy(){setBusy(true);const r=await fetch("/api/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,variantId:variantId||null,quantity:1})});const d=await r.json();if(r.status===401){router.push("/login?next=/checkout");return;}if(!r.ok){alert(d.error||"Could not start checkout");setBusy(false);return;}router.push("/checkout");}return <button className="secondaryButton" onClick={buy} disabled={busy}>{busy?"Preparing...":"Buy now"}</button>;}
