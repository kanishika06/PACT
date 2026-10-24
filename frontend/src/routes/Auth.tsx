import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import ParticleField from "../features/landing/ParticleField";
import { Mono } from "../components/primitives";
import { AuthError, continueAsDemo, signIn, signUp } from "../lib/session";
import { hasAnswers, loadProfile } from "../lib/profile";
import { setVisitorName } from "../lib/identity";

type Mode = "signin" | "signup";

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  form?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  function validate(): boolean {
    const next: Errors = {};
    if (mode === "signup" && !name.trim()) next.name = "Tell us what to call you.";
    if (!email.trim()) next.email = "Student email is required.";
    else if (!EMAIL_RE.test(email.trim())) next.email = "That doesn't look like an email address.";
    if (!password) next.password = "Password is required.";
    else if (mode === "signup" && password.length < 8)
      next.password = "Use at least 8 characters.";
    if (mode === "signup" && confirm !== password) next.confirm = "Passwords don't match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  /** Where to go once access is granted. */
  function proceed(fallbackName?: string) {
    if (fallbackName) setVisitorName(fallbackName);
    const profile = loadProfile();
    navigate(profile.completed || hasAnswers(profile) ? "/dashboard" : "/story");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setErrors({});
    try {
      if (mode === "signup") {
        // Password is validated above, then dropped. It is never sent.
        await signUp(name, email);
        proceed(name);
      } else {
        await signIn(email);
        proceed();
      }
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : err instanceof Error && "friendly" in err
            ? (err as { friendly: string }).friendly
            : "Something went wrong. Try again.";
      setErrors({ form: message });
    } finally {
      setBusy(false);
    }
  }

  async function onDemo() {
    setBusy(true);
    setErrors({});
    try {
      await continueAsDemo();
      proceed();
    } catch (err) {
      setErrors({
        form:
          err instanceof AuthError
            ? err.message
            : "Couldn't reach the backend. Is it running on port 8000?",
      });
    } finally {
      setBusy(false);
    }
  }

  const fieldBase =
    "w-full border bg-[rgba(8,9,16,0.6)] px-4 py-3 font-display text-[var(--text)] outline-none transition-colors focus:border-[var(--cyan)] focus-visible:ring-1 focus-visible:ring-[var(--cyan)]";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080910]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 700px at 28% 45%, rgba(99,62,220,0.38), transparent 68%), radial-gradient(600px 500px at 70% 75%, rgba(192,38,211,0.16), transparent 72%)",
        }}
        aria-hidden
      />
      <ParticleField />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 md:px-10">
        <div className="font-display text-lg font-medium tracking-tight text-white">
          TEAMSYNC<span className="text-[var(--cyan)]">.</span>{" "}
          <span className="text-[var(--muted)]">AI</span>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-12 py-12 lg:flex-row lg:items-center lg:gap-20">
          {/* message */}
          <motion.div
            className="max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-4xl font-light leading-[1.05] text-white md:text-5xl">
              Your next chapter starts with you.
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-[var(--muted)]">
              Find your strengths. Discover your people. Build something meaningful.
            </p>
          </motion.div>

          {/* panel */}
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="notched p-px"
              style={{ background: "linear-gradient(160deg, rgba(99,62,220,0.5), rgba(45,212,212,0.3))" }}
            >
              <div className="notched bg-[rgba(10,11,20,0.82)] p-7 backdrop-blur-md">
                <div className="mb-6 flex gap-5" role="tablist" aria-label="Access mode">
                  {(["signin", "signup"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      type="button"
                      aria-selected={mode === m}
                      onClick={() => {
                        setMode(m);
                        setErrors({});
                      }}
                      className={`pb-1 transition-colors ${
                        mode === m
                          ? "border-b border-[var(--cyan)] text-[var(--text)]"
                          : "text-[var(--faint)] hover:text-[var(--muted)]"
                      }`}
                    >
                      <Mono>{m === "signin" ? "Sign in" : "Create account"}</Mono>
                    </button>
                  ))}
                </div>

                <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
                  {mode === "signup" && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="auth-name">
                        <Mono className="text-[var(--faint)]">Full name</Mono>
                      </label>
                      <input
                        id="auth-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? "auth-name-err" : undefined}
                        className={`${fieldBase} ${
                          errors.name ? "border-[#f6b8ff]" : "border-[rgba(124,58,237,0.35)]"
                        }`}
                      />
                      {errors.name && (
                        <Mono id="auth-name-err" className="text-[#f6b8ff]">
                          {errors.name}
                        </Mono>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-email">
                      <Mono className="text-[var(--faint)]">Student email</Mono>
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete={mode === "signup" ? "email" : "username"}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "auth-email-err" : undefined}
                      className={`${fieldBase} ${
                        errors.email ? "border-[#f6b8ff]" : "border-[rgba(124,58,237,0.35)]"
                      }`}
                    />
                    {errors.email && (
                      <Mono id="auth-email-err" className="text-[#f6b8ff]">
                        {errors.email}
                      </Mono>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-password">
                      <Mono className="text-[var(--faint)]">Password</Mono>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? "auth-password-err" : undefined}
                        className={`${fieldBase} pr-16 ${
                          errors.password ? "border-[#f6b8ff]" : "border-[rgba(124,58,237,0.35)]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--faint)] transition-colors hover:text-[var(--text)]"
                      >
                        <Mono>{showPassword ? "Hide" : "Show"}</Mono>
                      </button>
                    </div>
                    {errors.password && (
                      <Mono id="auth-password-err" className="text-[#f6b8ff]">
                        {errors.password}
                      </Mono>
                    )}
                  </div>

                  {mode === "signup" && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="auth-confirm">
                        <Mono className="text-[var(--faint)]">Confirm password</Mono>
                      </label>
                      <input
                        id="auth-confirm"
                        type={showPassword ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.confirm)}
                        aria-describedby={errors.confirm ? "auth-confirm-err" : undefined}
                        className={`${fieldBase} ${
                          errors.confirm ? "border-[#f6b8ff]" : "border-[rgba(124,58,237,0.35)]"
                        }`}
                      />
                      {errors.confirm && (
                        <Mono id="auth-confirm-err" className="text-[#f6b8ff]">
                          {errors.confirm}
                        </Mono>
                      )}
                    </div>
                  )}

                  {errors.form && (
                    <div role="alert">
                      <Mono className="text-[#f6b8ff]">{errors.form}</Mono>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="notched-sm mt-2 w-full py-3 text-[#06121a] transition-opacity disabled:opacity-50"
                    style={{ background: "linear-gradient(120deg, #6b4ddb, var(--cyan))" }}
                  >
                    <Mono className="font-medium">
                      {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
                    </Mono>
                  </button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[rgba(234,242,248,0.12)]" />
                  <Mono className="text-[var(--faint)]">or</Mono>
                  <span className="h-px flex-1 bg-[rgba(234,242,248,0.12)]" />
                </div>

                <button
                  type="button"
                  onClick={onDemo}
                  disabled={busy}
                  className="w-full border border-[rgba(124,58,237,0.4)] py-3 text-[var(--muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--text)] disabled:opacity-50"
                >
                  <Mono>Continue with demo</Mono>
                </button>

                {/* The single most important sentence on this screen. */}
                <p className="mt-5 text-[11px] leading-relaxed text-[var(--faint)]">
                  Demo access, not authentication. This project has no sign-in on the
                  server — your password is checked for format only, then discarded. It is
                  never sent or stored. Creating an account adds a name and email to the
                  demo database.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
