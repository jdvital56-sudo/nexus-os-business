"use client";

import { useState } from "react";
import { useAuth, useUI } from "@/lib/store";
import { Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";

export function AuthPage() {
  const { login, register } = useAuth();
  const { addNotification } = useUI();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", orgName: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        addNotification("success", "Welcome back!");
      } else {
        await register(form.email, form.password, form.name, form.orgName || undefined);
        addNotification("success", "Account created! Welcome to Nexus OS.");
      }
    } catch (err: any) {
      addNotification("error", err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-0 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg">N</div>
            <span className="text-xl font-bold">Nexus OS</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-6">
            Build any business<br />
            <span className="text-brand-400">in minutes.</span>
          </h2>
          <p className="text-white/60 text-lg max-w-md">
            Universal business operating system with AI-powered CRM, websites, automations, and intelligent agents — all in one platform.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {["AI First", "Modular", "API First", "Low-Code", "Multi-Tenant", "Cloud Native"].map((f) => (
            <div key={f} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/50 border border-white/5">{f}</div>
          ))}
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-1">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg">N</div>
            <span className="text-xl font-bold">Nexus OS</span>
          </div>

          <h3 className="text-2xl font-bold mb-1">{mode === "login" ? "Welcome back" : "Create your account"}</h3>
          <p className="text-sm text-dark-3 mb-8">
            {mode === "login" ? "Sign in to your workspace" : "Start building your business in minutes"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-dark-2 mb-1.5">Full Name</label>
                  <input className="input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-2 mb-1.5">Organization Name <span className="text-dark-3">(optional)</span></label>
                  <input className="input" placeholder="My Company" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1.5">Email</label>
              <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-2 mb-1.5">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-3 hover:text-dark-0">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-dark-3 mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-brand-600 font-medium hover:underline">
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
