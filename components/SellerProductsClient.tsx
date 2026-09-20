"use client";

import { FormEvent, useMemo, useState } from "react";

type Product = {
  id: string; name: string; description: string; categoryId: string; categoryName: string;
  price: number; oldPrice: number | null; stock: number; published: boolean; images: string[]; updatedAt: string;
};
type Category = { id: string; name: string };
const emptyForm = { name: "", description: "", categoryId: "", price: "", oldPrice: "", stock: "", images: "" };

export default function SellerProductsClient({ initialProducts, categories }: { initialProducts: Product[]; categories: Category[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = filter.toLowerCase().trim();
    return products.filter((product) => !query || product.name.toLowerCase().includes(query) || product.categoryName.toLowerCase().includes(query));
  }, [products, filter]);

  function resetForm() {
    setForm(emptyForm); setEditingId(null); setShowForm(false);
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name, description: product.description, categoryId: product.categoryId,
      price: String(product.price), oldPrice: product.oldPrice == null ? "" : String(product.oldPrice),
      stock: String(product.stock), images: product.images.join("\n"),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const endpoint = editingId ? "/api/seller/products/" + editingId : "/api/seller/products";
      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), oldPrice: form.oldPrice ? Number(form.oldPrice) : null, stock: Number(form.stock), images: form.images }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save product.");
      const next = normalize(data.product);
      setProducts((items) => editingId ? items.map((item) => item.id === editingId ? next : item) : [next, ...items]);
      setMessage(editingId ? "Product updated successfully." : "Product added successfully.");
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save product.");
    } finally { setSaving(false); }
  }

  async function archiveProduct(product: Product) {
    if (!window.confirm("Remove \"" + product.name + "\" from your store?")) return;
    const response = await fetch("/api/seller/products/" + product.id, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Could not remove product."); return; }
    setProducts((items) => items.map((item) => item.id === product.id ? { ...item, published: false } : item));
    setMessage("Product removed from the store.");
  }

  return <div>
    {message && <div className="sellerMessage" role="status">{message}</div>}
    {showForm && <section id="add-product" className="panel sellerProductFormPanel">
      <div className="sectionHeader"><div><h2>{editingId ? "Edit product" : "Add product"}</h2><p className="portalSub">Use real product photos by adding direct image URLs.</p></div><button className="secondaryButton" type="button" onClick={resetForm}>Close</button></div>
      <form className="sellerProductForm" onSubmit={submit}>
        <label>Product name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Samsung Galaxy A55" /></label>
        <label>Category<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Price (FRW)<input required min="1" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
        <label>Old price (FRW)<input min="1" type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder="Optional" /></label>
        <label>Stock<input required min="0" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
        <label className="full">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the product..." /></label>
        <label className="full">Product image URLs<textarea value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder={"https://example.com/image-1.jpg\nhttps://example.com/image-2.jpg"} /><small>One image URL per line. Up to 8 images.</small></label>
        <div className="full sellerFormActions"><button className="cta" type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add product"}</button><button className="secondaryButton" type="button" onClick={resetForm}>Cancel</button></div>
      </form>
    </section>}

    <div className="panel">
      <div className="sectionHeader"><div><h2>Your products</h2><p className="portalSub">{products.length} products in your catalog</p></div><div className="sellerProductTools"><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search products" /><button className="cta compactCta" type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>+ Add</button></div></div>
      <div className="sellerProductTableWrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Updated</th><th></th></tr></thead>
      <tbody>{filtered.map((product) => <tr key={product.id}>
        <td><div className="sellerProductCell">{product.images[0] ? <img src={product.images[0]} alt="" /> : <div className="sellerImagePlaceholder"><span className="material-symbols-outlined">image</span></div>}<strong>{product.name}</strong></div></td>
        <td>{product.categoryName}</td><td>{product.price.toLocaleString()} FRW</td><td><span className={product.stock <= 5 ? "stockLow" : ""}>{product.stock}</span></td>
        <td><span className={product.published ? "statusPill statusLive" : "statusPill"}>{product.published ? "Live" : "Hidden"}</span></td>
        <td>{new Date(product.updatedAt).toLocaleDateString("en-GB")}</td>
        <td><div className="tableActions"><button type="button" onClick={() => editProduct(product)}>Edit</button><button type="button" className="dangerText" onClick={() => archiveProduct(product)}>Remove</button></div></td>
      </tr>)}</tbody></table>{!filtered.length && <div className="emptyState">No products found.</div>}</div>
    </div>
  </div>;
}

function normalize(product: any): Product {
  return {
    id: product.id, name: product.name, description: product.description || "",
    categoryId: product.categoryId, categoryName: product.category?.name || "Uncategorized",
    price: Number(product.price), oldPrice: product.oldPrice == null ? null : Number(product.oldPrice),
    stock: product.stock, published: product.published, images: (product.images || []).map((image: any) => image.url),
    updatedAt: product.updatedAt,
  };
}
