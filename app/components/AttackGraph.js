"use client";

const NODES = ["Login", "Auth", "Admin", "Database", "Data Leak"];

export default function AttackGraph({ active = 0 }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">Attack Graph</h3>
      <div className="flex flex-wrap items-center gap-2">
        {NODES.map((node, i) => (
          <div key={node} className="flex items-center gap-2">
            <span className={`rounded-md px-3 py-1 text-xs border ${i <= active ? "border-[#FF3B3B] text-[#FF3B3B] bg-red-950/30" : "border-neutral-700 text-neutral-400"}`}>
              {node}
            </span>
            {i < NODES.length - 1 && <span className="text-neutral-600">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
