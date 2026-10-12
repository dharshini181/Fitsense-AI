"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If we arrived here from the onboarding style picker, there'll be a
  // pending style selection waiting in sessionStorage — surface that so
  // signing up doesn't silently lose it.
  const [pendingStyles, setPendingStyles] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fitsense_onboarding_styles");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPendingStyles(JSON.parse(raw));
    } catch {
      // ignore malformed/missing storage
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signup") {
        await authApi.signup({ name, email, password });

        // Apply the style chosen during onboarding, if any. Best-effort —
        // failing to save a preference shouldn't block the person from
        // getting into their new account.
        if (pendingStyles.length > 0) {
          try {
            await authApi.updateProfile({
              style_preference: pendingStyles.slice(0, 2).join(", ").slice(0, 60),
            });
          } catch {
            // non-fatal
          } finally {
            sessionStorage.removeItem("fitsense_onboarding_styles");
          }
        }
      } else {
        await authApi.login({ email, password });
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-container-padding-mobile md:px-container-padding-desktop py-4 antialiased text-on-surface">
      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="flex justify-center mb-3">
          <Link href="/">
            <img
              src="/logo/fitsense-logo.png"
              alt="FitSense AI"
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-3xl md:text-4xl font-bold text-on-surface mb-1">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {mode === "signup"
              ? "Let's get your wardrobe curated."
              : "Curate your style intelligence."}
          </p>
          {mode === "signup" && pendingStyles.length > 0 && (
            <p className="text-xs text-primary mt-1">
              We&apos;ll apply your style pick ({pendingStyles.join(", ")}) once you sign up.
            </p>
          )}
        </div>

        {/* Login / Signup toggle */}
        <div className="flex rounded-full bg-surface-variant/40 p-1 mb-3">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 h-9 rounded-full text-sm font-semibold transition-colors ${
              mode === "login" ? "bg-primary-container text-on-surface" : "text-on-surface-variant"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 h-9 rounded-full text-sm font-semibold transition-colors ${
              mode === "signup" ? "bg-primary-container text-on-surface" : "text-on-surface-variant"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="glass-card rounded-[24px] p-5 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-xs font-medium text-on-surface-variant">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field w-full h-11 rounded-xl px-4 text-sm text-on-surface placeholder:text-on-surface-variant/40"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-xs font-medium text-on-surface-variant">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                  <Mail className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full h-11 rounded-xl pl-12 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-medium text-on-surface-variant">
                  Password{mode === "signup" ? " (at least 8 characters)" : ""}
                </label>
                {mode === "login" && (
                  <span className="text-xs font-medium text-on-surface-variant/50" title="Password reset isn't available yet">
                    Forgot?
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">
                  <Lock className="w-[18px] h-[18px]" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full h-11 rounded-xl pl-12 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-12 font-semibold text-sm mt-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === "signup" ? "Create Account" : "Sign In"}
                  <ArrowRight className="w-[18px] h-[18px]" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-3 text-center">
          <p className="text-sm text-on-surface-variant">
            {mode === "signup" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-on-surface hover:text-primary transition-colors">
                  Sign In
                </button>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-on-surface hover:text-primary transition-colors">
                  Sign Up
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}