import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock,
  Coins,
  CreditCard,
  Info,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import {
  type SellerOrder,
  type SellerProductStat,
  useEarningsByPeriod,
  useEarningsSummary,
  useProductStats,
  useSellerOrders,
} from "../hooks/useSellerDashboard";
import {
  type PaymentMethod,
  type WithdrawRequest,
  useMyWithdrawalLimit,
  useWallet,
} from "../hooks/useWallet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(v: number) {
  return `৳${v.toLocaleString("en-BD")}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Period filter config ─────────────────────────────────────────────────────

const PERIODS = [
  { label: "Last 30 days", days: 30, granularity: "daily" },
  { label: "Last 90 days", days: 90, granularity: "weekly" },
  { label: "Last 12 months", days: 365, granularity: "monthly" },
  { label: "All Time", days: 0, granularity: "monthly" },
] as const;

type PeriodKey = (typeof PERIODS)[number]["days"];

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
  delay: number;
  note?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  delay,
  note,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1 truncate">
            {label}
          </p>
          <p className="font-display text-2xl font-bold tracking-tight">
            {value}
          </p>
          {note && <p className="text-xs text-white/60 mt-1">{note}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm flex-shrink-0">
          <Icon size={20} strokeWidth={1.75} />
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute -top-5 -left-5 w-16 h-16 rounded-full bg-white/5 blur-2xl pointer-events-none" />
    </motion.div>
  );
}

// ─── Order Status Badge ───────────────────────────────────────────────────────

const orderStatusStyles: Record<string, string> = {
  Delivered: "bg-[oklch(0.95_0.08_142)] text-[oklch(0.38_0.18_142)]",
  Ongoing: "bg-[oklch(0.95_0.08_199)] text-[oklch(0.40_0.20_199)]",
  Pending: "bg-[oklch(0.95_0.08_60)] text-[oklch(0.45_0.18_60)]",
  Cancelled: "bg-[oklch(0.95_0.06_25)] text-[oklch(0.45_0.18_25)]",
};

function OrderStatusBadge({ status }: { status: string }) {
  const cls = orderStatusStyles[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

// ─── Withdrawal Status Badge ──────────────────────────────────────────────────

const withdrawStatusConfig: Record<
  string,
  { cls: string; icon: React.ElementType; label: string }
> = {
  Pending: {
    cls: "bg-[oklch(0.96_0.10_65)] text-[oklch(0.45_0.22_65)]",
    icon: Clock,
    label: "Pending",
  },
  Approved: {
    cls: "bg-[oklch(0.95_0.08_142)] text-[oklch(0.38_0.18_142)]",
    icon: CheckCircle2,
    label: "Approved",
  },
  Rejected: {
    cls: "bg-[oklch(0.95_0.06_25)] text-[oklch(0.45_0.18_25)]",
    icon: XCircle,
    label: "Rejected",
  },
};

function WithdrawStatusBadge({ status }: { status: string }) {
  const cfg = withdrawStatusConfig[status] ?? {
    cls: "bg-muted text-muted-foreground",
    icon: Clock,
    label: status,
  };
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

// ─── Product Performance Card ─────────────────────────────────────────────────

const rankGradients = [
  "from-amber-500 to-yellow-400",
  "from-slate-400 to-slate-300",
  "from-orange-600 to-amber-500",
];

function ProductCard({
  stat,
  rank,
}: { stat: SellerProductStat; rank: number }) {
  const color =
    rank <= 3 ? rankGradients[rank - 1] : "from-primary/60 to-accent/60";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-smooth"
      data-ocid={`seller-product-card-${stat.productId}`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0`}
        >
          #{rank}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-foreground text-sm truncate">
            {stat.productName}
          </p>
          <p className="text-xs text-muted-foreground">
            {stat.salesCount} sales
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
            Revenue
          </p>
          <p className="font-display font-bold text-foreground text-sm">
            {formatMoney(stat.totalRevenue)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
            Commission
          </p>
          <p className="font-display font-bold text-destructive text-sm">
            -{formatMoney(stat.commissionDeducted)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">
            Net
          </p>
          <p className="font-display font-bold text-[oklch(0.45_0.18_142)] text-sm">
            {formatMoney(stat.netRevenue)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Mobile Order Card ────────────────────────────────────────────────────────

function OrderCard({ order, index }: { order: SellerOrder; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-xl border border-border/60 bg-card p-4"
      data-ocid={`seller-order-card-${order.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-bold text-foreground text-sm">
          {order.id}
        </span>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {formatDate(order.date)}
      </p>
      <div className="text-xs text-foreground/80 mb-2 space-y-0.5">
        {order.items.map((item) => (
          <span key={`${order.id}-${item.name}`} className="block truncate">
            {item.qty}× {item.name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="font-display font-bold text-primary text-sm">
          {formatMoney(order.total)}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Withdrawal History Row (Mobile) ─────────────────────────────────────────

function WithdrawCard({ wr, index }: { wr: WithdrawRequest; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-xl border border-border/60 bg-card p-4"
      data-ocid={`withdraw-card-${wr.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-display font-bold text-foreground text-base">
          {formatMoney(wr.amount)}
        </span>
        <WithdrawStatusBadge status={wr.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/70">{wr.method}</span>
        <span>•</span>
        <span>{wr.accountNumber}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {formatDate(wr.date)}
      </p>
      {wr.note && (
        <p className="text-xs text-muted-foreground mt-1 italic">{wr.note}</p>
      )}
    </motion.div>
  );
}

// ─── Withdrawal Request Form ──────────────────────────────────────────────────

interface WithdrawFormProps {
  remainingBalance: number;
  withdrawalLimit: number | null | undefined;
  requestWithdrawal: (
    amount: number,
    method: PaymentMethod,
    accountNumber: string,
    withdrawalLimit?: number | null,
  ) => Promise<{ ok: true } | { err: string }>;
}

function WithdrawForm({
  remainingBalance,
  withdrawalLimit,
  requestWithdrawal,
}: WithdrawFormProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bKash");
  const [accountNumber, setAccountNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const parsedAmount = Number.parseFloat(amount) || 0;
  const limitExceeded =
    withdrawalLimit !== null &&
    withdrawalLimit !== undefined &&
    withdrawalLimit > 0 &&
    parsedAmount > withdrawalLimit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }
    setIsSubmitting(true);
    const result = await requestWithdrawal(
      parsedAmount,
      method,
      accountNumber,
      withdrawalLimit,
    );
    setIsSubmitting(false);
    if ("ok" in result) {
      setSuccessMsg(
        "Withdrawal request submitted successfully! Admin will review it shortly.",
      );
      setAmount("");
      setAccountNumber("");
    } else {
      setErrorMsg(result.err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-ocid="withdraw-form"
    >
      {/* Amount */}
      <div>
        <label
          className="block text-sm font-semibold text-foreground mb-1.5"
          htmlFor="wd-amount"
        >
          Amount (৳)
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
            ৳
          </span>
          <input
            id="wd-amount"
            type="number"
            min="1"
            max={
              withdrawalLimit && withdrawalLimit > 0
                ? Math.min(remainingBalance, withdrawalLimit)
                : remainingBalance
            }
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max ${formatMoney(withdrawalLimit && withdrawalLimit > 0 ? Math.min(remainingBalance, withdrawalLimit) : remainingBalance)}`}
            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
            data-ocid="withdraw-amount-input"
            disabled={isSubmitting}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Available:{" "}
          <span className="font-semibold text-[oklch(0.45_0.18_142)]">
            {formatMoney(remainingBalance)}
          </span>
        </p>

        {/* Withdrawal limit info badge */}
        {withdrawalLimit !== null &&
          withdrawalLimit !== undefined &&
          withdrawalLimit > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 px-3 py-2 text-xs"
              data-ocid="withdraw-limit-badge"
            >
              <Info size={13} className="text-blue-500 shrink-0" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Your withdrawal limit: {formatMoney(withdrawalLimit)} per
                request
              </span>
            </motion.div>
          )}

        {/* Limit exceeded error */}
        {limitExceeded && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600/10 to-pink-600/10 border border-red-500/20 px-3 py-2 text-xs"
            data-ocid="withdraw-limit-exceeded"
          >
            <AlertCircle size={13} className="text-red-500 shrink-0" />
            <span className="text-red-700 dark:text-red-300 font-medium">
              Cannot exceed your limit of {formatMoney(withdrawalLimit ?? 0)}.
              Contact admin for higher limits.
            </span>
          </motion.div>
        )}
      </div>

      {/* Payment Method */}
      <fieldset>
        <legend className="block text-sm font-semibold text-foreground mb-1.5">
          Payment Method
        </legend>
        <div className="flex gap-3">
          {(["bKash", "Nagad"] as PaymentMethod[]).map((m) => (
            <label
              key={m}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-smooth cursor-pointer ${
                method === m
                  ? m === "bKash"
                    ? "border-[oklch(0.65_0.28_355)] bg-[oklch(0.97_0.05_355)] text-[oklch(0.50_0.25_355)]"
                    : "border-[oklch(0.60_0.22_260)] bg-[oklch(0.97_0.04_260)] text-[oklch(0.45_0.22_260)]"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
              data-ocid={`withdraw-method-${m.toLowerCase()}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                disabled={isSubmitting}
                className="sr-only"
              />
              {m === "bKash" ? "🌸" : "🟠"} {m}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Account Number */}
      <div>
        <label
          className="block text-sm font-semibold text-foreground mb-1.5"
          htmlFor="wd-account"
        >
          {method} Number
        </label>
        <input
          id="wd-account"
          type="tel"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="01XXXXXXXXX"
          maxLength={14}
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth"
          data-ocid="withdraw-account-input"
          disabled={isSubmitting}
        />
      </div>

      {/* Feedback */}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl bg-[oklch(0.97_0.04_25)] border border-[oklch(0.88_0.10_25)] px-4 py-3 text-sm text-[oklch(0.45_0.22_25)]"
          data-ocid="withdraw-error"
        >
          <XCircle size={16} className="mt-0.5 flex-shrink-0" />
          {errorMsg}
        </motion.div>
      )}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 rounded-xl bg-[oklch(0.96_0.06_142)] border border-[oklch(0.88_0.10_142)] px-4 py-3 text-sm text-[oklch(0.38_0.18_142)]"
          data-ocid="withdraw-success"
        >
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          {successMsg}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || remainingBalance <= 0 || limitExceeded}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 text-sm shadow-md transition-smooth hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        data-ocid="withdraw-submit-btn"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Submitting…
          </span>
        ) : (
          <>
            <ArrowDownToLine size={16} />
            Request Withdrawal
          </>
        )}
      </button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortField = "sales" | "revenue";

export function SellerDashboardPage() {
  const { isAuthenticated, role, email } = useAuth();
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState<PeriodKey>(30);
  const [sortBy, setSortBy] = useState<SortField>("revenue");
  const [sortDesc, setSortDesc] = useState(true);

  const activePeriod =
    PERIODS.find((p) => p.days === selectedDays) ?? PERIODS[0];

  // All hooks called unconditionally — access control rendered below
  const summaryQ = useEarningsSummary(selectedDays);
  const earningsQ = useEarningsByPeriod(selectedDays, activePeriod.granularity);
  const productQ = useProductStats(selectedDays);
  const ordersQ = useSellerOrders();
  const walletData = useWallet();
  const limitQ = useMyWithdrawalLimit();

  const sortedProducts = useMemo(() => {
    const list = [...(productQ.data ?? [])];
    list.sort((a, b) => {
      const va = sortBy === "sales" ? a.salesCount : a.totalRevenue;
      const vb = sortBy === "sales" ? b.salesCount : b.totalRevenue;
      return sortDesc ? vb - va : va - vb;
    });
    return list;
  }, [productQ.data, sortBy, sortDesc]);

  const sortedOrders = useMemo(
    () => [...(ordersQ.data ?? [])].sort((a, b) => b.date - a.date),
    [ordersQ.data],
  );

  const withdrawals = useMemo(
    () =>
      [...(walletData.wallet?.withdrawals ?? [])].sort(
        (a, b) => b.date - a.date,
      ),
    [walletData.wallet],
  );

  // ── Access guard ────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={28} className="text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Seller Dashboard
        </h2>
        <p className="text-muted-foreground font-body mb-6">
          Please log in to access your seller dashboard.
        </p>
        <button
          type="button"
          onClick={() => void router.navigate({ to: "/login" })}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-white font-semibold transition-smooth hover:opacity-90"
          data-ocid="seller-login-cta"
        >
          Log In
        </button>
      </div>
    );
  }

  if (role !== "Seller" && role !== "Admin") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={28} className="text-muted-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Seller Dashboard
        </h2>
        <p className="text-muted-foreground font-body">
          This section is available for seller accounts only.
        </p>
      </div>
    );
  }

  const summary = summaryQ.data;
  const chartData = earningsQ.data ?? [];
  const remainingBalance = walletData.wallet?.remainingBalance ?? 0;
  const withdrawalLimit: number | null =
    typeof limitQ.data === "number" ? limitQ.data : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 sm:pb-10 space-y-8">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <BarChart3 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Seller Dashboard
            </h1>
            <p className="text-sm text-muted-foreground truncate max-w-[240px]">
              {email}
            </p>
          </div>
        </div>

        {/* Period Filter */}
        <div
          className="flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Time period filter"
          data-ocid="seller-period-filter"
        >
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              role="tab"
              aria-selected={selectedDays === p.days}
              onClick={() => setSelectedDays(p.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth ${
                selectedDays === p.days
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              data-ocid={`seller-period-${p.days}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Earnings Summary Cards ── */}
      <section aria-label="Earnings summary">
        {summaryQ.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {["g1", "g2", "g3", "g4", "g5"].map((k) => (
              <Skeleton key={k} className="h-[100px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              label="Gross Revenue"
              value={formatMoney(summary?.totalGrossRevenue ?? 0)}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-sky-500 to-blue-600"
              delay={0}
            />
            <StatCard
              label="Commission (10%)"
              value={formatMoney(summary?.totalCommissionDeducted ?? 0)}
              icon={CreditCard}
              gradient="bg-gradient-to-br from-rose-500 to-pink-600"
              delay={0.08}
              note="Auto-deducted"
            />
            <StatCard
              label="Net Earnings"
              value={formatMoney(summary?.totalNetEarnings ?? 0)}
              icon={Coins}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              delay={0.16}
            />
            <StatCard
              label="Total Withdrawn"
              value={formatMoney(summary?.totalWithdrawn ?? 0)}
              icon={ArrowDownToLine}
              gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
              delay={0.24}
            />
            <StatCard
              label="Available Balance"
              value={walletData.isLoading ? "…" : formatMoney(remainingBalance)}
              icon={Wallet}
              gradient="bg-gradient-to-br from-amber-500 to-orange-500"
              delay={0.32}
              note="Ready to withdraw"
            />
          </div>
        )}
      </section>

      {/* ── Earnings Trend Chart ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        aria-label="Earnings trend chart"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Earnings Trend — {activePeriod.label}
          </h2>
        </div>

        {earningsQ.isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.88 0 0)" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `৳${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatMoney(value),
                  name === "grossRevenue"
                    ? "Gross"
                    : name === "netRevenue"
                      ? "Net"
                      : "Commission",
                ]}
                contentStyle={{
                  borderRadius: "0.75rem",
                  border: "1px solid oklch(0.88 0 0)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="grossRevenue"
                name="grossRevenue"
                fill="oklch(0.62 0.28 199)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="netRevenue"
                name="netRevenue"
                fill="oklch(0.70 0.24 142)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[oklch(0.62_0.28_199)]" />
            Gross Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[oklch(0.70_0.24_142)]" />
            Net Earnings
          </span>
        </div>
      </motion.section>

      {/* ── Product Performance ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        aria-label="Product performance"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Package size={16} className="text-white" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Product Performance
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">
              Sort:
            </span>
            {(["revenue", "sales"] as SortField[]).map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => {
                  if (sortBy === field) setSortDesc((d) => !d);
                  else {
                    setSortBy(field);
                    setSortDesc(true);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-smooth ${
                  sortBy === field
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
                data-ocid={`seller-sort-${field}`}
              >
                {field.charAt(0).toUpperCase() + field.slice(1)}
                {sortBy === field &&
                  (sortDesc ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronUp size={12} />
                  ))}
              </button>
            ))}
          </div>
        </div>

        {productQ.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["p1", "p2", "p3"].map((k) => (
              <Skeleton key={k} className="h-[152px] rounded-2xl" />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-12 text-center"
            data-ocid="seller-products-empty"
          >
            <Package size={28} className="text-muted-foreground" />
            <p className="font-semibold text-foreground">No products yet</p>
            <p className="text-sm text-muted-foreground">
              Your product performance will appear here once you have sales.
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="seller-products-grid"
          >
            {sortedProducts.map((stat, i) => (
              <ProductCard key={stat.productId} stat={stat} rank={i + 1} />
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Order History ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        aria-label="Order history"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">
              Order History
            </h2>
          </div>
          {sortedOrders.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {sortedOrders.length} orders
            </span>
          )}
        </div>

        {ordersQ.isLoading ? (
          <div className="space-y-3">
            {["o1", "o2", "o3"].map((k) => (
              <Skeleton key={k} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-12 text-center"
            data-ocid="seller-orders-empty"
          >
            <ShoppingBag size={28} className="text-muted-foreground" />
            <p className="font-semibold text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground">
              Orders from customers will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div
              className="hidden md:block rounded-2xl border border-border overflow-hidden"
              data-ocid="seller-orders-table"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {["Order ID", "Date", "Items", "Total", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide ${
                            h === "Total"
                              ? "text-right"
                              : h === "Status"
                                ? "text-center"
                                : "text-left"
                          }`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order, i) => (
                    <tr
                      key={order.id}
                      className={`border-b border-border/40 transition-smooth hover:bg-muted/20 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
                      data-ocid={`seller-order-row-${order.id}`}
                    >
                      <td className="px-4 py-3 font-display font-bold text-foreground">
                        {order.id}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-4 py-3 text-foreground/80 max-w-[200px]">
                        <span className="truncate block">
                          {order.items
                            .map((it) => `${it.qty}× ${it.name}`)
                            .join(", ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-display font-bold text-primary">
                        {formatMoney(order.total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <OrderStatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div
              className="md:hidden space-y-3"
              data-ocid="seller-orders-cards"
            >
              {sortedOrders.map((order, i) => (
                <OrderCard key={order.id} order={order} index={i} />
              ))}
            </div>
          </>
        )}
      </motion.section>

      {/* ── Withdrawal Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.44 }}
        aria-label="Withdrawal"
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <CircleDollarSign size={16} className="text-white" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Withdraw Earnings
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <ArrowDownToLine size={14} className="text-white" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">
                Request Withdrawal
              </h3>
            </div>

            {walletData.isLoading ? (
              <div className="space-y-3">
                {["f1", "f2", "f3"].map((k) => (
                  <Skeleton key={k} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : remainingBalance <= 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-8 text-center"
                data-ocid="withdraw-empty-balance"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Wallet size={22} className="text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  No balance available
                </p>
                <p className="text-xs text-muted-foreground">
                  Your available balance will appear here once you have approved
                  earnings.
                </p>
              </div>
            ) : (
              <WithdrawForm
                remainingBalance={remainingBalance}
                withdrawalLimit={withdrawalLimit}
                requestWithdrawal={walletData.requestWithdrawal}
              />
            )}
          </div>

          {/* Withdrawal History */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Clock size={14} className="text-white" />
                </div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Withdrawal History
                </h3>
              </div>
              {withdrawals.length > 0 && (
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {withdrawals.length}
                </span>
              )}
            </div>

            {walletData.isLoading ? (
              <div className="space-y-3">
                {["h1", "h2"].map((k) => (
                  <Skeleton key={k} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : withdrawals.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 py-8 text-center"
                data-ocid="withdraw-history-empty"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Clock size={22} className="text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground text-sm">
                  No withdrawals yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Your withdrawal requests will appear here once submitted.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div
                  className="hidden sm:block rounded-xl border border-border overflow-hidden"
                  data-ocid="withdraw-history-table"
                >
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        {["Amount", "Method", "Account", "Date", "Status"].map(
                          (h) => (
                            <th
                              key={h}
                              className={`px-3 py-2.5 font-semibold text-muted-foreground uppercase tracking-wide ${h === "Amount" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((wr, i) => (
                        <tr
                          key={wr.id}
                          className={`border-b border-border/40 transition-smooth hover:bg-muted/20 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
                          data-ocid={`withdraw-row-${wr.id}`}
                        >
                          <td className="px-3 py-2.5 text-right font-display font-bold text-foreground">
                            {formatMoney(wr.amount)}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-foreground">
                            {wr.method}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-mono">
                            {wr.accountNumber}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {formatDate(wr.date)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <WithdrawStatusBadge status={wr.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div
                  className="sm:hidden space-y-3"
                  data-ocid="withdraw-history-cards"
                >
                  {withdrawals.map((wr, i) => (
                    <WithdrawCard key={wr.id} wr={wr} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
