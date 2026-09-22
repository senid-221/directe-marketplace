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
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [discount, setDiscount] = useState(0);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("Kigali City");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [address, setAddress] = useState("");
  const router = useRouter();

  async function applyCoupon() {
    setCouponMessage("");
    if (!coupon.trim()) return;
    try {
      const response = await fetch("/api/coupons/validate", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ code: coupon, subtotal }) });
      const data = await response.json();
      if (!response.ok) { setDiscount(0); setCouponMessage(data.error || "Invalid coupon."); return; }
      setDiscount(Number(data.discount || 0));
      setCouponMessage("Coupon applied.");
    } catch { setCouponMessage("Could not validate coupon."); }
  }

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
        body: JSON.stringify({
          method,
          recipientName: fullName.trim(),
          phone: phone.trim(),
          province: province.trim(),
          district: district.trim(),
          sector: sector.trim(),
          address: address.trim(),
        }),
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

  const finalTotal = Math.max(0, total - discount);

  return (
    <div className="checkoutLayout">
      <section className="checkoutCard">
        <h2>Delivery details</h2>
        <p className="paymentNote">Enter the Rwanda location where your order should be delivered. Your tracking code will be available after checkout.</p>
        <div className="formGrid">
          <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" autoComplete="name" /></label>
          <label>Phone number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 7xx xxx xxx" inputMode="tel" autoComplete="tel" /></label>
          <label>Province / City<input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Kigali City" /></label>
          <label>District<input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Gasabo" /></label>
          <label>Sector<input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Kacyiru" /></label>
          <label>Address / landmark<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, village, house number or landmark" /></label>
        </div>

        <h2>Payment method</h2>
        <label className="paymentOption"><input type="radio" name="p" value="momo" checked={payment === "momo"} onChange={() => setPayment("momo")} /> MTN Mobile Money</label>
        <label className="paymentOption"><input type="radio" name="p" value="bank" checked={payment === "bank"} onChange={() => setPayment("bank")} /> Banking</label>
        <label className="paymentOption"><input type="radio" name="p" value="card" checked={payment === "card"} onChange={() => setPayment("card")} /> Credit / Debit Card</label>

        <div className="couponRow"><input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" /><button type="button" className="secondaryButton" onClick={applyCoupon}>Apply</button></div>{couponMessage && <p className="paymentNote">{couponMessage}</p>}<p className="paymentNote">Delivery fee is currently RWF {delivery.toLocaleString()}. Payment is completed through the secure payment page.</p>
        <button className="cta" onClick={pay} disabled={busy} style={{marginTop:18,width:"100%"}}>
          {busy ? "Opening secure payment..." : "Pay securely · RWF " + finalTotal.toLocaleString()}
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
        {discount > 0 && <div><span>Coupon discount</span><strong>- RWF {discount.toLocaleString()}</strong></div>}<div className="grand"><span>Total</span><strong>RWF {finalTotal.toLocaleString()}</strong></div>
      </aside>
    </div>
  );
}
