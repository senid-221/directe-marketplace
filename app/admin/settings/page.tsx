import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import AdminBrandingClient from "@/components/AdminBrandingClient";

export default async function AdminSettingsPage() {
  const session = await requireAuth(["ADMIN"]).catch(() => null);
  if (!session) redirect("/login?next=/admin/settings");
  return <main className="portal">
    <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Admin Portal</h3>
      <a href="/admin">Overview</a><a href="/admin/customers">Customers</a><a href="/admin/sellers">Sellers</a><a href="/admin/products">Products</a><a href="/admin/orders">Orders</a><a href="/admin/payments">Payments</a><a href="/admin/categories">Categories</a><a href="/admin/settings" className="portalNavActive">Settings</a>
    </aside>
    <section className="portalMain"><div className="portalTop"><div><div className="eyebrow">ADMIN SETTINGS</div><h1>Branding</h1><p className="portalSub">Change the marketplace logo shown across the website.</p></div></div>
      <div className="panel"><div className="sectionHeader"><div><h2>Marketplace logo</h2><p className="portalSub">Only administrators can replace or restore the logo.</p></div></div><AdminBrandingClient /></div>
    </section>
  </main>;
}
