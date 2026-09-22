"use client";

import { useState } from "react";

export default function PriceAlertButton({ productId }: { productId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Please sign in to enable price alerts.");
        return;
      }
      setMessage("Price-drop alert enabled.");
    } catch {
      setMessage("Could not enable the price alert.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="secondaryButton" type="button" onClick={handleClick} disabled={busy}>
        {busy ? "Saving..." : "Notify me on price drop"}
      </button>
      {message ? <small style={{ display: "block", marginTop: 6 }}>{message}</small> : null}
    </div>
  );
}
