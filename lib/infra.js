import { Pool } from "pg";
import Redis from "ioredis";

let pool;
let redis;

export function getPool() {
  if (!process.env.GHOST_DATABASE_URL && !process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.GHOST_DATABASE_URL || process.env.DATABASE_URL,
      ssl:
        process.env.GHOST_DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }
  return pool;
}

export async function ensureTables() {
  const db = getPool();
  if (!db) return false;
  await db.query(`
    CREATE TABLE IF NOT EXISTS codebase_scans (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255),
      findings JSONB,
      severity_counts JSONB,
      scanned_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS domain_attacks (
      id SERIAL PRIMARY KEY,
      domain VARCHAR(255),
      report JSONB,
      risk_score INTEGER,
      scanned_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS attack_runs (
      id SERIAL PRIMARY KEY,
      target VARCHAR(255),
      report JSONB,
      scanned_at TIMESTAMP DEFAULT NOW()
    );
  `);
  return true;
}

export async function saveCodebaseScan({ filename, findings, severityCounts }) {
  const db = getPool();
  if (!db) return;
  await ensureTables();
  await db.query(
    `INSERT INTO codebase_scans (filename, findings, severity_counts) VALUES ($1, $2::jsonb, $3::jsonb)`,
    [filename, JSON.stringify(findings), JSON.stringify(severityCounts)]
  );
}

export async function saveDomainAttack({ domain, report, riskScore }) {
  const db = getPool();
  if (!db) return;
  await ensureTables();
  await db.query(
    `INSERT INTO domain_attacks (domain, report, risk_score) VALUES ($1, $2::jsonb, $3)`,
    [domain, JSON.stringify(report), riskScore]
  );
}

export async function saveAttackRun({ target, report }) {
  const db = getPool();
  if (!db) return;
  await ensureTables();
  await db.query(`INSERT INTO attack_runs (target, report) VALUES ($1, $2::jsonb)`, [
    target,
    JSON.stringify(report),
  ]);
}

export function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redis.connect().catch(() => {});
  }
  return redis;
}

export async function cacheGet(key) {
  const client = getRedis();
  if (!client) return null;
  const raw = await client.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function cacheSet(key, value, ttlSeconds = 3600) {
  const client = getRedis();
  if (!client) return false;
  await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  return true;
}

export async function runWunderGraphOperation(operation, payload) {
  const endpoint = process.env.WUNDERGRAPH_ENDPOINT;
  if (!endpoint) {
    return {
      passthrough: true,
      operation,
      payload,
      status: "WUNDERGRAPH_NOT_CONFIGURED",
    };
  }

  const url = `${endpoint.replace(/\/$/, "")}/${operation}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  return {
    passthrough: false,
    operation,
    ok: res.ok,
    status: res.status,
    body: text,
  };
}
