import { NextResponse } from "next/server";
import { getPool } from "@/lib/infra";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Handle Vapi Function Calls
    if (body.message?.type === "function-call") {
      const { name, parameters } = body.message.functionCall;
      
      if (name === "get_latest_scans") {
        const db = getPool();
        if (db) {
          const { rows } = await db.query("SELECT domain, risk_score FROM domain_attacks ORDER BY scanned_at DESC LIMIT 5");
          return NextResponse.json({
            results: [
              {
                toolCallId: body.message.toolCallId,
                result: JSON.stringify(rows)
              }
            ]
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
