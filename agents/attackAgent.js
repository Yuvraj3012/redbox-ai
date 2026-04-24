export function attackAgentOutput(vulnerabilities, simulation) {
  const top = vulnerabilities.slice(0, 2).map((v) => v.title).join(" + ");
  return [
    { agent: "Exploit Agent", message: `Primary attack path uses ${top}.` },
    { agent: "Escalation Agent", message: simulation.steps[simulation.steps.length - 1]?.text || "Escalation path evaluated." },
  ];
}
