"use client";

import { useState } from "react";

type Product = { id: string; name: string; stock: number; price: number; image: string };

export default function InventoryClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function saveStock(id: string, stock: number) {
    setSaving(id); setMessage("");
    try {
      const response = await fetch("/api/seller/products/" + id, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update stock.");
      setProducts((items) => items.map((item) => item.id === id ? { ...item, stock } : item));
      setMessage("Inventory updated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update stock."); }
    finally { setSaving(null); }
  }

  return <div>{message && <div className="sellerMessage">{message}</div>}<div className="panel"><table><thead><tr><th>Product</th><th>Price</th><th>Current stock</th><th>New stock</th><th></th></tr></thead><tbody>{products.map((product) => <StockRow key={product.id} product={product} saving={saving === product.id} onSave={saveStock} />)}</tbody></table>{!products.length && <div className="emptyState">No products in inventory.</div>}</div></div>;
}

function StockRow({ product, saving, onSave }: { product: Product; saving: boolean; onSave: (id: string, stock: number) => void }) {
  const [value, setValue] = useState(String(product.stock));
  return <tr><td><div className="sellerProductCell">{product.image ? <img src={product.image} alt="" /> : <div className="sellerImagePlaceholder"><span className="material-symbols-outlined">image</span></div>}<strong>{product.name}</strong></div></td><td>{product.price.toLocaleString()} FRW</td><td><span className={product.stock <= 5 ? "stockLow" : ""}>{product.stock}</span></td><td><input className="stockInput" min="0" type="number" value={value} onChange={(e) => setValue(e.target.value)} /></td><td><button className="secondaryButton compactButton" disabled={saving} onClick={() => onSave(product.id, Math.max(0, Number(value) || 0))}>{saving ? "Saving..." : "Save"}</button></td></tr>;
}
