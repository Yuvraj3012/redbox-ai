"use client";

export default function AgentChat({ messages = [] }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 h-[240px] overflow-y-auto">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">Multi-Agent Chat</h3>
      <div className="space-y-2 text-sm">
        {messages.map((m, i) => (
          <p key={`${m.agent}-${i}`} className="text-neutral-200">
            <span className="text-[#FF8C42] font-medium">{m.agent}:</span> {m.message}
          </p>
        ))}
        {messages.length === 0 && <p className="text-neutral-500">No agent output yet.</p>}
      </div>
    </div>
  );
}
