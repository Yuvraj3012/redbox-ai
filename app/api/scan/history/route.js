import { NextResponse } from "next/server";
import { getScanHistory } from "@/lib/ghost";

export async function GET() {
  try {
    const history = await getScanHistory(12);
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ history: [], error: String(error) }, { status: 500 });
  }
}
