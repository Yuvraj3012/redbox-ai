"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

const AGENT_COLORS = {
  wundergraph: '#9f7aea',
  tinyfish: '#3b82f6',
  recon: '#22c55e',
  nexla: '#06b6d4',
  redis: '#06b6d4',
  ai: '#eab308',
  gemini: '#eab308',
  exploit: '#f97316',
  escalation: '#ef4444',
  impact: '#ef4444',
  ghost: '#8b5cf6',
  akash: '#6b7280',
  guild: '#6b7280',
  insforge: '#6b7280',
};

function lineColor(line) {
  if (/SYSTEM COMPROMISED/i.test(line)) return '#ef4444';
  const lower = line.toLowerCase();
  for (const [key, color] of Object.entries(AGENT_COLORS)) {
    if (lower.includes(`[${key}]`)) return color;
  }
  if (/critical|error|breach|compromised/i.test(line)) return '#ef4444';
  if (/exploit|inject|bypass/i.test(line)) return '#f97316';
  if (/warning|exposed|vulnerable/i.test(line)) return '#fbbf24';
  return '#a3e635';
}

function lineWeight(line) {
  return /SYSTEM COMPROMISED/i.test(line) ? '900' : '400';
}

function lineFontSize(line) {
  return /SYSTEM COMPROMISED/i.test(line) ? '18px' : '13px';
}

const TerminalPlayback = memo(function TerminalPlayback({ logs = [], steps = [], playing = false }) {
  const [revealedLogs, setRevealedLogs] = useState([]);
  const [typing, setTyping] = useState('');
  const [typedIndex, setTypedIndex] = useState(0);
  const [charPos, setCharPos] = useState(0);
  const endRef = useRef(null);

  const scripted = useMemo(() => steps.map((s) => `[${s.phase}] ${s.text}`), [steps]);
  const lines = logs.length > 0 ? logs : scripted;

  useEffect(() => {
    if (logs.length === 0) {
      setRevealedLogs([]);
      setTyping('');
      setTypedIndex(0);
      setCharPos(0);
    }
  }, [logs]);

  useEffect(() => {
    if (!playing) {
      setRevealedLogs([]);
      setTyping('');
      setTypedIndex(0);
      setCharPos(0);
      return;
    }
    if (typedIndex >= lines.length) return;

    const current = lines[typedIndex] || '';
    const isCompromised = /SYSTEM COMPROMISED/i.test(current);
    const charDelay = isCompromised ? 40 : 8;

    const timer = setTimeout(() => {
      const nextPos = charPos + 1;
      setTyping(current.slice(0, nextPos));
      if (nextPos >= current.length) {
        setRevealedLogs((prev) => [...prev, current]);
        setTyping('');
        setTypedIndex((v) => v + 1);
        setCharPos(0);
      } else {
        setCharPos(nextPos);
      }
    }, charDelay);

    return () => clearTimeout(timer);
  }, [playing, lines, typedIndex, charPos]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealedLogs, typing]);

  useEffect(() => {
    if (!playing) return;
    if (typedIndex > lines.length) setTypedIndex(lines.length);
  }, [lines.length, playing, typedIndex]);

  return (
    <div
      style={{
        height: '520px',
        overflowY: 'auto',
        borderRadius: '12px',
        border: '1px solid #262626',
        background: '#000',
        padding: '16px',
        fontFamily: 'monospace',
      }}
    >
      <p style={{ color: '#525252', marginBottom: '12px', fontSize: '12px' }}>
        redbox@simulation:~$ run --safe --sse
      </p>
      {revealedLogs.map((line, i) => (
        <div
          key={`${i}-${line.slice(0, 20)}`}
          style={{
            color: lineColor(line),
            fontWeight: lineWeight(line),
            fontSize: lineFontSize(line),
            marginBottom: /SYSTEM COMPROMISED/i.test(line) ? '8px' : '3px',
            animation: /SYSTEM COMPROMISED/i.test(line) ? 'redPulse 0.8s infinite' : 'slideIn 0.15s ease',
            letterSpacing: /SYSTEM COMPROMISED/i.test(line) ? '4px' : 'normal',
          }}
        >
          {/SYSTEM COMPROMISED/i.test(line) ? '⚠ ' : ''}{line}
        </div>
      ))}
      {playing && typing && (
        <div
          style={{
            color: lineColor(typing),
            fontWeight: lineWeight(typing),
            fontSize: lineFontSize(typing),
            marginBottom: '3px',
          }}
        >
          {typing}
          <span style={{ animation: 'redPulse 1s infinite' }}>▋</span>
        </div>
      )}
      {!playing && lines.length === 0 && (
        <p style={{ color: '#404040' }}>Waiting for simulation run...</p>
      )}
      <div ref={endRef} />
    </div>
  );
});

export default TerminalPlayback;
