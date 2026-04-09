import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Gift,
  Link2,
  Share2,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { SiWhatsapp } from "react-icons/si";
import type { ReferralRecord } from "../backend";
import { ReferralStatus } from "../backend";
import { useAuth } from "../hooks/useAuth";
import { useReferral, useReferralLeaderboard } from "../hooks/useReferral";
import type { LeaderboardEntry } from "../hooks/useReferral";

const PAGE_SIZE = 10;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***.***";
  const masked =
    local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : "***";
  return `${masked}@${domain}`;
}

function maskUserId(id: string): string {
  if (id.length <= 12) return `${id.slice(0, 4)}****`;
  return `${id.slice(0, 6)}****${id.slice(-4)}`;
}

function StatusBadge({ status }: { status: ReferralRecord["status"] }) {
  if (status === ReferralStatus.Completed)
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-300 gap-1">
        <CheckCircle2 size={11} />
        Completed
      </Badge>
    );
  if (status === ReferralStatus.Pending)
    return (
      <Badge className="bg-amber-500/15 text-amber-600 border-amber-300 gap-1">
        <Clock size={11} />
        Pending
      </Badge>
    );
  return (
    <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
      <XCircle size={11} />
      Invalid
    </Badge>
  );
}

function HowItWorksStep({
  step,
  icon,
  title,
  desc,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 p-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow">
          {step}
        </span>
      </div>
      <div>
        <p className="font-display font-semibold text-foreground text-sm">
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white font-bold text-sm shadow-md shadow-yellow-400/30">
        #1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-white font-bold text-sm shadow-md shadow-gray-300/30">
        #2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-400/30">
        #3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold text-sm">
      #{rank}
    </span>
  );
}

function LeaderboardRowBg({ rank }: { rank: number }) {
  if (rank === 1)
    return "bg-gradient-to-r from-yellow-400/8 via-amber-500/5 to-transparent hover:from-yellow-400/15";
  if (rank === 2)
    return "bg-gradient-to-r from-gray-300/10 via-gray-400/5 to-transparent hover:from-gray-300/20";
  if (rank === 3)
    return "bg-gradient-to-r from-orange-400/8 via-amber-500/5 to-transparent hover:from-orange-400/15";
  return "hover:bg-muted/30";
}

function LeaderboardTab({
  entries,
  isLoading,
}: { entries: LeaderboardEntry[]; isLoading: boolean }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = entries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Leaderboard hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6 shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400 via-transparent to-transparent" />
        <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full bg-purple-400/10" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-amber-500/20 border border-yellow-400/30 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
            🏆
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white leading-tight">
              Top Referrers
            </h2>
            <p className="text-purple-200 text-sm mt-0.5">
              Champions who bring the most friends to SuperApp
            </p>
          </div>
        </div>
        {/* Top 3 podium mini-badges */}
        <div className="flex gap-3 mt-5">
          {[
            {
              icon: "🥇",
              label: "Gold",
              color: "from-yellow-400/30 to-amber-500/20 border-yellow-400/40",
            },
            {
              icon: "🥈",
              label: "Silver",
              color: "from-gray-300/25 to-gray-400/15 border-gray-300/40",
            },
            {
              icon: "🥉",
              label: "Bronze",
              color: "from-orange-400/25 to-amber-500/15 border-orange-400/40",
            },
          ].map((p) => (
            <span
              key={p.label}
              className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${p.color} border text-white text-xs font-semibold backdrop-blur-sm`}
            >
              {p.icon} {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Leaderboard table */}
      <Card
        className="border-border shadow-sm overflow-hidden"
        data-ocid="leaderboard-table"
      >
        <div className="h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />
        <CardContent className="px-0 pb-0">
          {isLoading ? (
            <div className="space-y-3 px-6 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 px-4 text-center"
              data-ocid="leaderboard-empty"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex items-center justify-center mb-3 text-3xl">
                🏆
              </div>
              <p className="font-display font-semibold text-foreground">
                No referrers yet
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Be the first to refer friends and claim the top spot!
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-y border-border">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">
                        Rank
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Referrer
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Referrals
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Rewards Earned
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Last Invite
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageEntries.map((entry) => {
                      const rank = Number(entry.rank);
                      return (
                        <tr
                          key={entry.referrerId}
                          className={`transition-colors ${LeaderboardRowBg({ rank })}`}
                          data-ocid="leaderboard-row"
                        >
                          <td className="px-6 py-3.5">
                            <RankBadge rank={rank} />
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-foreground">
                            {maskUserId(entry.referrerId)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-indigo-600">
                              <Users size={13} />
                              {Number(entry.totalReferrals)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">
                            +{entry.totalRewardEarned.toLocaleString()} units
                          </td>
                          <td className="px-6 py-3.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                            {Number(entry.lastReferralDate) > 0
                              ? new Date(
                                  Number(entry.lastReferralDate),
                                ).toLocaleDateString("en-BD")
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="sm:hidden divide-y divide-border">
                {pageEntries.map((entry) => {
                  const rank = Number(entry.rank);
                  return (
                    <div
                      key={entry.referrerId}
                      className={`flex items-center gap-4 px-4 py-3.5 transition-colors ${LeaderboardRowBg({ rank })}`}
                      data-ocid="leaderboard-row"
                    >
                      <RankBadge rank={rank} />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-foreground truncate">
                          {maskUserId(entry.referrerId)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Number(entry.totalReferrals)} referrals ·{" "}
                          {Number(entry.lastReferralDate) > 0
                            ? new Date(
                                Number(entry.lastReferralDate),
                              ).toLocaleDateString("en-BD")
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-emerald-600 text-sm">
                          +{entry.totalRewardEarned.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">units</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20"
                  data-ocid="leaderboard-pagination"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="gap-1"
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={page >= totalPages - 1}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MyReferralsTab({
  referralLink,
  referrals,
  totalEarnings,
  loading,
  copied,
  isAuthenticated,
  handleCopy,
  handleCreateCode,
  whatsappText,
  completedReferrals,
}: {
  referralLink: string | null;
  referrals: ReferralRecord[];
  totalEarnings: bigint;
  loading: boolean;
  copied: boolean;
  isAuthenticated: boolean;
  handleCopy: () => void;
  handleCreateCode: () => void;
  whatsappText: string;
  completedReferrals: number;
}) {
  return (
    <div className="space-y-6">
      {/* Referral link card */}
      <Card
        className="border-border shadow-md overflow-hidden"
        data-ocid="referral-link-card"
      >
        <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Link2 size={17} className="text-teal-600" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : referralLink ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <span className="text-sm text-muted-foreground truncate flex-1 font-mono min-w-0">
                  {referralLink}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1 gap-2 border-teal-300 text-teal-700 hover:bg-teal-50 hover:border-teal-400"
                  data-ocid="referral-copy-btn"
                >
                  <Copy size={15} />
                  {copied ? "Copied!" : "Copy link"}
                </Button>
                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors shrink-0"
                  data-ocid="referral-whatsapp-btn"
                >
                  <SiWhatsapp size={16} />
                  <span className="hidden sm:inline">Share on WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                {isAuthenticated
                  ? "You don't have a referral code yet."
                  : "Log in to get your referral link."}
              </p>
              {isAuthenticated && (
                <Button
                  onClick={handleCreateCode}
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white gap-2"
                  data-ocid="referral-create-btn"
                >
                  <Gift size={15} />
                  Generate My Referral Code
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4" data-ocid="referral-stats">
        <Card className="border-border shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Users size={20} className="text-teal-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-12 mb-1" />
                ) : (
                  <p className="font-display text-2xl font-bold text-foreground">
                    {completedReferrals}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <p className="font-display text-2xl font-bold text-foreground">
                    {Number(totalEarnings)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Units Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500" />
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Share2 size={17} className="text-teal-600" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <HowItWorksStep
              step={1}
              icon={<Link2 size={22} className="text-white" />}
              title="Share your link"
              desc="Copy and share your unique referral link with friends and family."
            />
            <HowItWorksStep
              step={2}
              icon={<Users size={22} className="text-white" />}
              title="Friend signs up"
              desc="Your friend creates a SuperApp account using your referral link."
            />
            <HowItWorksStep
              step={3}
              icon={<Gift size={22} className="text-white" />}
              title="Both earn rewards"
              desc="You get 50 units added to your wallet. They get a 100 unit signup bonus."
            />
          </div>
        </CardContent>
      </Card>

      {/* Referral history */}
      <Card
        className="border-border shadow-sm overflow-hidden"
        data-ocid="referral-history"
      >
        <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Clock size={17} className="text-teal-600" />
            Referral History
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-3 px-6 pb-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 px-4 text-center"
              data-ocid="referral-empty"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Users size={24} className="text-muted-foreground" />
              </div>
              <p className="font-display font-semibold text-foreground">
                No referrals yet
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Share your link above to invite friends. Your referral history
                will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-y border-border">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Referred User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Reward
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-muted/30 transition-colors"
                      data-ocid="referral-row"
                    >
                      <td className="px-6 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        {Number(r.completedAt) > 0
                          ? new Date(
                              Number(r.completedAt) / 1_000_000,
                            ).toLocaleDateString("en-BD")
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-foreground">
                        {maskEmail(r.refereeId)}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-emerald-600">
                        {r.status === ReferralStatus.Completed
                          ? `+${Number(r.referrerReward)} units`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type ActiveTab = "my-referrals" | "leaderboard";

export function ReferralPage() {
  const { userId, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("my-referrals");
  const {
    referralLink,
    referrals,
    totalEarnings,
    loading,
    copied,
    createCode,
    copyLink,
  } = useReferral(userId);

  const { data: leaderboard = [], isLoading: leaderboardLoading } =
    useReferralLeaderboard();

  const handleCopy = () => {
    void copyLink();
  };
  const handleCreateCode = () => {
    if (userId) void createCode(userId);
  };

  const whatsappText = referralLink
    ? encodeURIComponent(
        `🎁 Join me on SuperApp! Sign up and get a 100 unit bonus. Use my link: ${referralLink}`,
      )
    : "";

  const completedReferrals = referrals.filter(
    (r) => r.status === ReferralStatus.Completed,
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-20 sm:pb-8">
      {/* Hero gradient header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-500 to-cyan-600 px-4 pt-10 pb-20">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Gift size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                Refer &amp; Earn
              </h1>
              <p className="text-teal-100 text-sm font-body">
                Invite friends, earn rewards together
              </p>
            </div>
          </div>

          {/* Reward info pills */}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold backdrop-blur-sm">
              💰 You earn 50 units per referral
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold backdrop-blur-sm">
              🎁 Friend gets 100 unit signup bonus
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 space-y-6">
        {/* Tab switcher */}
        <div
          className="flex gap-2 bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-blue-900/90 p-1.5 rounded-2xl shadow-xl backdrop-blur-sm border border-white/10"
          data-ocid="referral-tab-switcher"
          role="tablist"
          aria-label="Referral sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "my-referrals"}
            onClick={() => setActiveTab("my-referrals")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "my-referrals"
                ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/30"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            data-ocid="tab-my-referrals"
          >
            <Users size={15} />
            My Referrals
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "leaderboard"}
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === "leaderboard"
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
            data-ocid="tab-leaderboard"
          >
            <Trophy size={15} />
            Leaderboard
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "my-referrals" ? (
          <MyReferralsTab
            referralLink={referralLink}
            referrals={referrals}
            totalEarnings={totalEarnings}
            loading={loading}
            copied={copied}
            isAuthenticated={isAuthenticated}
            handleCopy={handleCopy}
            handleCreateCode={handleCreateCode}
            whatsappText={whatsappText}
            completedReferrals={completedReferrals}
          />
        ) : (
          <LeaderboardTab
            entries={leaderboard}
            isLoading={leaderboardLoading}
          />
        )}
      </div>
    </div>
  );
}
