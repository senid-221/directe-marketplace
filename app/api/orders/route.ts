import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "PAYMENT_REQUIRED", message: "Please use the checkout payment flow to place an order." },
    { status: 410 }
  );
}
