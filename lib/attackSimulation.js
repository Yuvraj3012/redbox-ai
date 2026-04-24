import { askGemini } from "./gemini";

const BASE_STEPS = [
  { phase: "Recon", text: "Scanning target surface and endpoint map...", level: "info" },
  { phase: "Recon", text: "Found /login and /api endpoints with exposed metadata.", level: "info" },
  { phase: "Exploit", text: "Simulated SQL injection path identified in auth flow.", level: "critical" },
  { phase: "Access", text: "Simulated auth bypass grants admin session token.", level: "critical" },
  { phase: "Escalation", text: "Privilege escalation reaches sensitive database tables.", level: "high" },
  { phase: "Impact", text: "Data exfiltration path possible in under 18 minutes.", level: "critical" },
];

export async function generateAttackSimulation({ target, vulnerabilities, ceoMode = false }) {
  const simulatedSteps = BASE_STEPS.filter((step) => {
    if (vulnerabilities.some((v) => v.id === "sqli-risk")) return true;
    return !/SQL|auth bypass|database/i.test(step.text);
  });

  const fallback = ceoMode
    ? "Business summary: attacker could move from login to sensitive data rapidly if controls remain weak."
    : "Technical summary: chain indicates SQLi -> auth bypass -> privilege escalation -> data exposure.";

  const explanation = await askGemini(
    `You are a cybersecurity expert simulating an attack safely. Explain this attack chain for ${target}. vulnerabilities=${JSON.stringify(vulnerabilities)} ceoMode=${ceoMode}`,
    fallback
  );

  return { steps: simulatedSteps, explanation };
}
