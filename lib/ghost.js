import { getPool } from "./infra";

async function ensureRedboxTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS redbox_scans (
      id SERIAL PRIMARY KEY,
      target TEXT,
      risk_score INTEGER,
      findings JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  // Keep legacy table for history queries
  await db.query(`
    CREATE TABLE IF NOT EXISTS redbox_scan_history (
      id SERIAL PRIMARY KEY,
      target TEXT,
      data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

export async function storeScan(target, data) {
  try {
    const db = getPool();
    if (!db) {
      console.log('[Ghost] No DB — scan not persisted');
      return false;
    }

    await ensureRedboxTable(db);

    const riskScore = data?.report?.riskScore ?? data?.riskScore ?? 0;
    const findings = data?.vulnerabilities ?? data?.findings ?? [];

    await Promise.all([
      db.query(
        'INSERT INTO redbox_scans (target, risk_score, findings) VALUES ($1, $2, $3::jsonb)',
        [target, riskScore, JSON.stringify(findings)]
      ),
      db.query(
        'INSERT INTO redbox_scan_history (target, data) VALUES ($1, $2::jsonb)',
        [target, JSON.stringify(data)]
      ),
    ]);

    console.log('[Ghost] Scan stored');
    return true;
  } catch (err) {
    console.warn('[Ghost] Store failed (non-fatal):', err.message);
    return false;
  }
}

export async function getScanHistory(limit = 12) {
  try {
    const db = getPool();
    if (!db) return [];

    await ensureRedboxTable(db);

    const { rows } = await db.query(
      'SELECT id, target, created_at FROM redbox_scan_history ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return rows;
  } catch (err) {
    console.warn('[Ghost] History query failed (non-fatal):', err.message);
    return [];
  }
}

export async function pingGhost() {
  try {
    const db = getPool();
    if (!db) return false;
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
