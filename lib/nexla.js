export function nexlaTransform(data) {
  const headers = data?.recon?.headers || {};
  const endpoints = data?.recon?.endpoints || [];

  const issues = [];
  if (!headers["content-security-policy"]) issues.push("Missing CSP");
  if (!headers["x-frame-options"]) issues.push("Missing X-Frame-Options");
  if (endpoints.some((e) => /login|auth/i.test(e))) issues.push("Auth endpoint exposed");
  if (endpoints.some((e) => /api/i.test(e))) issues.push("API surface exposed");

  return {
    issues,
    raw: data,
  };
}
