"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { loginUser } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await loginUser(email, password);
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail("admin@auditgenai.com");
    setPassword("Admin@AuditGen2026");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              AuditGenAI
            </span>
            <Badge variant="primary" size="xs">
              P2
            </Badge>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-4">
            Sign in to AuditGenAI
          </h2>
          <p className="text-xs text-slate-400">
            Cooperative Housing Society Financial Management & Audit
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-6 md:p-8 shadow-xl space-y-5">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/25 p-3.5 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300">
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@auditgenai.com"
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              icon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                className="w-full shadow-md shadow-indigo-600/20"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Platform
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="rounded-xl bg-slate-950/70 border border-slate-800/90 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Initial Super Admin Credentials
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-2"
                >
                  Auto Fill
                </button>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Email: <span className="text-slate-300">admin@auditgenai.com</span>
                <br />
                Password: <span className="text-slate-300">Admin@AuditGen2026</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-500">
          <Link
            href="/"
            className="hover:text-slate-300 transition inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
