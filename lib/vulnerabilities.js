const CATALOG = {
  auth: {
    id: "weak-auth",
    title: "Weak Authentication Flow",
    severity: "critical",
    impact: "Account takeover and admin compromise",
    fix: "Enforce MFA and lockout policy",
  },
  apiKey: {
    id: "exposed-api-key",
    title: "API Key Exposure Pattern",
    severity: "high",
    impact: "Unauthorized API usage and data abuse",
    fix: "Move secrets to server-side env and rotate keys",
  },
  headers: {
    id: "missing-security-headers",
    title: "Missing Security Headers",
    severity: "medium",
    impact: "Increased XSS and clickjacking risk",
    fix: "Add CSP, X-Frame-Options, and HSTS",
  },
  sqli: {
    id: "sqli-risk",
    title: "SQL Injection Risk Pattern",
    severity: "critical",
    impact: "Database read/write compromise",
    fix: "Use parameterized queries and strict validation",
  },
};

export function detectVulnerabilities(recon, fixes = []) {
  const found = [];

  const hasLogin = recon.endpoints.some((e) => /login|auth|signin/i.test(e));
  const hasApi = recon.endpoints.some((e) => /api|graphql/i.test(e));

  if (hasLogin && !fixes.includes("fix-auth")) found.push(CATALOG.auth);
  if (hasApi && !fixes.includes("remove-api-key")) found.push(CATALOG.apiKey);
  found.push(CATALOG.headers);
  if (!fixes.includes("fix-auth")) found.push(CATALOG.sqli);

  return found;
}
