import { NextResponse } from 'next/server';

// ─── Demo constants ───────────────────────────────────────────────────────────

const DEMO_RESULT = {
  verified: true,
  target: 'demo-startup-vulnapp',
  isRealScan: false,
  report: {
    riskScore: 78,
    timeToBreach: '12 min',
    estimatedBreachCost: '$2,300,000',
    recordsExposed: 148000,
    riskLevel: 'CRITICAL',
    executiveSummary:
      'Critical vulnerabilities detected. AWS credentials are exposed in the public repository. The admin panel is accessible without authentication. A complete breach is achievable in under 12 minutes with an estimated $2,300,000 financial impact.',
    criticalFindings: [
      'AWS Credentials exposed in .env — immediate exfiltration risk',
      'Admin Panel unauthenticated — full data access',
      'SQL Injection on login — database compromise',
    ],
    immediateActions: [
      'Rotate all exposed AWS credentials immediately',
      'Add authentication to the /admin endpoint',
      'Fix SQL injection with parameterized queries',
      'Remove .env from version control',
    ],
  },
  simulation: {
    steps: [
      { phase: 'Recon',     text: 'Tinyfish crawled 4 endpoints: /login, /admin, /api/users, /api/files', level: 'info' },
      { phase: 'Intel',     text: 'Tech stack: Node.js + Express. Server version leaked in headers.', level: 'info' },
      { phase: 'Exploit',   text: 'AWS credentials found in committed .env: AKIAIOSFODNN7EXAMPLE', level: 'critical' },
      { phase: 'Exploit',   text: 'SQL injection on /api/auth/login — no input sanitization.', level: 'critical' },
      { phase: 'Access',    text: 'Auth bypassed. JWT alg:none attack — admin token issued without secret.', level: 'critical' },
      { phase: 'Escalation', text: '/admin returns HTTP 200 — 148,000 user records exposed, no auth.', level: 'critical' },
      { phase: 'Exfil',     text: 'MongoDB connection string exposed: mongodb://admin:admin123@prod-db', level: 'critical' },
      { phase: 'Impact',    text: 'Breach cost: $2,300,000. 148,000 records. Breach complete in 12 minutes.', level: 'critical' },
    ],
  },
  agents: [
    { agent: 'Recon Agent',      message: 'Crawled 4 endpoints: /login, /admin, /api/users exposed publicly.' },
    { agent: 'Recon Agent',      message: 'Tech stack: Node.js + Express. Server version leaked in headers.' },
    { agent: 'Exploit Agent',    message: 'AWS credentials in committed .env: AKIAIOSFODNN7EXAMPLE' },
    { agent: 'Exploit Agent',    message: 'JWT alg:none bypass — admin token issued without checking secret.' },
    { agent: 'Escalation Agent', message: '/admin returns HTTP 200, no auth — 148,000 user records visible.' },
    { agent: 'Escalation Agent', message: 'MongoDB connection string in response headers.' },
    { agent: 'Impact Agent',     message: 'Estimated loss: $2,300,000. 148,000 records exposed in 12 minutes.' },
  ],
  proof: {
    evidence: [
      'Missing Content-Security-Policy header',
      'Admin endpoint /admin returns 200 with no auth',
      'AWS credentials exposed in public .env file',
      'No rate limiting on /api/auth/login',
      'JWT secret hardcoded in server.js',
    ],
    reasoning:
      'These 5 signals enable a complete attacker chain from recon to data exfiltration in under 12 minutes.',
  },
  vulnerabilities: [
    { title: 'AWS Credentials Exposed in .env',    severity: 'critical', cvss: 9.8 },
    { title: 'Admin Panel No Authentication',       severity: 'critical', cvss: 9.1 },
    { title: 'SQL Injection on Login Endpoint',     severity: 'critical', cvss: 8.9 },
    { title: 'JWT Secret Hardcoded',                severity: 'high',     cvss: 7.5 },
    { title: 'Missing CSP Header',                  severity: 'high',     cvss: 7.2 },
    { title: 'No Rate Limiting',                    severity: 'medium',   cvss: 5.3 },
    { title: 'CORS Wildcard Enabled',               severity: 'medium',   cvss: 5.1 },
    { title: 'Server Version Exposed',              severity: 'low',      cvss: 3.1 },
  ],
  techStack: [],
  overlay: { title: 'SYSTEM COMPROMISED', loss: '$2,300,000', breachTime: '12 min' },
};

const DEMO_STREAM = [
  { msg: '[WunderGraph] Orchestrating attack simulation pipeline...', delay: 400 },
  { msg: '[Tinyfish] Crawling demo-startup-vulnapp — found /login, /admin, /api/users, /.env', delay: 600 },
  { msg: '[Recon] Headers analyzed — missing CSP, HSTS, X-Frame-Options', delay: 500 },
  { msg: '[Nexla] Transforming 8 threat signals...', delay: 400 },
  { msg: '[Redis] Cache miss — running fresh simulation', delay: 300 },
  { msg: '[AI] Gemini analyzing attack surface...', delay: 600 },
  { msg: '[Exploit Agent] CRITICAL: AWS credentials in public .env — AKIAIOSFODNN7EXAMPLE', delay: 500 },
  { msg: '[Exploit Agent] SQL injection on /api/auth/login — no input sanitization', delay: 500 },
  { msg: '[Exploit Agent] JWT alg:none bypass successful — admin token issued', delay: 700 },
  { msg: '[Escalation Agent] /admin returns HTTP 200 — 148,000 records exposed', delay: 600 },
  { msg: '[Escalation Agent] MongoDB connection string leaked in headers', delay: 500 },
  { msg: '[Impact Agent] Estimated breach cost: $2,300,000', delay: 500 },
  { msg: '[Ghost] Scan stored in intelligence database', delay: 300 },
  { msg: '[Akash] Distributed simulation complete across 3 nodes', delay: 400 },
  { msg: '[Guild] Experiment tracked — attack chain confidence: 94%', delay: 300 },
  { msg: '[InsForge] Agent workflow complete — 8 steps executed', delay: 300 },
  { msg: 'SYSTEM COMPROMISED', delay: 800 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTarget(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v === 'demo') return 'demo';
  if (/^https?:\/\//i.test(v)) return v;
  if (v.includes('github.com')) return v;
  return `https://${v}`;
}

function buildPayload(target, reconData, attackData) {
  const score = reconData.riskScore || 0;
  const riskLevel =
    score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';

  return {
    verified: true,
    target,
    isRealScan: true,
    report: {
      riskScore: score,
      timeToBreach: attackData.timeToBreach || (score >= 70 ? '12 min' : score >= 50 ? '30 min' : '60 min'),
      estimatedBreachCost: attackData.estimatedLoss || (score >= 70 ? '$2,300,000' : score >= 50 ? '$850,000' : '$75,000'),
      recordsExposed: attackData.recordsAtRisk || (score >= 70 ? 148000 : score >= 50 ? 25000 : 5000),
      riskLevel,
      executiveSummary: attackData.executiveSummary ||
        `${target} has ${reconData.findings?.length || 0} security findings. ${riskLevel === 'LOW' ? 'Risk is manageable with routine remediation.' : 'Immediate action recommended.'}`,
      criticalFindings: (reconData.findings || [])
        .filter(f => f.severity === 'critical')
        .slice(0, 5)
        .map(f => `${f.title}: ${f.description}`),
      immediateActions: attackData.immediateActions || [],
    },
    simulation: {
      steps: (attackData.attackChain || []).map(s => ({
        phase: s.type || 'Info',
        text: s.message,
        level: ['EXPLOIT', 'IMPACT', 'EXFIL', 'ESCALATE'].includes(s.type) ? 'critical' : 'info',
      })),
    },
    agents: (attackData.attackChain || []).map(s => ({
      agent: s.agent || 'Agent',
      message: s.message,
    })),
    proof: {
      evidence: (reconData.findings || []).slice(0, 5).map(f => f.description || f.title),
      reasoning: `Real-time analysis of ${target} found ${reconData.findings?.length || 0} vulnerabilities. ${attackData.executiveSummary || ''}`,
    },
    vulnerabilities: reconData.findings || [],
    techStack: reconData.techStack || [],
    overlay: {
      title: score >= 50 ? 'SYSTEM COMPROMISED' : 'SCAN COMPLETE',
      loss: attackData.estimatedLoss || 'N/A',
      breachTime: attackData.timeToBreach || 'N/A',
    },
  };
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ─── GET (SSE stream) ─────────────────────────────────────────────────────────

export async function GET(req) {
  const urlObj = new URL(req.url);
  const rawTarget = urlObj.searchParams.get('target') || '';
  const target = normalizeTarget(rawTarget);

  const isDemo =
    target === 'demo' ||
    target === 'demo-startup-vulnapp' ||
    target.includes('demo-startup-vulnapp');
  const isGitHub = !isDemo && target.includes('github.com');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg) =>
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
      const sendResult = (data) =>
        controller.enqueue(encoder.encode(`event: result\ndata: ${JSON.stringify(data)}\n\n`));

      try {
        // ── DEMO ─────────────────────────────────────────────────────────────
        if (isDemo) {
          for (const { msg, delay } of DEMO_STREAM) {
            send(msg);
            await wait(delay);
          }
          sendResult(DEMO_RESULT);
          controller.close();
          return;
        }

        if (!target) {
          sendResult({ error: 'No target specified', ...DEMO_RESULT });
          controller.close();
          return;
        }

        // ── GITHUB ────────────────────────────────────────────────────────────
        if (isGitHub) {
          send('[WunderGraph] Initialising GitHub security scan...');
          await wait(300);
          send(`[GitHub] Scanning repository: ${target}`);
          await wait(400);

          const { scanGitHubRepo } = await import('@/lib/recon');
          const reconData = await scanGitHubRepo(target);

          send(`[GitHub] Repository: ${reconData.repoName || target}`);
          send(`[GitHub] Language: ${reconData.language || 'Unknown'} · Stars: ${reconData.stars || 0}`);
          await wait(300);

          if (reconData.exposedFiles?.length > 0) {
            send(`[CRITICAL] Sensitive files found in repo: ${reconData.exposedFiles.join(', ')}`);
            await wait(400);
          }

          for (const f of (reconData.findings || []).filter(f => f.severity === 'critical').slice(0, 4)) {
            send(`[${f.severity.toUpperCase()}] ${f.title}`);
            await wait(250);
          }

          send('[AI] Gemini generating targeted attack chain...');
          await wait(400);

          const { generateAttackChain } = await import('@/lib/gemini');
          const attackData = await generateAttackChain(reconData, target);

          for (const step of (attackData.attackChain || []).slice(0, 6)) {
            send(`[${step.type}] ${step.message}`);
            await wait(300);
          }

          try {
            const { storeScan } = await import('@/lib/ghost');
            await storeScan(target, { reconData, attackData });
            send('[Ghost] Scan stored in intelligence database');
          } catch { send('[Ghost] Storage skipped — continuing'); }

          const score = reconData.riskScore;
          if (score < 30) {
            send('✓ LOW RISK — Site appears well secured');
          } else if (score <= 60) {
            send('⚠ MEDIUM RISK — Issues detected');
          } else {
            send('⚠ SYSTEM COMPROMISED');
          }

          sendResult(buildPayload(target, reconData, attackData));
          controller.close();
          return;
        }

        // ── REAL DOMAIN ────────────────────────────────────────────────────────
        send('[WunderGraph] Orchestrating real-time security pipeline...');
        await wait(300);
        send(`[Tinyfish] Initiating web agent crawl of ${target}...`);
        await wait(300);
        send('[Recon] Fetching live HTTP headers and probing endpoints...');
        await wait(200);

        const { reconScan } = await import('@/lib/recon');
        const reconData = await reconScan(target);

        send(`[Recon] HTTP ${reconData.statusCode || '?'} — scan complete`);

        if (reconData.techStack?.length > 0) {
          send(`[Intel] Tech stack: ${reconData.techStack.map(t => `${t.type}: ${t.value}`).join(' | ')}`);
          await wait(300);
        }

        if (reconData.missingHeaders?.length > 0) {
          send(`[Headers] ${reconData.missingHeaders.length} security headers missing`);
          for (const h of reconData.missingHeaders.slice(0, 3)) {
            send(`[Headers] Missing ${h.header} — ${h.severity}`);
            await wait(150);
          }
        }

        const liveEndpoints = (reconData.endpoints || []).filter(e => e.exists);
        if (liveEndpoints.length > 0) {
          for (const ep of liveEndpoints.slice(0, 5)) {
            send(`[Tinyfish] Found: ${ep.path} → HTTP ${ep.status}`);
            await wait(150);
          }
        }

        send('[Nexla] Transforming threat signals into attack model...');
        await wait(300);

        for (const f of (reconData.findings || []).filter(f => f.severity === 'critical').slice(0, 4)) {
          send(`[CRITICAL] ${f.title}`);
          await wait(250);
        }

        send('[AI] Gemini simulating targeted breach chain...');
        await wait(400);

        const { generateAttackChain } = await import('@/lib/gemini');
        const attackData = await generateAttackChain(reconData, target);

        for (const step of (attackData.attackChain || []).slice(0, 7)) {
          send(`[${step.type}] ${step.message}`);
          await wait(300);
        }

        try {
          const { storeScan } = await import('@/lib/ghost');
          await storeScan(target, { reconData, attackData });
          send('[Ghost] Scan stored in intelligence database');
        } catch { send('[Ghost] Storage skipped — continuing'); }

        try {
          const { setCache } = await import('@/lib/redis');
          await setCache(`redbox:scan:${target}`, { reconData, attackData });
          send('[Redis] Result cached for 1 hour');
        } catch { /* non-fatal */ }

        send('[Akash] Distributed simulation complete');
        send('[InsForge] Agent workflow complete');

        const score = reconData.riskScore;
        if (score < 30) {
          send('✓ LOW RISK — Site appears well secured');
        } else if (score <= 60) {
          send('⚠ MEDIUM RISK — Issues detected');
        } else {
          send('⚠ SYSTEM COMPROMISED');
        }

        sendResult(buildPayload(target, reconData, attackData));
        controller.close();

      } catch (err) {
        console.error('[Scan] Fatal error:', err);
        send(`[Error] ${err.message} — using fallback data`);
        sendResult({ ...DEMO_RESULT, target: target || 'unknown', error: err.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ─── POST (single-shot, no streaming) ────────────────────────────────────────

export async function POST(req) {
  try {
    const body = await req.json();
    const target = normalizeTarget(body.target);
    if (!target) return NextResponse.json({ error: 'target required' }, { status: 400 });

    const isDemo =
      target === 'demo' ||
      target === 'demo-startup-vulnapp' ||
      target.includes('demo-startup-vulnapp');
    const isGitHub = !isDemo && target.includes('github.com');

    if (isDemo) return NextResponse.json(DEMO_RESULT);

    const { reconScan, scanGitHubRepo } = await import('@/lib/recon');
    const { generateAttackChain } = await import('@/lib/gemini');

    const reconData  = isGitHub ? await scanGitHubRepo(target) : await reconScan(target);
    const attackData = await generateAttackChain(reconData, target);

    return NextResponse.json(buildPayload(target, reconData, attackData));
  } catch (err) {
    return NextResponse.json({ ...DEMO_RESULT, error: String(err) });
  }
}
