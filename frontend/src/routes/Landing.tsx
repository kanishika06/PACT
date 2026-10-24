import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import ParticleField from "../features/landing/ParticleField";
import { Mono } from "../components/primitives";
import { setVisitorName } from "../lib/identity";

const HEADLINE = "But first — who's building?";

export default function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setVisitorName(name);
    navigate("/auth");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--void)]">
      {/* violet nebula behind the particles */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 700px at 50% 45%, rgba(124,58,237,0.42), transparent 65%), radial-gradient(600px 500px at 30% 70%, rgba(192,38,211,0.22), transparent 70%)",
        }}
        aria-hidden
      />
      <ParticleField />

      {/* corner HUD */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between p-6 md:p-10">
        <div className="flex items-start justify-between">
          <div className="font-display text-xl font-medium tracking-tight text-white">
            TEAMSYNC<span className="text-[var(--cyan)]">.</span>
          </div>
          <Mono className="hidden text-[var(--muted)] md:block">From ideas to execution</Mono>
          <Mono className="text-[var(--faint)]">Demo build</Mono>
        </div>

        <div className="mx-auto w-full max-w-3xl text-center">
          <motion.h1
            className="font-display text-4xl font-light leading-tight text-white md:text-6xl"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.04 } } }}
          >
            {HEADLINE.split(" ").map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: 14, filter: "blur(8px)" },
                  shown: { opacity: 1, y: 0, filter: "blur(0px)" },
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="mx-auto mt-5 max-w-md text-sm text-[var(--muted)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Create projects, split the work, and let AI draft the task list.
          </motion.p>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Enter your full name"
                aria-label="Your full name"
                maxLength={120}
                autoFocus
                className="w-full border border-[rgba(234,242,248,0.18)] bg-[rgba(10,10,25,0.45)] px-6 py-5 text-center font-display text-lg text-white outline-none backdrop-blur-sm transition-colors focus:border-[rgba(234,242,248,0.4)]"
              />
              {/* gradient sweep on focus */}
              <motion.div
                className="absolute bottom-0 left-0 h-px"
                style={{ background: "var(--grad)" }}
                initial={{ width: "0%" }}
                animate={{ width: focused ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={!name.trim()} className="disabled:opacity-30">
                <Mono className="text-[var(--muted)] transition-colors hover:text-white">
                  Press enter ⏎
                </Mono>
              </button>
            </div>
          </motion.form>

          <div className="mt-8 flex items-end justify-between">
            <Mono className="text-[var(--faint)]">
              {name.trim() ? "Progress 50%" : "Progress 0%"}
            </Mono>
            <Mono className="hidden max-w-xs text-right text-[var(--faint)] md:block">
              This build uses AI to draft project tasks.
              <br />
              No account needed — a demo identity is chosen next.
            </Mono>
          </div>
        </div>
      </div>
    </div>
  );
}
