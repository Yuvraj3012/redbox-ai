"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TerminalPlayback from "./components/TerminalPlayback";
import MetricsPanel from "./components/MetricsPanel";
import AttackGraph from "./components/AttackGraph";
import AgentChat from "./components/AgentChat";
import InputBox from "./components/InputBox";

// ─── Overlays ─────────────────────────────────────────────────────────────────

const CompromisedOverlay = ({ show, onDismiss, report }) => {
  if (!show) return null;
  const loss    = report?.estimatedBreachCost || '$2,300,000';
  const time    = report?.timeToBreach        || '12 min';
  const records = report?.recordsExposed;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, animation: 'overlayFadeIn 0.5s ease',
    }}>
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#e63946', fontWeight: '700', marginBottom: '16px' }}>
          ████ SECURITY BREACH DETECTED ████
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', color: '#e63946', letterSpacing: '-2px', lineHeight: 1, animation: 'redPulse 1s infinite' }}>
          SYSTEM
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', color: '#ff4444', letterSpacing: '-2px', lineHeight: 1, marginBottom: '40px' }}>
          COMPROMISED
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px', padding: '0 40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#ff4444' }}>{loss}</div>
            <div style={{ fontSize: '12px', color: '#666', letterSpacing: '2px', marginTop: '4px' }}>ESTIMATED LOSS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#ff6600' }}>{time}</div>
            <div style={{ fontSize: '12px', color: '#666', letterSpacing: '2px', marginTop: '4px' }}>TIME TO BREACH</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: '900', color: '#ffaa00' }}>
              {records ? records.toLocaleString() : '148,000'}
            </div>
            <div style={{ fontSize: '12px', color: '#666', letterSpacing: '2px', marginTop: '4px' }}>RECORDS EXPOSED</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button onClick={onDismiss} style={{ background: 'transparent', border: '1px solid #e63946', color: '#e63946', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', letterSpacing: '2px' }}>
            VIEW FULL REPORT
          </button>
          <button onClick={onDismiss} style={{ background: '#e63946', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', letterSpacing: '2px' }}>
            FIX VULNERABILITIES →
          </button>
        </div>
      </div>
    </div>
  );
};

const LowRiskBanner = ({ show, onDismiss, score }) => {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: '#052e16', border: '1px solid #166534',
      borderRadius: '12px', padding: '16px 24px',
      zIndex: 1000, animation: 'overlayFadeIn 0.4s ease',
      maxWidth: '340px',
    }}>
      <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
        ✓ LOW RISK DETECTED
      </div>
      <div style={{ color: '#86efac', fontSize: '13px', marginBottom: '12px' }}>
        Risk score: {score}/100 — no critical vulnerabilities found. Review findings below.
      </div>
      <button onClick={onDismiss} style={{ background: 'transparent', border: '1px solid #166534', color: '#22c55e', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>
        DISMISS
      </button>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [currentTarget, setCurrentTarget] = useState("");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [ceoMode, setCeoMode] = useState(false);
  const [fixes, setFixes] = useState([]);
  const [showCompromised, setShowCompromised] = useState(false);
  const [showLowRisk, setShowLowRisk] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [history, setHistory] = useState([]);
  const [autoMode, setAutoMode] = useState(false);
  const [serviceStatuses, setServiceStatuses] = useState({});

  const eventSourceRef = useRef(null);
  const runningRef     = useRef(false);
  const ceoModeRef     = useRef(false);
  const fixesRef       = useRef([]);

  useEffect(() => { ceoModeRef.current = ceoMode; }, [ceoMode]);
  useEffect(() => { fixesRef.current = fixes;     }, [fixes]);

  const progress = running ? Math.min(0.9, 0.2 + logs.length * 0.08) : 1;

  useEffect(() => {
    fetch("/api/scan/history")
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => setHistory([]));
  }, [data]);

  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then(d => setServiceStatuses(d))
      .catch(() => setServiceStatuses({
        wundergraph: true, tinyfish: true, redis: true,
        gemini: true, ghost: true, nexla: true, akash: true,
      }));
  }, []);

  useEffect(() => {
    if (!autoMode) return;
    const interval = setInterval(() => {
      if (currentTarget && !runningRef.current) runScan(currentTarget, true);
    }, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, currentTarget]);

  useEffect(() => {
    return () => { eventSourceRef.current?.close(); };
  }, []);

  const startScan = useCallback((target, fromAuto = false) => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    const params = new URLSearchParams({ target, ceoMode: String(ceoModeRef.current) });
    if (fixesRef.current.length > 0) params.set("fixes", fixesRef.current.join(","));

    const source = new EventSource(`/api/scan?${params.toString()}`);
    eventSourceRef.current = source;

    source.onmessage = (e) => {
      setLogs(prev => [...prev.slice(-49), e.data]);
    };

    source.addEventListener("result", (e) => {
      try {
        const payload = JSON.parse(e.data);
        setData(payload);
        if (payload?.error) setError(payload.error);
        const score = payload?.report?.riskScore ?? 0;
        if (score >= 50) {
          setShowCompromised(true);
          setShowLowRisk(false);
        } else {
          setShowLowRisk(true);
          setShowCompromised(false);
        }
      } catch { /* no-op */ }
      finally {
        setRunning(false);
        runningRef.current = false;
        source.close();
        eventSourceRef.current = null;
      }
    });

    source.onerror = () => {
      source.close();
      if (eventSourceRef.current === source) eventSourceRef.current = null;
      setRunning(false);
      runningRef.current = false;
      if (!fromAuto) setError("Stream disconnected — check console");
    };
  }, []);

  const runScan = useCallback(async (target, fromAuto = false) => {
    if (!target || runningRef.current) return;
    runningRef.current = true;
    setCurrentTarget(target);
    setRunning(true);
    setError("");
    setShowCompromised(false);
    setShowLowRisk(false);
    setLogs([]);

    if (!fromAuto) {
      for (const n of [3, 2, 1]) {
        setCountdown(n);
        await new Promise(r => setTimeout(r, 350));
      }
      setCountdown(null);
    }

    startScan(target, fromAuto);
  }, [startScan]);

  const handleRun  = useCallback(t => runScan(t),      [runScan]);
  const handleDemo = useCallback(() => runScan("demo"), [runScan]);

  function toggleFix(flag) {
    setFixes(prev => prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]);
  }

  const memoedSteps  = useMemo(() => data?.simulation?.steps || [], [data]);
  const memoedAgents = useMemo(() => data?.agents || [],             [data]);
  const attackActive = useMemo(
    () => Math.min(4, memoedSteps.length ? memoedSteps.length - 1 : Math.max(0, logs.length - 1)),
    [memoedSteps, logs.length]
  );

  const statusBar = useMemo(() => {
    const items = [
      { key: 'wundergraph', label: 'WunderGraph' }, { key: 'tinyfish', label: 'Tinyfish' },
      { key: 'redis',       label: 'Redis'       }, { key: 'gemini',   label: 'Gemini'   },
      { key: 'ghost',       label: 'Ghost'       }, { key: 'nexla',    label: 'Nexla'    },
      { key: 'akash',       label: 'Akash'       },
    ];
    return items.map(({ key, label }) => ({ label, ok: serviceStatuses[key] !== false }));
  }, [serviceStatuses]);

  const techStack = data?.techStack || [];
  const immActions = data?.report?.immediateActions || [];

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8">

        {/* Sponsor status bar */}
        <div className="mb-5 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs tracking-wide flex flex-wrap gap-3">
          {statusBar.map(({ label, ok }) => (
            <span key={label} style={{ color: ok ? '#22c55e' : '#ef4444' }}>
              {label} {ok ? '✓' : '✗'}
            </span>
          ))}
        </div>

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">RedBox AI</h1>
            <button
              onClick={handleDemo}
              disabled={running}
              style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 16px', fontWeight: '700', fontSize: '12px', letterSpacing: '2px', cursor: running ? 'not-allowed' : 'pointer' }}
            >
              DEMO
            </button>
            {data?.isRealScan && (
              <span style={{ fontSize: '11px', color: '#22c55e', border: '1px solid #166534', borderRadius: '20px', padding: '3px 10px', letterSpacing: '1px' }}>
                ● LIVE SCAN
              </span>
            )}
          </div>
          <p className="text-neutral-400 mt-1">
            AI-powered real-time attack simulation · Type any domain or paste a GitHub URL
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <InputBox onRun={handleRun} onDemo={handleDemo} isScanning={running} />

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <button onClick={() => setCeoMode(v => !v)} className={`rounded-md px-3 py-1 border ${ceoMode ? "border-[#22C55E] text-[#22C55E]" : "border-neutral-700 text-neutral-300"}`}>
              CEO Mode: {ceoMode ? "Business" : "Technical"}
            </button>
            <button onClick={() => toggleFix("fix-auth")} className={`rounded-md px-3 py-1 border ${fixes.includes("fix-auth") ? "border-[#22C55E] text-[#22C55E]" : "border-neutral-700 text-neutral-300"}`}>
              Fix auth
            </button>
            <button onClick={() => toggleFix("remove-api-key")} className={`rounded-md px-3 py-1 border ${fixes.includes("remove-api-key") ? "border-[#22C55E] text-[#22C55E]" : "border-neutral-700 text-neutral-300"}`}>
              Remove API key
            </button>
            <button onClick={() => currentTarget && runScan(currentTarget)} disabled={running || !currentTarget} className="rounded-md px-3 py-1 border border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              Re-run
            </button>
            <button onClick={() => setAutoMode(v => !v)} className={`rounded-md px-3 py-1 border ${autoMode ? "border-[#22C55E] text-[#22C55E]" : "border-neutral-700 text-neutral-300"}`}>
              Auto Monitor: {autoMode ? "ON" : "OFF"}
            </button>
            <Link href="/sandbox" className="rounded-md px-3 py-1 border border-neutral-700 text-neutral-300 hover:bg-neutral-800">
              🧪 Sandbox Lab
            </Link>
          </div>

          {countdown !== null && (
            <p className="text-[#FF8C42] text-2xl font-bold mt-3">Attack Countdown: {countdown}</p>
          )}
          {error && <p className="text-[#FF3B3B] text-sm mt-3">{error}</p>}
        </section>

        <section className="mt-6 grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 space-y-4">
            <TerminalPlayback logs={logs} steps={memoedSteps} playing={running || logs.length > 0} />
            <AttackGraph active={attackActive} />
            <AgentChat messages={memoedAgents} />
          </div>

          <div className="xl:col-span-2 space-y-4">
            <MetricsPanel report={data?.report} progress={progress} />

            {/* Tech stack detected */}
            {techStack.length > 0 && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <h3 className="text-sm font-medium text-neutral-300 mb-2">Tech Stack Detected</h3>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((t, i) => (
                    <span key={i} style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', color: '#a3e635' }}>
                      {t.type}: {t.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Why this works */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">Why This Works</h3>
              <ul className="list-disc pl-4 text-xs text-neutral-300 space-y-1">
                {(data?.proof?.evidence || []).map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
              <p className="text-xs text-neutral-400 mt-2">
                {data?.proof?.reasoning || "Signals are analyzed and converted into safe attack simulation logic."}
              </p>
            </div>

            {/* Executive summary */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">Executive Summary</h3>
              <p className="text-sm text-neutral-200 whitespace-pre-wrap">
                {data?.report?.executiveSummary || "Run a simulation to generate an AI-backed security briefing."}
              </p>
            </div>

            {/* Immediate actions */}
            {immActions.length > 0 && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                <h3 className="text-sm font-medium text-neutral-300 mb-2">Immediate Actions</h3>
                <ol className="list-decimal pl-4 text-xs text-[#fbbf24] space-y-1">
                  {immActions.map((a, i) => <li key={i}>{a}</li>)}
                </ol>
              </div>
            )}

            {/* Scan history */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-medium text-neutral-300 mb-2">Scan History</h3>
              <div className="space-y-1 text-xs text-neutral-300 max-h-28 overflow-y-auto">
                {history.map(row => (
                  <p key={row.id}>{row.target} · {new Date(row.created_at).toLocaleString()}</p>
                ))}
                {history.length === 0 && <p className="text-neutral-500">No stored scans yet.</p>}
              </div>
            </div>
          </div>
        </section>

        {/* Overlays */}
        <CompromisedOverlay
          show={showCompromised}
          onDismiss={() => setShowCompromised(false)}
          report={data?.report}
        />
        <LowRiskBanner
          show={showLowRisk}
          onDismiss={() => setShowLowRisk(false)}
          score={data?.report?.riskScore || 0}
        />

        <footer className="mt-10 border-t border-neutral-800 pt-5 text-xs text-neutral-500">
          Powered by Tinyfish · WunderGraph · Redis · Nexla · Ghost · Akash · Guild.ai · InsForge · Chainguard
        </footer>
      </div>
    </main>
  );
}
