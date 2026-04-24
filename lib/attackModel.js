function hasLogin(signals) {
  return (signals?.endpoints || []).some((e) => /login|auth|signin/i.test(e));
}

function weakPatterns(signals) {
  const missingCsp = !signals?.headers?.["content-security-policy"];
  const weakCookies = !signals?.cookieFlags?.secure || !signals?.cookieFlags?.httpOnly;
  return missingCsp || weakCookies;
}

function sensitivePaths(signals) {
  return (signals?.endpoints || []).some((e) => /admin|backup|db|storage|api/i.test(e));
}

export function simulateSQLi(signals) {
  if (hasLogin(signals) && weakPatterns(signals)) {
    return "SQL Injection possible -> auth bypass risk";
  }
  return "SQLi risk reduced by current surface signals";
}

export function simulateDDoS(signals) {
  const endpointCount = (signals?.endpoints || []).length;
  const estimatedCapacity = Math.max(80, 220 - endpointCount * 8);
  const overloadSec = Math.max(8, Math.round(estimatedCapacity / 20));
  return `High traffic could overwhelm server in ${overloadSec} seconds`;
}

export function simulateRansomware(signals) {
  if (sensitivePaths(signals)) {
    return "Data encryption risk via compromised access";
  }
  return "Ransomware path limited by exposed surfaces";
}

export function buildAttackModel(signals) {
  const sql = simulateSQLi(signals);
  const ddos = simulateDDoS(signals);
  const ransomware = simulateRansomware(signals);

  const evidence = [];
  if (!signals?.headers?.["content-security-policy"]) evidence.push("Missing CSP header");
  if (hasLogin(signals)) evidence.push("Login endpoint exposed");
  if (!signals?.headers?.["x-ratelimit-limit"] && !signals?.headers?.["ratelimit-limit"]) {
    evidence.push("No rate limiting detected");
  }

  const steps = [
    { step: 1, type: "Recon", message: "Found login endpoint" },
    { step: 2, type: "SQLi (simulated)", message: sql.includes("possible") ? "Auth bypass likely" : sql },
    { step: 3, type: "DDoS (simulated)", message: ddos },
    { step: 4, type: "Impact", message: ransomware.includes("risk") ? "Data exposure possible" : ransomware },
  ];

  return {
    sql,
    ddos,
    ransomware,
    steps,
    proof: {
      evidence: evidence.length > 0 ? evidence : ["Core hardening headers present"],
      reasoning: "These signals enable attacker chain",
    },
  };
}
