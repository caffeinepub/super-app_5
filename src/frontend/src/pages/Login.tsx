import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, LogIn, ShieldAlert, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockCountdown > 0) {
      setIsLocked(true);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setLockCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsLocked(false);
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockCountdown]);

  function formatCountdown(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
    return `${s}s`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setError("");
    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if ("err" in result) {
      if (result.locked && result.remainingSecs) {
        setLockCountdown(result.remainingSecs);
      }
      setError(result.err);
    } else {
      void router.navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-primary-foreground font-display font-bold text-lg">
              S
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Sign in to your SuperApp account
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display">Sign In</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              id="login-form"
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!isLocked) setError("");
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  autoFocus
                  disabled={isLocked}
                  data-ocid="login-email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!isLocked) setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                    disabled={isLocked}
                    data-ocid="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Lockout banner */}
              {isLocked && (
                <div
                  className="flex flex-col gap-2 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3"
                  role="alert"
                  data-ocid="login-lockout-banner"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <Lock size={15} />
                    Account temporarily locked
                  </div>
                  <div className="flex items-center gap-2 text-sm text-destructive/80">
                    <Timer size={14} />
                    <span>
                      Try again in{" "}
                      <span className="font-mono font-bold text-destructive">
                        {formatCountdown(lockCountdown)}
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Too many failed attempts. Your account has been locked for
                    15 minutes for security.
                  </p>
                </div>
              )}

              {/* Generic error (non-lockout) */}
              {error && !isLocked && (
                <div
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
                  role="alert"
                  data-ocid="login-error"
                >
                  <ShieldAlert size={14} />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                form="login-form"
                className="w-full"
                disabled={isSubmitting || !email || !password || isLocked}
                data-ocid="login-submit"
              >
                {isLocked ? (
                  <span className="flex items-center gap-2">
                    <Lock size={16} />
                    Locked — {formatCountdown(lockCountdown)}
                  </span>
                ) : isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn size={16} />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-0">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  New to SuperApp?
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void router.navigate({ to: "/signup" })}
              data-ocid="login-goto-signup"
            >
              Create an account
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
