"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [phoneMode, setPhoneMode] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/akaziconnect-logo.svg");

  useEffect(() => {
    fetch("/api/site-settings").then((res) => res.json()).then((data) => {
      if (data.logoUrl) setLogoUrl(data.logoUrl);
    }).catch(() => {});
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your phone/email and password.");
      return;
    }

    setLoading(true);
    try {
      const payload = phoneMode
        ? { phone: identifier.trim(), password }
        : { email: identifier.trim(), password };

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed. Check your details and try again.");
        return;
      }

      const next = new URLSearchParams(window.location.search).get("next") || "/account";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function enablePhoneLogin() {
    setPhoneMode(true);
    setError("");
    setIdentifier("");
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <div className="brand">
          <img
            src={logoUrl}
            alt="AkaziConnect"
            className="brandLogo"
          />
        </div>

        <h1>Welcome back</h1>
        <p>Sign in to manage your shopping, orders and account.</p>

        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label>
            {phoneMode ? "Phone number" : "Phone or email"}
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              type={phoneMode ? "tel" : "text"}
              inputMode={phoneMode ? "tel" : "text"}
              autoComplete={phoneMode ? "tel" : "username"}
              placeholder={phoneMode ? "+250 7XX XXX XXX" : "Phone or email"}
              required
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              required
            />
          </label>

          {error && <div className="authError" role="alert">{error}</div>}

          <button className="cta" style={{ width: "100%" }} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="authDivider">or</div>

        {!phoneMode ? (
          <button className="secondaryButton" style={{ width: "100%" }} type="button" onClick={enablePhoneLogin}>
            <span className="material-symbols-outlined inlineIcon">phone</span>
            Continue with phone
          </button>
        ) : (
          <button
            className="secondaryButton"
            style={{ width: "100%" }}
            type="button"
            onClick={() => { setPhoneMode(false); setIdentifier(""); setError(""); }}
          >
            Use email instead
          </button>
        )}

        <small>By continuing, you agree to AkaziConnect terms and privacy policy.</small>
      </div>
    </main>
  );
}
