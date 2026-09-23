"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ productId, variantId, className="add", children="Add to cart" }: { productId:string; variantId?:string|null; className?:string; children?:React.ReactNode }) {
  const [busy,setBusy]=useState(false); const router=useRouter();
  async function add(){setBusy(true);const r=await fetch("/api/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId,variantId:variantId||null,quantity:1})});if(r.status===401){router.push("/login?next=/cart");return;}const data=await r.json();if(!r.ok){alert(data.error||"Could not add product");setBusy(false);return;}router.push("/cart");}
  return <button className={className} onClick={add} disabled={busy}>{busy ? "Adding..." : children}</button>;
}
