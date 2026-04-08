import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowDownCircle,
  BadgeDollarSign,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { OrderStatus } from "../backend.d";
import { type AdminCategory, useAdmin } from "../hooks/useAdmin";
import { useAdminApprovals } from "../hooks/useAdminApprovals";
import { useAdminOrders } from "../hooks/useAdminOrders";
import {
  useAdminPendingPayments,
  useApproveAdminPayment,
} from "../hooks/useAdminPayments";
import {
  useAdminPendingWithdrawals,
  useAdminWithdrawalAction,
} from "../hooks/useAdminWithdrawals";
import { useAuth } from "../hooks/useAuth";
import {
  useAdminStats,
  useCommissionByPeriod,
  useTopProducts,
  useTopSellers,
} from "../hooks/useCommission";

// --- Helpers ---
function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too short", color: "bg-destructive" },
    { label: "Weak", color: "bg-destructive" },
    { label: "Fair", color: "bg-secondary" },
    { label: "Good", color: "bg-chart-3" },
    { label: "Strong", color: "bg-primary" },
    { label: "Very strong", color: "bg-primary" },
  ];
  return { score, ...map[score] };
}

function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold w-5 h-5 animate-pulse shrink-0">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// --- Featured IDs editor ---
interface FeaturedEditorProps {
  category: AdminCategory;
  initialIds: string[];
  sessionPassword: string;
  onSaved: () => void;
  isUpdatePending: boolean;
  updateFeatured: (
    category: AdminCategory,
    ids: string[],
    pw: string,
  ) => Promise<{ ok: true } | { err: string }>;
}

function FeaturedEditor({
  category,
  initialIds,
  sessionPassword,
  onSaved,
  isUpdatePending,
  updateFeatured,
}: FeaturedEditorProps) {
  const [ids, setIds] = useState<string[]>(initialIds);
  const [newId, setNewId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIds(initialIds);
  }, [initialIds]);

  const addId = () => {
    const trimmed = newId.trim();
    if (!trimmed || ids.includes(trimmed)) return;
    setIds((prev) => [...prev, trimmed]);
    setNewId("");
    inputRef.current?.focus();
  };

  const removeId = (id: string) =>
    setIds((prev) => prev.filter((i) => i !== id));

  const handleSave = async () => {
    const result = await updateFeatured(category, ids, sessionPassword);
    if ("ok" in result) {
      toast.success(`Featured ${category} items saved!`);
      onSaved();
    } else {
      toast.error(result.err ?? "Failed to save");
    }
  };

  return (
    <div className="space-y-4">
      <div className="min-h-[56px] flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-background">
        {ids.length === 0 ? (
          <span className="text-sm text-muted-foreground self-center">
            No featured items yet — add some below
          </span>
        ) : (
          ids.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1.5 pl-3 pr-2 py-1 text-sm font-mono"
            >
              {id}
              <button
                type="button"
                onClick={() => removeId(id)}
                className="rounded-sm opacity-70 hover:opacity-100 transition-colors focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Remove ${id}`}
                data-ocid={`featured-remove-${category}-${id}`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addId();
            }
          }}
          placeholder="Enter item ID…"
          className="font-mono"
          data-ocid={`featured-add-input-${category}`}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addId}
          disabled={!newId.trim()}
          data-ocid={`featured-add-btn-${category}`}
        >
          <Plus size={16} />
          Add
        </Button>
      </div>
      <Button
        type="button"
        onClick={() => void handleSave()}
        disabled={isUpdatePending}
        className="w-full"
        data-ocid={`featured-save-${category}`}
      >
        {isUpdatePending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Save featured {category} items
      </Button>
    </div>
  );
}

// --- Reset password panel ---
function ResetPasswordPanel({
  resetPassword,
  isResetPending,
}: {
  resetPassword: (
    oldPw: string,
    newPw: string,
  ) => Promise<{ ok: true } | { err: string }>;
  isResetPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const strength = getPasswordStrength(newPw);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPw !== confirmPw) {
      setError("New passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    const result = await resetPassword(oldPw, newPw);
    if ("ok" in result) {
      setSuccess(true);
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password updated successfully");
    } else {
      setError(result.err ?? "Failed to reset password");
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
        aria-expanded={open}
        data-ocid="admin-reset-toggle"
      >
        <span className="flex items-center gap-2">
          <KeyRound size={15} className="text-muted-foreground" />
          Change Admin Password
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <form
          onSubmit={(e) => void handleReset(e)}
          className="p-4 space-y-4 border-t border-border"
        >
          {success && (
            <div className="flex items-center gap-2 text-sm text-chart-3 bg-chart-3/10 border border-chart-3/20 rounded-md px-3 py-2">
              <CheckCircle size={14} />
              Password updated successfully
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="reset-old">Current password</Label>
            <Input
              id="reset-old"
              type="password"
              value={oldPw}
              onChange={(e) => setOldPw(e.target.value)}
              autoComplete="current-password"
              required
              data-ocid="admin-reset-old-pw"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reset-new">New password</Label>
            <Input
              id="reset-new"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
              required
              data-ocid="admin-reset-new-pw"
            />
            {newPw && (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex gap-0.5 flex-1 h-1 rounded-full overflow-hidden bg-border">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${strength.score >= i ? strength.color : "bg-border"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {strength.label}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm">Confirm new password</Label>
            <Input
              id="reset-confirm"
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              required
              data-ocid="admin-reset-confirm-pw"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <ShieldAlert size={13} /> {error}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            disabled={isResetPending || !oldPw || !newPw || !confirmPw}
            className="w-full"
            data-ocid="admin-reset-submit"
          >
            {isResetPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RotateCcw size={15} />
            )}
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}

// --- Gradient Stat Card ---
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
  textClass?: string;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  gradient,
  textClass = "text-primary",
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-5 ${gradient} border border-white/10`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1">
            {label}
          </p>
          <p className={`font-display text-3xl font-bold ${textClass}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-foreground/50 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

// --- Dashboard Tab ---
function DashboardTab({ totalOrders }: { totalOrders: number }) {
  const { data: stats, isLoading } = useAdminStats();
  const { data: pendingPayments } = useAdminPendingPayments();
  const { data: pendingWithdrawals } = useAdminPendingWithdrawals();

  const pendingPmtCount =
    pendingPayments?.filter((p) => p.status === "Pending").length ?? 0;
  const pendingWdCount =
    pendingWithdrawals?.filter((w) => w.status === "Pending").length ?? 0;

  const displayOrders = stats?.totalOrders ?? totalOrders;
  const displayUsers = stats?.totalUsers ?? 0;
  const displayCommission = stats?.totalCommission ?? 0;
  const displayRevenue = stats?.totalRevenue ?? 0;

  const statCards: StatCardProps[] = [
    {
      label: "Total Orders",
      value: isLoading ? "—" : displayOrders.toLocaleString(),
      icon: <Package size={20} className="text-primary" />,
      gradient: "bg-gradient-to-br from-primary/15 to-primary/5",
      textClass: "text-primary",
    },
    {
      label: "Total Revenue",
      value: isLoading ? "—" : `৳${displayRevenue.toLocaleString()}`,
      icon: <TrendingUp size={20} className="text-secondary" />,
      gradient: "bg-gradient-to-br from-secondary/15 to-secondary/5",
      textClass: "text-secondary",
    },
    {
      label: "Commission Earned",
      value: isLoading ? "—" : `৳${displayCommission.toLocaleString()}`,
      sub: "@ 10% rate",
      icon: <BadgeDollarSign size={20} className="text-accent" />,
      gradient: "bg-gradient-to-br from-accent/15 to-accent/5",
      textClass: "text-accent",
    },
    {
      label: "Registered Users",
      value: isLoading ? "—" : displayUsers.toLocaleString(),
      icon: <Users size={20} className="text-chart-3" />,
      gradient: "bg-gradient-to-br from-chart-3/15 to-chart-3/5",
      textClass: "text-chart-3",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Alert cards for pending actions */}
      {(pendingPmtCount > 0 || pendingWdCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pendingPmtCount > 0 && (
            <div className="flex items-center gap-3 rounded-xl p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20">
              <AlertTriangle size={20} className="text-destructive shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pendingPmtCount} Payment{pendingPmtCount > 1 ? "s" : ""}{" "}
                  Awaiting Verification
                </p>
                <p className="text-xs text-muted-foreground">
                  Go to Payment Verification tab
                </p>
              </div>
            </div>
          )}
          {pendingWdCount > 0 && (
            <div className="flex items-center gap-3 rounded-xl p-4 bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20">
              <Wallet size={20} className="text-secondary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pendingWdCount} Withdrawal{pendingWdCount > 1 ? "s" : ""}{" "}
                  Pending Approval
                </p>
                <p className="text-xs text-muted-foreground">
                  Go to Withdrawal Management tab
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Welcome to the Admin Dashboard. Use the tabs above to manage orders,
        payments, commissions, approvals, and featured items.
      </p>
    </div>
  );
}

// --- Commission Dashboard Tab ---
type PeriodType = "daily" | "weekly" | "monthly";

function CommissionDashboardTab() {
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const { data: summary, isLoading: summaryLoading } = useAdminStats();
  const { data: chartData, isLoading: chartLoading } =
    useCommissionByPeriod(period);
  const { data: topSellers, isLoading: sellersLoading } = useTopSellers();
  const { data: topProducts, isLoading: productsLoading } = useTopProducts();

  const totalCommission = summary?.totalCommission ?? 0;
  const totalRevenue = summary?.totalRevenue ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;

  const periodButtons: { key: PeriodType; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Total Commission"
          value={summaryLoading ? "—" : `৳${totalCommission.toLocaleString()}`}
          sub="System-wide, all sellers"
          icon={<BadgeDollarSign size={20} className="text-primary" />}
          gradient="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10"
          textClass="text-primary"
        />
        <StatCard
          label="Total Revenue"
          value={summaryLoading ? "—" : `৳${totalRevenue.toLocaleString()}`}
          sub="Before commission deduction"
          icon={<TrendingUp size={20} className="text-secondary" />}
          gradient="bg-gradient-to-br from-secondary/20 via-secondary/10 to-chart-3/10"
          textClass="text-secondary"
        />
        <StatCard
          label="Orders Processed"
          value={summaryLoading ? "—" : totalOrders.toLocaleString()}
          sub="@ 10% commission rate"
          icon={<Package size={20} className="text-accent" />}
          gradient="bg-gradient-to-br from-accent/20 via-accent/10 to-primary/10"
          textClass="text-accent"
        />
      </div>

      {/* Chart section */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">
              Commission Trend
            </CardTitle>
            <div className="flex gap-1.5">
              {periodButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    period === key
                      ? "filter-badge-active bg-primary text-primary-foreground"
                      : "filter-badge-inactive bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                  data-ocid={`commission-period-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {chartLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="commissionGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="oklch(0.52 0.28 199)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.52 0.28 199)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.68 0.25 40)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.68 0.25 40)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.88 0 0 / 0.5)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "oklch(0.50 0 0)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "oklch(0.50 0 0)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) =>
                    `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.98 0 0)",
                    border: "1px solid oklch(0.88 0 0)",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    `৳${value.toLocaleString()}`,
                    name === "commission" ? "Commission" : "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.68 0.25 40)"
                  strokeWidth={1.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="oklch(0.52 0.28 199)"
                  strokeWidth={2}
                  fill="url(#commissionGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full bg-primary" />
              Commission (10%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block rounded-full bg-secondary" />
              Revenue
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Top Sellers + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Sellers */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star size={15} className="text-secondary" />
              Top Sellers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {sellersLoading
              ? [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))
              : (topSellers ?? []).slice(0, 5).map((seller, idx) => (
                  <div
                    key={seller.sellerId}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                    data-ocid={`top-seller-${seller.sellerId}`}
                  >
                    <span className="w-6 text-xs font-bold text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {seller.sellerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {seller.orders} orders
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">
                        ৳{seller.commission.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        commission
                      </p>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package size={15} className="text-accent" />
              Top Products
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {productsLoading
              ? [1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))
              : (topProducts ?? []).slice(0, 5).map((product, idx) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                    data-ocid={`top-product-${product.productId}`}
                  >
                    <span className="w-6 text-xs font-bold text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.sold} sold
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-accent">
                        ৳{product.commission.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        commission
                      </p>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- All Orders tab ---
const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "bg-secondary/15 text-secondary border-secondary/30",
  [OrderStatus.Ongoing]: "bg-accent/15 text-accent border-accent/30",
  [OrderStatus.Delivered]: "bg-chart-3/15 text-chart-3 border-chart-3/30",
};

const STATUS_OPTIONS = [
  OrderStatus.Pending,
  OrderStatus.Ongoing,
  OrderStatus.Delivered,
];

function AllOrdersTab() {
  const { orders, isLoading, updateStatus, isUpdatePending } = useAdminOrders();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="admin-orders-empty"
      >
        <ClipboardList size={36} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No orders yet</p>
        <p className="text-sm mt-1">
          Orders will appear here once customers place them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="admin-orders-list">
      {orders.map((order) => {
        const dateStr = new Date(
          Number(order.date) / 1_000_000,
        ).toLocaleDateString();
        const shortUserId = `${order.userId.toText().slice(0, 12)}…`;
        return (
          <Card key={order.id.toString()} className="border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{order.id.toString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs border ${STATUS_COLORS[order.status]}`}
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {order.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span title={order.userId.toText()}>{shortUserId}</span>
                    <span>{dateStr}</span>
                    <span className="font-medium text-foreground">
                      ৳{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <select
                    className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    value={order.status}
                    disabled={isUpdatePending}
                    aria-label="Change order status"
                    data-ocid={`admin-order-status-${order.id}`}
                    onChange={async (e) => {
                      const result = await updateStatus(
                        order.id,
                        e.target.value as OrderStatus,
                      );
                      if ("err" in result)
                        toast.error(result.err ?? "Failed to update status");
                      else toast.success("Order status updated");
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// --- Pending Approvals tab ---
function PendingApprovalsTab() {
  const { approvals, isLoading, approve, reject, isActionPending } =
    useAdminApprovals();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="admin-approvals-empty"
      >
        <UserCheck size={36} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No pending approvals</p>
        <p className="text-sm mt-1">Admin role requests will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="admin-approvals-list">
      {approvals.map((approval) => {
        const dateStr = approval.requestedAt
          ? new Date(approval.requestedAt).toLocaleDateString()
          : "—";
        const shortId = `${approval.principalText.slice(0, 16)}…`;
        return (
          <Card
            key={approval.principalText}
            className="border-border shadow-sm"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p
                    className="text-sm font-medium text-foreground font-mono truncate"
                    title={approval.principalText}
                  >
                    {shortId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested admin role · {dateStr}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => reject(approval.userId)}
                    disabled={isActionPending}
                    data-ocid={`admin-approval-reject-${approval.principalText}`}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      const result = await approve(approval.userId);
                      if ("ok" in result) toast.success("Admin role granted!");
                      else toast.error(result.err ?? "Failed to approve");
                    }}
                    disabled={isActionPending}
                    data-ocid={`admin-approval-approve-${approval.principalText}`}
                  >
                    {isActionPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// --- Payment Verification Tab ---
const PAYMENT_METHOD_CONFIG = {
  bkash: {
    label: "bKash",
    emoji: "💜",
    color: "text-[oklch(var(--bkash))]",
    bg: "bg-[oklch(var(--bkash)/0.08)] border-[oklch(var(--bkash)/0.3)]",
  },
  nagad: {
    label: "Nagad",
    emoji: "🟠",
    color: "text-[oklch(var(--nagad))]",
    bg: "bg-[oklch(var(--nagad)/0.08)] border-[oklch(var(--nagad)/0.3)]",
  },
} as const;

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-secondary/15 text-secondary border-secondary/30",
  Approved: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

function PaymentVerificationTab() {
  const { data: payments, isLoading } = useAdminPendingPayments();
  const { mutateAsync: actionPayment, isPending: isActionPending } =
    useApproveAdminPayment();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const pending = (payments ?? []).filter((p) => p.status === "Pending");

  if (pending.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="admin-payments-empty"
      >
        <CheckCircle size={36} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No pending payments</p>
        <p className="text-sm mt-1">
          Payment submissions awaiting verification will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="admin-payments-list">
      {pending.map((payment) => {
        const methodConf =
          PAYMENT_METHOD_CONFIG[
            payment.method as keyof typeof PAYMENT_METHOD_CONFIG
          ] ?? PAYMENT_METHOD_CONFIG.bkash;
        const dateStr = new Date(payment.createdAt).toLocaleDateString();
        return (
          <Card
            key={payment.id}
            className="border-border shadow-sm overflow-hidden"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${methodConf.bg}`}
                    >
                      <span>{methodConf.emoji}</span>
                      <span className={methodConf.color}>
                        {methodConf.label}
                      </span>
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs border ${PAYMENT_STATUS_COLORS[payment.status] ?? ""}`}
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
                    <span className="text-muted-foreground">
                      Order:{" "}
                      <span className="font-mono text-foreground">
                        #{payment.orderId}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      TxID:{" "}
                      <span className="font-mono text-foreground">
                        {payment.transactionId}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Date: <span className="text-foreground">{dateStr}</span>
                    </span>
                    <span className="font-bold text-primary text-sm col-span-2 sm:col-span-1">
                      ৳{payment.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={isActionPending}
                    data-ocid={`payment-reject-${payment.id}`}
                    onClick={async () => {
                      try {
                        await actionPayment({
                          id: payment.id,
                          action: "reject",
                        });
                        toast.error("Payment rejected");
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Action failed",
                        );
                      }
                    }}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-chart-3 text-chart-3-foreground hover:bg-chart-3/90"
                    disabled={isActionPending}
                    data-ocid={`payment-approve-${payment.id}`}
                    onClick={async () => {
                      try {
                        await actionPayment({
                          id: payment.id,
                          action: "approve",
                        });
                        toast.success("Payment approved! Order confirmed.");
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Action failed",
                        );
                      }
                    }}
                  >
                    {isActionPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// --- Withdrawal Management Tab ---
const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-secondary/15 text-secondary border-secondary/30",
  Approved: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

function WithdrawalManagementTab() {
  const { data: withdrawals, isLoading } = useAdminPendingWithdrawals();
  const { mutateAsync: actionWithdrawal, isPending: isActionPending } =
    useAdminWithdrawalAction();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const pending = (withdrawals ?? []).filter((w) => w.status === "Pending");

  if (pending.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="admin-withdrawals-empty"
      >
        <ArrowDownCircle size={36} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No pending withdrawals</p>
        <p className="text-sm mt-1">
          Seller withdrawal requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-ocid="admin-withdrawals-list">
      {pending.map((req) => {
        const methodConf =
          PAYMENT_METHOD_CONFIG[
            req.method as keyof typeof PAYMENT_METHOD_CONFIG
          ] ?? PAYMENT_METHOD_CONFIG.bkash;
        const dateStr = new Date(req.requestedAt).toLocaleDateString();
        return (
          <Card
            key={req.id}
            className="border-border shadow-sm overflow-hidden"
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {req.sellerName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${methodConf.bg}`}
                    >
                      <span>{methodConf.emoji}</span>
                      <span className={methodConf.color}>
                        {methodConf.label}
                      </span>
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs border ${WITHDRAWAL_STATUS_COLORS[req.status] ?? ""}`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                    <span className="text-muted-foreground">
                      Account:{" "}
                      <span className="font-mono text-foreground">
                        {req.accountNumber}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Requested:{" "}
                      <span className="text-foreground">{dateStr}</span>
                    </span>
                    <span className="font-bold text-secondary text-sm">
                      ৳{req.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={isActionPending}
                    data-ocid={`withdrawal-reject-${req.id}`}
                    onClick={async () => {
                      try {
                        await actionWithdrawal({
                          id: req.id,
                          action: "reject",
                        });
                        toast.error("Withdrawal request rejected");
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Action failed",
                        );
                      }
                    }}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="bg-chart-3 text-chart-3-foreground hover:bg-chart-3/90"
                    disabled={isActionPending}
                    data-ocid={`withdrawal-approve-${req.id}`}
                    onClick={async () => {
                      try {
                        await actionWithdrawal({
                          id: req.id,
                          action: "approve",
                        });
                        toast.success(
                          "Withdrawal approved! Seller will be paid.",
                        );
                      } catch (e) {
                        toast.error(
                          e instanceof Error ? e.message : "Action failed",
                        );
                      }
                    }}
                  >
                    {isActionPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================
export function AdminPage() {
  const {
    iiIsAuthenticated: isAuthenticated,
    iiLogin: login,
    iiIsInitializing: isInitializing,
  } = useAuth();
  const admin = useAdmin();
  const { orders } = useAdminOrders();
  const { data: pendingPayments } = useAdminPendingPayments();
  const { data: pendingWithdrawals } = useAdminPendingWithdrawals();

  const [setupPw, setSetupPw] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupError, setSetupError] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [sessionPw, setSessionPw] = useState("");
  const [featuredIds, setFeaturedIds] = useState<
    Record<AdminCategory, string[]>
  >({
    shop: [],
    delivery: [],
    service: [],
  });

  const setupStrength = getPasswordStrength(setupPw);
  const { isVerified: adminIsVerified, getFeaturedByCategory } = admin;

  const pendingPmtCount = (pendingPayments ?? []).filter(
    (p) => p.status === "Pending",
  ).length;
  const pendingWdCount = (pendingWithdrawals ?? []).filter(
    (w) => w.status === "Pending",
  ).length;
  const pendingOrdersCount = orders.filter(
    (o) => o.status === OrderStatus.Pending,
  ).length;

  useEffect(() => {
    if (!adminIsVerified) return;
    const load = async () => {
      const [shop, delivery, service] = await Promise.all([
        getFeaturedByCategory("shop"),
        getFeaturedByCategory("delivery"),
        getFeaturedByCategory("service"),
      ]);
      setFeaturedIds({ shop, delivery, service });
    };
    void load();
  }, [adminIsVerified, getFeaturedByCategory]);

  const handleAdminLogout = () => {
    admin.setIsVerified(false);
    setSessionPw("");
    setLoginPw("");
    setLoginError("");
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    if (setupPw !== setupConfirm) {
      setSetupError("Passwords do not match");
      return;
    }
    if (setupPw.length < 8) {
      setSetupError("Password must be at least 8 characters");
      return;
    }
    const result = await admin.setupPassword(setupPw);
    if ("ok" in result) {
      setSessionPw(setupPw);
      toast.success("Admin account created!");
    } else {
      setSetupError(result.err ?? "Setup failed");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const ok = await admin.verifyPassword(loginPw);
    if (ok) {
      setSessionPw(loginPw);
      toast.success("Welcome back, Admin!");
    } else {
      setLoginError("Incorrect password. Please try again.");
    }
  };

  // STATE 1: Not logged in with Internet Identity
  if (!isAuthenticated && !isInitializing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={26} className="text-muted-foreground" />
            </div>
            <CardTitle className="font-display text-2xl">
              Login Required
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in with Internet Identity to access the Admin section.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={login}
              className="w-full"
              data-ocid="admin-ii-login"
            >
              <LogIn size={16} />
              Sign in with Internet Identity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATE 2: Not set up
  if (
    isAuthenticated &&
    !admin.isVerified &&
    !admin.isSetup &&
    !admin.isSetupLoading
  ) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <KeyRound size={26} className="text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">
              Create Admin Password
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Set a secure password to protect the Admin Dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSetup(e)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="setup-pw">Password</Label>
                <Input
                  id="setup-pw"
                  type="password"
                  value={setupPw}
                  onChange={(e) => setSetupPw(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                  data-ocid="admin-setup-pw"
                />
                {setupPw && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-0.5 flex-1 h-1.5 rounded-full overflow-hidden bg-border">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all duration-300 ${setupStrength.score >= i ? setupStrength.color : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground w-20">
                      {setupStrength.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setup-confirm">Confirm password</Label>
                <Input
                  id="setup-confirm"
                  type="password"
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                  data-ocid="admin-setup-confirm"
                />
              </div>
              {setupError && (
                <p
                  className="text-sm text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <ShieldAlert size={13} /> {setupError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={admin.isSetupPending || !setupPw || !setupConfirm}
                data-ocid="admin-setup-submit"
              >
                {admin.isSetupPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                Create Admin Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATE 3: Setup but not verified → Admin Login
  if (isAuthenticated && !admin.isVerified && admin.isSetup) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={26} className="text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Admin Login</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your admin password to access the dashboard.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleLogin(e)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-pw">Password</Label>
                <Input
                  id="login-pw"
                  type="password"
                  value={loginPw}
                  onChange={(e) => {
                    setLoginPw(e.target.value);
                    setLoginError("");
                  }}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
                  autoFocus
                  data-ocid="admin-login-pw"
                />
              </div>
              {loginError && (
                <div
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
                  role="alert"
                  data-ocid="admin-login-error"
                >
                  <ShieldAlert size={14} /> {loginError}
                </div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={admin.isVerifyPending || !loginPw}
                data-ocid="admin-login-submit"
              >
                {admin.isVerifyPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                Unlock Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATE 4: Verified → Full Admin Panel with 7 tabs
  if (admin.isVerified) {
    const categoryConfig = [
      { key: "shop" as AdminCategory, label: "Shop", color: "text-secondary" },
      {
        key: "delivery" as AdminCategory,
        label: "Delivery",
        color: "text-accent",
      },
      {
        key: "service" as AdminCategory,
        label: "Service",
        color: "text-chart-3",
      },
    ];

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20 sm:pb-8">
        {/* Panel header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Commission, payments, orders & more
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdminLogout}
            data-ocid="admin-dashboard-logout"
          >
            <LogOut size={14} />
            Lock
          </Button>
        </div>

        {/* Main tabbed panel */}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue="dashboard">
              {/* 7-tab layout: scroll on mobile */}
              <TabsList className="w-full mb-6 flex overflow-x-auto gap-0.5 h-auto p-1 flex-nowrap">
                <TabsTrigger
                  value="dashboard"
                  className="flex-1 min-w-[80px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-dashboard"
                >
                  <Package
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="commission"
                  className="flex-1 min-w-[90px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-commission"
                >
                  <BadgeDollarSign
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Commission
                </TabsTrigger>
                <TabsTrigger
                  value="payments"
                  className="flex-1 min-w-[90px] text-xs sm:text-sm flex items-center justify-center"
                  data-ocid="admin-main-tab-payments"
                >
                  <CheckCircle
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Payments
                  <NotificationBadge count={pendingPmtCount} />
                </TabsTrigger>
                <TabsTrigger
                  value="withdrawals"
                  className="flex-1 min-w-[100px] text-xs sm:text-sm flex items-center justify-center"
                  data-ocid="admin-main-tab-withdrawals"
                >
                  <Wallet
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Withdrawals
                  <NotificationBadge count={pendingWdCount} />
                </TabsTrigger>
                <TabsTrigger
                  value="orders"
                  className="flex-1 min-w-[70px] text-xs sm:text-sm flex items-center justify-center"
                  data-ocid="admin-main-tab-orders"
                >
                  <ClipboardList
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Orders
                  <NotificationBadge count={pendingOrdersCount} />
                </TabsTrigger>
                <TabsTrigger
                  value="approvals"
                  className="flex-1 min-w-[80px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-approvals"
                >
                  <UserCheck
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Approvals
                </TabsTrigger>
                <TabsTrigger
                  value="featured"
                  className="flex-1 min-w-[75px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-featured"
                >
                  <Star size={13} className="mr-1 hidden sm:inline shrink-0" />
                  Featured
                </TabsTrigger>
              </TabsList>

              {/* Dashboard */}
              <TabsContent value="dashboard">
                <DashboardTab totalOrders={orders.length} />
              </TabsContent>

              {/* Commission Dashboard */}
              <TabsContent value="commission">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Commission Dashboard
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      System-wide 10% commission across all sellers and
                      products.
                    </p>
                  </div>
                  <CommissionDashboardTab />
                </div>
              </TabsContent>

              {/* Payment Verification */}
              <TabsContent value="payments">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Payment Verification
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Approve or reject bKash/Nagad payment submissions from
                      customers.
                    </p>
                  </div>
                  <PaymentVerificationTab />
                </div>
              </TabsContent>

              {/* Withdrawal Management */}
              <TabsContent value="withdrawals">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Withdrawal Management
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review and process seller withdrawal requests via
                      bKash/Nagad.
                    </p>
                  </div>
                  <WithdrawalManagementTab />
                </div>
              </TabsContent>

              {/* All Orders */}
              <TabsContent value="orders">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      All Orders
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      View and update order status for all customers.
                    </p>
                  </div>
                  <AllOrdersTab />
                </div>
              </TabsContent>

              {/* Pending Approvals */}
              <TabsContent value="approvals">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Pending Approvals
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Approve or reject admin role requests.
                    </p>
                  </div>
                  <PendingApprovalsTab />
                </div>
              </TabsContent>

              {/* Featured Items */}
              <TabsContent value="featured">
                <div className="space-y-4">
                  <div>
                    <CardTitle className="text-base">Featured Items</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Control which items appear in the Featured &amp; Trending
                      sections.
                    </p>
                  </div>
                  <Tabs defaultValue="shop">
                    <TabsList className="w-full mb-4">
                      {categoryConfig.map(({ key, label, color }) => (
                        <TabsTrigger
                          key={key}
                          value={key}
                          className="flex-1"
                          data-ocid={`admin-tab-${key}`}
                        >
                          <span className={color}>{label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {categoryConfig.map(({ key }) => (
                      <TabsContent key={key} value={key}>
                        <FeaturedEditor
                          category={key}
                          initialIds={featuredIds[key]}
                          sessionPassword={sessionPw}
                          onSaved={() => {
                            void admin.getFeaturedByCategory(key).then((ids) =>
                              setFeaturedIds((prev) => ({
                                ...prev,
                                [key]: ids,
                              })),
                            );
                          }}
                          isUpdatePending={admin.isUpdatePending}
                          updateFeatured={admin.updateFeatured}
                        />
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Reset password */}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <ResetPasswordPanel
              resetPassword={admin.resetPassword}
              isResetPending={admin.isResetPending}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-muted-foreground" />
    </div>
  );
}
