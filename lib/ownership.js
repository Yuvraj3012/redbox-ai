function normalizeTarget(target) {
  const value = String(target || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.includes("github.com")) return value;
  return `https://${value}`;
}

function looksLikeRepo(target) {
  return /github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i.test(target);
}

export async function verifyOwnership(target) {
  const normalized = normalizeTarget(target);
  if (!normalized) return { verified: false, method: "none", reason: "Missing target" };

  if (looksLikeRepo(normalized)) {
    const verified = /owner|demo|verified/i.test(normalized);
    return {
      verified,
      method: "github-oauth-mock",
      reason: verified
        ? "Mock GitHub OAuth confirmed repo ownership"
        : "Mock GitHub OAuth could not confirm ownership",
    };
  }

  const host = new URL(normalized).hostname;
  const verified = /demo|localhost|example|verified/i.test(host);
  return {
    verified,
    method: "dns-txt-mock",
    reason: verified
      ? `Mock DNS TXT token found for ${host}`
      : `Mock DNS TXT token missing for ${host}`,
  };
}
