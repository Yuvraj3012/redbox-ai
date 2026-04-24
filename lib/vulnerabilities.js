function hasIssue(issues, pattern) {
  return issues.some((i) => pattern.test(i));
}

export function detectVulnerabilities(data, fixes = []) {
  const issues = data?.issues || [];
  const findings = [];

  if (hasIssue(issues, /Missing CSP/i)) {
    findings.push({ title: "Missing CSP", severity: "High", impact: "Higher reflected and DOM XSS blast radius" });
  }

  if (hasIssue(issues, /Auth endpoint exposed/i) && !fixes.includes("fix-auth")) {
    findings.push({ title: "Weak Authentication", severity: "Critical", impact: "Credential stuffing and auth bypass path" });
  }

  if (hasIssue(issues, /API surface exposed/i) && !fixes.includes("remove-api-key")) {
    findings.push({ title: "API Key Exposure Risk", severity: "High", impact: "Potential unauthorized API access" });
  }

  if (hasIssue(issues, /Missing X-Frame-Options/i)) {
    findings.push({ title: "Clickjacking Risk", severity: "Medium", impact: "UI redress and user action hijack" });
  }

  return findings;
}
