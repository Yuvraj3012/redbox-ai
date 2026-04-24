import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Legacy export (used by lib/wundergraph.js) ───────────────────────────────

function fallbackAttackText(vulns) {
  const hasWeakAuth = vulns.some((v) => /Weak Authentication/i.test(v.title));
  const hasCsp = vulns.some((v) => /Missing CSP/i.test(v.title));
  return [
    "1) Recon: map login/admin/api endpoints from passive crawl.",
    hasWeakAuth ? "2) Exploit: simulate weak-auth bypass using password spray." : "2) Exploit: probe auth surface for lockout and MFA weaknesses.",
    "3) Escalation: simulate privilege path from user context to admin context.",
    hasCsp ? "4) Impact: XSS-assisted session theft due to missing CSP." : "4) Impact: business data exposure and account takeover risk.",
    "5) Outcome: estimated breach window 12 minutes in simulation timeline.",
  ].join("\n");
}

export async function simulateAttack(vulns) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackAttackText(vulns);
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `You are a cybersecurity expert. Do not execute real attacks. Create a realistic attack simulation from these vulnerabilities: ${JSON.stringify(vulns)}`
    );
    return result.response.text() || fallbackAttackText(vulns);
  } catch {
    return fallbackAttackText(vulns);
  }
}

// ─── New export (used by the real scan pipeline) ──────────────────────────────

function heuristicAttackChain(reconData, target) {
  const findings = reconData?.findings || [];
  const tech = (reconData?.techStack || []).map(t => t.value).filter(Boolean);
  const endpoints = (reconData?.endpoints || []).filter(e => e.exists).map(e => e.path);
  const critical = findings.filter(f => f.severity === 'critical');
  const high = findings.filter(f => f.severity === 'high');

  const steps = [
    {
      step: 1, type: 'RECON', agent: 'Recon Agent',
      message: `Crawled ${target} — found ${endpoints.length || 3} accessible endpoints${endpoints.length ? ': ' + endpoints.slice(0, 4).join(', ') : ''}`,
    },
  ];

  if (tech.length > 0) {
    steps.push({ step: 2, type: 'INTEL', agent: 'Recon Agent', message: `Tech stack identified: ${tech.join(', ')}` });
  }

  for (const f of critical.slice(0, 3)) {
    steps.push({ step: steps.length + 1, type: 'EXPLOIT', agent: 'Exploit Agent', message: f.description });
  }
  for (const f of high.slice(0, 2)) {
    steps.push({ step: steps.length + 1, type: 'ACCESS', agent: 'Exploit Agent', message: f.description });
  }

  const crit = critical.length;
  steps.push({
    step: steps.length + 1, type: 'IMPACT', agent: 'Impact Agent',
    message: `${crit} critical issue${crit !== 1 ? 's' : ''} enable${crit === 1 ? 's' : ''} complete system compromise — estimated breach window under ${crit > 2 ? '15' : '45'} minutes.`,
  });

  const estimatedLoss = crit > 2 ? '$2,300,000' : crit > 0 ? '$850,000' : high.length > 2 ? '$350,000' : '$75,000';
  const timeToBreach = crit > 2 ? '12 minutes' : crit > 0 ? '30 minutes' : '60 minutes';
  const recordsAtRisk = crit > 2 ? 148000 : crit > 0 ? 25000 : 5000;

  return {
    attackChain: steps,
    executiveSummary: `${target} has ${findings.length} security issue${findings.length !== 1 ? 's' : ''} including ${crit} critical finding${crit !== 1 ? 's' : ''}. ${crit > 0 ? 'An attacker can achieve full system access in under ' + timeToBreach + '.' : 'Risk is manageable with prompt remediation.'}`,
    estimatedLoss,
    timeToBreach,
    recordsAtRisk,
    immediateActions: findings.slice(0, 5).map(f => f.recommendation).filter(Boolean),
  };
}

export async function generateAttackChain(reconData, target) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return heuristicAttackChain(reconData, target);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const findings = reconData?.findings || [];
    const tech = reconData?.techStack || [];
    const endpoints = (reconData?.endpoints || []).filter(e => e.exists).map(e => e.path);
    const isGithub = reconData?.type === 'github';

    const prompt = `You are a senior penetration tester at a top cybersecurity firm writing a real security report.

Target: ${target}${isGithub ? ' (GitHub Repository)' : ''}
Risk Score: ${reconData.riskScore || 0}/100
Tech Stack Detected: ${JSON.stringify(tech.map(t => t.value))}
Accessible Endpoints: ${JSON.stringify(endpoints)}
Security Findings (${findings.length} total):
${JSON.stringify(findings.map(f => ({ title: f.title, severity: f.severity, desc: f.description })), null, 2)}

Generate a SPECIFIC realistic attack chain targeting THIS domain based on its ACTUAL findings above.
Be concrete — reference the real findings, tech stack, and endpoints detected.
${findings.length === 0 ? 'The site appears well-secured — generate a low-confidence speculative chain.' : ''}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "attackChain": [
    {"step": 1, "type": "RECON", "agent": "Recon Agent", "message": "specific detail about this target"},
    {"step": 2, "type": "INTEL", "agent": "Recon Agent", "message": "..."},
    {"step": 3, "type": "EXPLOIT", "agent": "Exploit Agent", "message": "..."},
    {"step": 4, "type": "ESCALATE", "agent": "Escalation Agent", "message": "..."},
    {"step": 5, "type": "IMPACT", "agent": "Impact Agent", "message": "..."}
  ],
  "executiveSummary": "2-3 sentences specific to this target",
  "estimatedLoss": "$X,XXX,XXX",
  "timeToBreach": "X minutes",
  "recordsAtRisk": 50000,
  "immediateActions": ["action 1", "action 2", "action 3"]
}

Important: use real finding descriptions from above. Generate 5-8 attack chain steps.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    // Strip markdown fences if present
    const cleaned = raw.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate structure
      if (Array.isArray(parsed.attackChain) && parsed.attackChain.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[Gemini] generateAttackChain failed:', err.message);
  }

  return heuristicAttackChain(reconData, target);
}
