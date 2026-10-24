import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import NotchedCard from "../components/NotchedCard";
import { LogoMark } from "../components/AppShell";
import { Badge, Display, EmptyState, Mono, Skeleton } from "../components/primitives";
import { useUsers } from "../lib/queries";
import { getVisitorName, setIdentity } from "../lib/identity";
import type { User } from "../types/api";

/** Descending staircase offsets from reference 2. */
const STEP = [0, 32, 64, 96, 128];

export default function Login() {
  const navigate = useNavigate();
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const visitor = getVisitorName();

  function choose(user: User) {
    setIdentity(user);
    navigate("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--deep)]">
      <div className="rays pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1000px 500px at 50% -5%, rgba(45,212,212,0.12), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 md:px-10">
        <div className="flex items-center justify-between">
          <LogoMark />
          <Badge>Select your identity</Badge>
          <div className="w-11" />
        </div>

        <div className="mt-12 text-center md:mt-16">
          <Display className="text-5xl md:text-7xl">
            {visitor ? `Welcome, ${visitor.split(" ")[0]}.` : "Who are you"}
            <br />
            {visitor ? "Who are you building as?" : "building as?"}
          </Display>
          <p className="mx-auto mt-5 max-w-sm text-sm text-[var(--muted)]">
            Pick a demo identity to continue. This project has no sign-in — anyone can
            choose any identity.
          </p>
        </div>

        <div className="mt-14 flex-1">
          {isLoading && (
            <div className="flex flex-wrap items-start justify-center gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ marginTop: STEP[i] }}>
                  <Skeleton className="h-64 w-44" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <EmptyState
              title="Can't reach the backend"
              hint={error.friendly}
              action={
                <button
                  onClick={() => refetch()}
                  className="notched-sm mt-2 px-5 py-2.5 text-[#06121a]"
                  style={{ background: "var(--grad)" }}
                >
                  <Mono className="font-medium">Retry</Mono>
                </button>
              }
            />
          )}

          {users && users.length === 0 && (
            <EmptyState
              title="No demo users yet"
              hint={
                <>
                  Seed the database first — run{" "}
                  <code className="mono-micro text-[var(--cyan)]">python -m backend.seed</code>{" "}
                  from the repository root, then retry.
                </>
              }
              action={
                <button
                  onClick={() => refetch()}
                  className="notched-sm mt-2 px-5 py-2.5 text-[#06121a]"
                  style={{ background: "var(--grad)" }}
                >
                  <Mono className="font-medium">Retry</Mono>
                </button>
              }
            />
          )}

          {users && users.length > 0 && (
            <motion.div
              className="flex flex-wrap items-start justify-center gap-5"
              initial="hidden"
              animate="shown"
              variants={{ shown: { transition: { staggerChildren: 0.06 } } }}
            >
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  style={{ marginTop: STEP[i % STEP.length] }}
                  variants={{
                    hidden: { opacity: 0, y: 28 },
                    shown: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <NotchedCard
                    interactive
                    onClick={() => choose(user)}
                    className="h-64 w-44"
                    innerClassName="flex h-full flex-col justify-between p-5"
                  >
                    <div
                      className="h-8 w-8 rounded-full"
                      style={{
                        background: "var(--grad)",
                        opacity: 0.8,
                      }}
                    />
                    <div>
                      <Mono className="block text-[var(--text)]">{user.name}</Mono>
                      <span className="mt-2 block truncate text-[11px] text-[var(--faint)]">
                        {user.email}
                      </span>
                      {user.skills && user.skills.length > 0 && (
                        <span className="mt-3 block text-[11px] text-[var(--muted)]">
                          {user.skills.slice(0, 2).join(" · ")}
                        </span>
                      )}
                    </div>
                    <span className="text-[var(--muted)]">↓</span>
                  </NotchedCard>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
