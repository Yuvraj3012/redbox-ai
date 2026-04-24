"use client";

import { memo, useEffect, useRef, useState } from "react";

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const end = target;
    prevTarget.current = end;

    if (end === 0) { setValue(0); return; }

    const startTime = performance.now();
    let raf;

    function tick(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function riskColor(score) {
  if (score >= 75) return '#ef4444';
  if (score >= 50) return '#f97316';
  return '#22c55e';
}

const MetricsPanel = memo(function MetricsPanel({ report, progress = 1 }) {
  const rawScore = Math.round((report?.riskScore || 0) * progress);
  const lossRaw = Number(String(report?.estimatedBreachCost || '$0').replace(/[^0-9]/g, ''));
  const rawLoss = Math.round(lossRaw * progress);
  const rawRecords = Math.round((report?.recordsExposed || 0) * progress);

  const score = useCountUp(rawScore);
  const loss = useCountUp(rawLoss);
  const records = useCountUp(rawRecords);

  const color = riskColor(score);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Risk Score — giant */}
      <div style={{ borderRadius: '12px', border: '1px solid #262626', background: '#0a0a0a', padding: '20px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#525252', marginBottom: '8px' }}>RISK SCORE</p>
        <p style={{ fontSize: '64px', fontWeight: '900', color, lineHeight: 1, margin: 0 }}>{score}</p>
        <p style={{ fontSize: '11px', color, marginTop: '4px', letterSpacing: '2px' }}>
          {score >= 75 ? '⚠ CRITICAL' : score >= 50 ? '▲ HIGH' : score > 0 ? '● MODERATE' : '—'}
        </p>
      </div>

      {/* Time to breach */}
      <div style={{ borderRadius: '12px', border: '1px solid #262626', background: '#0a0a0a', padding: '16px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#525252', marginBottom: '6px' }}>TIME TO BREACH</p>
        <p style={{ fontSize: '36px', fontWeight: '700', color: '#f97316', margin: 0 }}>
          {report?.timeToBreach || '—'}
        </p>
      </div>

      {/* Estimated loss */}
      <div style={{ borderRadius: '12px', border: '1px solid #262626', background: '#0a0a0a', padding: '16px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#525252', marginBottom: '6px' }}>ESTIMATED LOSS</p>
        <p style={{ fontSize: '36px', fontWeight: '700', color: '#ef4444', margin: 0 }}>
          ${loss.toLocaleString()}
        </p>
      </div>

      {/* Records exposed */}
      <div style={{ borderRadius: '12px', border: '1px solid #262626', background: '#0a0a0a', padding: '16px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '2px', color: '#525252', marginBottom: '6px' }}>RECORDS EXPOSED</p>
        <p style={{ fontSize: '36px', fontWeight: '700', color: '#fbbf24', margin: 0 }}>
          {records.toLocaleString()}
        </p>
      </div>
    </div>
  );
});

export default MetricsPanel;
