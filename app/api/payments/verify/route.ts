import { NextResponse } from "next/server";
import { verifyAndFinalizePayment } from "@/lib/payment";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const txRef = url.searchParams.get("tx_ref");
  const transactionId = url.searchParams.get("transaction_id");
  if (!txRef || !transactionId) return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
  try {
    const result = await verifyAndFinalizePayment(txRef, transactionId);
    return NextResponse.json(result, { status: result.ok ? 200 : 402 });
  } catch (error) {
    console.error("AkaziConnect payment verification failed:", error);
    return NextResponse.json({ error: "Could not verify payment." }, { status: 502 });
  }
}
