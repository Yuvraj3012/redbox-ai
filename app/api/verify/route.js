import { NextResponse } from "next/server";
import { verifyOwnership } from "@/lib/ownership";

export async function POST(req) {
  try {
    const body = await req.json();
    const target = String(body.target || "").trim();
    if (!target) {
      return NextResponse.json({ verified: false, reason: "Target is required" }, { status: 400 });
    }

    const result = await verifyOwnership(target);
    return NextResponse.json({ verified: result.verified, method: result.method, reason: result.reason });
  } catch (error) {
    return NextResponse.json({ verified: false, reason: String(error) }, { status: 500 });
  }
}
