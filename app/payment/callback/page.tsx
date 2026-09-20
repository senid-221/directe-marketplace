import Link from "next/link";
import { verifyAndFinalizePayment } from "@/lib/payment";
import { verifyAndFinalizeSellerPayment } from "@/lib/seller-payment";

export const dynamic = "force-dynamic";

export default async function PaymentCallback({ searchParams }: { searchParams: Promise<{ status?: string; tx_ref?: string; transaction_id?: string }> }) {
  const params = await searchParams;
  let successful = false;
  let sellerPayment = false;
  let orderId = "";
  let sellerId = "";

  if (params.tx_ref?.startsWith("AKZ-SELLER-")) {
    sellerPayment = true;
    if (params.tx_ref && params.transaction_id && params.status === "successful") {
      try {
        const result = await verifyAndFinalizeSellerPayment(params.tx_ref, params.transaction_id);
        successful = result.ok;
        sellerId = result.sellerId;
      } catch (error) {
        console.error("Seller payment callback failed:", error);
      }
    }
  } else if (params.tx_ref && params.transaction_id && params.status === "successful") {
    try {
      const result = await verifyAndFinalizePayment(params.tx_ref, params.transaction_id);
      successful = result.ok;
      orderId = result.orderId || "";
    } catch (error) {
      console.error("Payment callback failed:", error);
    }
  }

  return <main className="paymentResult"><div className="paymentResultCard">
    <span className="material-symbols-outlined paymentResultIcon">{successful ? "check_circle" : "error"}</span>
    <h1>{successful ? "Payment successful" : "Payment not completed"}</h1>
    <p>{successful
      ? sellerPayment
        ? "Your seller application payment has been verified. Your application is now waiting for AkaziConnect admin approval."
        : "Your payment has been verified and your order is confirmed."
      : "We could not confirm this payment. If money was deducted, please contact AkaziConnect support before paying again."}</p>
    <div className="paymentResultActions">
      {successful && sellerPayment && sellerId ? <Link className="cta" href="/seller/apply">View application status</Link> : successful && orderId ? <Link className="cta" href={"/orders/" + orderId}>View order</Link> : <Link className="cta" href={sellerPayment ? "/seller/apply" : "/checkout"}>Return</Link>}
      <Link className="secondaryButton" href="/">Continue shopping</Link>
    </div>
  </div></main>;
}