/**
 * Demo access state — NOT authentication.
 *
 * The backend has no auth: no login endpoint, no password field, no session,
 * no token. Nothing in this file verifies anyone's identity.
 *
 * What it actually does:
 *   - Sign up   -> POST /api/users, which creates a REAL row (name + email).
 *                  The password is validated in the form, then discarded. It
 *                  is never transmitted and never stored.
 *   - Sign in   -> GET /api/users and match on email. Anyone who types a
 *                  known email is "signed in". The password is ignored.
 *   - Demo      -> bind to the first seeded user.
 *
 * Passwords are never written to localStorage, sessionStorage, or the network.
 * Replacing this module is the whole job when real auth lands; see
 * `AUTH_CONTRACT` at the bottom for what the backend would need to expose.
 */

import { api, ApiError } from "./api";
import { setIdentity } from "./identity";
import type { User } from "../types/api";

const ACCESS_KEY = "teamsync.demoAccess";

export type AccessMode = "signin" | "signup" | "demo";

export interface DemoAccess {
  /** How this session started — surfaced in the UI so it is never mistaken
   *  for a verified login. */
  mode: AccessMode;
  userId: string;
  startedAt: string;
}

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — access just won't survive a reload */
  }
}

export function getAccess(): DemoAccess | null {
  const raw = safeRead(ACCESS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoAccess;
    return parsed?.userId ? parsed : null;
  } catch {
    return null;
  }
}

function grant(mode: AccessMode, user: User): DemoAccess {
  const access: DemoAccess = {
    mode,
    userId: user.id,
    startedAt: new Date().toISOString(),
  };
  safeWrite(ACCESS_KEY, JSON.stringify(access));
  setIdentity(user);
  return access;
}

export function clearAccess(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
  } catch {
    /* ignore */
  }
}

export class AuthError extends Error {}

/**
 * Creates a real user row. The password argument is accepted only so the
 * caller cannot accidentally send it somewhere else — it is deliberately
 * unused here, and no part of it reaches the network or storage.
 */
export async function signUp(name: string, email: string): Promise<DemoAccess> {
  try {
    const user = await api.post<User>("/api/users", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      skills: null,
    });
    return grant("signup", user);
  } catch (err) {
    if (err instanceof ApiError && err.status === 400) {
      throw new AuthError("An account already exists for that email. Try signing in.");
    }
    throw err;
  }
}

/** Matches an existing user by email. The password is not checked — it cannot
 *  be, because the backend does not store one. */
export async function signIn(email: string): Promise<DemoAccess> {
  const users = await api.get<User[]>("/api/users");
  const match = users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!match) {
    throw new AuthError("No demo account with that email. Create one, or continue with demo.");
  }
  return grant("signin", match);
}

/** Binds to the first seeded user so the workspace is reachable in one click. */
export async function continueAsDemo(): Promise<DemoAccess> {
  const users = await api.get<User[]>("/api/users");
  if (users.length === 0) {
    throw new AuthError(
      "No demo users exist yet. Run `python -m backend.seed` from the repository root.",
    );
  }
  return grant("demo", users[0]);
}

/**
 * What the backend would need for this to become real authentication.
 * Nothing below is implemented today.
 */
export const AUTH_CONTRACT = `
POST /api/auth/signup  { name, email, password }     -> 201 { user, access_token }
POST /api/auth/login   { email, password }           -> 200 { user, access_token }
POST /api/auth/logout                                -> 204
GET  /api/auth/me      Authorization: Bearer <token> -> 200 { user }

Requires on the backend: a password_hash column, hashing (argon2/bcrypt),
token issuing and verification, and a dependency that resolves the current
user so owner_id/assignee_id stop being client-supplied.
` as const;
