"use client";

import React, { useState } from "react";
import { AuthProvider, useAuth, DEMO_CREDENTIALS } from "@/lib/auth/client-auth";
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

function LoginForm() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("admin@edumerge.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const ok = await login(email, password);
    if (!ok) {
      setError("Invalid credentials. Try using one of the 1-click demo logins below.");
    }
    setSubmitting(false);
  };

  const handleDemoSelect = (roleKey: string) => {
    const creds = DEMO_CREDENTIALS[roleKey];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.pass);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/25">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Edumerge-360</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enterprise Campus Operating System • Pre-Drive Engineering Evaluation
          </p>
        </div>

        {/* Login Box */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@edumerge.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/90 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              <span>{submitting ? "Authenticating..." : "Sign In to Campus OS"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* 1-Click Demo Personas */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>1-Click Evaluator Personas (Live RBAC)</span>
              </div>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                Pre-Loaded
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {Object.entries(DEMO_CREDENTIALS).map(([roleKey, data]) => (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleDemoSelect(roleKey)}
                  className={`flex flex-col rounded-lg border p-2.5 transition-all text-left ${
                    email === data.email
                      ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <span className="text-[11px] font-bold text-white">{data.label}</span>
                  <span className="text-[10px] text-slate-400">{roleKey}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Bcrypt Hashed • JWT Stateless Tokens • Multi-tenant RBAC Enforced</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
