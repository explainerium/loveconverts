"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ImageIcon, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") || "/dashboard";
  const urlError     = searchParams.get("error");

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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        // Full page reload to ensure cookie is set and proxy recognizes it
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
      {(error || urlError) && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error || (urlError === "CredentialsSignin" ? "Invalid email or password." : "Sign-in failed.")}</span>
        </div>
      )}

      {/* Social Login Buttons */}
      <div className="flex flex-col gap-2">
        <a
          href={`/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          onClick={(e) => { e.preventDefault(); signIn("google", { callbackUrl }); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:border-[#FF4747]/40 hover:shadow-sm transition-all cursor-pointer"
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
          href={`/api/auth/signin/github?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          onClick={(e) => { e.preventDefault(); signIn("github", { callbackUrl }); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:border-[#FF4747]/40 hover:shadow-sm transition-all cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 5.3 3.4 9.8 8.2 11.4.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.7 18 5 18 5c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6C20.6 21.8 24 17.3 24 12c0-6.6-5.4-12-12-12z"/>
          </svg>
          Continue with GitHub
        </a>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="••••••••" required autoComplete="current-password"
              className="w-full px-3.5 py-2.5 pr-10 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-background"
            />
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className={`w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
            loading ? "bg-gray-300 cursor-not-allowed" : "bg-primary hover:bg-primary-hover active:scale-95 shadow-md"
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <ImageIcon size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Love<span className="text-primary">Converts</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground">Welcome back</h1>
          <p className="text-muted text-sm mt-1">Sign in to your account</p>
        </div>

        <Suspense fallback={<div className="bg-card border border-border rounded-2xl p-6 h-48 animate-pulse" />}>
          <SignInForm />
        </Suspense>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
