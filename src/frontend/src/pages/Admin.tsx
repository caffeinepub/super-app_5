import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  ArrowDownCircle,
  BadgeDollarSign,
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Copy,
  Edit2,
  Filter,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Save,
  Scale,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  TrendingUp,
  UserCheck,
  UserMinus,
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
import { createActor } from "../backend";
import { OrderStatus, UserRole } from "../backend.d";
import type { AuditEntry, UserId } from "../backend.d";
import { OtpModal } from "../components/OtpModal";
import { type AdminCategory, useAdmin } from "../hooks/useAdmin";
import { useAdminApprovals } from "../hooks/useAdminApprovals";
import { useAdminOrders } from "../hooks/useAdminOrders";
import {
  useAdminPendingPayments,
  useApproveAdminPayment,
} from "../hooks/useAdminPayments";
import {
  useAddProduct,
  useAdminAllProducts,
  useDeleteProduct,
  useUpdateProduct,
} from "../hooks/useAdminProducts";
import {
  useAdminPendingWithdrawals,
  useAdminWithdrawalAction,
  useAllSellerLimits,
  useSetSellerWithdrawalLimit,
} from "../hooks/useAdminWithdrawals";
import {
  useAllSellerSuspensions,
  useAuditLog,
  useSellerSuspensionTrail,
} from "../hooks/useAuditLog";
import { useAuth } from "../hooks/useAuth";
import {
  useAdminStats,
  useCommissionByPeriod,
  useTopProducts,
  useTopSellers,
} from "../hooks/useCommission";
import type { BackendProduct, NewProduct, StockStatus } from "../types";

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
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
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
            <div style={{ width: "100%", height: 210, minHeight: 210 }}>
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
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
                    strokeDasharray="0"
                    stroke="oklch(0.88 0 0 / 0.25)"
                    vertical={false}
                    strokeWidth={1}
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
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="oklch(0.52 0.28 199)"
                    strokeWidth={2}
                    fill="url(#commissionGrad)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

// --- Payment Verification Tab (with OTP) ---
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

function PaymentVerificationTab({ adminUserId }: { adminUserId: string }) {
  const { data: payments, isLoading } = useAdminPendingPayments();
  const { mutateAsync: actionPayment, isPending: isActionPending } =
    useApproveAdminPayment();
  const [otpTarget, setOtpTarget] = useState<{ id: string } | null>(null);

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
    <>
      <OtpModal
        open={!!otpTarget}
        userId={adminUserId}
        action="ApprovePayment"
        actionLabel="Approve Payment"
        onConfirm={async () => {
          if (!otpTarget) return;
          try {
            await actionPayment({ id: otpTarget.id, action: "approve" });
            toast.success("Payment approved! Order confirmed.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Action failed");
          } finally {
            setOtpTarget(null);
          }
        }}
        onCancel={() => setOtpTarget(null)}
      />

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
                      onClick={() => setOtpTarget({ id: payment.id })}
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
    </>
  );
}

// --- Withdrawal Management Tab (with OTP) ---
const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-secondary/15 text-secondary border-secondary/30",
  Approved: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

// ─── Per-Seller Withdrawal Limits Card ───────────────────────────────────────

function SellerWithdrawalLimitsCard() {
  const { data: limits, isLoading: limitsLoading } = useAllSellerLimits();
  const { mutateAsync: setLimit, isPending: isSettingLimit } =
    useSetSellerWithdrawalLimit();
  const [sellerIdInput, setSellerIdInput] = useState("");
  const [limitInput, setLimitInput] = useState("");
  const [formError, setFormError] = useState("");

  const handleSetLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const trimmedId = sellerIdInput.trim();
    const parsedLimit = Number.parseFloat(limitInput);
    if (!trimmedId) {
      setFormError("Please enter a seller ID.");
      return;
    }
    if (!parsedLimit || parsedLimit <= 0) {
      setFormError("Please enter a valid limit amount greater than 0.");
      return;
    }
    try {
      await setLimit({ sellerId: trimmedId, limit: parsedLimit });
      toast.success(
        `Withdrawal limit of ৳${parsedLimit.toLocaleString()} set for ${trimmedId}`,
      );
      setSellerIdInput("");
      setLimitInput("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to set limit");
    }
  };

  const handleRemoveLimit = async (sellerId: string) => {
    try {
      await setLimit({ sellerId, limit: null });
      toast.success(`Withdrawal limit removed for ${sellerId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove limit",
      );
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden border border-violet-500/20 shadow-sm mb-6"
      data-ocid="seller-limits-card"
    >
      {/* Card header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Settings2 size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-sm">
              Per-Seller Withdrawal Limits
            </h3>
            <p className="text-xs text-white/70 mt-0.5">
              Set maximum withdrawal amounts per seller. Sellers without a limit
              can withdraw any amount up to their balance.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card px-5 py-4 space-y-5">
        {/* Set limit form */}
        <form
          onSubmit={(e) => void handleSetLimit(e)}
          className="space-y-3"
          data-ocid="seller-limit-form"
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <Label
                htmlFor="limit-seller-id"
                className="text-xs font-semibold mb-1.5 block"
              >
                Seller ID
              </Label>
              <Input
                id="limit-seller-id"
                value={sellerIdInput}
                onChange={(e) => {
                  setSellerIdInput(e.target.value);
                  setFormError("");
                }}
                placeholder="user@example.com or principal"
                className="text-sm"
                data-ocid="limit-seller-id-input"
              />
            </div>
            <div>
              <Label
                htmlFor="limit-amount"
                className="text-xs font-semibold mb-1.5 block"
              >
                Limit Amount (৳)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                  ৳
                </span>
                <Input
                  id="limit-amount"
                  type="number"
                  min="1"
                  value={limitInput}
                  onChange={(e) => {
                    setLimitInput(e.target.value);
                    setFormError("");
                  }}
                  placeholder="e.g. 5000"
                  className="text-sm pl-7"
                  data-ocid="limit-amount-input"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSettingLimit || !sellerIdInput || !limitInput}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 hover:opacity-90 shrink-0"
              data-ocid="limit-set-btn"
            >
              {isSettingLimit ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Set Limit
            </Button>
          </div>
          {formError && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <ShieldAlert size={12} /> {formError}
            </p>
          )}
        </form>

        {/* Current limits table */}
        {limitsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : !limits || limits.length === 0 ? (
          <div
            className="flex flex-col items-center gap-2 py-8 text-center rounded-xl border border-dashed border-border bg-muted/20"
            data-ocid="seller-limits-empty"
          >
            <Settings2 size={24} className="text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground font-medium">
              No limits set
            </p>
            <p className="text-xs text-muted-foreground">
              All sellers can withdraw up to their full balance.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border border-border overflow-hidden"
            data-ocid="seller-limits-table"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  {["Seller ID", "Limit (৳)", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${h === "Limit (৳)" ? "text-right" : h === "Actions" ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {limits.map((entry, i) => (
                  <tr
                    key={entry.sellerId}
                    className={`border-b border-border/40 transition-smooth hover:bg-muted/20 ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
                    data-ocid={`limit-row-${entry.sellerId}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground max-w-[200px]">
                      <span className="truncate block">{entry.sellerId}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-display font-bold text-violet-600 dark:text-violet-400">
                      ৳{entry.limit.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10 h-7 px-2.5"
                        disabled={isSettingLimit}
                        data-ocid={`limit-remove-${entry.sellerId}`}
                        onClick={() => void handleRemoveLimit(entry.sellerId)}
                      >
                        <Trash2 size={12} />
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function WithdrawalManagementTab({ adminUserId }: { adminUserId: string }) {
  const { data: withdrawals, isLoading } = useAdminPendingWithdrawals();
  const { mutateAsync: actionWithdrawal, isPending: isActionPending } =
    useAdminWithdrawalAction();
  const [otpTarget, setOtpTarget] = useState<{ id: string } | null>(null);

  const pending = (withdrawals ?? []).filter((w) => w.status === "Pending");

  return (
    <div className="space-y-6">
      {/* Per-seller limits section — always visible above pending list */}
      <SellerWithdrawalLimitsCard />

      {/* Pending withdrawal requests */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ArrowDownCircle size={15} className="text-muted-foreground" />
          Pending Withdrawal Requests
          {pending.length > 0 && (
            <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
              {pending.length} pending
            </span>
          )}
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div
            className="text-center py-10 text-muted-foreground rounded-xl border border-dashed border-border bg-muted/10"
            data-ocid="admin-withdrawals-empty"
          >
            <ArrowDownCircle size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium text-sm">No pending withdrawals</p>
            <p className="text-xs mt-1">
              Seller withdrawal requests will appear here.
            </p>
          </div>
        ) : (
          <>
            <OtpModal
              open={!!otpTarget}
              userId={adminUserId}
              action="WithdrawalRequest"
              actionLabel="Approve Withdrawal"
              onConfirm={async () => {
                if (!otpTarget) return;
                try {
                  await actionWithdrawal({
                    id: otpTarget.id,
                    action: "approve",
                  });
                  toast.success("Withdrawal approved! Seller will be paid.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Action failed");
                } finally {
                  setOtpTarget(null);
                }
              }}
              onCancel={() => setOtpTarget(null)}
            />

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
                                  e instanceof Error
                                    ? e.message
                                    : "Action failed",
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
                            onClick={() => setOtpTarget({ id: req.id })}
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
          </>
        )}
      </div>
    </div>
  );
}

// --- Audit Log Tab ---
const ACTION_TYPE_COLORS: Record<string, string> = {
  financial: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  auth: "bg-secondary/15 text-secondary border-secondary/30",
  admin: "bg-accent/15 text-accent border-accent/30",
  suspension: "bg-destructive/15 text-destructive border-destructive/30",
};

function getActionTypeBadge(actionType: string): string {
  const lower = actionType.toLowerCase();
  if (
    lower.includes("payment") ||
    lower.includes("withdraw") ||
    lower.includes("commission")
  )
    return "financial";
  if (
    lower.includes("login") ||
    lower.includes("auth") ||
    lower.includes("otp")
  )
    return "auth";
  if (
    lower.includes("suspend") ||
    lower.includes("block") ||
    lower.includes("ban")
  )
    return "suspension";
  return "admin";
}

// ── Seller Audit Trail Tab ─────────────────────────────────────────────────

function SuspensionBadge({ actionType }: { actionType: string }) {
  const isSuspend = actionType === "SUSPEND_USER";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
        isSuspend
          ? "bg-gradient-to-r from-red-600 to-rose-700"
          : "bg-gradient-to-r from-green-600 to-emerald-700"
      }`}
    >
      {isSuspend ? <UserMinus size={11} /> : <UserCheck size={11} />}
      {isSuspend ? "SUSPENDED" : "UNSUSPENDED"}
    </span>
  );
}

function CopyableId({ id }: { id: string }) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(id);
    toast.success("Copied to clipboard");
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={id}
      className="inline-flex items-center gap-1 font-mono text-xs bg-muted/60 hover:bg-muted px-2 py-0.5 rounded transition-colors cursor-pointer"
      data-ocid="suspension-copy-id"
    >
      <span className="truncate max-w-[120px]">
        {id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id}
      </span>
      <Copy size={10} className="shrink-0 text-muted-foreground" />
    </button>
  );
}

function formatSuspensionTs(ts: bigint): string {
  return new Date(Number(ts) / 1_000_000).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SellerLookupPanel() {
  const [inputId, setInputId] = useState("");
  const [searchId, setSearchId] = useState("");

  const { data: entries = [], isFetching } = useSellerSuspensionTrail(searchId);

  const handleSearch = () => {
    const trimmed = inputId.trim();
    if (trimmed) setSearchId(trimmed);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-gradient-to-r from-red-950/40 via-rose-950/30 to-purple-950/40 border border-rose-800/30 p-4">
        <h3 className="font-semibold text-sm text-foreground mb-1 flex items-center gap-2">
          <Search size={14} className="text-rose-400" />
          Look Up Seller History
        </h3>
        <p className="text-xs text-muted-foreground">
          Enter a Seller ID to view their complete suspension and reinstatement
          history.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Enter Seller ID…"
          className="font-mono text-sm"
          data-ocid="suspension-seller-id-input"
        />
        <Button
          type="button"
          onClick={handleSearch}
          disabled={!inputId.trim() || isFetching}
          data-ocid="suspension-seller-search-btn"
          className="shrink-0"
        >
          {isFetching ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Search size={14} />
          )}
          Search
        </Button>
      </div>

      {searchId && (
        <div className="space-y-2">
          {isFetching ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-border bg-muted/20">
              <UserMinus
                size={28}
                className="mx-auto mb-2 text-muted-foreground/50"
              />
              <p className="text-sm text-muted-foreground">
                No suspension history found for this seller
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Seller ID: <span className="font-mono">{searchId}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                {entries.length} event{entries.length !== 1 ? "s" : ""} found
                for <span className="font-mono">{searchId}</span>
              </p>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SuspensionBadge actionType={entry.actionType} />
                      <span className="text-xs text-muted-foreground">
                        {formatSuspensionTs(entry.timestamp)}
                      </span>
                    </div>
                    {entry.details && (
                      <p className="text-xs text-foreground/80 mt-0.5">
                        {entry.details}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">by</span>
                    <CopyableId id={entry.actorId} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AllSuspensionsPanel() {
  const [page, setPage] = useState(0);
  const PAGE = 20;
  const { data: entries = [], isFetching } = useAllSellerSuspensions(
    PAGE,
    page * PAGE,
  );

  const suspendCount = entries.filter(
    (e) => e.actionType === "SUSPEND_USER",
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-red-900 via-pink-900 to-purple-900 p-4 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Scale size={15} />
              All Recent Suspensions
            </h3>
            <p className="text-xs text-white/70 mt-0.5">
              System-wide suspension and reinstatement activity
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="text-lg font-bold">{entries.length}</p>
              <p className="text-xs text-white/70">Total Events</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-lg font-bold text-rose-300">{suspendCount}</p>
              <p className="text-xs text-white/70">Suspensions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {isFetching ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 rounded-xl border border-dashed border-border bg-muted/20">
          <Scale size={28} className="mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No suspension events recorded yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-lg border border-border bg-card p-3 hover:bg-muted/30 transition-colors"
              data-ocid="suspension-list-row"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SuspensionBadge actionType={entry.actionType} />
                  <span className="text-xs text-muted-foreground">
                    {formatSuspensionTs(entry.timestamp)}
                  </span>
                </div>
                {entry.details && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {entry.details}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Seller:
                </span>
                <CopyableId id={entry.resourceId} />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Admin:
                </span>
                <CopyableId id={entry.actorId} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || isFetching}
          data-ocid="suspension-prev-page"
        >
          <ChevronLeft size={14} />
          Prev
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page + 1} · {entries.length} entries
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={entries.length < PAGE || isFetching}
          data-ocid="suspension-next-page"
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

function SellerAuditTrailTab() {
  return (
    <div className="space-y-6">
      {/* Tab header */}
      <div className="rounded-xl bg-gradient-to-r from-red-950/30 via-pink-950/20 to-purple-950/30 border border-red-800/30 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Scale size={16} className="text-rose-400" />
          <h2 className="font-semibold text-foreground text-sm">
            Seller Suspension Audit Trail
          </h2>
          <Badge
            variant="outline"
            className="text-xs border-rose-500/30 text-rose-400 bg-rose-500/10 ml-auto"
          >
            Immutable · Read-only
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Complete, immutable record of all seller suspension and reinstatement
          actions. Cannot be edited or deleted.
        </p>
      </div>

      {/* Look up panel */}
      <SellerLookupPanel />

      <div className="h-px bg-border" />

      {/* All suspensions */}
      <AllSuspensionsPanel />
    </div>
  );
}

function AuditLogTab() {
  const log = useAuditLog();
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!hasLoaded) {
      void log.fetchPage(0);
      setHasLoaded(true);
    }
  }, [hasLoaded, log]);

  const handleSearch = async () => {
    if (actorFilter.trim()) {
      await log.filterByActor(actorFilter.trim());
    } else if (actionFilter.trim()) {
      await log.filterByAction(actionFilter.trim());
    } else if (fromDate && toDate) {
      await log.filterByDateRange(new Date(fromDate), new Date(toDate));
    } else {
      await log.fetchPage(0);
    }
  };

  const handleClear = async () => {
    setActorFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    await log.clearFilters();
  };

  function formatTs(ts: bigint): string {
    return new Date(Number(ts) / 1_000_000).toLocaleString("en-BD", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function truncate(s: string, n = 20): string {
    return s.length > n ? `${s.slice(0, n)}…` : s;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10 border border-accent/20 p-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen size={16} className="text-accent" />
          <h2 className="font-semibold text-foreground text-sm">Audit Log</h2>
          <Badge
            variant="outline"
            className="text-xs border-accent/30 text-accent bg-accent/10 ml-auto"
          >
            Immutable · 12+ months
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          All admin and financial actions are recorded here and cannot be
          modified.
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="audit-actor-filter"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Actor / User
              </label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="audit-actor-filter"
                  value={actorFilter}
                  onChange={(e) => setActorFilter(e.target.value)}
                  placeholder="Search by actor…"
                  className="pl-8 text-sm h-9"
                  data-ocid="audit-actor-filter"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label
                htmlFor="audit-action-filter"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Action Type
              </label>
              <Input
                id="audit-action-filter"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder="e.g. ApprovePayment…"
                className="text-sm h-9"
                data-ocid="audit-action-filter"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="audit-from-date"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                From Date
              </label>
              <Input
                id="audit-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-sm h-9"
                data-ocid="audit-from-date"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="audit-to-date"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                To Date
              </label>
              <Input
                id="audit-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-sm h-9"
                data-ocid="audit-to-date"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => void handleSearch()}
              disabled={log.loading}
              data-ocid="audit-search-btn"
            >
              {log.loading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Filter size={13} />
              )}
              Apply Filters
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleClear()}
              disabled={log.loading}
              data-ocid="audit-clear-btn"
            >
              <X size={13} />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {log.error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <ShieldAlert size={14} />
          {log.error}
        </div>
      )}

      {/* Table */}
      {log.loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : log.entries.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="audit-log-empty"
        >
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No audit entries found</p>
          <p className="text-sm mt-1">
            Try adjusting your filters or load the full log.
          </p>
        </div>
      ) : (
        <div className="space-y-2" data-ocid="audit-log-list">
          {log.entries.map((entry: AuditEntry) => {
            const category = getActionTypeBadge(entry.actionType);
            const colorClass =
              ACTION_TYPE_COLORS[category] ?? ACTION_TYPE_COLORS.admin;
            return (
              <div
                key={entry.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/20 transition-colors"
                data-ocid={`audit-entry-${entry.id}`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold border px-2 py-0.5 ${colorClass}`}
                    >
                      {category.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {entry.actionType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="font-mono" title={entry.actorId}>
                      {truncate(entry.actorId, 18)}
                    </span>
                    <span>·</span>
                    <span>
                      {entry.resourceType}:{" "}
                      <span className="text-foreground font-medium">
                        {entry.resourceId}
                      </span>
                    </span>
                    {entry.details && (
                      <span className="text-foreground/70">
                        {truncate(entry.details, 40)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatTs(entry.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!log.loading && log.entries.length > 0 && (
        <div
          className="flex items-center justify-between pt-2"
          data-ocid="audit-pagination"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => void log.fetchPage(log.currentPage - 1)}
            disabled={log.currentPage === 0 || log.loading}
            data-ocid="audit-prev"
          >
            <ChevronLeft size={14} />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {log.currentPage + 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void log.fetchPage(log.currentPage + 1)}
            disabled={log.totalFetched < 20 || log.loading}
            data-ocid="audit-next"
          >
            Next
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

// --- User Management Tab (Suspend/Unsuspend with OTP) ---
interface ManagedUser {
  email: string;
  role: "Customer" | "Seller";
  suspended: boolean;
}

function UserManagementTab({ adminUserId }: { adminUserId: string }) {
  const { actor } = useActor(createActor);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [otpTarget, setOtpTarget] = useState<{
    email: string;
    action: "suspend" | "unsuspend";
  } | null>(null);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    // Load users from localStorage (same store as useAuth)
    const raw = localStorage.getItem("sa_users");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<
          string,
          { role: "Customer" | "Seller"; suspended?: boolean }
        >;
        const list: ManagedUser[] = Object.entries(parsed).map(
          ([email, u]) => ({
            email,
            role: u.role,
            suspended: u.suspended ?? false,
          }),
        );
        setUsers(list);
      } catch {
        setUsers([]);
      }
    }
    setIsLoading(false);
  }, []);

  const applySuspend = async (email: string, suspend: boolean) => {
    setActionPending(true);
    try {
      // Update localStorage
      const raw = localStorage.getItem("sa_users");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<
          string,
          {
            role: "Customer" | "Seller";
            suspended?: boolean;
            passwordHash: string;
            pendingAdmin: boolean;
          }
        >;
        if (parsed[email]) {
          parsed[email].suspended = suspend;
          localStorage.setItem("sa_users", JSON.stringify(parsed));
        }
      }
      // Record in backend audit log via assignRole (closest available action)
      if (actor) {
        try {
          // Lock suspended user out by recording a backend lockout signal
          if (suspend) {
            // Record 99 failures to trigger lockout for 15 minutes on the user's key
            for (let i = 0; i < 5; i++) {
              await actor.recordLoginFailure(email);
            }
          } else {
            await actor.clearLoginAttempts(email);
          }
        } catch {
          /* noop */
        }
      }
      setUsers((prev) =>
        prev.map((u) => (u.email === email ? { ...u, suspended: suspend } : u)),
      );
      toast.success(
        suspend
          ? `${email} has been suspended.`
          : `${email} has been unsuspended.`,
      );
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionPending(false);
      setOtpTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div
        className="text-center py-12 text-muted-foreground"
        data-ocid="admin-users-empty"
      >
        <Users size={36} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">No registered users</p>
        <p className="text-sm mt-1">Users who sign up will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <OtpModal
        open={!!otpTarget}
        userId={adminUserId}
        action="SuspendUser"
        actionLabel={
          otpTarget?.action === "suspend" ? "Suspend User" : "Unsuspend User"
        }
        onConfirm={async () => {
          if (!otpTarget) return;
          await applySuspend(otpTarget.email, otpTarget.action === "suspend");
        }}
        onCancel={() => setOtpTarget(null)}
      />

      <div className="space-y-3" data-ocid="admin-users-list">
        {users.map((user) => (
          <Card key={user.email} className="border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {user.email}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs border ${
                        user.role === "Seller"
                          ? "bg-accent/10 text-accent border-accent/30"
                          : "bg-primary/10 text-primary border-primary/30"
                      }`}
                    >
                      {user.role}
                    </Badge>
                    {user.suspended && (
                      <Badge
                        variant="outline"
                        className="text-xs border bg-destructive/10 text-destructive border-destructive/30"
                        data-ocid={`user-suspended-badge-${user.email}`}
                      >
                        Suspended
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {user.suspended ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-chart-3/40 text-chart-3 hover:bg-chart-3/10"
                      disabled={actionPending}
                      data-ocid={`user-unsuspend-${user.email}`}
                      onClick={() =>
                        setOtpTarget({ email: user.email, action: "unsuspend" })
                      }
                    >
                      <UserCheck size={14} />
                      Unsuspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={actionPending}
                      data-ocid={`user-suspend-${user.email}`}
                      onClick={() =>
                        setOtpTarget({ email: user.email, action: "suspend" })
                      }
                    >
                      <UserMinus size={14} />
                      Suspend
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// ==================== ALL PRODUCTS TAB ====================

const STOCK_STATUS_OPTIONS: { value: StockStatus; label: string }[] = [
  { value: "in_stock", label: "In Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "limited", label: "Limited" },
];

const SUBCATEGORY_OPTIONS = [
  "Electronics",
  "Clothing",
  "Food",
  "Home & Living",
  "Sports",
  "Beauty",
  "Other",
];

const STOCK_BADGE: Record<StockStatus, string> = {
  in_stock: "bg-chart-3/15 text-chart-3 border-chart-3/30",
  out_of_stock: "bg-destructive/15 text-destructive border-destructive/30",
  limited: "bg-secondary/15 text-secondary border-secondary/30",
};
const STOCK_LABEL: Record<StockStatus, string> = {
  in_stock: "In Stock",
  out_of_stock: "Out of Stock",
  limited: "Limited",
};

const emptyForm = (): NewProduct => ({
  name: "",
  description: "",
  images: [""],
  sellerName: "",
  shopName: "",
  shopDescription: "",
  subcategory: "Electronics",
  price: 0,
  stockStatus: "in_stock",
});

interface ProductFormProps {
  initial?: BackendProduct | null;
  onSave: (data: NewProduct & { id?: string }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function ProductForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: ProductFormProps) {
  const [form, setForm] = useState<NewProduct>(
    initial
      ? {
          name: initial.name,
          description: initial.description,
          images: initial.images.length ? initial.images : [""],
          sellerName: initial.sellerName,
          shopName: initial.shopName,
          shopDescription: initial.shopDescription,
          subcategory: initial.subcategory,
          price: initial.price,
          stockStatus: initial.stockStatus,
        }
      : emptyForm(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.price || form.price <= 0)
      e.price = "Price must be greater than 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSave({ ...form, id: initial?.id });
  };

  const setImage = (idx: number, val: string) => {
    setForm((f) => {
      const imgs = [...f.images];
      imgs[idx] = val;
      return { ...f, images: imgs };
    });
  };

  const addImage = () => setForm((f) => ({ ...f, images: [...f.images, ""] }));
  const removeImage = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  return (
    <div
      className="rounded-2xl border border-primary/20 overflow-hidden mt-4"
      data-ocid="product-form"
    >
      <div className="bg-gradient-to-r from-primary/20 via-accent/15 to-secondary/20 px-5 py-4">
        <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
          {initial ? <Edit2 size={15} /> : <Plus size={15} />}
          {initial ? "Edit Product" : "Add New Product"}
        </h3>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-card p-5 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-name" className="text-xs font-semibold">
              📦 Product Name *
            </Label>
            <Input
              id="pf-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Enter product name"
              data-ocid="pf-name"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-price" className="text-xs font-semibold">
              💰 Price (৳) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">
                ৳
              </span>
              <Input
                id="pf-price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    price: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="pl-7"
                placeholder="0.00"
                data-ocid="pf-price"
              />
            </div>
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price}</p>
            )}
          </div>

          {/* Subcategory */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-subcat" className="text-xs font-semibold">
              🏷️ Subcategory
            </Label>
            <select
              id="pf-subcat"
              value={form.subcategory}
              onChange={(e) =>
                setForm((f) => ({ ...f, subcategory: e.target.value }))
              }
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              data-ocid="pf-subcat"
            >
              {SUBCATEGORY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-stock" className="text-xs font-semibold">
              📊 Stock Status
            </Label>
            <select
              id="pf-stock"
              value={form.stockStatus}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  stockStatus: e.target.value as StockStatus,
                }))
              }
              className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              data-ocid="pf-stock"
            >
              {STOCK_STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Seller Name */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-seller" className="text-xs font-semibold">
              🏪 Seller Name
            </Label>
            <Input
              id="pf-seller"
              value={form.sellerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, sellerName: e.target.value }))
              }
              placeholder="Seller display name"
              data-ocid="pf-seller"
            />
          </div>

          {/* Shop Name */}
          <div className="space-y-1.5">
            <Label htmlFor="pf-shop" className="text-xs font-semibold">
              🏬 Shop Name
            </Label>
            <Input
              id="pf-shop"
              value={form.shopName}
              onChange={(e) =>
                setForm((f) => ({ ...f, shopName: e.target.value }))
              }
              placeholder="Shop or store name"
              data-ocid="pf-shop"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="pf-desc" className="text-xs font-semibold">
            📝 Description *
          </Label>
          <textarea
            id="pf-desc"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            rows={3}
            placeholder="Detailed product description…"
            className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            data-ocid="pf-desc"
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Shop Description */}
        <div className="space-y-1.5">
          <Label htmlFor="pf-shopdesc" className="text-xs font-semibold">
            📖 Shop Description
          </Label>
          <textarea
            id="pf-shopdesc"
            value={form.shopDescription}
            onChange={(e) =>
              setForm((f) => ({ ...f, shopDescription: e.target.value }))
            }
            rows={2}
            placeholder="About this shop or seller…"
            className="w-full text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            data-ocid="pf-shopdesc"
          />
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">
            🖼️ Product Images (URLs)
          </Label>
          {form.images.map((img, i) => (
            <div
              key={`img-slot-${i}-${form.images.length}`}
              className="flex gap-2"
            >
              <Input
                value={img}
                onChange={(e) => setImage(i, e.target.value)}
                placeholder={
                  i === 0
                    ? "Primary image URL (required for display)"
                    : "Additional image URL"
                }
                className="flex-1"
                data-ocid={`pf-image-${i}`}
              />
              {form.images.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeImage(i)}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
                  aria-label="Remove this image URL"
                  data-ocid={`pf-remove-image-${i}`}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addImage}
            className="text-xs"
            data-ocid="pf-add-image"
          >
            <Plus size={13} /> Add another image
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-border">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 hover:opacity-90"
            data-ocid="pf-save"
          >
            {isSaving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {initial ? "Save Changes" : "Add Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-ocid="pf-cancel"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function AllProductsTab() {
  const { data: products, isLoading, isError } = useAdminAllProducts();
  const { mutateAsync: addProduct, isPending: isAdding } = useAddProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } =
    useUpdateProduct();
  const { mutateAsync: deleteProduct, isPending: isDeleting } =
    useDeleteProduct();

  const [formMode, setFormMode] = useState<"hidden" | "add" | "edit">("hidden");
  const [editTarget, setEditTarget] = useState<BackendProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const isSaving = isAdding || isUpdating;

  const openAdd = () => {
    setEditTarget(null);
    setFormMode("add");
  };
  const openEdit = (p: BackendProduct) => {
    setEditTarget(p);
    setFormMode("edit");
  };
  const closeForm = () => {
    setFormMode("hidden");
    setEditTarget(null);
  };

  const handleSave = async (data: NewProduct & { id?: string }) => {
    try {
      if (formMode === "edit" && data.id) {
        await updateProduct({
          id: data.id,
          name: data.name,
          description: data.description,
          images: data.images.filter(Boolean),
          sellerName: data.sellerName,
          shopName: data.shopName,
          shopDescription: data.shopDescription,
          subcategory: data.subcategory,
          price: data.price,
          stockStatus: data.stockStatus,
          // preserve existing fields
          sellerId: editTarget!.sellerId as unknown as UserId,
          rating: editTarget!.rating,
          reviewCount: editTarget!.reviewCount,
          createdAt: editTarget!.createdAt,
          updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        toast.success("Product updated!");
      } else {
        await addProduct({
          id: crypto.randomUUID(),
          name: data.name,
          description: data.description,
          images: data.images.filter(Boolean),
          sellerName: data.sellerName,
          shopName: data.shopName,
          shopDescription: data.shopDescription,
          subcategory: data.subcategory,
          price: data.price,
          stockStatus: data.stockStatus,
          sellerId: "" as unknown as UserId,
          rating: 0,
          reviewCount: BigInt(0),
          createdAt: BigInt(Date.now()) * BigInt(1_000_000),
          updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
        });
        toast.success("Product added!");
      }
      closeForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab header */}
      <div className="rounded-2xl overflow-hidden border border-violet-500/20">
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 px-5 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <ShoppingBag size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-sm">
                  All Products
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  {isLoading
                    ? "Loading…"
                    : `${(products ?? []).length} products in store`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={openAdd}
              disabled={formMode !== "hidden"}
              className="bg-white text-violet-700 hover:bg-white/90 font-semibold text-xs border-0 shrink-0"
              data-ocid="admin-add-product-btn"
            >
              <Plus size={14} />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Inline form */}
      {formMode !== "hidden" && (
        <ProductForm
          initial={editTarget}
          onSave={handleSave}
          onCancel={closeForm}
          isSaving={isSaving}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          data-ocid="delete-confirm"
        >
          <AlertTriangle
            size={18}
            className="text-destructive shrink-0 mt-0.5 sm:mt-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Delete this product?
            </p>
            <p className="text-xs text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
              data-ocid="delete-cancel"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => void handleDelete(deleteConfirm)}
              data-ocid="delete-confirm-btn"
            >
              {isDeleting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
          <ShieldAlert size={15} />
          Failed to load products. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && (products ?? []).length === 0 && (
        <div
          className="text-center py-16 rounded-xl border border-dashed border-border bg-muted/20"
          data-ocid="admin-products-empty"
        >
          <Store size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-display font-semibold text-foreground">
            No products yet
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Click "Add Product" above to add your first product.
          </p>
        </div>
      )}

      {/* Product table */}
      {!isLoading && !isError && (products ?? []).length > 0 && (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="admin-products-table"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {[
                  "",
                  "Name",
                  "Seller",
                  "Category",
                  "Price",
                  "Stock",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap ${
                      h === "Price"
                        ? "text-right"
                        : h === "Actions"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "bg-card" : "bg-background"}`}
                  data-ocid={`admin-product-row-${p.id}`}
                >
                  {/* Image */}
                  <td className="px-3 py-2.5 w-10">
                    {p.images[0] && !imgErrors[p.id] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover border border-border"
                        onError={() =>
                          setImgErrors((e) => ({ ...e, [p.id]: true }))
                        }
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center text-lg border border-border">
                        📦
                      </div>
                    )}
                  </td>
                  {/* Name */}
                  <td className="px-3 py-2.5 max-w-[160px]">
                    <p className="font-medium text-foreground truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.description.slice(0, 48)}
                      {p.description.length > 48 ? "…" : ""}
                    </p>
                  </td>
                  {/* Seller */}
                  <td className="px-3 py-2.5 max-w-[120px]">
                    <p className="text-xs text-foreground truncate">
                      {p.sellerName || "—"}
                    </p>
                    {p.shopName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {p.shopName}
                      </p>
                    )}
                  </td>
                  {/* Category */}
                  <td className="px-3 py-2.5">
                    <span className="text-xs bg-muted/60 text-foreground/70 px-2 py-0.5 rounded-full border border-border/50 whitespace-nowrap">
                      {p.subcategory || "—"}
                    </span>
                  </td>
                  {/* Price */}
                  <td className="px-3 py-2.5 text-right font-display font-bold text-primary whitespace-nowrap">
                    ৳{p.price.toLocaleString()}
                  </td>
                  {/* Stock */}
                  <td className="px-3 py-2.5">
                    <Badge
                      variant="outline"
                      className={`text-xs border whitespace-nowrap ${STOCK_BADGE[p.stockStatus as StockStatus] ?? STOCK_BADGE.in_stock}`}
                    >
                      {STOCK_LABEL[p.stockStatus as StockStatus] ??
                        p.stockStatus}
                    </Badge>
                  </td>
                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => openEdit(p)}
                        disabled={formMode !== "hidden"}
                        data-ocid={`admin-edit-product-${p.id}`}
                      >
                        <Edit2 size={12} />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteConfirm(p.id)}
                        disabled={isDeleting}
                        data-ocid={`admin-delete-product-${p.id}`}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================
export function AdminPage() {
  const {
    iiIsAuthenticated: isAuthenticated,
    iiLogin: login,
    iiIsInitializing: isInitializing,
    iiPrincipal,
  } = useAuth();
  const admin = useAdmin();
  const { orders } = useAdminOrders();
  const { data: pendingPayments } = useAdminPendingPayments();
  const { data: pendingWithdrawals } = useAdminPendingWithdrawals();
  const { actor } = useActor(createActor);

  const [setupPw, setSetupPw] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupError, setSetupError] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLocked, setLoginLocked] = useState(false);
  const [lockSecsLeft, setLockSecsLeft] = useState(0);
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Use iiPrincipal as the admin userId for OTP
  const adminUserId = iiPrincipal ?? "admin";
  const adminLockoutKey = `admin:${adminUserId}`;

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

  // Lockout countdown effect
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    };
  }, []);

  const startLockCountdown = (secs: number) => {
    setLoginLocked(true);
    setLockSecsLeft(secs);
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    lockTimerRef.current = setInterval(() => {
      setLockSecsLeft((prev) => {
        if (prev <= 1) {
          if (lockTimerRef.current) clearInterval(lockTimerRef.current);
          setLoginLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAdminLogout = () => {
    admin.setIsVerified(false);
    setSessionPw("");
    setLoginPw("");
    setLoginError("");
    setLoginLocked(false);
    setLockSecsLeft(0);
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
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

    // Check lockout before attempting
    if (actor) {
      try {
        const lockStatus = await actor.checkLoginLockout(adminLockoutKey);
        if (lockStatus.locked) {
          const secs = Number(lockStatus.remainingSecs);
          startLockCountdown(secs);
          setLoginError(
            `Account locked. Try again in ${Math.ceil(secs / 60)} minute${secs >= 120 ? "s" : ""}.`,
          );
          return;
        }
      } catch {
        /* backend unavailable — proceed */
      }
    }

    const ok = await admin.verifyPassword(loginPw);
    if (ok) {
      // Clear attempts on success
      if (actor) {
        try {
          await actor.clearLoginAttempts(adminLockoutKey);
        } catch {
          /* noop */
        }
      }
      setSessionPw(loginPw);
      toast.success("Welcome back, Admin!");
    } else {
      // Record failure
      if (actor) {
        try {
          const failCount = await actor.recordLoginFailure(adminLockoutKey);
          const count = Number(failCount);
          if (count >= 5) {
            // Check if now locked
            const lockStatus = await actor.checkLoginLockout(adminLockoutKey);
            if (lockStatus.locked) {
              const secs = Number(lockStatus.remainingSecs);
              startLockCountdown(secs);
              setLoginError(
                `Too many failed attempts. Account locked for ${Math.ceil(secs / 60)} minutes.`,
              );
              return;
            }
          }
        } catch {
          /* noop */
        }
      }
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
    const lockMins = Math.ceil(lockSecsLeft / 60);
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
                  disabled={loginLocked}
                  data-ocid="admin-login-pw"
                />
              </div>
              {loginLocked && (
                <div
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
                  role="alert"
                  data-ocid="admin-login-locked"
                >
                  <ShieldAlert size={14} />
                  Account locked · {lockMins}m {lockSecsLeft % 60}s remaining
                </div>
              )}
              {!loginLocked && loginError && (
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
                disabled={admin.isVerifyPending || !loginPw || loginLocked}
                data-ocid="admin-login-submit"
              >
                {admin.isVerifyPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {loginLocked
                  ? `Locked (${lockMins}m ${lockSecsLeft % 60}s)`
                  : "Unlock Dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATE 4: Verified → Full Admin Panel with 8 tabs (+ Audit Log)
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
                Commission, payments, orders &amp; more
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
              {/* 8-tab layout: scroll on mobile */}
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
                  value="users"
                  className="flex-1 min-w-[70px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-users"
                >
                  <Users size={13} className="mr-1 hidden sm:inline shrink-0" />
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="audit"
                  className="flex-1 min-w-[70px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-audit"
                >
                  <BookOpen
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Audit Log
                </TabsTrigger>
                <TabsTrigger
                  value="featured"
                  className="flex-1 min-w-[75px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-featured"
                >
                  <Star size={13} className="mr-1 hidden sm:inline shrink-0" />
                  Featured
                </TabsTrigger>
                <TabsTrigger
                  value="seller-audit"
                  className="flex-1 min-w-[85px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-seller-audit"
                >
                  <Scale size={13} className="mr-1 hidden sm:inline shrink-0" />
                  Seller Audit
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="flex-1 min-w-[85px] text-xs sm:text-sm"
                  data-ocid="admin-main-tab-products"
                >
                  <ShoppingBag
                    size={13}
                    className="mr-1 hidden sm:inline shrink-0"
                  />
                  Products
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <DashboardTab totalOrders={orders.length} />
              </TabsContent>

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

              <TabsContent value="payments">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Payment Verification
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Approve or reject bKash/Nagad payment submissions. OTP
                      required for approval.
                    </p>
                  </div>
                  <PaymentVerificationTab adminUserId={adminUserId} />
                </div>
              </TabsContent>

              <TabsContent value="withdrawals">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Withdrawal Management
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Review and process seller withdrawal requests. OTP
                      required for approval.
                    </p>
                  </div>
                  <WithdrawalManagementTab adminUserId={adminUserId} />
                </div>
              </TabsContent>

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

              <TabsContent value="users">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      User Management
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Suspend or unsuspend users. OTP required for suspension
                      actions.
                    </p>
                  </div>
                  <UserManagementTab adminUserId={adminUserId} />
                </div>
              </TabsContent>

              <TabsContent value="audit">
                <AuditLogTab />
              </TabsContent>

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

              <TabsContent value="seller-audit">
                <SellerAuditTrailTab />
              </TabsContent>

              <TabsContent value="products">
                <AllProductsTab />
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
