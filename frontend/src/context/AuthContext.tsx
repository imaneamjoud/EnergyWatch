"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/types";
import { checkPassword, demoUsers } from "@/mocks/users";

const KEY = "ei_user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => boolean;
  logout: () => void;
  updateSession: (user: User) => void;
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
    const found = demoUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found || found.active === false || !checkPassword(found.id, password)) return false;
    const session = { ...found };
    setUser(session);
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  };

  // Met à jour l'utilisateur affiché (profil modifié) dans le stockage où la session a été enregistrée
  const updateSession = (next: User) => {
    setUser(next);
    if (localStorage.getItem(KEY)) localStorage.setItem(KEY, JSON.stringify(next));
    else if (sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, JSON.stringify(next));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
