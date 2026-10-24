import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

import NotchedCard from "./NotchedCard";
import { Mono } from "./primitives";

/** Number that counts up on mount. Skips the animation under reduced motion. */
function useCountUp(value: number, decimals = 0) {
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();
  const previous = useRef(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduced]);

  return display.toFixed(decimals);
}

export default function StatTile({
  label,
  value,
  decimals = 0,
  suffix = "",
  progress,
  delay = 0,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  /** 0–100; renders a gradient bar under the number. */
  progress?: number;
  delay?: number;
}) {
  const shown = useCountUp(value, decimals);

  return (
    <NotchedCard
      small
      active={false}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 0.55, y: 0 }}
      whileHover={{ opacity: 1, y: -3 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      innerClassName="flex h-full flex-col justify-between gap-5 p-5"
    >
      <Mono className="text-[var(--faint)]">{label}</Mono>
      <div>
        <div className="font-display text-4xl font-light leading-none text-[var(--text)]">
          {shown}
          <span className="text-2xl text-[var(--muted)]">{suffix}</span>
        </div>
        {progress !== undefined && (
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[rgba(234,242,248,0.08)]">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                background: "var(--grad)",
                width: `${Math.max(0, Math.min(100, progress))}%`,
                transitionDelay: "200ms",
              }}
            />
          </div>
        )}
      </div>
    </NotchedCard>
  );
}
