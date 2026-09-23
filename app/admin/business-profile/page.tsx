import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import BusinessProfileClient from "@/components/BusinessProfileClient";

export default async function BusinessProfilePage() {
  const session = await requireAuth(["ADMIN"]).catch(() => null);
  if (!session) redirect("/login?next=/admin/business-profile");

  return (
    <main className="portal">
      <aside className="portalSide">
        <div className="brand"><span className="brandMark">A</span>AkaziConnect</div>
        <h3>Admin Portal</h3>
        <a href="/admin">Overview</a>
        <a href="/admin/customers">Customers</a>
        <a href="/admin/sellers">Sellers</a>
        <a href="/admin/products">Products</a>
        <a href="/admin/orders">Orders</a>
        <a href="/admin/payments">Payments</a>
        <a href="/admin/categories">Categories</a>
        <a href="/admin/settings">Settings</a>
        <a href="/admin/business-profile" className="portalNavActive">Business Profile</a>
      </aside>
      <section className="portalMain">
        <div className="portalTop">
          <div>
            <div className="eyebrow">BUSINESS PROFILE</div>
            <h1>AkaziConnect</h1>
            <p className="portalSub">Company identity and payment information used by the marketplace.</p>
          </div>
        </div>
        <BusinessProfileClient />
      </section>
    </main>
  );
}
