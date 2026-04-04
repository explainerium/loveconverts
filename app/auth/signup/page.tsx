"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ImageIcon, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",  pass: password.length >= 8 },
    { label: "Uppercase",      pass: /[A-Z]/.test(password) },
    { label: "Lowercase",      pass: /[a-z]/.test(password) },
    { label: "Number",         pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const bar   = ["bg-gray-200", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"][score];

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? bar : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span key={c.label} className={`text-[10px] flex items-center gap-0.5 ${c.pass ? "text-green-600" : "text-gray-400"}`}>
            {c.pass ? <CheckCircle2 size={9} /> : <span className="w-[9px]" />} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto sign-in after registration
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Account created! Please sign in.");
        window.location.href = "/auth/signin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <ImageIcon size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Love<span className="text-primary">Converts</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground">Create your account</h1>
          <p className="text-muted text-sm mt-1">Free forever. No credit card required.</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name <span className="text-muted font-normal">(optional)</span></label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith" autoComplete="name"
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                loading ? "bg-gray-300 cursor-not-allowed" : "bg-primary hover:bg-primary-hover active:scale-95 shadow-md"
              }`}
            >
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Create Account"}
            </button>
          </form>

          <p className="text-[11px] text-center text-muted">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons — use direct links as fallback */}
          <div className="flex flex-col gap-2">
            <a
              href="/api/auth/signin/google?callbackUrl=/dashboard"
              onClick={(e) => { e.preventDefault(); signIn("google", { callbackUrl: "/dashboard" }); }}
              className="w-full py-2.5 rounded-xl text-sm font-medium border border-border hover:border-[#FF4747]/40 hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.5 33.1 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.2-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.1 0-9.4-2.9-11.3-7.1l-6.5 5C9.8 39.8 16.4 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.6-2.6 4.8-4.9 6.3l6.2 5.2C40.3 36.2 44 30.6 44 24c0-1.3-.2-2.7-.4-4z"/>
              </svg>
              Continue with Google
            </a>

            <a
              href="/api/auth/signin/github?callbackUrl=/dashboard"
              onClick={(e) => { e.preventDefault(); signIn("github", { callbackUrl: "/dashboard" }); }}
              className="w-full py-2.5 rounded-xl text-sm font-medium border border-border hover:border-[#FF4747]/40 hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.6-5.4-12-12-12z"/>
              </svg>
              Continue with GitHub
            </a>
          </div>
        </div>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}