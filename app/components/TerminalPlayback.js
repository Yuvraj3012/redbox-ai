"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function TerminalPlayback({ steps = [], playing }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typed, setTyped] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (!playing || steps.length === 0) return;
    let idx = 0;
    let char = 0;

    const tick = setInterval(() => {
      if (idx >= steps.length) {
        clearInterval(tick);
        return;
      }

      const line = `[${steps[idx].phase}] ${steps[idx].text}`;
      char += 1;
      setTyped(line.slice(0, char));

      if (char >= line.length) {
        idx += 1;
        char = 0;
        setVisibleCount(idx);
      }
    }, 22);

    return () => clearInterval(tick);
  }, [playing, steps]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount, typed]);

  const shown = useMemo(() => steps.slice(0, visibleCount), [steps, visibleCount]);

  return (
    <div className="h-[520px] overflow-y-auto rounded-xl border border-neutral-800 bg-black p-4 font-mono text-sm">
      <p className="text-neutral-500 mb-3">redbox@simulation:~$ start --safe-mode</p>
      {shown.map((step, i) => (
        <p key={`${step.phase}-${i}`} className={step.level === "critical" ? "text-[#FF3B3B]" : step.level === "high" ? "text-[#FF8C42]" : "text-[#A3E635]"}>
          [{step.phase}] {step.text}
        </p>
      ))}
      {playing && typed && (
        <p className="text-[#A3E635]">
          {typed}
          <span className="animate-pulse">▋</span>
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
