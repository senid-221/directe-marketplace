import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="accountPage">
      <div className="accountHeader">
        <div>
          <div className="eyebrow">HELP CENTER</div>
          <h1>AkaziConnect Support</h1>
          <p>Find help with orders, delivery, payments and your account.</p>
        </div>
        <Link href="/products" className="cta">Continue shopping</Link>
      </div>

      <section className="accountGrid">
        <div className="accountCard">
          <h2>Orders & delivery</h2>
          <p>Check your order status and delivery tracking from your account.</p>
          <Link href="/account?tab=orders" className="secondaryButton">View my orders</Link>
        </div>
        <div className="accountCard">
          <h2>Payments</h2>
          <p>For a payment that was deducted but is not confirmed, keep your transaction reference and avoid paying again until it is checked.</p>
          <Link href="/account?tab=orders" className="secondaryButton">Check orders</Link>
        </div>
        <div className="accountCard">
          <h2>Account</h2>
          <p>Update your profile and saved delivery addresses from your account page.</p>
          <Link href="/account" className="secondaryButton">Open account</Link>
        </div>
      </section>
    </main>
  );
}
