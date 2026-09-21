import { NextResponse } from "next/server";
import crypto from "crypto";
import { verifyAndFinalizePayment } from "@/lib/payment";
import { verifyAndFinalizeSellerPayment } from "@/lib/seller-payment";

export async function POST(request: Request) {
  const raw = await request.text();
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = request.headers.get("flutterwave-signature");
  if (secretHash) {
    const expected = crypto.createHmac("sha256", secretHash).update(raw).digest("base64");
    if (!signature) return new NextResponse("Invalid signature", { status: 401 });
    const provided = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) {
      return new NextResponse("Invalid signature", { status: 401 });
    }
  } else {
    const legacy = request.headers.get("verif-hash");
    if (!legacy || legacy !== process.env.FLW_SECRET_HASH) return new NextResponse("Webhook secret not configured", { status: 401 });
  }

  try {
    const payload = JSON.parse(raw);
    const tx = payload?.data;
    if (payload?.event === "charge.completed" && tx?.tx_ref && tx?.id) {
      if (String(tx.tx_ref).startsWith("AKZ-SELLER-")) await verifyAndFinalizeSellerPayment(String(tx.tx_ref), String(tx.id));
      else await verifyAndFinalizePayment(String(tx.tx_ref), String(tx.id));
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("AkaziConnect Flutterwave webhook failed:", error);
    return NextResponse.json({ received: true });
  }
}
