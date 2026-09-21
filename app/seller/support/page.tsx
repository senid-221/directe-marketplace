import Link from "next/link";

export default function SellerSupportPage() {
  return (
    <main className="accountPage">
      <div className="accountHeader">
        <div>
          <div className="eyebrow">SELLER SUPPORT</div>
          <h1>Seller Help</h1>
          <p>Manage your store, products, inventory and orders from Seller Center.</p>
        </div>
        <Link href="/seller" className="cta">Seller Center</Link>
      </div>

      <section className="accountGrid">
        <div className="accountCard">
          <h2>Products</h2>
          <p>Add, edit and publish your marketplace products.</p>
          <Link href="/seller/products" className="secondaryButton">Manage products</Link>
        </div>
        <div className="accountCard">
          <h2>Inventory</h2>
          <p>Keep product stock quantities up to date so customers can place orders.</p>
          <Link href="/seller/inventory" className="secondaryButton">Manage inventory</Link>
        </div>
        <div className="accountCard">
          <h2>Orders</h2>
          <p>Review customer orders and update order and delivery status.</p>
          <Link href="/seller/orders" className="secondaryButton">Manage orders</Link>
        </div>
        <div className="accountCard">
          <h2>Store settings</h2>
          <p>Update your store name and description.</p>
          <Link href="/seller/settings" className="secondaryButton">Store settings</Link>
        </div>
      </section>
    </main>
  );
}
