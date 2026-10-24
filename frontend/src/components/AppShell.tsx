import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Mono } from "./primitives";
import { clearIdentity, getIdentity } from "../lib/identity";
import { clearAccess } from "../lib/session";
import { useDbHealth } from "../lib/queries";

/** Aperture mark from reference 2 — concentric ring with a cyan/violet glow. */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: "conic-gradient(from 210deg, var(--cyan), var(--violet), var(--magenta), var(--cyan))",
        filter: "drop-shadow(0 0 10px rgba(124,58,237,0.55))",
      }}
    >
      <div
        className="absolute rounded-full bg-[var(--deep)]"
        style={{ inset: size * 0.16 }}
      />
      <div
        className="absolute rounded-full"
        style={{
          inset: size * 0.3,
          background: "radial-gradient(circle at 35% 35%, var(--cyan), var(--violet))",
          opacity: 0.85,
        }}
      />
    </div>
  );
}

/**
 * Shared chrome for the signed-in screens: logo, identity, DB status.
 * Reference 2's layout — corner-anchored, faint perspective rays behind.
 */
export default function AppShell({
  children,
  badge,
}: {
  children: ReactNode;
  badge?: string;
}) {
  const navigate = useNavigate();
  const identity = getIdentity();
  const health = useDbHealth();
  const dbDown = health.isError;

  return (
    <div className="relative min-h-screen bg-[var(--deep)]">
      <div className="rays pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -10%, rgba(124,58,237,0.16), transparent 70%)",
        }}
        aria-hidden
      />

      {dbDown && (
        <div className="relative z-20 bg-[rgba(192,38,211,0.18)] py-2 text-center">
          <Mono className="text-[#f6b8ff]">Database offline — data may be stale</Mono>
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-10">
        <Link to="/dashboard" className="flex items-center gap-3">
          <LogoMark />
          <div className="hidden sm:block">
            <div className="font-display text-lg leading-none text-[var(--text)]">TeamSync AI</div>
            <Mono className="text-[var(--faint)]">From ideas to execution</Mono>
          </div>
        </Link>

        {badge && (
          <div className="hidden md:block">
            <div className="inline-block rounded-full p-px" style={{ background: "var(--grad)" }}>
              <div className="rounded-full bg-[#0c1a22] px-4 py-1.5">
                <Mono className="text-[var(--muted)]">{badge}</Mono>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {identity && (
            <div className="hidden text-right sm:block">
              <div className="font-display text-sm text-[var(--text)]">{identity.name}</div>
              <Mono className="text-[var(--faint)]">Demo identity</Mono>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              clearIdentity();
              clearAccess();
              navigate("/auth");
            }}
            title="Sign out of demo access"
            className="notched-sm flex h-11 w-11 items-center justify-center border border-[rgba(124,58,237,0.4)] bg-[var(--raised)] transition-colors hover:border-[var(--cyan)]"
          >
            <div className="flex flex-col items-end gap-1">
              <span className="block h-px w-4 bg-[var(--muted)]" />
              <span className="block h-px w-3 bg-[var(--muted)]" />
              <span className="block h-px w-4 bg-[var(--muted)]" />
            </div>
          </motion.button>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-20 md:px-10">{children}</main>
    </div>
  );
}
