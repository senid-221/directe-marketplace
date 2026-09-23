import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import PayoutForm from "@/components/PayoutForm";

export default async function SellerWalletPage() {
  const session = await requireAuth(["SELLER"]).catch(() => null);
  if (!session) redirect("/login?next=/seller/wallet");

  const seller = await prisma.seller.findUnique({
    where: { userId: session.userId },
    include: { wallet: true, payouts: { orderBy: { requestedAt: "desc" }, take: 20 }, user: { select: { phone: true } } },
  });
  if (!seller || seller.status !== "APPROVED") redirect("/seller/apply");

  const available = Number(seller.wallet?.availableBalance || 0);
  const pending = Number(seller.wallet?.pendingBalance || 0);
  const totalSales = Number(seller.wallet?.totalSales || 0);
  const totalPayouts = Number(seller.wallet?.totalPayouts || 0);
  const payoutPhone = seller.payoutPhone || seller.user.phone || "";
  const payoutProvider = seller.payoutProvider || "MTN_MOMO_RWA";

  return <main className="portal">
    <SellerSidebar active="Wallet" />
    <section className="portalMain">
      <div className="portalTop">
        <div><div className="eyebrow">SELLER CENTER</div><h1>Wallet & payouts</h1><p className="portalSub">Track seller earnings and request MTN Mobile Money payouts.</p></div>
        <Link href="/seller/settings" className="secondaryButton">Payout settings</Link>
      </div>
      <div className="stats">
        <div className="stat"><span>Available balance</span><strong>RWF {Math.round(available).toLocaleString()}</strong></div>
        <div className="stat"><span>Pending payouts</span><strong>RWF {Math.round(pending).toLocaleString()}</strong></div>
        <div className="stat"><span>Total sales credited</span><strong>RWF {Math.round(totalSales).toLocaleString()}</strong></div>
        <div className="stat"><span>Total paid out</span><strong>RWF {Math.round(totalPayouts).toLocaleString()}</strong></div>
      </div>
      <div className="walletGrid">
        <div className="panel">
          <div className="sectionHeader"><div><h2>Request payout</h2><p className="portalSub">Enter the amount you want to withdraw.</p></div></div>
          {!seller.payoutEnabled
            ? <div className="walletNotice"><span className="material-symbols-outlined">lock</span><div><strong>Payouts are not enabled</strong><p>Contact the marketplace administrator after your payout details are ready.</p></div></div>
            : <PayoutForm available={available} payoutPhone={payoutPhone} payoutProvider={payoutProvider} />}
        </div>
        <div className="panel">
          <div className="sectionHeader"><div><h2>Payout status</h2><p className="portalSub">Payouts are sent only when your seller account is enabled.</p></div></div>
          <div className="walletStatus">
            <div><span className={"walletStatusDot " + (seller.payoutEnabled ? "enabled" : "")}></span><strong>{seller.payoutEnabled ? "Payouts enabled" : "Payouts not enabled"}</strong></div>
            <p>Provider: <strong>{payoutProvider}</strong></p>
            <p>Destination: <strong>{payoutPhone || "Not configured"}</strong></p>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="sectionHeader"><div><h2>Payout history</h2><p className="portalSub">Your latest payout requests.</p></div></div>
        <div className="walletTable">
          {seller.payouts.length === 0 ? <div className="emptyState">No payouts yet.</div> : seller.payouts.map((payout) =>
            <div className="walletRow" key={payout.id}>
              <div><strong>RWF {Math.round(Number(payout.amount)).toLocaleString()}</strong><span>{payout.phone} · {new Date(payout.requestedAt).toLocaleString("en-GB")}</span></div>
              <div className={"walletPayoutStatus walletPayoutStatus-" + payout.status.toLowerCase()}>{payout.status}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  </main>;
}

function SellerSidebar({ active }: { active:string }) {
  const links=[["Dashboard","/seller"],["Products","/seller/products"],["Orders","/seller/orders"],["Inventory","/seller/inventory"],["Wallet","/seller/wallet"],["Store settings","/seller/settings"]];
  return <aside className="portalSide"><div className="brand"><span className="brandMark">A</span>AkaziConnect</div><h3>Seller Center</h3>{links.map(([label,href])=><a key={label} href={href} className={active===label?"portalNavActive":""}>{label}</a>)}</aside>;
}
