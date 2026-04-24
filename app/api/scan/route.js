import { NextResponse } from "next/server";
import demoData from "@/data/demoData.json";
import { runRecon } from "@/lib/recon";
import { detectVulnerabilities } from "@/lib/vulnerabilities";
import { generateAttackSimulation } from "@/lib/attackSimulation";
import { buildReport, saveAttackLog } from "@/lib/report";
import { cacheGet, cacheSet } from "@/lib/redis";
import { orchestrate } from "@/lib/wundergraph";
import { transformForDashboard } from "@/lib/nexla";
import { reconAgentOutput } from "@/agents/reconAgent";
import { attackAgentOutput } from "@/agents/attackAgent";
import { reportAgentOutput } from "@/agents/reportAgent";

function normalizeTarget(raw) {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (v === "demo") return "demo";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes("github.com")) return v;
  return `https://${v}`;
}

function statuses(result) {
  return {
    wundergraph: result.wg.status === "active" ? "WunderGraph Active ✓" : "WunderGraph Mock",
    tinyfish: "Powered by Tinyfish",
    nexla: "Nexla Transform Ready",
    redis: result.cacheHit ? "Redis Cache Hit" : "Redis Cache Miss",
    tigerdata: result.savedToGhost ? "TigerData Stored" : "TigerData Mock",
    akash: "Akash Distributed Simulation (Mock)",
    chainguard: "Secured by Chainguard",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const ceoMode = Boolean(body.ceoMode);
    const fixes = Array.isArray(body.fixes) ? body.fixes : [];
    const target = normalizeTarget(body.target);

    if (!target) {
      return NextResponse.json({ error: "Target is required" }, { status: 400 });
    }

    if (target === "demo") {
      const agents = [
        ...reconAgentOutput({ endpoints: ["/login", "/api", "/admin"], techStack: ["Next.js", "Node"] }),
        ...attackAgentOutput(demoData.vulnerabilities, demoData.simulation),
        ...reportAgentOutput(demoData.report),
      ];

      return NextResponse.json({
        ...demoData,
        agents,
        dashboard: transformForDashboard(demoData),
        statuses: {
          wundergraph: "WunderGraph Mock",
          tinyfish: "Powered by Tinyfish",
          nexla: "Nexla Transform Ready",
          redis: "Redis bypassed for demo",
          tigerdata: "TigerData Mock",
          akash: "Akash Distributed Simulation (Mock)",
          chainguard: "Secured by Chainguard",
        },
      });
    }

    const cacheKey = `redbox:${target}:${fixes.sort().join(",")}:${ceoMode ? "ceo" : "tech"}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cacheHit: true, statuses: { ...cached.statuses, redis: "Redis Cache Hit ⚡" } });
    }

    const wg = await orchestrate("scan", { target, ceoMode, fixes });
    const recon = await runRecon(target);
    const vulnerabilities = detectVulnerabilities(recon, fixes);
    const simulation = await generateAttackSimulation({
      target,
      vulnerabilities,
      ceoMode,
    });
    const report = await buildReport({
      target,
      vulnerabilities,
      simulation,
      ceoMode,
    });

    const agents = [
      ...reconAgentOutput(recon),
      ...attackAgentOutput(vulnerabilities, simulation),
      ...reportAgentOutput(report),
    ];

    const payload = {
      target,
      recon,
      vulnerabilities,
      simulation,
      report,
      agents,
      dashboard: transformForDashboard({ vulnerabilities, simulation }),
      wg,
      cacheHit: false,
      savedToGhost: false,
    };

    const saved = await saveAttackLog(payload).catch(() => false);
    payload.savedToGhost = saved;
    payload.statuses = statuses(payload);

    await cacheSet(cacheKey, payload, 3600);

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
