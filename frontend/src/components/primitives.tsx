import type { ReactNode } from "react";
import { motion } from "framer-motion";

/** Uppercase mono micro-type — used for every label in the references. */
export function Mono({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`mono-micro ${className}`}>{children}</span>;
}

/** The pill badge from reference 2 ("BEGIN YOUR JOURNEY"). */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-block rounded-full p-px" style={{ background: "var(--grad)" }}>
      <div className="rounded-full bg-[#0c1a22] px-4 py-1.5">
        <Mono className="text-[var(--muted)]">{children}</Mono>
      </div>
    </div>
  );
}

/** Large light display heading with the white → pale-cyan gradient fill. */
export function Display({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={`grad-text font-display font-light leading-[0.95] tracking-tight ${className}`}
    >
      {children}
    </h1>
  );
}

/** Primary action — gradient fill, notched, mono label. */
export function GradientButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`notched-sm px-6 py-3 text-[#06121a] disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      style={{ background: "var(--grad)" }}
    >
      <Mono className="font-medium">{children}</Mono>
    </motion.button>
  );
}

/** Secondary action — outlined. */
export function GhostButton({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`notched-sm border border-[rgba(124,58,237,0.45)] bg-[var(--raised)] px-5 py-2.5 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)] disabled:opacity-40 ${className}`}
    >
      <Mono>{children}</Mono>
    </motion.button>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[rgba(234,242,248,0.07)] ${className}`}
      aria-hidden
    />
  );
}

/** Priority chip. High reads hot, Low reads quiet. */
export function PriorityChip({ priority }: { priority: "Low" | "Medium" | "High" }) {
  const tone = {
    High: "border-[rgba(192,38,211,0.5)] text-[#f0a6ff]",
    Medium: "border-[rgba(124,58,237,0.5)] text-[#c4b5fd]",
    Low: "border-[rgba(45,212,212,0.4)] text-[#9adcdc]",
  }[priority];

  return (
    <span className={`mono-micro rounded-full border px-2 py-0.5 ${tone}`}>{priority}</span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div
        className="h-10 w-10 rounded-full opacity-50"
        style={{ background: "var(--grad)", filter: "blur(2px)" }}
      />
      <p className="font-display text-lg text-[var(--text)]">{title}</p>
      {hint && <p className="max-w-sm text-sm text-[var(--muted)]">{hint}</p>}
      {action}
    </div>
  );
}
