"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WishlistButton({ productId, initialSaved=false }: { productId:string; initialSaved?:boolean }) {
  const [saved,setSaved]=useState(initialSaved);
  const [busy,setBusy]=useState(false);
  const router=useRouter();

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const r = await fetch("/api/wishlist", {
      method: saved ? "DELETE" : "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ productId })
    });
    if (r.status === 401) {
      router.push("/login?next="+encodeURIComponent(window.location.pathname));
      return;
    }
    if (r.ok) setSaved(!saved);
    setBusy(false);
  }

  return <button type="button" className={"wishlistButton "+(saved?"saved":"")} onClick={toggle} disabled={busy} aria-label={saved?"Remove from wishlist":"Add to wishlist"} title={saved?"Remove from wishlist":"Add to wishlist"}>
    <span className="material-symbols-outlined">{saved?"favorite":"favorite_border"}</span>
  </button>;
}
