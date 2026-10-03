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
    <main className="min-h-screen flex items-center justify-center p-container-padding-mobile md:p-container-padding-desktop antialiased text-on-surface">
      <div className="fixed top-8 left-8 md:top-12 md:left-12 z-50">
        <Link href="/" className="text-headline-lg font-bold tracking-tight text-on-surface">
          FitSense AI
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10">
        <div className="text-center mb-stack-lg">
          <h2 className="text-[48px] md:text-display-lg font-bold text-on-surface mb-unit">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            {mode === "signup"
              ? "Let's get your wardrobe curated."
              : "Curate your style intelligence."}
          </p>
          {mode === "signup" && pendingStyles.length > 0 && (
            <p className="text-caption text-primary mt-2">
              We&apos;ll apply your style pick ({pendingStyles.join(", ")}) once you sign up.
            </p>
          )}
        </div>

        {/* Login / Signup toggle */}
        <div className="flex rounded-full bg-surface-variant/40 p-1 mb-stack-md">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 h-10 rounded-full text-sm font-semibold transition-colors ${
              mode === "login" ? "bg-primary-container text-on-surface" : "text-on-surface-variant"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 h-10 rounded-full text-sm font-semibold transition-colors ${
              mode === "signup" ? "bg-primary-container text-on-surface" : "text-on-surface-variant"
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="glass-card rounded-[24px] p-8 w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-stack-md">
            {mode === "signup" && (
              <div className="flex flex-col gap-unit">
                <label htmlFor="name" className="text-caption font-medium text-on-surface-variant">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field w-full h-14 rounded-xl px-4 text-body-md text-on-surface placeholder:text-on-surface-variant/40"
                />
              </div>
            )}

            <div className="flex flex-col gap-unit">
              <label htmlFor="email" className="text-caption font-medium text-on-surface-variant">
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
                  className="input-field w-full h-14 rounded-xl pl-12 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            <div className="flex flex-col gap-unit">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-caption font-medium text-on-surface-variant">
                  Password
                </label>
                {mode === "login" && (
                  <span className="text-caption font-medium text-on-surface-variant/50" title="Password reset isn't available yet">
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
                  className="input-field w-full h-14 rounded-xl pl-12 pr-12 text-body-md text-on-surface placeholder:text-on-surface-variant/40"
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
              {mode === "signup" && (
                <p className="text-caption text-on-surface-variant/60">At least 8 characters.</p>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-14 font-semibold text-button mt-unit flex items-center justify-center gap-2 disabled:opacity-50"
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

            <div className="relative flex items-center py-unit">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink-0 mx-4 text-caption text-on-surface-variant">or</span>
              <div className="flex-grow border-t border-border" />
            </div>

            {/* Social login isn't wired up to a real provider yet — shown
                disabled rather than clickable-but-silently-broken. */}
            <div className="flex flex-col gap-unit">
              <button
                type="button"
                disabled
                title="Coming soon"
                className="btn-secondary w-full h-14 font-semibold text-button flex items-center justify-center gap-3 opacity-40 cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google — coming soon
              </button>
            </div>
          </form>
        </div>

        <div className="mt-stack-md text-center">
          <p className="text-body-md text-on-surface-variant">
            {mode === "signup" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-button text-on-surface hover:text-primary transition-colors">
                  Sign In
                </button>
              </>
            ) : (
              <>Don&apos;t have an account?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-button text-on-surface hover:text-primary transition-colors">
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
