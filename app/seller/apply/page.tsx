"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  { id: "starter", name: "Starter", price: 50000, description: "For individuals starting a store on AkaziConnect.", icon: "storefront", features: ["Up to 50 products", "Basic store tools", "Standard support"] },
  { id: "business", name: "Business", price: 150000, description: "For growing businesses with a larger catalog.", icon: "analytics", features: ["Up to 200 products", "Advanced store tools", "Priority support", "Basic analytics"], popular: true },
  { id: "plus", name: "Plus", price: 250000, description: "For established sellers with higher business needs.", icon: "workspace_premium", features: ["Unlimited products", "Advanced store tools", "Advanced analytics", "Dedicated support", "Featured store placement"] },
];

const paymentMethods = [
  { id: "MOBILE_MONEY", name: "MTN Mobile Money", detail: "Pay securely through the Rwanda mobile-money checkout.", logos: [{ src: "https://momoapi.mtn.co.rw/content/MoMo-flat-logo_1.png", alt: "MTN MoMo" }] },
  { id: "BANK_TRANSFER", name: "Banking", detail: "Continue to the secure payment page for available bank options.", logos: [
    { src: "https://www.google.com/s2/favicons?domain=bk.rw&sz=128", alt: "Bank of Kigali" },
    { src: "https://www.google.com/s2/favicons?domain=equitygroupholdings.com&sz=128", alt: "Equity" },
    { src: "https://www.google.com/s2/favicons?domain=imbankgroup.com&sz=128", alt: "I&M Bank" },
  ] },
  { id: "CARD", name: "Credit / Debit Card", detail: "Pay with a supported Visa or Mastercard.", logos: [
    { src: "https://corporate.visa.com/dam/VCOM/corporate/about-visa/images/visa-brand-mark-grid-800x450.jpg", alt: "Visa" },
    { src: "https://www.mastercard.com/news/media/jbcmoato/mastercard-symbol_transparentbg.png", alt: "Mastercard" },
  ] },
];

export default function SellerApplyPage() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = plans.find((plan) => plan.id === selectedPlan);

  async function continueToPayment() {
    setError("");
    if (!selected || !paymentMethod || !storeName.trim()) {
      setError("Choose a plan, payment method and enter your store name.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected.id, paymentMethod, storeName, description, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start the application.");
      window.location.href = data.paymentUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the application.");
      setLoading(false);
    }
  }

  return (
    <main className="sellerApply">
      <div className="sellerApplyTop">
        <Link href="/" className="sellerBack"><span className="material-symbols-outlined inlineIcon">arrow_back</span> Back to AkaziConnect</Link>
        <div className="sellerHero">
          <div className="sellerHeroIcon"><span className="material-symbols-outlined">storefront</span></div>
          <div><div className="eyebrow">AKAZICONNECT SELLER PROGRAM</div><h1>Become a Seller</h1><p>Apply, complete payment, then wait for AkaziConnect approval.</p></div>
        </div>
      </div>
      <div className="sellerSteps">
        <div className="sellerStep active"><span>1</span><strong>Application</strong></div><div className="sellerStepLine" />
        <div className="sellerStep active"><span>2</span><strong>Payment</strong></div><div className="sellerStepLine" />
        <div className="sellerStep"><span>3</span><strong>Admin Review</strong></div><div className="sellerStepLine" />
        <div className="sellerStep"><span>4</span><strong>Seller Approved</strong></div>
      </div>
      <section className="sellerSection">
        <div className="sellerSectionHeading"><h2>1. Choose your seller plan</h2><p>Your selected plan is charged once through the secure payment page.</p></div>
        <div className="sellerPlans">
          {plans.map((plan) => {
            const active = selectedPlan === plan.id;
            return <button key={plan.id} type="button" className={"sellerPlan " + (active ? "selected" : "")} onClick={() => setSelectedPlan(plan.id)}>
              {plan.popular && <span className="sellerPopular">Most Popular</span>}
              <span className={"sellerRadio " + (active ? "checked" : "")}><span /></span>
              <span className={"sellerPlanIcon " + plan.id}><span className="material-symbols-outlined">{plan.icon}</span></span>
              <strong className="sellerPlanName">{plan.name}</strong><span className="sellerPlanDescription">{plan.description}</span>
              <span className="sellerPlanPrice">{plan.price.toLocaleString()} FRW</span><span className="sellerPlanPeriod">per year</span>
              <span className="sellerFeatures">{plan.features.map((feature) => <span key={feature}><span className="material-symbols-outlined">check_circle</span>{feature}</span>)}</span>
              <span className={"sellerChoose " + (active ? "active" : "")}>{active ? "Chosen" : "Choose"}</span>
            </button>;
          })}
        </div>
      </section>
      <section className="sellerFormCard">
        <div className="sellerFormTitle"><span className="material-symbols-outlined">storefront</span><div><h2>2. Store information</h2><p>These details are sent to the admin for review.</p></div></div>
        <div className="sellerFormGrid">
          <label>Store name<input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Your store name" /></label>
          <label>Business description<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers about your store and products..." /></label>
          <label>Phone number<input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+250 7XX XXX XXX" /></label>
        </div>
      </section>
      {selected && <section className="sellerPayment">
        <div className="sellerSectionHeading"><h2>3. Payment method</h2><p>Pay {selected.price.toLocaleString()} FRW for the {selected.name} plan.</p></div>
        <div className="sellerPaymentGrid">
          {paymentMethods.map((method) => {
            const active = paymentMethod === method.id;
            return <button key={method.id} type="button" className={"sellerPaymentCard " + (active ? "selected" : "")} onClick={() => setPaymentMethod(method.id)}>
              <span className={"sellerRadio " + (active ? "checked" : "")}><span /></span>
              <span className="sellerPaymentText"><strong>{method.name}</strong><small>{method.detail}</small></span>
              <span className="sellerLogos">{method.logos.map((logo) => <img key={logo.src} src={logo.src} alt={logo.alt} />)}</span>
            </button>;
          })}
        </div>
      </section>}
      {error && <div className="sellerMessage">{error}</div>}
      <button className="sellerSubmit cta" type="button" disabled={loading || !selected || !paymentMethod || !storeName.trim()} onClick={continueToPayment}>
        <span className="material-symbols-outlined">lock</span>
        {loading ? "Starting secure payment..." : selected && paymentMethod ? "Continue to secure payment" : "Complete application details"}
      </button>
      <p className="sellerNote"><span className="material-symbols-outlined">verified_user</span> Payment does not automatically approve a seller. After successful payment, an admin must approve the application.</p>
    </main>
  );
}
