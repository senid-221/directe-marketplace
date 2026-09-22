import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const session = await getSession();
  if (!session) {
    return <main className="emptyState" style={{ margin: "60px auto", maxWidth: 700 }}>
      <h1>Sign in</h1>
      <Link href="/login?next=/account/returns" className="cta">Sign in</Link>
    </main>;
  }

  const returns = await prisma.returnRequest.findMany({
    where: { userId: session.userId },
    include: { order: true, items: { include: { product: true } } },
    orderBy: { requestedAt: "desc" },
  });

  return (
    <main className="accountPage">
      <Link href="/account" className="secondaryButton">← Account</Link>
      <div className="accountHeader">
        <div>
          <div className="eyebrow">CUSTOMER CARE</div>
          <h1>Returns & refunds</h1>
          <p>Track your return requests and refund status.</p>
        </div>
      </div>
      {!returns.length ? (
        <div className="emptyState"><h2>No return requests</h2><p>Eligible delivered orders can be returned from your order details.</p></div>
      ) : (
        <div className="sellerOrderCards">
          {returns.map((item) => (
            <article className="sellerOrderCard" key={item.id}>
              <div className="sellerOrderTop">
                <div><strong>Order #{item.orderId.slice(-8)}</strong><small>{new Date(item.requestedAt).toLocaleString()}</small></div>
                <span className="statusPill">{item.status}</span>
              </div>
              <div className="sellerOrderItems">
                {item.items.map((ri) => (
                  <div className="sellerOrderItem" key={ri.id}>
                    <div><strong>{ri.product.name}</strong><small>Qty {ri.quantity}</small></div>
                  </div>
                ))}
              </div>
              <p><strong>Reason:</strong> {item.reason}</p>
              {item.refundAmount !== null && <p><strong>Refund:</strong> RWF {Number(item.refundAmount).toLocaleString()}</p>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
