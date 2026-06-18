"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Crown, LogIn, UserPlus, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (isRegister) {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
      } else {
        setSuccess("Registrasi berhasil! Cek email untuk verifikasi, atau langsung login.");
        setIsRegister(false);
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message === "Invalid login credentials" ? "Email atau password salah" : err.message);
      }
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 text-brand mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-brand">SULTAN</h1>
          <p className="text-white/40 mt-1">Sistem HPP Kopi Brand Sultan</p>
        </div>

        <div className="bg-cream rounded-xl p-6 shadow-xl border border-white/10">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            {isRegister ? "Buat Akun Baru" : "Masuk ke Akun"}
          </h2>

          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-900/30 border border-emerald-700 text-emerald-300 px-4 py-3 rounded-lg">
              <p className="text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-white/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-white/20 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white font-semibold px-4 py-3 rounded-lg hover:bg-brand-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  Daftar
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Masuk
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-brand hover:text-brand-light transition-colors"
            >
              {isRegister
                ? "Sudah punya akun? Masuk"
                : "Belum punya akun? Daftar"}
            </button>
          </div>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          Kopi Sultan &copy; 2026
        </p>
      </div>
    </div>
  );
}
