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
import {
  CheckCircle,
  Eye,
  EyeOff,
  Gift,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useReferral } from "../hooks/useReferral";

type RoleOption = "Customer" | "Seller";

const roleOptions: { value: RoleOption; label: string; description: string }[] =
  [
    {
      value: "Customer",
      label: "Customer",
      description: "Browse, shop, book services, and track deliveries",
    },
    {
      value: "Seller",
      label: "Seller",
      description: "List products, manage orders, and grow your business",
    },
  ];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Too short", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = [
    "bg-destructive",
    "bg-destructive",
    "bg-secondary",
    "bg-chart-3",
    "bg-primary",
    "bg-primary",
  ];

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex gap-0.5 flex-1 h-1.5 rounded-full overflow-hidden bg-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              score >= i ? colors[score] : "bg-border"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground w-20">
        {labels[score]}
      </span>
    </div>
  );
}

export function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  // We use the referral hook with null initially (userId not known yet),
  // but we call processSignupReferral directly after account creation
  const { processSignupReferral, createCode } = useReferral(null);

  const [refCode, setRefCode] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleOption>("Customer");
  const [requestAdmin, setRequestAdmin] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Read ?ref= param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setRefCode(ref);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const result = await signup(email, password, selectedRole, requestAdmin);
    setIsSubmitting(false);

    if ("err" in result) {
      setError(result.err);
    } else {
      // Generate their own referral code
      const newUserId = email.toLowerCase().trim();
      void createCode(newUserId);

      // Process referral if they came via a referral link
      if (refCode) {
        void processSignupReferral(newUserId, refCode);
      }

      setSuccess(true);
      setTimeout(() => void router.navigate({ to: "/" }), 1500);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Account created!
          </h2>
          {refCode && (
            <div className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-300 text-sm font-medium text-emerald-700">
              <Gift size={16} className="shrink-0" />
              100 unit signup bonus added to your wallet!
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Taking you to the home page…
          </p>
        </div>
      </div>
    );
  }

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
            Create account
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Join SuperApp — it's free
          </p>
        </div>

        {/* Referral invite banner */}
        {refCode && (
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-300"
            data-ocid="referral-invite-banner"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Gift size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                You were invited!
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Sign up now and get a <strong>100 unit signup bonus</strong>{" "}
                added to your wallet.
              </p>
            </div>
          </div>
        )}

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display">Sign Up</CardTitle>
          </CardHeader>

          <CardContent>
            <form
              id="signup-form"
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-4"
            >
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  autoFocus
                  data-ocid="signup-email"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    required
                    className="pr-10"
                    data-ocid="signup-password"
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
                <PasswordStrength password={password} />
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm">Confirm password</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                  data-ocid="signup-confirm"
                />
              </div>

              {/* Role selector */}
              <div className="space-y-2">
                <Label>Account type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map(({ value, label, description }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(value);
                        if (value !== "Customer") setRequestAdmin(false);
                      }}
                      className={`text-left rounded-lg border p-3 transition-all ${
                        selectedRole === value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                      }`}
                      data-ocid={`signup-role-${value.toLowerCase()}`}
                    >
                      <p className="text-sm font-medium font-body text-foreground">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Request admin (only for Customers) */}
              {selectedRole === "Customer" && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border">
                  <input
                    id="signup-request-admin"
                    type="checkbox"
                    checked={requestAdmin}
                    onChange={(e) => setRequestAdmin(e.target.checked)}
                    className="mt-0.5 accent-primary w-4 h-4 shrink-0"
                    data-ocid="signup-request-admin"
                  />
                  <div>
                    <label
                      htmlFor="signup-request-admin"
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      Request Admin access
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your request will be reviewed by an existing admin before
                      approval.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
                  role="alert"
                  data-ocid="signup-error"
                >
                  <ShieldAlert size={14} />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                form="signup-form"
                className="w-full"
                disabled={
                  isSubmitting || !email || !password || !confirmPassword
                }
                data-ocid="signup-submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus size={16} />
                    Create Account
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
                  Already have an account?
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void router.navigate({ to: "/login" })}
              data-ocid="signup-goto-login"
            >
              Sign in instead
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
