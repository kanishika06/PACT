/**
 * Demo identity, not authentication.
 *
 * The backend has no auth: no login endpoint, no session, no token. The user
 * picks a demo user from GET /api/users and that UUID is kept here, then sent
 * as owner_id / assignee_id. Anyone can pick any identity — that is understood
 * and surfaced in the UI.
 */

import type { User } from "../types/api";

const USER_KEY = "teamsync.identity";
const NAME_KEY = "teamsync.visitorName";

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
    /* private mode or blocked storage — identity just won't persist */
  }
}

export function getIdentity(): User | null {
  const raw = safeRead(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function setIdentity(user: User): void {
  safeWrite(USER_KEY, JSON.stringify(user));
}

export function clearIdentity(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

/** The name typed on the landing page, used only for the greeting. */
export function getVisitorName(): string {
  return safeRead(NAME_KEY) ?? "";
}

export function setVisitorName(name: string): void {
  safeWrite(NAME_KEY, name.trim());
}
