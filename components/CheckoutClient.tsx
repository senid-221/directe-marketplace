"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutItem = {
  name: string;
  quantity: number;
  price: number;
};

type Props = {
  items: CheckoutItem[];
  subtotal: number;
  delivery: number;
  total: number;
};

export default function CheckoutClient({ items, subtotal, delivery, total }: Props) {
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState("momo");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [address, setAddress] = useState("");
  const router = useRouter();

  async function pay() {
    if (!fullName.trim() || !phone.trim() || !province.trim() || !district.trim() || !sector.trim() || !address.trim()) {
      alert("Please complete all delivery details before continuing.");
      return;
    }

    setBusy(true);

    try {
      const method = payment === "momo" ? "MOBILE_MONEY" : payment === "bank" ? "BANK_TRANSFER" : "CARD";
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({method}),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.push("/login?next=/checkout");
        return;
      }

      if (!response.ok) {
        alert(data.error || "Could not start payment.");
        return;
      }

      if (!data.paymentUrl) {
        alert("Payment gateway did not return a checkout link.");
        return;
      }

      window.location.href = data.paymentUrl;
    } catch {
      alert("Could not connect to the payment service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkoutLayout">
      <section className="checkoutCard">
        <h2>Delivery details</h2>
        <div className="formGrid">
          <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" /></label>
          <label>Phone number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 7xx xxx xxx" /></label>
          <label>Province<input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Kigali City" /></label>
          <label>District<input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Gasabo" /></label>
          <label>Sector<input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Kacyiru" /></label>
          <label>Address<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street / village / landmark" /></label>
        </div>

        <h2>Payment method</h2>
        <label className="paymentOption"><input type="radio" name="p" value="momo" checked={payment === "momo"} onChange={() => setPayment("momo")} /> MTN Mobile Money</label>
        <label className="paymentOption"><input type="radio" name="p" value="bank" checked={payment === "bank"} onChange={() => setPayment("bank")} /> Banking</label>
        <label className="paymentOption"><input type="radio" name="p" value="card" checked={payment === "card"} onChange={() => setPayment("card")} /> Credit / Debit Card</label>

        <p className="paymentNote">You will be redirected to the secure payment page to complete your payment.</p>
        <button className="cta" onClick={pay} disabled={busy} style={{marginTop:18,width:"100%"}}>
          {busy ? "Opening secure payment..." : "Pay securely · RWF " + total.toLocaleString()}
        </button>
      </section>

      <aside className="summary">
        <h2>Your order</h2>
        {items.map((item: CheckoutItem) => (
          <div key={item.name}>
            <span>{item.name} × {item.quantity}</span>
            <strong>RWF {(item.price * item.quantity).toLocaleString()}</strong>
          </div>
        ))}
        <div><span>Subtotal</span><strong>RWF {subtotal.toLocaleString()}</strong></div>
        <div><span>Delivery</span><strong>RWF {delivery.toLocaleString()}</strong></div>
        <hr />
        <div className="grand"><span>Total</span><strong>RWF {total.toLocaleString()}</strong></div>
      </aside>
    </div>
  );
}
