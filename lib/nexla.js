export function transformForDashboard(input) {
  const steps = input.simulation.steps || [];
  const critical = input.vulnerabilities.filter((v) => v.severity === "critical").length;
  const high = input.vulnerabilities.filter((v) => v.severity === "high").length;
  const medium = input.vulnerabilities.filter((v) => v.severity === "medium").length;

  return {
    transformedBy: "Nexla",
    metrics: {
      critical,
      high,
      medium,
      stepCount: steps.length,
    },
    timeline: steps.map((s, idx) => ({ id: idx + 1, ...s })),
  };
}
