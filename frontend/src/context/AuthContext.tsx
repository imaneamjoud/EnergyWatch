"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/types";
import { demoUsers, DEMO_PASSWORD } from "@/mocks/users";

const KEY = "ei_user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    }
    setLoading(false);
  }, []);

  const login = (email: string, password: string, remember = true) => {
    const found = demoUsers.find((u) => u.email === email);
    if (!found || found.active === false || password !== DEMO_PASSWORD) return false;
    setUser(found);
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(found));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
