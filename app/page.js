"use client";

import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import MetricsPanel from "./components/MetricsPanel";
import AttackGraph from "./components/AttackGraph";
import AgentChat from "./components/AgentChat";
import InputBox from "./components/InputBox";

// ─── Sponsors ─────────────────────────────────────────────────────────────────

const SPONSORS = [
  { id: 'wundergraph', label: 'WunderGraph', icon: '🔗', desc: 'Orchestrating pipeline' },
  { id: 'tinyfish',   label: 'Tinyfish',    icon: '🐠', desc: 'Crawling target' },
  { id: 'nexla',      label: 'Nexla',       icon: '🔄', desc: 'Transforming data' },
  { id: 'redis',      label: 'Redis',       icon: '⚡', desc: 'Caching results' },
  { id: 'gemini',     label: 'Gemini AI',   icon: '🤖', desc: 'Simulating attack' },
  { id: 'ghost',      label: 'Ghost DB',    icon: '👻', desc: 'Storing scan' },
  { id: 'akash',      label: 'Akash',       icon: '🌐', desc: 'Distributed compute' },
  { id: 'guild',      label: 'Guild.ai',    icon: '🎯', desc: 'Tracking experiment' },
  { id: 'insforge',   label: 'InsForge',    icon: '⚙️', desc: 'Agent workflow' },
  { id: 'chainguard', label: 'Chainguard',  icon: '🔐', desc: 'Secure runtime' },
];

const SponsorBar = memo(function SponsorBar({ activeSponsors }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '6px',
      padding: '8px 0', borderBottom: '1px solid #1a1a2e',
      marginBottom: '8px', flexShrink: 0,
    }}>
      {SPONSORS.map((s) => {
        const on = activeSponsors.has(s.id);
        return (
          <div key={s.id} title={s.desc} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '100px',
            border: `1px solid ${on ? '#00ff88' : '#2a2a3a'}`,
            background: on ? '#00ff8812' : '#0d0d1a',
            color: on ? '#00ff88' : '#3a3a4a',
            fontSize: '11px', fontWeight: '600',
            transition: 'all 0.35s ease',
          }}>
            <span style={{ fontSize: '12px' }}>{s.icon}</span>
            {s.label}
            {on && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88', animation: 'blink 1s infinite' }} />}
          </div>
        );
      })}
    </div>
  );
});

// ─── Terminal log line ────────────────────────────────────────────────────────

const LogLine = memo(function LogLine({ log }) {
  const color = (() => {
    if (log.includes('SYSTEM COMPROMISED'))                          return '#ff2222';
    if (log.includes('CRITICAL') || log.includes('[Exploit'))       return '#ff4444';
    if (log.includes('[Escalation') || log.includes('[Impact'))     return '#ff6600';
    if (log.includes('[WunderGraph]'))                               return '#a78bfa';
    if (log.includes('[Tinyfish]'))                                  return '#38bdf8';
    if (log.includes('[Nexla]'))                                     return '#fb923c';
    if (log.includes('[Redis]'))                                     return '#f87171';
    if (log.includes('[AI]') || log.includes('[Gemini]'))           return '#facc15';
    if (log.includes('[Ghost]'))                                     return '#c084fc';
    if (log.includes('[Recon]') || log.includes('[Intel]'))         return '#4ade80';
    if (log.includes('[GitHub]'))                                    return '#60a5fa';
    if (log.includes('[Akash]'))                                     return '#22d3ee';
    if (log.includes('[Guild]'))                                     return '#a3e635';
    if (log.includes('[InsForge]'))                                  return '#f472b6';
    return '#94a3b8';
  })();

  const isBig = log.includes('SYSTEM COMPROMISED') || log.includes('VULNERABILITIES DETECTED');

  return (
    <div style={{
      color,
      fontSize: isBig ? '17px' : '13px',
      fontWeight: isBig ? '900' : '400',
      animation: 'slideIn 0.2s ease',
      letterSpacing: isBig ? '2px' : 'normal',
      padding: isBig ? '6px 0' : '0',
    }}>
      {isBig ? '⚠ ' + log : '› ' + log}
    </div>
  );
});

// ─── CEO mode translator ──────────────────────────────────────────────────────

function toCeoMessage(log) {
  const t = String(log || '');
  if (t.includes('[Tinyfish]'))                  return 'We sent a web agent to crawl your site and map pages/endpoints.';
  if (t.includes('[WunderGraph]'))               return 'The orchestration pipeline is coordinating each scan step.';
  if (t.includes('[Recon]'))                     return 'We are reviewing your site headers and externally visible configuration.';
  if (t.includes('[Nexla]'))                     return 'Raw signals are being transformed into structured risk insights.';
  if (t.includes('[Redis]'))                     return 'We are using memory/cache so repeated checks stay fast and consistent.';
  if (t.includes('[AI]') || t.includes('[Gemini]')) return 'AI is modeling likely attacker behavior from discovered signals.';
  if (t.includes('[Ghost]'))                     return 'This scan was saved for audit/history tracking.';
  if (t.includes('[Exploit'))                    return 'A likely exploitation path was identified in the current configuration.';
  if (t.includes('[Escalation'))                 return 'An attacker may be able to escalate access after initial entry.';
  if (t.includes('[Impact'))                     return 'Business impact is being estimated from risk findings.';
  if (t.includes('LOW RISK'))                    return 'Security posture looks healthy overall — low immediate risk.';
  if (t.includes('MEDIUM RISK'))                 return 'Some important issues were found and should be fixed soon.';
  if (t.includes('SYSTEM COMPROMISED'))          return 'This indicates a high-risk path that could lead to major impact.';
  return t;
}

// ─── Fix & Re-run helper ──────────────────────────────────────────────────────

function applyTopFixToPayload(payload) {
  if (!payload) return payload;
  const vulns = Array.isArray(payload.vulnerabilities) ? payload.vulnerabilities : [];
  const sorted = [...vulns].sort((a, b) => {
    const w = { critical: 4, high: 3, medium: 2, low: 1 };
    return (w[b?.severity] || 0) - (w[a?.severity] || 0);
  });
  const removed = sorted[0];
  return {
    ...payload,
    vulnerabilities: removed ? sorted.slice(1) : sorted,
    report: {
      ...(payload.report || {}),
      riskScore: 18, riskLevel: 'LOW',
      timeToBreach: 'Blocked by remediation',
      estimatedBreachCost: '$0', recordsExposed: 0,
      executiveSummary: removed
        ? `Top issue fixed: ${removed.title}. Attack chain interrupted — risk reduced to low.`
        : 'No critical issues remained; risk reduced to low after remediation.',
    },
    simulation: {
      steps: [
        ...(payload.simulation?.steps || []).slice(0, 3),
        { phase: 'Defense', text: removed ? `Fix applied: ${removed.title} mitigated. Attack stopped.` : 'Fix applied. Attack chain stopped.', level: 'info' },
      ],
    },
  };
}

// ─── Overlays ─────────────────────────────────────────────────────────────────

const CompromisedOverlay = ({ show, onDismiss, report }) => {
  if (!show) return null;
  const loss    = report?.estimatedBreachCost || '$2,300,000';
  const time    = report?.timeToBreach        || '12 min';
  const records = report?.recordsExposed;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'overlayFadeIn 0.5s ease' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: '11px', letterSpacing: '4px', color: '#e63946', fontWeight: '700', marginBottom: '16px' }}>
          ████ SECURITY BREACH DETECTED ████
        </div>
        <div style={{ fontSize: '68px', fontWeight: '900', color: '#e63946', letterSpacing: '-2px', lineHeight: 1, animation: 'redPulse 1s infinite' }}>SYSTEM</div>
        <div style={{ fontSize: '68px', fontWeight: '900', color: '#ff4444', letterSpacing: '-2px', lineHeight: 1, marginBottom: '36px' }}>COMPROMISED</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: '40px', padding: '0 32px' }}>
          {[{ val: loss, label: 'ESTIMATED LOSS', color: '#ff4444' }, { val: time, label: 'TIME TO BREACH', color: '#ff6600' }, { val: records ? records.toLocaleString() : '148,000', label: 'RECORDS EXPOSED', color: '#ffaa00' }].map(({ val, label, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '900', color }}>{val}</div>
              <div style={{ fontSize: '11px', color: '#666', letterSpacing: '2px', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
          <button onClick={onDismiss} style={{ background: 'transparent', border: '1px solid #e63946', color: '#e63946', padding: '11px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '2px' }}>VIEW FULL REPORT</button>
          <button onClick={onDismiss} style={{ background: '#e63946', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', letterSpacing: '2px' }}>FIX VULNERABILITIES →</button>
        </div>
      </div>
    </div>
  );
};

const LowRiskBanner = ({ show, onDismiss, score }) => {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#052e16', border: '1px solid #166534', borderRadius: '12px', padding: '16px 24px', zIndex: 1000, animation: 'overlayFadeIn 0.4s ease', maxWidth: '320px' }}>
      <div style={{ color: '#22c55e', fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>✓ LOW RISK DETECTED</div>
      <div style={{ color: '#86efac', fontSize: '12px', marginBottom: '10px' }}>Risk score: {score}/100 — no critical vulnerabilities found.</div>
      <button onClick={onDismiss} style={{ background: 'transparent', border: '1px solid #166534', color: '#22c55e', padding: '5px 14px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}>DISMISS</button>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [currentTarget,      setCurrentTarget]      = useState('');
  const [running,            setRunning]            = useState(false);
  const [logs,               setLogs]               = useState([]);
  const [data,               setData]               = useState(null);
  const [error,              setError]              = useState('');
  const [ceoMode,            setCeoMode]            = useState(false);
  const [fixes,              setFixes]              = useState([]);
  const [showCompromised,    setShowCompromised]    = useState(false);
  const [showLowRisk,        setShowLowRisk]        = useState(false);
  const [countdown,          setCountdown]          = useState(null);
  const [history,            setHistory]            = useState([]);
  const [autoMode,           setAutoMode]           = useState(false);
  const [remediationPending, setRemediationPending] = useState(false);
  const [serviceStatuses,    setServiceStatuses]    = useState({});
  const [activeSponsors,     setActiveSponsors]     = useState(new Set());

  const eventSourceRef      = useRef(null);
  const terminalRef         = useRef(null);
  const runningRef          = useRef(false);
  const ceoModeRef          = useRef(false);
  const fixesRef            = useRef([]);
  const remediationRef      = useRef(false);   // stable flag for startScan closure

  useEffect(() => { ceoModeRef.current = ceoMode; },            [ceoMode]);
  useEffect(() => { fixesRef.current = fixes; },                [fixes]);
  useEffect(() => { remediationRef.current = remediationPending; }, [remediationPending]);

  const progress = running ? Math.min(0.9, 0.2 + logs.length * 0.08) : 1;

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Load scan history after each result
  useEffect(() => {
    fetch('/api/scan/history')
      .then(r => r.json())
      .then(d => setHistory(d.history || []))
      .catch(() => setHistory([]));
  }, [data]);

  // Check live service statuses once
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setServiceStatuses(d))
      .catch(() => setServiceStatuses({
        wundergraph: true, tinyfish: true, redis: true,
        gemini: true, ghost: true, nexla: true, akash: true,
      }));
  }, []);

  // Auto-monitor interval
  useEffect(() => {
    if (!autoMode) return;
    const id = setInterval(() => {
      if (currentTarget && !runningRef.current) runScan(currentTarget, true);
    }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, currentTarget]);

  // Close EventSource on unmount
  useEffect(() => () => { eventSourceRef.current?.close(); }, []);

  // Stable sponsor activator — only depends on stable setActiveSponsors
  const activateSponsorFromLog = useCallback((msg) => {
    const lower = String(msg || '').toLowerCase();
    setActiveSponsors(prev => {
      const next = new Set(prev);
      if (lower.includes('wundergraph'))                  next.add('wundergraph');
      if (lower.includes('tinyfish'))                     next.add('tinyfish');
      if (lower.includes('nexla'))                        next.add('nexla');
      if (lower.includes('redis'))                        next.add('redis');
      if (lower.includes('gemini') || lower.includes('[ai]')) next.add('gemini');
      if (lower.includes('ghost'))                        next.add('ghost');
      if (lower.includes('akash'))                        next.add('akash');
      if (lower.includes('guild'))                        next.add('guild');
      if (lower.includes('insforge'))                     next.add('insforge');
      if (lower.includes('chainguard'))                   next.add('chainguard');
      return next;
    });
  }, []);

  const startScan = useCallback((target, fromAuto = false) => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;

    const params = new URLSearchParams({ target, ceoMode: String(ceoModeRef.current) });
    if (fixesRef.current.length > 0) params.set('fixes', fixesRef.current.join(','));

    const source = new EventSource(`/api/scan?${params}`);
    eventSourceRef.current = source;

    source.onmessage = (e) => {
      const msg = ceoModeRef.current ? toCeoMessage(e.data) : e.data;
      setLogs(prev => [...prev.slice(-49), msg]);
      activateSponsorFromLog(e.data);
    };

    source.addEventListener('result', (e) => {
      try {
        let payload = JSON.parse(e.data);
        if (remediationRef.current) {
          payload = applyTopFixToPayload(payload);
          remediationRef.current = false;
          setRemediationPending(false);
        }
        setData(payload);
        if (payload?.error) setError(payload.error);
        const score = payload?.report?.riskScore ?? 0;
        if (score >= 61) { setShowCompromised(true);  setShowLowRisk(false); }
        else             { setShowLowRisk(true);       setShowCompromised(false); }
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
      if (!fromAuto) setError('Stream disconnected — check console');
    };
  }, [activateSponsorFromLog]);

  const runScan = useCallback(async (target, fromAuto = false) => {
    if (!target || runningRef.current) return;
    runningRef.current = true;
    setCurrentTarget(target);
    setRunning(true);
    setError('');
    setShowCompromised(false);
    setShowLowRisk(false);
    setLogs([]);
    setActiveSponsors(new Set(['wundergraph']));

    if (!fromAuto) {
      for (const n of [3, 2, 1]) {
        setCountdown(n);
        await new Promise(r => setTimeout(r, 350));
      }
      setCountdown(null);
    }

    startScan(target, fromAuto);
  }, [startScan]);

  const handleRun  = useCallback(t => runScan(t),        [runScan]);
  const handleDemo = useCallback(() => runScan('demo'),   [runScan]);

  function exportReport() {
    if (!data?.report) return;
    const blob = new Blob([
      ['RedBox AI Security Report',
       `Target: ${data.target || currentTarget || 'unknown'}`,
       `Risk Score: ${data.report.riskScore ?? 0}/100`,
       `Risk Level: ${data.report.riskLevel || 'N/A'}`,
       `Time to Breach: ${data.report.timeToBreach || 'N/A'}`,
       '', 'Executive Summary', data.report.executiveSummary || 'N/A',
       '', 'Top Findings',
       ...(data.vulnerabilities || []).slice(0, 10).map(v => `- [${(v.severity || 'info').toUpperCase()}] ${v.title || 'Untitled'}`),
       '', 'Generated by RedBox AI',
      ].join('\n')
    ], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `redbox-report-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  const memoedSteps  = useMemo(() => data?.simulation?.steps || [], [data]);
  const memoedAgents = useMemo(() => data?.agents || [],             [data]);
  const attackActive = useMemo(
    () => Math.min(4, memoedSteps.length ? memoedSteps.length - 1 : Math.max(0, logs.length - 1)),
    [memoedSteps, logs.length]
  );

  const statusBar = useMemo(() => (
    ['wundergraph','tinyfish','redis','gemini','ghost','nexla','akash']
      .map(k => ({ label: k[0].toUpperCase() + k.slice(1), ok: serviceStatuses[k] !== false }))
  ), [serviceStatuses]);

  const techStack  = data?.techStack || [];
  const immActions = data?.report?.immediateActions || [];

  return (
    // Fixed-height viewport — nothing scrolls except the two inner panels
    <div style={{ height: '100vh', overflow: 'hidden', background: '#0B0B0B', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'hidden', maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '14px 20px 0', display: 'flex', flexDirection: 'column' }}>

        {/* Sponsor pills — lights up GREEN as each sponsor is used */}
        <SponsorBar activeSponsors={activeSponsors} />

        {/* Service health row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px', padding: '5px 12px', borderRadius: '8px', border: '1px solid #1a1a2e', background: '#050510', fontSize: '11px', flexShrink: 0 }}>
          {statusBar.map(({ label, ok }) => (
            <span key={label} style={{ color: ok ? '#22c55e' : '#ef4444' }}>{label} {ok ? '✓' : '✗'}</span>
          ))}
        </div>

        {/* Header */}
        <header style={{ marginBottom: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 900, margin: 0 }}>RedBox AI</h1>
            <button onClick={handleDemo} disabled={running} style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 13px', fontWeight: '700', fontSize: '11px', letterSpacing: '2px', cursor: running ? 'not-allowed' : 'pointer' }}>
              DEMO
            </button>
            {data?.isRealScan && (
              <span style={{ fontSize: '10px', color: '#22c55e', border: '1px solid #166534', borderRadius: '20px', padding: '2px 9px', letterSpacing: '1px' }}>
                ● LIVE SCAN
              </span>
            )}
          </div>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: '12px' }}>
            AI-powered real-time attack simulation · Type any domain or paste a GitHub URL
          </p>
        </header>

        {/* Input + controls */}
        <section style={{ borderRadius: '10px', border: '1px solid #1f1f1f', background: '#0a0a0a', padding: '12px', marginBottom: '10px', flexShrink: 0 }}>
          <InputBox onRun={handleRun} onDemo={handleDemo} isScanning={running} />

          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>

            {/* CEO Mode */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button title="Translates technical logs to plain English" onClick={() => setCeoMode(v => !v)}
                style={{ borderRadius: '6px', padding: '5px 11px', border: `1px solid ${ceoMode ? '#22c55e' : '#374151'}`, background: 'transparent', color: ceoMode ? '#22c55e' : '#d1d5db', fontSize: '11px', cursor: 'pointer' }}>
                CEO Mode: {ceoMode ? 'ON' : 'OFF'}
              </button>
              <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Plain-English mode</span>
            </div>

            {/* Fix & Re-run — only after scan */}
            {data && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button title="Apply the top fix and re-run to see attack stopped"
                  disabled={running || !currentTarget}
                  onClick={() => {
                    if (!currentTarget || running) return;
                    remediationRef.current = true;
                    setRemediationPending(true);
                    setFixes(['fix-auth', 'remove-api-key']);
                    runScan(currentTarget);
                  }}
                  style={{ borderRadius: '6px', padding: '5px 11px', border: '1px solid #16a34a', background: 'transparent', color: '#4ade80', fontSize: '11px', cursor: 'pointer', opacity: (running || !currentTarget) ? 0.5 : 1 }}>
                  Fix &amp; Re-run
                </button>
                <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Apply top fix then rescan</span>
              </div>
            )}

            {/* Auto Monitor */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <button title="Re-run scan every 30 seconds" onClick={() => setAutoMode(v => !v)}
                style={{ borderRadius: '6px', padding: '5px 11px', border: `1px solid ${autoMode ? '#22c55e' : '#374151'}`, background: 'transparent', color: autoMode ? '#22c55e' : '#d1d5db', fontSize: '11px', cursor: 'pointer' }}>
                Auto Monitor: {autoMode ? 'ON' : 'OFF'}
              </button>
              <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>{autoMode ? '🔴 LIVE — every 30s' : 'Disabled'}</span>
            </div>

            {/* Export Report — only after scan */}
            {data && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button title="Download security report" onClick={exportReport}
                  style={{ borderRadius: '6px', padding: '5px 11px', border: '1px solid #0e7490', background: 'transparent', color: '#67e8f9', fontSize: '11px', cursor: 'pointer' }}>
                  Export Report
                </button>
                <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Download report snapshot</span>
              </div>
            )}

            {/* Sandbox link */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Link href="/sandbox" title="Interactive safe attack demo lab"
                style={{ borderRadius: '6px', padding: '5px 11px', border: '1px solid #374151', background: 'transparent', color: '#d1d5db', fontSize: '11px', textDecoration: 'none', display: 'inline-block' }}>
                Sandbox Lab
              </Link>
              <span style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px' }}>Interactive attack demos</span>
            </div>
          </div>

          {countdown !== null && (
            <p style={{ color: '#ff8c42', fontSize: '16px', fontWeight: 700, margin: '6px 0 0' }}>Attack Countdown: {countdown}</p>
          )}
          {error && <p style={{ color: '#ff3b3b', fontSize: '12px', margin: '4px 0 0' }}>{error}</p>}
        </section>

        {/* Main grid — fills remaining height, ZERO page scroll */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '60% 40%', gap: '14px' }}>

          {/* LEFT — Terminal (scrolls internally) */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <div style={{ background: '#1a1a2e', padding: '5px 14px', borderRadius: '8px 8px 0 0', fontSize: '11px', color: '#555', flexShrink: 0 }}>
              redbox@simulation:~$ run --safe --sse
            </div>
            <div ref={terminalRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', background: '#080b12', padding: '12px 14px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.7', borderRadius: '0 0 8px 8px', border: '1px solid #1a1a2e' }}>
              {logs.length === 0 && (
                <span style={{ color: '#333' }}>› Waiting for target… try demo mode or paste a domain</span>
              )}
              {logs.map((log, i) => <LogLine key={i} log={log} />)}
            </div>
            <div style={{ marginTop: '8px', flexShrink: 0 }}>
              <AttackGraph active={attackActive} />
            </div>
            <div style={{ marginTop: '8px', flexShrink: 0 }}>
              <AgentChat messages={memoedAgents} />
            </div>
          </div>

          {/* RIGHT — Metrics panel (scrolls internally) */}
          <div style={{ minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MetricsPanel report={data?.report} progress={progress} />

            {techStack.length > 0 && (
              <div style={{ borderRadius: '10px', border: '1px solid #1f1f1f', background: '#0a0a0a', padding: '12px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Tech Stack</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {techStack.map((t, i) => (
                    <span key={i} style={{ background: '#1a1a2e', border: '1px solid #2a2a3a', borderRadius: '20px', padding: '2px 9px', fontSize: '10px', color: '#a3e635' }}>
                      {t.type}: {t.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderRadius: '10px', border: '1px solid #1f1f1f', background: '#0a0a0a', padding: '12px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Why This Works</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '16px', margin: 0, fontSize: '11px', color: '#d1d5db', lineHeight: 1.6 }}>
                {(data?.proof?.evidence || []).map((ev, i) => <li key={i}>{ev}</li>)}
              </ul>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '6px 0 0' }}>
                {data?.proof?.reasoning || 'Signals are analyzed and converted into safe attack simulation logic.'}
              </p>
            </div>

            <div style={{ borderRadius: '10px', border: '1px solid #1f1f1f', background: '#0a0a0a', padding: '12px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Executive Summary</h3>
              <p style={{ fontSize: '12px', color: '#e5e7eb', margin: 0, lineHeight: 1.6 }}>
                {data?.report?.executiveSummary || 'Run a simulation to generate an AI-backed security briefing.'}
              </p>
            </div>

            {immActions.length > 0 && (
              <div style={{ borderRadius: '10px', border: '1px solid #1f1f1f', background: '#0a0a0a', padding: '12px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Immediate Actions</h3>
                <ol style={{ listStyle: 'decimal', paddingLeft: '16px', margin: 0, fontSize: '11px', color: '#fbbf24', lineHeight: 1.6 }}>
                  {immActions.map((a, i) => <li key={i}>{a}</li>)}
                </ol>
              </div>
            )}

            <div style={{ borderRadius: '10px', border: '1px solid #1f1f1f', background: '#0a0a0a', padding: '12px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Scan History</h3>
              <div style={{ fontSize: '11px', color: '#d1d5db', maxHeight: '80px', overflowY: 'auto', lineHeight: 1.6 }}>
                {history.length === 0
                  ? <span style={{ color: '#4b5563' }}>No stored scans yet.</span>
                  : history.map(row => (
                      <p key={row.id} style={{ margin: '0 0 2px' }}>{row.target} · {new Date(row.created_at).toLocaleString()}</p>
                    ))
                }
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Fixed overlays — rendered outside the scroll container */}
      <CompromisedOverlay show={showCompromised} onDismiss={() => setShowCompromised(false)} report={data?.report} />
      <LowRiskBanner      show={showLowRisk}      onDismiss={() => setShowLowRisk(false)}      score={data?.report?.riskScore || 0} />
    </div>
  );
}
