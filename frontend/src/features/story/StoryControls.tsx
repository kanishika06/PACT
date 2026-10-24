import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { Mono } from "../../components/primitives";

/**
 * Keyboard-operable selection tile. A real <button> with aria-pressed, so
 * Tab/Enter/Space work without any key handling of our own.
 */
export function SelectTile({
  label,
  hint,
  selected,
  onToggle,
  index = 0,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onToggle: () => void;
  index?: number;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className={`notched-sm border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)] ${
        selected
          ? "border-[var(--cyan)] bg-[rgba(45,212,212,0.10)]"
          : "border-[rgba(124,58,237,0.45)] bg-[rgba(16,32,42,0.92)] hover:border-[rgba(124,58,237,0.85)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] ${
            selected
              ? "border-[var(--cyan)] bg-[var(--cyan)] text-[#06121a]"
              : "border-[var(--faint)]"
          }`}
          aria-hidden
        >
          {selected ? "✓" : ""}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[15px] leading-snug text-[var(--text)]">
            {label}
          </span>
          {hint && <span className="mt-1 block text-[12px] text-[var(--muted)]">{hint}</span>}
        </span>
      </div>
    </motion.button>
  );
}

/** Compact single-choice pill group. */
export function ChoiceRow({
  options,
  value,
  onChange,
  allowClear = true,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  allowClear?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on && allowClear ? "" : option)}
            className={`rounded-full border px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)] ${
              on
                ? "border-[var(--cyan)] bg-[rgba(45,212,212,0.12)] text-[var(--text)]"
                : "border-[rgba(124,58,237,0.3)] text-[var(--muted)] hover:border-[rgba(124,58,237,0.6)]"
            }`}
          >
            <Mono>{option}</Mono>
          </button>
        );
      })}
    </div>
  );
}

/** Multi-choice pill group. */
export function MultiRow({
  options,
  values,
  onChange,
}: {
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const on = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(on ? values.filter((v) => v !== option) : [...values, option])
            }
            className={`rounded-full border px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyan)] ${
              on
                ? "border-[var(--cyan)] bg-[rgba(45,212,212,0.12)] text-[var(--text)]"
                : "border-[rgba(124,58,237,0.3)] text-[var(--muted)] hover:border-[rgba(124,58,237,0.6)]"
            }`}
          >
            <Mono>{option}</Mono>
          </button>
        );
      })}
    </div>
  );
}

/** Scene heading + optional adaptive supporting line. */
export function SceneHeading({
  title,
  support,
  children,
}: {
  title: string;
  support?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <motion.h2
        className="grad-text font-display text-3xl font-light leading-tight md:text-5xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {title}
      </motion.h2>
      {support && (
        <motion.p
          className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {support}
        </motion.p>
      )}
      {children}
    </div>
  );
}

/** Restrained step indicator — dots, not a loud progress bar. */
export function StoryProgress({ step, total }: { step: number; total: number }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Scene ${step} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className="h-px transition-all duration-500"
          style={{
            width: i + 1 === step ? 28 : 14,
            background:
              i + 1 === step
                ? "var(--cyan)"
                : i + 1 < step
                  ? "rgba(124,58,237,0.7)"
                  : "rgba(234,242,248,0.18)",
          }}
        />
      ))}
      <Mono className="ml-2 text-[var(--faint)]">
        {step} / {total}
      </Mono>
    </div>
  );
}
