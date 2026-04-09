import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useCallback, useEffect, useState } from "react";
import { createActor } from "../backend";

export type UserRole = "Customer" | "Seller" | "Admin" | null;

export interface AuthState {
  // Shared
  isAuthenticated: boolean;
  isInitializing: boolean;
  logout: () => void;

  // Email/password auth
  email: string | null;
  userId: string | null;
  role: UserRole;
  login: (
    email: string,
    password: string,
  ) => Promise<
    { ok: true } | { err: string; locked?: boolean; remainingSecs?: number }
  >;
  signup: (
    email: string,
    password: string,
    role: "Customer" | "Seller",
    requestAdmin?: boolean,
  ) => Promise<{ ok: true } | { err: string }>;

  // Internet Identity (admin flow — kept intact)
  iiIsAuthenticated: boolean;
  iiLogin: () => void;
  iiLogout: () => void;
  iiPrincipal: string | null;
  iiDisplayName: string | null;
  iiIsInitializing: boolean;
}

// ─── Local storage schema ────────────────────────────────────────────────────
const SESSION_KEY = "sa_session";
const USERS_KEY = "sa_users";

interface StoredUser {
  email: string;
  passwordHash: string;
  role: "Customer" | "Seller";
  pendingAdmin: boolean;
}

interface Session {
  email: string;
  userId: string;
  role: "Customer" | "Seller";
}

/** Very lightweight hash — NOT cryptographic, just avoids plaintext storage */
async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(`${password}sa_salt_2026`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loadUsers(): Record<string, StoredUser> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredUser>) : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, StoredUser>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(() => loadSession());
  const [isInitializing, setIsInitializing] = useState(true);
  const { actor } = useActor(createActor);

  // Internet Identity (admin flow)
  const {
    identity,
    login: iiLoginFn,
    clear: iiClear,
    isInitializing: iiIsInitializing,
  } = useInternetIdentity();

  // Rehydrate session on mount
  useEffect(() => {
    const stored = loadSession();
    setSession(stored);
    setIsInitializing(false);
  }, []);

  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<
      { ok: true } | { err: string; locked?: boolean; remainingSecs?: number }
    > => {
      const normalizedEmail = email.toLowerCase().trim();

      // Check lockout before anything else
      if (actor) {
        try {
          const lockStatus = await actor.checkLoginLockout(normalizedEmail);
          if (lockStatus.locked) {
            const secs = Number(lockStatus.remainingSecs);
            return {
              err: `Account locked. Try again in ${Math.ceil(secs / 60)} minute${secs >= 120 ? "s" : ""}.`,
              locked: true,
              remainingSecs: secs,
            };
          }
        } catch {
          // Backend unavailable — proceed with local auth
        }
      }

      const users = loadUsers();
      const user = users[normalizedEmail];

      if (!user) {
        // Record failure for unknown email attempts (soft fail)
        if (actor) {
          try {
            await actor.recordLoginFailure(normalizedEmail);
          } catch {
            /* noop */
          }
        }
        return { err: "No account found with that email." };
      }

      const hash = await hashPassword(password);
      if (hash !== user.passwordHash) {
        // Record failed attempt
        if (actor) {
          try {
            await actor.recordLoginFailure(normalizedEmail);
          } catch {
            /* noop */
          }
        }
        return { err: "Incorrect password." };
      }

      // Success — clear attempts
      if (actor) {
        try {
          await actor.clearLoginAttempts(normalizedEmail);
        } catch {
          /* noop */
        }
      }

      const newSession: Session = {
        email: normalizedEmail,
        userId: normalizedEmail,
        role: user.role,
      };
      saveSession(newSession);
      setSession(newSession);
      return { ok: true };
    },
    [actor],
  );

  const signup = useCallback(
    async (
      email: string,
      password: string,
      role: "Customer" | "Seller",
      requestAdmin = false,
    ): Promise<{ ok: true } | { err: string }> => {
      if (!email.trim() || !password)
        return { err: "Email and password are required." };
      if (password.length < 6)
        return { err: "Password must be at least 6 characters." };

      const normalizedEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail))
        return { err: "Please enter a valid email address." };

      const users = loadUsers();
      if (users[normalizedEmail])
        return { err: "An account with this email already exists." };

      const passwordHash = await hashPassword(password);
      users[normalizedEmail] = {
        email: normalizedEmail,
        passwordHash,
        role: role,
        pendingAdmin: requestAdmin,
      };
      saveUsers(users);

      const newSession: Session = {
        email: normalizedEmail,
        userId: normalizedEmail,
        role: role,
      };
      saveSession(newSession);
      setSession(newSession);
      return { ok: true };
    },
    [],
  );

  const logout = useCallback(() => {
    saveSession(null);
    setSession(null);
    // Also clear II session if active
    iiClear();
  }, [iiClear]);

  // II helpers
  const iiPrincipal = identity ? identity.getPrincipal().toText() : null;
  const iiDisplayName = iiPrincipal ? `User ${iiPrincipal.slice(0, 5)}…` : null;

  const iiLogout = useCallback(() => {
    iiClear();
  }, [iiClear]);

  return {
    isAuthenticated: !!session,
    isInitializing,
    email: session?.email ?? null,
    userId: session?.userId ?? null,
    role: session?.role ?? null,
    login,
    signup,
    logout,

    iiIsAuthenticated: !!identity,
    iiLogin: iiLoginFn,
    iiLogout,
    iiPrincipal,
    iiDisplayName,
    iiIsInitializing,
  };
}
