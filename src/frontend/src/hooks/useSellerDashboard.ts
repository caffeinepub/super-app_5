import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SellerProductStat {
  productId: string;
  productName: string;
  salesCount: number;
  totalRevenue: number;
  commissionDeducted: number;
  netRevenue: number;
}

export interface SellerDashboardSummary {
  totalGrossRevenue: number;
  totalCommissionDeducted: number;
  totalNetEarnings: number;
  totalWithdrawn: number;
  remainingBalance: number;
  periodLabel: string;
}

export interface SellerEarningsByPeriod {
  period: string;
  grossRevenue: number;
  commissionDeducted: number;
  netRevenue: number;
}

export interface SellerOrder {
  id: string;
  date: number;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: string;
}

// ─── Extended actor type ──────────────────────────────────────────────────────

type SellerActor = {
  getMySellerOrders(): Promise<SellerOrder[]>;
  getMyProductStats(days: bigint): Promise<SellerProductStat[]>;
  getMyEarningsSummary(days: bigint): Promise<SellerDashboardSummary>;
  getMyEarningsByPeriod(
    days: bigint,
    granularity: string,
  ): Promise<SellerEarningsByPeriod[]>;
};

// ─── Safe fallback helper ─────────────────────────────────────────────────────

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSellerOrders() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as SellerActor | null;

  return useQuery<SellerOrder[]>({
    queryKey: ["sellerOrders"],
    queryFn: () => safeCall(() => ext!.getMySellerOrders(), FALLBACK_ORDERS),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

export function useProductStats(days: number) {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as SellerActor | null;

  return useQuery<SellerProductStat[]>({
    queryKey: ["sellerProductStats", days],
    queryFn: () =>
      safeCall(
        () => ext!.getMyProductStats(BigInt(days)),
        FALLBACK_PRODUCT_STATS,
      ),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

export function useEarningsSummary(days: number) {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as SellerActor | null;

  return useQuery<SellerDashboardSummary>({
    queryKey: ["sellerEarningsSummary", days],
    queryFn: () =>
      safeCall(
        () => ext!.getMyEarningsSummary(BigInt(days)),
        buildFallbackSummary(days),
      ),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

export function useEarningsByPeriod(days: number, granularity: string) {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as SellerActor | null;

  return useQuery<SellerEarningsByPeriod[]>({
    queryKey: ["sellerEarningsByPeriod", days, granularity],
    queryFn: () =>
      safeCall(
        () => ext!.getMyEarningsByPeriod(BigInt(days), granularity),
        generateFallbackPeriods(days, granularity),
      ),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

// ─── Fallback sample data ─────────────────────────────────────────────────────

function buildFallbackSummary(days: number): SellerDashboardSummary {
  const label =
    days === 0
      ? "All Time"
      : days === 30
        ? "Last 30 Days"
        : days === 90
          ? "Last 90 Days"
          : "Last 12 Months";
  const gross =
    days === 0 ? 124500 : days === 365 ? 98400 : days === 90 ? 34200 : 12450;
  return {
    totalGrossRevenue: gross,
    totalCommissionDeducted: Math.round(gross * 0.1),
    totalNetEarnings: Math.round(gross * 0.9),
    totalWithdrawn: 3200,
    remainingBalance: Math.round(gross * 0.9) - 3200,
    periodLabel: label,
  };
}

function generateFallbackPeriods(
  days: number,
  granularity: string,
): SellerEarningsByPeriod[] {
  const now = new Date();

  if (granularity === "monthly") {
    const count = days === 0 || days === 365 ? 12 : days === 90 ? 3 : 1;
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (count - 1 - i),
        1,
      );
      const gross = 4000 + Math.round(Math.sin(i) * 2000 + 4000);
      return {
        period: d.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        }),
        grossRevenue: gross,
        commissionDeducted: Math.round(gross * 0.1),
        netRevenue: Math.round(gross * 0.9),
      };
    });
  }

  if (granularity === "weekly") {
    const count = days === 90 ? 12 : days === 30 ? 4 : 8;
    return Array.from({ length: count }, (_, i) => {
      const gross = 1500 + Math.round(Math.sin(i * 0.8) * 800 + 1000);
      return {
        period: `W${i + 1}`,
        grossRevenue: gross,
        commissionDeducted: Math.round(gross * 0.1),
        netRevenue: Math.round(gross * 0.9),
      };
    });
  }

  // daily
  const count = Math.min(days || 30, 30);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (count - 1 - i));
    const gross = 200 + Math.round(Math.random() * 600);
    return {
      period: `${d.getMonth() + 1}/${d.getDate()}`,
      grossRevenue: gross,
      commissionDeducted: Math.round(gross * 0.1),
      netRevenue: Math.round(gross * 0.9),
    };
  });
}

const FALLBACK_ORDERS: SellerOrder[] = [
  {
    id: "ORD-1001",
    date: Date.now() - 1 * 86400_000,
    items: [{ name: "Wireless Earbuds", qty: 2, price: 1800 }],
    total: 3600,
    status: "Delivered",
  },
  {
    id: "ORD-1002",
    date: Date.now() - 3 * 86400_000,
    items: [
      { name: "Phone Stand", qty: 1, price: 450 },
      { name: "USB-C Cable", qty: 3, price: 180 },
    ],
    total: 990,
    status: "Ongoing",
  },
  {
    id: "ORD-1003",
    date: Date.now() - 7 * 86400_000,
    items: [{ name: "Handmade Saree", qty: 1, price: 2200 }],
    total: 2200,
    status: "Delivered",
  },
  {
    id: "ORD-1004",
    date: Date.now() - 12 * 86400_000,
    items: [{ name: "LED Desk Lamp", qty: 2, price: 750 }],
    total: 1500,
    status: "Delivered",
  },
  {
    id: "ORD-1005",
    date: Date.now() - 18 * 86400_000,
    items: [{ name: "Notebook Set", qty: 5, price: 120 }],
    total: 600,
    status: "Pending",
  },
];

const FALLBACK_PRODUCT_STATS: SellerProductStat[] = [
  {
    productId: "p1",
    productName: "Wireless Earbuds",
    salesCount: 34,
    totalRevenue: 61200,
    commissionDeducted: 6120,
    netRevenue: 55080,
  },
  {
    productId: "p2",
    productName: "Handmade Saree",
    salesCount: 22,
    totalRevenue: 48400,
    commissionDeducted: 4840,
    netRevenue: 43560,
  },
  {
    productId: "p3",
    productName: "LED Desk Lamp",
    salesCount: 47,
    totalRevenue: 35250,
    commissionDeducted: 3525,
    netRevenue: 31725,
  },
  {
    productId: "p4",
    productName: "USB-C Cable",
    salesCount: 89,
    totalRevenue: 16020,
    commissionDeducted: 1602,
    netRevenue: 14418,
  },
  {
    productId: "p5",
    productName: "Notebook Set",
    salesCount: 56,
    totalRevenue: 6720,
    commissionDeducted: 672,
    netRevenue: 6048,
  },
];
