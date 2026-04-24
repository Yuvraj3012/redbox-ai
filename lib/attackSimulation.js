import { simulateAttack } from "./gemini";

function toSteps(text) {
  return String(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => ({
      phase: /recon/i.test(line)
        ? "Recon"
        : /exploit|sqli|xss|inject/i.test(line)
        ? "Exploit"
        : /escalat|admin|privilege/i.test(line)
        ? "Escalation"
        : /impact|loss|data|breach/i.test(line)
        ? "Impact"
        : "Access",
      text: line,
      level: /critical|breach|bypass/i.test(line) ? "critical" : /high|escalat/i.test(line) ? "high" : "info",
    }));
}

export async function generateAttackSimulation({ vulnerabilities }) {
  const text = await simulateAttack(vulnerabilities || []);
  return {
    steps: toSteps(text),
    explanation: text,
  };
}
