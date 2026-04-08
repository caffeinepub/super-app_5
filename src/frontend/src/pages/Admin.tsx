import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
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
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OrderStatus } from "../backend.d";
import { type AdminCategory, useAdmin } from "../hooks/useAdmin";
import { useAdminApprovals } from "../hooks/useAdminApprovals";
import { useAdminOrders } from "../hooks/useAdminOrders";
import { useAuth } from "../hooks/useAuth";

// --- Password strength helper ---
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
interface ResetPasswordPanelProps {
  resetPassword: (
    oldPw: string,
    newPw: string,
  ) => Promise<{ ok: true } | { err: string }>;
  isResetPending: boolean;
}

function ResetPasswordPanel({
  resetPassword,
  isResetPending,
}: ResetPasswordPanelProps) {
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

// --- Dashboard tab ---
function DashboardTab({ totalOrders }: { totalOrders: number }) {
  const stats = [
    {
      label: "Total Orders",
      value: totalOrders,
      icon: <Package size={20} className="text-primary" />,
      bg: "bg-primary/10",
    },
    {
      label: "Commission Earned",
      value: "—",
      icon: <Star size={20} className="text-secondary" />,
      bg: "bg-secondary/10",
    },
    {
      label: "Registered Users",
      value: "—",
      icon: <Users size={20} className="text-accent" />,
      bg: "bg-accent/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}
                >
                  {s.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold font-display text-foreground">
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Welcome to the Admin Dashboard. Use the tabs above to manage orders,
        approve admin role requests, and control featured items.
      </p>
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
                {/* Left info */}
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
                      ₱{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* Status changer */}
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

// --- Main Admin page ---
export function AdminPage() {
  const {
    iiIsAuthenticated: isAuthenticated,
    iiLogin: login,
    iiIsInitializing: isInitializing,
  } = useAuth();
  const admin = useAdmin();
  const { orders } = useAdminOrders();

  // Setup form state
  const [setupPw, setSetupPw] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupError, setSetupError] = useState("");

  // Login form state
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");

  // Session password for re-auth on mutations
  const [sessionPw, setSessionPw] = useState("");

  // Featured IDs local state per category
  const [featuredIds, setFeaturedIds] = useState<
    Record<AdminCategory, string[]>
  >({
    shop: [],
    delivery: [],
    service: [],
  });

  const setupStrength = getPasswordStrength(setupPw);
  const { isVerified: adminIsVerified, getFeaturedByCategory } = admin;

  // Load featured IDs once verified
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

  // STATE 1: Internet Identity not logged in
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

  // STATE 2: Authenticated + not verified + not set up → Create Admin Password
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

  // STATE 3: Authenticated + not verified + already set up → Admin Login
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

  // STATE 4: Verified → Full Admin Panel
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 pb-20 sm:pb-8">
        {/* Panel header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage orders, approvals, and featured content
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
              <TabsList className="w-full mb-6 grid grid-cols-4">
                <TabsTrigger
                  value="dashboard"
                  data-ocid="admin-main-tab-dashboard"
                >
                  <Package size={14} className="mr-1.5 hidden sm:inline" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="orders" data-ocid="admin-main-tab-orders">
                  <ClipboardList
                    size={14}
                    className="mr-1.5 hidden sm:inline"
                  />
                  Orders
                </TabsTrigger>
                <TabsTrigger
                  value="approvals"
                  data-ocid="admin-main-tab-approvals"
                >
                  <UserCheck size={14} className="mr-1.5 hidden sm:inline" />
                  Approvals
                </TabsTrigger>
                <TabsTrigger
                  value="featured"
                  data-ocid="admin-main-tab-featured"
                >
                  <Star size={14} className="mr-1.5 hidden sm:inline" />
                  Featured
                </TabsTrigger>
              </TabsList>

              {/* Dashboard */}
              <TabsContent value="dashboard">
                <DashboardTab totalOrders={orders.length} />
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
                      sections. Changes take effect immediately.
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

        {/* Reset password section */}
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

  // Loading / initializing state
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-muted-foreground" />
    </div>
  );
}
