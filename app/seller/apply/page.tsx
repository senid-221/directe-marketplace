"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 50000,
    description: "For individuals starting a store on DIRECTE.",
  },
  {
    id: "business",
    name: "Business",
    price: 150000,
    description: "For growing businesses with a larger catalog.",
  },
  {
    id: "plus",
    name: "Plus",
    price: 250000,
    description: "For established sellers with higher business needs.",
  },
];

export default function SellerApplyPage() {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selected = plans.find((plan) => plan.id === selectedPlan);

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 20px 70px" }}>
      <Link href="/" style={{ color: "var(--directe-orange)", fontWeight: 700 }}>
        ← Back to DIRECTE
      </Link>

      <div className="authCard" style={{ marginTop: 24, maxWidth: 1000 }}>
        <div className="eyebrow">DIRECTE SELLER PROGRAM</div>
        <h1>Become a Seller</h1>
        <p>
          Choose a paid seller plan before submitting your store application.
          Seller access is not free.
        </p>

        <h2 style={{ marginTop: 28 }}>Choose your seller plan</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
            marginTop: 16,
          }}
        >
          {plans.map((plan) => {
            const active = selectedPlan === plan.id;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  textAlign: "left",
                  padding: 20,
                  borderRadius: 14,
                  border: active
                    ? "2px solid var(--directe-orange)"
                    : "1px solid var(--directe-border)",
                  background: active ? "#fff8f2" : "#fff",
                  cursor: "pointer",
                }}
              >
                <strong style={{ fontSize: 20 }}>{plan.name}</strong>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>
                  {plan.price.toLocaleString()} FRW
                </div>
                <p style={{ margin: "8px 0 0", color: "#666" }}>
                  {plan.description}
                </p>
                <div
                  style={{
                    marginTop: 14,
                    fontWeight: 700,
                    color: active ? "var(--directe-orange)" : "#333",
                  }}
                >
                  {active ? "✓ Selected" : "Select plan"}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 30 }}>
          <label>
            Store name
            <input placeholder="Your store name" />
          </label>

          <label>
            Business description
            <textarea
              placeholder="Tell customers about your store"
              style={{
                minHeight: 110,
                border: "1px solid var(--directe-border)",
                borderRadius: 10,
                padding: 13,
                font: "inherit",
              }}
            />
          </label>

          <label>
            Phone number
            <input placeholder="+250 7xx xxx xxx" />
          </label>

          <label>
            Email
            <input type="email" placeholder="store@example.com" />
          </label>
        </div>

        {selected && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 10,
              background: "#f7f7f7",
            }}
          >
            <strong>Selected plan: {selected.name}</strong>
            <div style={{ marginTop: 4 }}>
              Seller fee: <strong>{selected.price.toLocaleString()} FRW</strong>
            </div>
          </div>
        )}

        <button
          className="cta"
          type="button"
          disabled={!selectedPlan || submitted}
          onClick={() => setSubmitted(true)}
          style={{
            width: "100%",
            marginTop: 20,
            opacity: !selectedPlan || submitted ? 0.6 : 1,
            cursor: !selectedPlan || submitted ? "not-allowed" : "pointer",
          }}
        >
          {submitted
            ? "Payment required before activation"
            : selected
              ? `Continue to payment — ${selected.price.toLocaleString()} FRW`
              : "Select a seller plan"}
        </button>

        <small style={{ display: "block", marginTop: 12 }}>
          Your seller account will only be activated after the selected plan
          has been paid and the DIRECTE team approves the application.
        </small>
      </div>
    </main>
  );
}
