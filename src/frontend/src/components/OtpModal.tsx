import { useActor } from "@caffeineai/core-infrastructure";
import { Check, Copy, RefreshCw, ShieldCheck, Timer, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";

export type OtpAction = "WithdrawalRequest" | "ApprovePayment" | "SuspendUser";

interface OtpModalProps {
  open: boolean;
  userId: string;
  action: OtpAction;
  actionLabel: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ACTION_COLORS: Record<OtpAction, { gradient: string; badge: string }> = {
  WithdrawalRequest: {
    gradient: "from-violet-600 via-purple-600 to-indigo-600",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  ApprovePayment: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  SuspendUser: {
    gradient: "from-rose-500 via-red-500 to-orange-500",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

const OTP_EXPIRE_SECS = 600; // 10 minutes

export function OtpModal({
  open,
  userId,
  action,
  actionLabel,
  onConfirm,
  onCancel,
}: OtpModalProps) {
  const { actor } = useActor(createActor);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRE_SECS);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const colors = ACTION_COLORS[action];

  // Generate OTP when modal opens
  useEffect(() => {
    if (open) {
      void generateOtp();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Focus input when code appears
  useEffect(() => {
    if (generatedCode && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [generatedCode]);

  // Keyboard escape to cancel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  async function generateOtp() {
    if (!actor) return;
    setIsGenerating(true);
    setError("");
    setInputCode("");
    setGeneratedCode(null);

    try {
      const code = await actor.generateOtp(userId, action);
      setGeneratedCode(code);
      setSecondsLeft(OTP_EXPIRE_SECS);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate OTP");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleConfirm() {
    if (!actor || !inputCode.trim()) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const valid = await actor.verifyOtp(userId, action, inputCode.trim());
      if (!valid) {
        setError("Incorrect code. Please try again.");
        setInputCode("");
        inputRef.current?.focus();
        return;
      }

      // OTP verified — execute the action
      await onConfirm();
      // Modal will be closed by parent
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  }

  function copyCode() {
    if (!generatedCode) return;
    void navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isExpired = secondsLeft === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Modal card — motion.dialog is unsupported; div with role=dialog is intentional */}
          {/* biome-ignore lint/a11y/useSemanticElements: motion.dialog is not supported by motion/react */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="OTP Verification"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
          >
            {/* Gradient header */}
            <div
              className={`bg-gradient-to-r ${colors.gradient} px-6 pt-6 pb-8 text-white relative overflow-hidden`}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
                }}
              />
              <button
                type="button"
                onClick={onCancel}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-3 mb-3 relative">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Security Verification
                  </p>
                  <p className="font-display font-bold text-lg leading-tight">
                    OTP Required
                  </p>
                </div>
              </div>

              <p className="text-sm text-white/80 relative">
                Confirm{" "}
                <span className="font-semibold text-white">{actionLabel}</span>{" "}
                with the code below
              </p>
            </div>

            {/* OTP code display */}
            <div className="px-6 -mt-5 mb-5">
              <div className="relative rounded-xl border-2 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 px-6 py-5 text-center shadow-sm">
                {isGenerating ? (
                  <div className="flex justify-center py-2">
                    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  </div>
                ) : generatedCode ? (
                  <>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                      Your one-time code
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono font-bold text-4xl tracking-[0.3em] text-primary select-all">
                        {generatedCode}
                      </span>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        aria-label="Copy code"
                      >
                        {copied ? (
                          <Check size={16} className="text-chart-3" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>

                    {/* Timer */}
                    <div
                      className={`flex items-center justify-center gap-1.5 mt-3 text-xs font-medium ${
                        isExpired
                          ? "text-destructive"
                          : secondsLeft < 60
                            ? "text-secondary"
                            : "text-muted-foreground"
                      }`}
                    >
                      <Timer size={12} />
                      {isExpired
                        ? "Code expired — regenerate below"
                        : `Expires in ${minutes}:${String(secs).padStart(2, "0")}`}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">
                    Generating code…
                  </p>
                )}
              </div>
            </div>

            {/* Input + actions */}
            <div className="px-6 pb-6 space-y-4">
              <div>
                <label
                  htmlFor="otp-input"
                  className="block text-sm font-semibold text-foreground mb-2"
                >
                  Enter the 6-digit code
                </label>
                <input
                  ref={inputRef}
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inputCode.length === 6)
                      void handleConfirm();
                  }}
                  placeholder="000000"
                  disabled={isExpired || !generatedCode}
                  className="w-full text-center font-mono font-bold text-2xl tracking-[0.4em] px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-colors disabled:opacity-50"
                  data-ocid="otp-input"
                  autoComplete="one-time-code"
                />
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm text-destructive text-center font-medium"
                    role="alert"
                    data-ocid="otp-error"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void generateOtp()}
                  disabled={isGenerating || isVerifying}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
                  data-ocid="otp-regenerate"
                >
                  <RefreshCw
                    size={14}
                    className={isGenerating ? "animate-spin" : ""}
                  />
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={
                    inputCode.length !== 6 ||
                    isVerifying ||
                    isExpired ||
                    !generatedCode
                  }
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white bg-gradient-to-r ${colors.gradient} hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
                  data-ocid="otp-confirm"
                >
                  {isVerifying ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <ShieldCheck size={15} />
                  )}
                  {isVerifying ? "Verifying…" : "Confirm"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
