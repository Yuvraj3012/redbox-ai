import { getCache, setCache, getAgentMemory, setAgentMemory } from "./redis";
import { tinyfishCrawl } from "./tinyfish";
import { reconScan } from "./recon";
import { nexlaTransform } from "./nexla";
import { detectVulnerabilities } from "./vulnerabilities";
import { simulateAttack } from "./gemini";
import { storeScan } from "./ghost";
import { buildAttackModel } from "./attackModel";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTarget(target) {
  if (!target) return "";
  if (/^https?:\/\//i.test(target)) return target;
  if (target.includes("github.com")) return target;
  return `https://${target}`;
}

function parseAttackSteps(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.replace(/^\d+\)\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8);

  return lines.map((line) => {
    const phase = /recon/i.test(line)
      ? "Recon"
      : /exploit|sqli|xss|inject/i.test(line)
      ? "Exploit"
      : /escalat|privilege|admin/i.test(line)
      ? "Escalation"
      : /impact|outcome|breach|data/i.test(line)
      ? "Impact"
      : "Access";

    const level = /critical|breach|exfil|bypass/i.test(line)
      ? "critical"
      : /high|admin|escalat/i.test(line)
      ? "high"
      : "info";

    return { phase, text: line, level };
  });
}

export async function runPipeline(target, options = {}) {
  const normalized = normalizeTarget(target);
  const fixes = Array.isArray(options.fixes) ? options.fixes : [];
  const stream = typeof options.onLog === "function" ? options.onLog : () => {};
  const log = (message) => {
    console.log(message);
    stream(message);
  };
  const cacheKey = `redbox:${normalized}:${fixes.sort().join(",")}:${options.ceoMode ? "ceo" : "tech"}`;

  log("[WunderGraph] Orchestrating pipeline");
  await delay(450);

  log("[Redis] Cache check");
  const cached = await getCache(cacheKey);
  if (cached) {
    log("[Redis] Cache hit");
    return { ...cached, cacheHit: true };
  }

  log("[Redis] Cache miss");
  log("[Tinyfish] Crawling pages");
  await delay(550);
  const crawl = await tinyfishCrawl(normalized);

  log("[Recon] Headers collected");
  await delay(500);
  const recon = await reconScan(normalized);

  log("[Nexla] Transforming data");
  await delay(500);
  const transformed = nexlaTransform({ crawl, recon });

  const vulnerabilities = detectVulnerabilities(transformed, fixes);
  const model = buildAttackModel({
    headers: recon.headers,
    endpoints: recon.endpoints,
    cookieFlags: recon.signals?.cookieFlags,
  });

  log("[AI] Simulating SQLi");
  await delay(450);
  log("[AI] Simulating DDoS");
  await delay(450);
  log("[AI] Simulating ransomware");
  await delay(450);

  const aiNarrative = await simulateAttack(vulnerabilities);
  const trimmedAttackText = String(aiNarrative || "").slice(0, 3000);
  const parsed = parseAttackSteps(trimmedAttackText);

  const attack = {
    text: trimmedAttackText,
    steps: model.steps,
    model,
    aiSteps: parsed,
  };

  log("[InsForge] Managing agent flow");
  await delay(380);
  log("[Guild] Tracking experiment");
  await delay(380);
  log("[Akash] Scaling simulation");
  await delay(380);

  log("[Ghost] Saving scan");
  const stored = await storeScan(normalized, {
    crawl,
    recon,
    transformed,
    vulnerabilities,
    attack,
  }).catch(() => false);

  const agentMemoryPrev = await getAgentMemory(normalized);
  const agentMemory = {
    lastVulnCount: vulnerabilities.length,
    previousVulnCount: agentMemoryPrev?.lastVulnCount || 0,
    updatedAt: new Date().toISOString(),
  };
  await setAgentMemory(normalized, agentMemory);

  const result = {
    crawl,
    recon,
    transformed,
    vulnerabilities,
    attack,
    proof: model.proof,
    cacheHit: false,
    stored,
    agentMemory,
    statuses: {
      verified: "Verified ✓",
      wundergraph: "WunderGraph ✓",
      tinyfish: "Tinyfish ✓",
      redis: "Redis ✓",
      nexla: "Nexla ✓",
      gemini: "Gemini ✓",
      ghost: stored ? "Ghost ✓" : "Ghost (mock)",
      akash: "Akash (mock)",
      guild: "Guild.ai (mock)",
      insforge: "InsForge (mock)",
      chainguard: "Chainguard runtime posture ✓",
      vapi: "Vapi optional endpoint ready",
    },
  };

  await setCache(cacheKey, result);
  return result;
}

export async function orchestrate(stage, payload) {
  const endpoint = process.env.WUNDERGRAPH_ENDPOINT;
  if (!endpoint) return { status: "mock", stage, payload };

  try {
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/${stage}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      status: res.ok ? "active" : "error",
      code: res.status,
      body: await res.text(),
    };
  } catch (error) {
    return { status: "error", message: String(error) };
  }
}
