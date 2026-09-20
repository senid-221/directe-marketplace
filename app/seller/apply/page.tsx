"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  { id: "starter", name: "Starter", price: 50000, description: "For individuals starting a store on DIRECTE.", icon: "storefront", features: ["Up to 50 products", "Basic store tools", "Standard support"] },
  { id: "business", name: "Business", price: 150000, description: "For growing businesses with a larger catalog.", icon: "analytics", features: ["Up to 200 products", "Advanced store tools", "Priority support", "Basic analytics"], popular: true },
  { id: "plus", name: "Plus", price: 250000, description: "For established sellers with higher business needs.", icon: "workspace_premium", features: ["Unlimited products", "Advanced store tools", "Advanced analytics", "Dedicated support", "Featured store placement"] },
];

const paymentMethods = [
  { id: "mtn", name: "MTN Mobile Money", detail: "Pay securely using your MTN MoMo account.", logos: [{ src: "https://momoapi.mtn.co.rw/content/MoMo-flat-logo_1.png", alt: "MTN MoMo official logo" }] },
  { id: "bank", name: "Banking", detail: "Choose your bank for bank transfer.", logos: [
    { src: "https://www.google.com/s2/favicons?domain=bk.rw&sz=128", alt: "Bank of Kigali official site logo" },
    { src: "https://www.google.com/s2/favicons?domain=equitygroupholdings.com&sz=128", alt: "Equity official site logo" },
    { src: "https://www.google.com/s2/favicons?domain=imbankgroup.com&sz=128", alt: "I&M Bank official site logo" },
  ], banks: ["BK", "Equity", "I&M Bank"] },
  { id: "card", name: "Credit / Debit Card", detail: "Pay with Visa or Mastercard.", logos: [
    { src: "https://corporate.visa.com/dam/VCOM/corporate/about-visa/images/visa-brand-mark-grid-800x450.jpg", alt: "Visa official brand mark" },
    { src: "https://www.mastercard.com/news/media/jbcmoato/mastercard-symbol_transparentbg.png", alt: "Mastercard official symbol" },
  ] },
];

export default function SellerApplyPage() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const selected = plans.find((plan) => plan.id === selectedPlan);

  return (
    <main className="sellerApply">
      <div className="sellerApplyTop">
        <Link href="/" className="sellerBack"><span className="material-symbols-outlined inlineIcon">arrow_back</span> Back to DIRECTE</Link>
        <div className="sellerHero">
          <div className="sellerHeroIcon"><span className="material-symbols-outlined">storefront</span></div>
          <div><div className="eyebrow">DIRECTE SELLER PROGRAM</div><h1>Become a Seller</h1><p>Choose a plan and grow your business on DIRECTE.</p></div>
        </div>
      </div>

      <div className="sellerSteps">
        <div className="sellerStep active"><span>1</span><strong>Choose Plan</strong></div><div className="sellerStepLine" />
        <div className="sellerStep"><span>2</span><strong>Store Information</strong></div><div className="sellerStepLine" />
        <div className="sellerStep"><span>3</span><strong>Payment</strong></div><div className="sellerStepLine" />
        <div className="sellerStep"><span>4</span><strong>Review & Submit</strong></div>
      </div>

      <section className="sellerSection">
        <div className="sellerSectionHeading"><h2>Choose your seller plan</h2><p>Select the plan that fits your business needs.</p></div>
        <div className="sellerPlans">
          {plans.map((plan) => {
            const active = selectedPlan === plan.id;
            return (
              <button key={plan.id} type="button" className={`sellerPlan ${active ? "selected" : ""}`} onClick={() => setSelectedPlan(plan.id)}>
                {plan.popular && <span className="sellerPopular">Most Popular</span>}
                <span className={`sellerRadio ${active ? "checked" : ""}`}><span /></span>
                <span className={`sellerPlanIcon ${plan.id}`}><span className="material-symbols-outlined">{plan.icon}</span></span>
                <strong className="sellerPlanName">{plan.name}</strong>
                <span className="sellerPlanDescription">{plan.description}</span>
                <span className="sellerPlanPrice">{plan.price.toLocaleString()} FRW</span>
                <span className="sellerPlanPeriod">per year</span>
                <span className="sellerFeatures">{plan.features.map((feature) => <span key={feature}><span className="material-symbols-outlined">check_circle</span>{feature}</span>)}</span>
                <span className={`sellerChoose ${active ? "active" : ""}`}>{active ? "Chosen" : "Choose"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="sellerFormCard">
        <div className="sellerFormTitle"><span className="material-symbols-outlined">storefront</span><div><h2>Store information</h2><p>Tell us about your store.</p></div></div>
        <div className="sellerFormGrid">
          <label>Store name<input placeholder="Your store name" /></label>
          <label>Business description<textarea placeholder="Tell customers about your store, the products you sell, and what makes your business unique..." /></label>
          <label>Phone number<input type="tel" placeholder="+250 7XX XXX XXX" /></label>
          <label>Email<input type="email" placeholder="store@example.com" /></label>
        </div>
      </section>

      {selected && <section className="sellerPayment">
        <div className="sellerSectionHeading"><h2>Payment method</h2><p>Pay {selected.price.toLocaleString()} FRW for the {selected.name} plan.</p></div>
        <div className="sellerPaymentGrid">
          {paymentMethods.map((method) => {
            const active = paymentMethod === method.id;
            return <button key={method.id} type="button" className={`sellerPaymentCard ${active ? "selected" : ""}`} onClick={() => setPaymentMethod(method.id)}>
              <span className={`sellerRadio ${active ? "checked" : ""}`}><span /></span>
              <span className="sellerPaymentText"><strong>{method.name}</strong><small>{method.detail}</small>{method.banks && <em>{method.banks.join(" · ")}</em>}</span>
              <span className="sellerLogos">{method.logos.map((logo) => <img key={logo.src} src={logo.src} alt={logo.alt} />)}</span>
            </button>;
          })}
        </div>
      </section>}

      <button className="sellerSubmit cta" type="button" disabled={!selectedPlan || !paymentMethod || submitted} onClick={() => setSubmitted(true)}>
        <span className="material-symbols-outlined">lock</span>
        {submitted ? "Payment required before activation" : selected && paymentMethod ? `Continue to payment — ${selected.price.toLocaleString()} FRW` : selected ? "Choose a payment method" : "Choose a seller plan"}
      </button>
      <p className="sellerNote"><span className="material-symbols-outlined">verified_user</span> Seller activation happens only after payment and DIRECTE approval.</p>
    </main>
  );
}
