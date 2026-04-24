import { Pool } from "pg";
import { askGemini } from "./gemini";

let pool;

function getPool() {
  const url = process.env.GHOST_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) return null;
  if (!pool) pool = new Pool({ connectionString: url });
  return pool;
}

export async function saveAttackLog(payload) {
  const db = getPool();
  if (!db) return false;

  await db.query(`
    CREATE TABLE IF NOT EXISTS redbox_attack_logs (
      id SERIAL PRIMARY KEY,
      target TEXT,
      payload JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(
    `INSERT INTO redbox_attack_logs (target, payload) VALUES ($1, $2::jsonb)`,
    [payload.target, JSON.stringify(payload)]
  );

  return true;
}

export async function buildReport({ target, vulnerabilities, simulation, ceoMode = false }) {
  const criticalFindings = vulnerabilities
    .filter((v) => v.severity === "critical" || v.severity === "high")
    .map((v) => `${v.title}: ${v.impact}`);

  const riskScore = Math.min(100, 35 + vulnerabilities.length * 11);
  const riskLevel = riskScore >= 75 ? "Critical" : riskScore >= 55 ? "High" : "Moderate";

  const estimatedBreachCost = `$${(riskScore * 30000).toLocaleString()}`;

  const fallbackSummary = ceoMode
    ? "Your startup has a high likelihood of a costly breach if these weaknesses remain unpatched."
    : "Attack chain demonstrates likely path from recon to simulated data exfiltration through auth and input flaws.";

  const executiveSummary = await askGemini(
    `Generate a concise ${ceoMode ? "business" : "technical"} executive summary for target ${target}. findings=${JSON.stringify(criticalFindings)} simulation=${JSON.stringify(simulation.steps)}`,
    fallbackSummary
  );

  return {
    executiveSummary,
    riskScore,
    riskLevel,
    criticalFindings,
    actions: vulnerabilities.map((v) => v.fix),
    estimatedBreachCost,
    timeToBreach: `${Math.max(6, 28 - vulnerabilities.length * 3)} min`,
    recordsExposed: Math.max(8000, vulnerabilities.length * 21000),
  };
}
