"use client";

import { useMemo, useState } from "react";
import TerminalPlayback from "./components/TerminalPlayback";
import MetricsPanel from "./components/MetricsPanel";
import AttackGraph from "./components/AttackGraph";
import AgentChat from "./components/AgentChat";

export default function Page() {
  const [target, setTarget] = useState("");
  const [running, setRunning] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [ceoMode, setCeoMode] = useState(false);
  const [fixes, setFixes] = useState([]);

  const progress = useMemo(() => (running ? 0.55 : 1), [running]);

  async function runSimulation(overrideTarget) {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: overrideTarget || target,
          ceoMode,
          fixes,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Scan failed");
      setData(payload);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  function toggleFix(flag) {
    setFixes((prev) => (prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]));
  }

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">RedBox AI</h1>
          <p className="text-neutral-400 mt-2">See how your startup gets hacked in seconds</p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Enter owned domain or GitHub repo"
              className="flex-1 rounded-lg border border-neutral-700 bg-black px-4 py-3 text-sm"
            />
            <button onClick={() => runSimulation()} disabled={running || !target} className="rounded-lg bg-[#FF3B3B] px-5 py-3 text-sm font-medium hover:bg-red-500 disabled:bg-neutral-700">
              {running ? "Running..." : "Run Simulation"}
            </button>
            <button onClick={() => runSimulation("demo")} disabled={running} className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-medium hover:bg-neutral-800">
              Demo Mode
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <button onClick={() => setCeoMode((v) => !v)} className={`rounded-md px-3 py-1 border ${ceoMode ? "border-[#22C55E] text-[#22C55E]" : "border-neutral-700 text-neutral-300"}`}>
              CEO Mode: {ceoMode ? "Business" : "Technical"}
            </button>
            <button onClick={() => toggleFix("fix-auth")} className={`rounded-md px-3 py-1 border ${fixes.includes("fix-auth") ? "border-[#22C55E] text-[#22C55E]" : "border-neutral-700 text-neutral-300"}`}>
              Fix auth
            </button>
            <button onClick={() => toggleFix("remove-api-key")} className={`rounded-md px-3 py-1 border ${fixes.includes("remove-api-key") ? "border-[#22C55E] text-[#22C55E]" : "border-neutral-700 text-neutral-300"}`}>
              Remove API key
            </button>
            <button onClick={() => runSimulation()} disabled={running || !target} className="rounded-md px-3 py-1 border border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              Re-run Simulation
            </button>
          </div>

          {error && <p className="text-[#FF3B3B] text-sm mt-3">{error}</p>}
        </section>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 space-y-4">
            <TerminalPlayback steps={data?.simulation?.steps || []} playing={Boolean(data)} />
            <AttackGraph active={Math.min(4, data?.simulation?.steps?.length ? data.simulation.steps.length - 1 : 0)} />
            <AgentChat messages={data?.agents || []} />
          </div>

          <div className="xl:col-span-2 space-y-4">
            <MetricsPanel report={data?.report} progress={progress} />

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">Executive Summary</h3>
              <p className="text-sm text-neutral-200 whitespace-pre-wrap">{data?.report?.executiveSummary || "Run a simulation to generate an AI-backed security briefing."}</p>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">Sponsor Integrations</h3>
              <ul className="space-y-1 text-xs text-neutral-300">
                {Object.entries(data?.statuses || {}).map(([k, v]) => (
                  <li key={k}>• {v}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-neutral-800 pt-5 text-xs text-neutral-500">
          Built for safe simulation only. No real attack execution. Runtime secured with Chainguard-compatible deployment posture.
        </footer>
      </div>
    </main>
  );
}
