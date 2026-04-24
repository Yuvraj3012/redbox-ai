"use client";

import { useMemo } from "react";

function riskColor(score) {
  if (score >= 75) return "text-[#FF3B3B]";
  if (score >= 50) return "text-[#FF8C42]";
  return "text-[#22C55E]";
}

export default function MetricsPanel({ report, progress = 1 }) {
  const risk = Math.round((report?.riskScore || 0) * progress);
  const lossRaw = Number(String(report?.estimatedBreachCost || "$0").replace(/[^0-9]/g, ""));
  const loss = Math.round(lossRaw * progress);
  const records = Math.round((report?.recordsExposed || 0) * progress);

  const cards = useMemo(
    () => [
      { label: "Risk Score", value: risk, cls: riskColor(risk) },
      { label: "Time to Breach", value: report?.timeToBreach || "--", cls: "text-white" },
      { label: "Estimated Loss", value: `$${loss.toLocaleString()}`, cls: "text-[#FF8C42]" },
      { label: "Records Exposed", value: records.toLocaleString(), cls: "text-[#FF3B3B]" },
    ],
    [risk, report, loss, records]
  );

  return (
    <div className="grid grid-cols-1 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">{c.label}</p>
          <p className={`mt-2 text-3xl font-semibold ${c.cls}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
