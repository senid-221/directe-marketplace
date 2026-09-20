import Link from "next/link";
import { verifyAndFinalizePayment } from "@/lib/payment";

export const dynamic = "force-dynamic";

export default async function PaymentCallback({ searchParams }: { searchParams: Promise<{ status?: string; tx_ref?: string; transaction_id?: string }> }) {
 const params=await searchParams;
 let successful=false; let orderId="";
 if(params.tx_ref&&params.transaction_id&&params.status==="successful"){
  try{const result=await verifyAndFinalizePayment(params.tx_ref,params.transaction_id);successful=result.ok;orderId=result.orderId||"";}catch(error){console.error("Payment callback failed:",error);}
 }
 return <main className="paymentResult"><div className="paymentResultCard"><span className="material-symbols-outlined paymentResultIcon">{successful?"check_circle":"error"}</span><h1>{successful?"Payment successful":"Payment not completed"}</h1><p>{successful?"Your payment has been verified and your order is confirmed.":"We could not confirm this payment. If money was deducted, please contact AkaziConnect support before paying again."}</p><div className="paymentResultActions">{successful&&orderId?<Link className="cta" href={"/orders/"+orderId}>View order</Link>:<Link className="cta" href="/checkout">Return to checkout</Link>}<Link className="secondaryButton" href="/">Continue shopping</Link></div></div></main>;
}
