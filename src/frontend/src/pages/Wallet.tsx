import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Send,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  type PaymentMethod,
  type WithdrawRequest,
  useWallet,
} from "../hooks/useWallet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number) {
  return `৳${amount.toLocaleString("en-BD")}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  WithdrawRequest["status"],
  { label: string; icon: React.ElementType; className: string }
> = {
  Pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-[oklch(0.95_0.08_60)] text-[oklch(0.45_0.18_60)] dark:bg-[oklch(0.22_0.08_60)] dark:text-[oklch(0.80_0.18_60)]",
  },
  Approved: {
    label: "Approved",
    icon: CheckCircle2,
    className:
      "bg-[oklch(0.95_0.08_142)] text-[oklch(0.38_0.18_142)] dark:bg-[oklch(0.20_0.08_142)] dark:text-[oklch(0.75_0.20_142)]",
  },
  Rejected: {
    label: "Rejected",
    icon: XCircle,
    className:
      "bg-[oklch(0.95_0.06_25)] text-[oklch(0.45_0.18_25)] dark:bg-[oklch(0.20_0.06_25)] dark:text-[oklch(0.75_0.18_25)]",
  },
};

function StatusBadge({ status }: { status: WithdrawRequest["status"] }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.className}`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
  delay: number;
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  delay,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${gradient}`}
      style={{
        animation: `float ${3 + delay * 2}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="font-display text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
          <Icon size={24} strokeWidth={1.75} />
        </div>
      </div>
      {/* Decorative blobs */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/5 blur-2xl pointer-events-none" />
    </motion.div>
  );
}

// ─── Withdrawal Form ──────────────────────────────────────────────────────────

interface WithdrawFormProps {
  maxAmount: number;
  onSubmit: (
    amount: number,
    method: PaymentMethod,
    account: string,
  ) => Promise<void>;
  isSubmitting: boolean;
}

function WithdrawForm({
  maxAmount,
  onSubmit,
  isSubmitting,
}: WithdrawFormProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bKash");
  const [account, setAccount] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const amountNum = Number.parseFloat(amount) || 0;
  const isInsufficient = amountNum > maxAmount && amount !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);

    if (!amount || amountNum <= 0) {
      setFieldError("Please enter a valid withdrawal amount.");
      return;
    }
    if (isInsufficient) {
      setFieldError(`Maximum available: ${formatMoney(maxAmount)}`);
      return;
    }
    if (!account.trim()) {
      setFieldError("Please enter your account number.");
      return;
    }

    await onSubmit(amountNum, method, account);
    setAmount("");
    setAccount("");
    setFieldError(null);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {/* Amount */}
      <div>
        <label
          htmlFor="withdraw-amount"
          className="block text-sm font-semibold text-foreground mb-1.5"
        >
          Withdrawal Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-display font-bold text-lg">
            ৳
          </span>
          <input
            id="withdraw-amount"
            type="number"
            min="1"
            max={maxAmount}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={`w-full pl-8 pr-4 py-3 rounded-xl border bg-background font-display text-lg font-semibold text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 transition-smooth ${
              isInsufficient
                ? "border-destructive focus:ring-destructive/30"
                : "border-input focus:border-primary focus:ring-primary/20"
            }`}
            data-ocid="wallet-amount-input"
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-muted-foreground">
            Available: {formatMoney(maxAmount)}
          </span>
          <button
            type="button"
            onClick={() => setAmount(String(maxAmount))}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Max
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label
          htmlFor="withdraw-method"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["bKash", "Nagad"] as PaymentMethod[]).map((m) => {
            const isBkash = m === "bKash";
            const selectedStyle = isBkash
              ? "border-[oklch(var(--bkash))] bg-[oklch(var(--bkash)/0.12)] shadow-md"
              : "border-[oklch(var(--nagad))] bg-[oklch(var(--nagad)/0.12)] shadow-md";
            const idleStyle =
              "border-border bg-muted/30 hover:border-muted-foreground/50";

            return (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-4 transition-smooth ${
                  method === m ? selectedStyle : idleStyle
                }`}
                data-ocid={`wallet-method-${m.toLowerCase()}`}
              >
                <span className="text-2xl">{isBkash ? "📱" : "💳"}</span>
                <span
                  className={`text-sm font-bold ${
                    method === m
                      ? isBkash
                        ? "text-[oklch(var(--bkash))]"
                        : "text-[oklch(var(--nagad))]"
                      : "text-foreground"
                  }`}
                >
                  {m}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Number */}
      <div>
        <label
          htmlFor="withdraw-method"
          className="block text-sm font-semibold text-foreground mb-2"
        >
          Payment Method
        </label>
        {/* Hidden to satisfy a11y — visible choice via buttons below */}
        <input id="withdraw-method" type="hidden" value={method} readOnly />
        <input
          id="withdraw-account"
          type="tel"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="01XXXXXXXXX"
          maxLength={11}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-smooth"
          data-ocid="wallet-account-input"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Enter the 11-digit {method} mobile number for payout
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {fieldError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle size={15} />
            {fieldError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || amountNum <= 0 || isInsufficient}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-display font-bold text-white text-base bg-gradient-to-r from-primary to-accent transition-smooth hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        data-ocid="wallet-submit-withdraw"
      >
        <Send size={17} />
        {isSubmitting ? "Submitting…" : "Request Withdrawal"}
      </button>
    </form>
  );
}

// ─── Request Row ─────────────────────────────────────────────────────────────

function RequestRow({ req, index }: { req: WithdrawRequest; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-border transition-smooth"
      data-ocid={`wallet-request-row-${req.id}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${
            req.method === "bKash"
              ? "bg-[oklch(var(--bkash)/0.15)]"
              : "bg-[oklch(var(--nagad)/0.15)]"
          }`}
        >
          {req.method === "bKash" ? "📱" : "💳"}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">
            {req.method} — {req.accountNumber}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(req.date)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="font-display font-bold text-foreground text-base">
          {formatMoney(req.amount)}
        </span>
        <StatusBadge status={req.status} />
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function WalletPage() {
  const { isAuthenticated, role } = useAuth();
  const { wallet, isLoading, requestWithdrawal } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleWithdraw(
    amount: number,
    method: PaymentMethod,
    account: string,
  ) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    const result = await requestWithdrawal(amount, method, account);
    setIsSubmitting(false);

    if ("ok" in result) {
      setSuccessMessage(
        `Withdrawal of ${formatMoney(amount)} via ${method} submitted! Admin will review shortly.`,
      );
    } else {
      setSubmitError(result.err);
    }
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Wallet size={28} className="text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Seller Wallet
        </h2>
        <p className="text-muted-foreground font-body">
          Please log in to access your wallet and request withdrawals.
        </p>
      </div>
    );
  }

  // ── Not a seller ──────────────────────────────────────────────────────────
  if (role !== "Seller") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Wallet size={28} className="text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Seller Wallet
        </h2>
        <p className="text-muted-foreground font-body">
          This section is available for seller accounts only.
        </p>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading || !wallet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/60 animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Wallet Dashboard ───────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 sm:pb-8 space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
          <Wallet size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Wallet
          </h1>
          <p className="text-sm text-muted-foreground">
            Track earnings &amp; request payouts
          </p>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Earnings"
          value={formatMoney(wallet.totalEarnings)}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          delay={0}
        />
        <StatCard
          label="Withdrawn"
          value={formatMoney(wallet.withdrawnAmount)}
          icon={ArrowDownToLine}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          delay={0.1}
        />
        <StatCard
          label="Balance"
          value={formatMoney(wallet.remainingBalance)}
          icon={Coins}
          gradient="bg-gradient-to-br from-violet-500 to-purple-700"
          delay={0.2}
        />
      </div>

      {/* Commission note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3.5"
      >
        <AlertCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
        <p className="text-sm text-foreground/80 font-body leading-relaxed">
          <span className="font-semibold text-primary">
            10% system commission
          </span>{" "}
          is automatically deducted from every order. Your displayed balance
          already reflects post-commission earnings.
        </p>
      </motion.div>

      {/* Withdrawal request form */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-5">
          <Send size={18} className="text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Request Withdrawal
          </h2>
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2.5 rounded-xl bg-[oklch(0.95_0.08_142)] border border-[oklch(0.80_0.15_142)] px-4 py-3 mb-5 text-sm text-[oklch(0.35_0.18_142)]"
              data-ocid="wallet-success-banner"
            >
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit error */}
        <AnimatePresence>
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 mb-5 text-sm text-destructive"
              data-ocid="wallet-error-banner"
            >
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {submitError}
            </motion.div>
          )}
        </AnimatePresence>

        <WithdrawForm
          maxAmount={wallet.remainingBalance}
          onSubmit={(amount, method, account) =>
            handleWithdraw(amount, method, account)
          }
          isSubmitting={isSubmitting}
        />
      </motion.section>

      {/* Withdrawal history */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight size={18} className="text-muted-foreground" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Withdrawal History
          </h2>
          {wallet.withdrawals.length > 0 && (
            <span className="ml-auto text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {wallet.withdrawals.length}
            </span>
          )}
        </div>

        {wallet.withdrawals.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-12 text-center"
            data-ocid="wallet-empty-history"
          >
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
              <ArrowDownToLine size={22} className="text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">No withdrawals yet</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your withdrawal requests will appear here after you submit one.
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-ocid="wallet-history-list">
            {wallet.withdrawals.map((req, i) => (
              <RequestRow key={req.id} req={req} index={i} />
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
