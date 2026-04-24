export function reconAgentOutput(recon) {
  return [
    { agent: "Recon Agent", message: `Found ${recon.endpoints.length} endpoints and mapped attack surface.` },
    { agent: "Recon Agent", message: `Tech stack signals: ${recon.techStack.join(", ")}` },
  ];
}
