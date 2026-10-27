"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type User = { name: string };
export type SavedScore = { game: string; score: number; name: string; at: number };

type Session = {
  user: User | null;
  login: (name: string) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const SessionContext = createContext<Session | null>(null);

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Render inicial como invitado; localStorage solo se lee tras montar para evitar mismatch de hidratación.
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(readJSON<User | null>(USER_KEY, null));
  }, []);

  const login = useCallback((name: string) => {
    const next: User = { name: (name.trim() || "PLAYER1").toUpperCase().slice(0, 10) };
    setUser(next);
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(USER_KEY);
    } catch {}
  }, []);

  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    try {
      const all = readJSON<SavedScore[]>(SCORES_KEY, []);
      all.push({ ...entry, at: Date.now() });
      localStorage.setItem(SCORES_KEY, JSON.stringify(all));
    } catch {}
  }, []);

  const value = useMemo(() => ({ user, login, signOut, saveScore }), [user, login, signOut, saveScore]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
