"use client";

import { memo } from "react";

const NODES = [
  { label: 'Login', desc: 'Entry' },
  { label: 'Auth', desc: 'Bypass' },
  { label: 'Admin', desc: 'Access' },
  { label: 'Database', desc: 'Exfil' },
  { label: 'Data Leak', desc: 'Impact' },
];

const AttackGraph = memo(function AttackGraph({ active = 0 }) {
  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid #262626',
        background: '#0a0a0a',
        padding: '16px',
      }}
    >
      <h3 style={{ fontSize: '12px', color: '#525252', letterSpacing: '2px', marginBottom: '12px', margin: '0 0 12px' }}>
        ATTACK GRAPH
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {NODES.map((node, i) => {
          const lit = i <= active;
          return (
            <div key={node.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  borderRadius: '6px',
                  padding: '6px 12px',
                  border: `1px solid ${lit ? '#ef4444' : '#262626'}`,
                  background: lit ? 'rgba(239,68,68,0.1)' : 'transparent',
                  color: lit ? '#ef4444' : '#525252',
                  fontSize: '12px',
                  fontWeight: lit ? '700' : '400',
                  transition: 'all 0.4s ease',
                  textAlign: 'center',
                }}
              >
                <div>{node.label}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>{node.desc}</div>
              </div>
              {i < NODES.length - 1 && (
                <span style={{ color: lit ? '#ef4444' : '#333', fontSize: '14px', transition: 'color 0.4s ease' }}>
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default AttackGraph;
