"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  studentProfile?: any;
  facultyProfile?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (targetRole: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS: Record<string, { email: string; pass: string; label: string }> = {
  SUPER_ADMIN: { email: "admin@edumerge.com", pass: "Admin@123", label: "Super Admin (Dr. Sharma)" },
  ACADEMIC_ADMIN: { email: "dean@edumerge.com", pass: "Dean@123", label: "Academic Dean (Prof. Roy)" },
  FINANCE_OFFICER: { email: "finance@edumerge.com", pass: "Finance@123", label: "Finance Officer (Suresh Patel)" },
  FACULTY: { email: "faculty@edumerge.com", pass: "Faculty@123", label: "Faculty (Dr. Vikram Rao)" },
  COUNSELLOR: { email: "counsellor@edumerge.com", pass: "Lead@123", label: "Admissions (Priya Singh)" },
  STUDENT: { email: "student@edumerge.com", pass: "Student@123", label: "Student (Aarav Gupta)" },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json.data.user);
        router.push("/dashboard");
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const switchRole = async (targetRole: string) => {
    const creds = DEMO_CREDENTIALS[targetRole];
    if (!creds) return false;
    return login(creds.email, creds.pass);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
