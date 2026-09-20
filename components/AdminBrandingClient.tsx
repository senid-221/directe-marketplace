"use client";

import { ChangeEvent, useEffect, useState } from "react";

export default function AdminBrandingClient() {
  const [logoUrl, setLogoUrl] = useState("/akaziconnect-logo.svg");
  const [preview, setPreview] = useState("/akaziconnect-logo.svg");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then((res) => res.json()).then((data) => {
      const value = data.logoUrl || "/akaziconnect-logo.svg";
      setLogoUrl(value); setPreview(value);
    }).catch(() => setMessage("Unable to load the current logo.")).finally(() => setLoading(false));
  }, []);

  function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Please choose an image file.");
    if (file.size > 4 * 1024 * 1024) return setMessage("Logo must be 4 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => { const value = String(reader.result || ""); setLogoUrl(value); setPreview(value); setMessage(""); };
    reader.readAsDataURL(file);
  }

  async function saveLogo() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logoUrl }) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error || "Unable to save the logo.");
      setLogoUrl(data.logoUrl); setPreview(data.logoUrl); setMessage("Logo updated successfully.");
    } catch { setMessage("Unable to save the logo."); }
    finally { setSaving(false); }
  }

  async function resetLogo() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/settings", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error || "Unable to reset the logo.");
      setLogoUrl(data.logoUrl); setPreview(data.logoUrl); setMessage("Default logo restored.");
    } catch { setMessage("Unable to reset the logo."); }
    finally { setSaving(false); }
  }

  return <div className="brandingSettings">
    <div className="brandingPreview">
      <div className="eyebrow">CURRENT LOGO</div>
      <div className="brandingLogoFrame">{loading ? <span>Loading...</span> : <img src={preview} alt="AkaziConnect logo preview" />}</div>
    </div>
    <div className="brandingControls">
      <label className="uploadLogoButton"><span className="material-symbols-outlined">upload</span>Choose logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={chooseLogo} /></label>
      <p className="brandingHint">PNG, JPG, WebP or SVG. Maximum 4 MB.</p>
      <div className="brandingActions"><button className="cta" type="button" onClick={saveLogo} disabled={saving || loading}>{saving ? "Saving..." : "Save logo"}</button><button className="secondaryButton" type="button" onClick={resetLogo} disabled={saving}>Restore default</button></div>
      {message && <div className="authError" role="status">{message}</div>}
    </div>
  </div>;
}
