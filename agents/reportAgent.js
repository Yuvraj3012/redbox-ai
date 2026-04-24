export function reportAgentOutput(report) {
  return [
    { agent: "Impact Agent", message: `Estimated business loss: ${report.estimatedBreachCost}` },
    { agent: "Impact Agent", message: `Risk score ${report.riskScore} (${report.riskLevel})` },
  ];
}
