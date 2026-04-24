import { GoogleGenerativeAI } from "@google/generative-ai";

async function maybeBusinessSummary(target, vulnerabilities, attack, ceoMode) {
  const fallback = ceoMode
    ? "Business impact: the current attack path enables rapid compromise with material financial and customer trust risk."
    : "Technical impact: passive recon plus security gaps creates a realistic compromise chain from login surface to data exposure.";

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Create a concise ${ceoMode ? "business" : "technical"} executive summary for ${target}. vulnerabilities=${JSON.stringify(
      vulnerabilities
    )} attack=${JSON.stringify(attack?.steps || [])}`;
    const out = await model.generateContent(prompt);
    return out.response.text() || fallback;
  } catch {
    return fallback;
  }
}

export async function buildReport({ target, vulnerabilities, attack, ceoMode = false }) {
  const critical = vulnerabilities.filter((v) => /critical/i.test(v.severity)).length;
  const high = vulnerabilities.filter((v) => /high/i.test(v.severity)).length;

  const riskScore = Math.min(100, 40 + critical * 22 + high * 12 + vulnerabilities.length * 5);
  const riskLevel = riskScore >= 75 ? "Critical" : riskScore >= 55 ? "High" : "Moderate";

  const estimatedLossNumber = 900000 + riskScore * 17000;
  const estimatedBreachCost = `$${Math.round(estimatedLossNumber).toLocaleString()}`;

  const executiveSummary = await maybeBusinessSummary(target, vulnerabilities, attack, ceoMode);

  return {
    executiveSummary,
    riskScore,
    riskLevel,
    criticalFindings: vulnerabilities.map((v) => `${v.title}: ${v.impact}`),
    actions: [
      "Harden authentication with MFA and lockout controls",
      "Add CSP + X-Frame-Options + strict header baseline",
      "Rotate exposed secrets and isolate API credentials",
      "Add continuous scan gating before deploy",
    ],
    estimatedBreachCost,
    timeToBreach: `${Math.max(8, 18 - critical * 3)} min`,
    recordsExposed: Math.max(14000, vulnerabilities.length * 28000),
  };
}
