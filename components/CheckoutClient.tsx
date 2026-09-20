"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutClient({items,subtotal,delivery,total}:{items:{name:string;quantity:number;price:number}[];subtotal:number;delivery:number;total:number}){
 const [busy,setBusy]=useState(false); const [payment,setPayment]=useState("momo"); const router=useRouter();
 async function pay(){
  setBusy(true);
  const method=payment==="momo"?"MOBILE_MONEY":payment==="bank"?"BANK_TRANSFER":"CARD";
  const r=await fetch("/api/payments/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({method})});
  const d=await r.json();
  if(r.status===401){router.push("/login?next=/checkout");return;}
  if(!r.ok){alert(d.error||"Could not start payment");setBusy(false);return;}
  window.location.href=d.paymentUrl;
 }
 return <div className="checkoutLayout"><section className="checkoutCard"><h2>Delivery details</h2><div className="formGrid"><label>Full name<input placeholder="Your full name"/></label><label>Phone number<input placeholder="+250 7xx xxx xxx"/></label><label>Province<input placeholder="Kigali City"/></label><label>District<input placeholder="Gasabo"/></label><label>Sector<input placeholder="Kacyiru"/></label><label>Address<input placeholder="Street / village / landmark"/></label></div><h2>Payment method</h2>
 <label className="paymentOption"><input type="radio" name="p" value="momo" checked={payment==="momo"} onChange={()=>setPayment("momo")}/> MTN Mobile Money</label>
 <label className="paymentOption"><input type="radio" name="p" value="bank" checked={payment==="bank"} onChange={()=>setPayment("bank")}/> Banking</label>
 <label className="paymentOption"><input type="radio" name="p" value="card" checked={payment==="card"} onChange={()=>setPayment("card")}/> Credit / Debit Card</label>
 <p className="paymentNote">You will be redirected to the secure payment page to complete your payment.</p>
 <button className="cta" onClick={pay} disabled={busy} style={{marginTop:18,width:"100%"}}>{busy?"Opening secure payment...":"Pay securely · RWF "+total.toLocaleString()}</button></section>
 <aside className="summary"><h2>Your order</h2>{items.map(i=><div key={i.name}><span>{i.name} × {i.quantity}</span><strong>RWF {(i.price*i.quantity).toLocaleString()}</strong></div>)}<div><span>Delivery</span><strong>RWF {delivery.toLocaleString()}</strong></div><hr/><div className="grand"><span>Total</span><strong>RWF {total.toLocaleString()}</strong></div></aside></div>;
}
