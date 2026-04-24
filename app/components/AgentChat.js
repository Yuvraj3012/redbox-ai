"use client";

import { memo } from "react";

const AGENT_COLORS = {
  'Recon Agent': '#3b82f6',
  'Exploit Agent': '#f97316',
  'Escalation Agent': '#ef4444',
  'Impact Agent': '#991b1b',
};

function agentColor(name) {
  for (const [key, color] of Object.entries(AGENT_COLORS)) {
    if (String(name || '').includes(key.split(' ')[0])) return color;
  }
  return '#9ca3af';
}

const AgentChat = memo(function AgentChat({ messages = [] }) {
  return (
    <div
      style={{
        borderRadius: '12px',
        border: '1px solid #262626',
        background: '#0a0a0a',
        padding: '16px',
        height: '240px',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ fontSize: '12px', color: '#525252', letterSpacing: '2px', marginBottom: '12px', margin: '0 0 12px' }}>
        MULTI-AGENT CHAT
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map((m, i) => {
          const color = agentColor(m.agent);
          return (
            <div
              key={`${m.agent}-${i}`}
              style={{
                display: 'flex',
                gap: '8px',
                fontSize: '12px',
                animation: 'slideIn 0.2s ease',
              }}
            >
              <span
                style={{
                  color,
                  fontWeight: '700',
                  whiteSpace: 'nowrap',
                  fontSize: '11px',
                  paddingTop: '1px',
                }}
              >
                [{m.agent}]
              </span>
              <span style={{ color: '#d1d5db', lineHeight: 1.5 }}>{m.message}</span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p style={{ color: '#404040', fontSize: '12px' }}>No agent output yet.</p>
        )}
      </div>
    </div>
  );
});

export default AgentChat;
