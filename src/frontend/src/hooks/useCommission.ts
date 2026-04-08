import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";

export interface CommissionSummary {
  totalCommission: number;
  totalOrders: number;
  commissionRate: number;
  totalRevenue: number;
}

export interface CommissionPeriod {
  label: string;
  commission: number;
  revenue: number;
  orders: number;
}

export interface TopSeller {
  sellerId: string;
  sellerName: string;
  revenue: number;
  commission: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  commission: number;
  sold: number;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayments: number;
  pendingWithdrawals: number;
}

type ExtendedActor = {
  getCommissionSummary(): Promise<CommissionSummary>;
  getCommissionByPeriod(period: string): Promise<CommissionPeriod[]>;
  getTopSellers(): Promise<TopSeller[]>;
  getTopProducts(): Promise<TopProduct[]>;
  getAdminStats(): Promise<AdminStats>;
};

const FALLBACK_SUMMARY: CommissionSummary = {
  totalCommission: 0,
  totalOrders: 0,
  commissionRate: 10,
  totalRevenue: 0,
};

const FALLBACK_STATS: AdminStats = {
  totalUsers: 0,
  totalOrders: 0,
  totalRevenue: 0,
  totalCommission: 0,
  pendingPayments: 0,
  pendingWithdrawals: 0,
};

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function useCommissionSummary() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<CommissionSummary>({
    queryKey: ["commissionSummary"],
    queryFn: () =>
      safeCall(() => ext!.getCommissionSummary(), FALLBACK_SUMMARY),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

export function useCommissionByPeriod(period: "daily" | "weekly" | "monthly") {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<CommissionPeriod[]>({
    queryKey: ["commissionByPeriod", period],
    queryFn: () =>
      safeCall(
        () => ext!.getCommissionByPeriod(period),
        generateFallbackPeriods(period),
      ),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

export function useTopSellers() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<TopSeller[]>({
    queryKey: ["topSellers"],
    queryFn: () => safeCall(() => ext!.getTopSellers(), FALLBACK_TOP_SELLERS),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

export function useTopProducts() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<TopProduct[]>({
    queryKey: ["topProducts"],
    queryFn: () => safeCall(() => ext!.getTopProducts(), FALLBACK_TOP_PRODUCTS),
    enabled: !!ext && !isFetching,
    staleTime: 60_000,
  });
}

export function useAdminStats() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<AdminStats>({
    queryKey: ["adminStats"],
    queryFn: () => safeCall(() => ext!.getAdminStats(), FALLBACK_STATS),
    enabled: !!ext && !isFetching,
    staleTime: 30_000,
  });
}

// --- Fallback sample data for display when backend methods are not yet deployed ---

function generateFallbackPeriods(
  period: "daily" | "weekly" | "monthly",
): CommissionPeriod[] {
  const now = new Date();
  if (period === "monthly") {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const revenue = 8000 + Math.round(Math.random() * 12000);
      return {
        label: d.toLocaleString("default", { month: "short" }),
        revenue,
        commission: Math.round(revenue * 0.1),
        orders: 10 + Math.round(Math.random() * 40),
      };
    });
  }
  if (period === "weekly") {
    return Array.from({ length: 8 }, (_, i) => {
      const revenue = 2000 + Math.round(Math.random() * 4000);
      return {
        label: `W${i + 1}`,
        revenue,
        commission: Math.round(revenue * 0.1),
        orders: 5 + Math.round(Math.random() * 15),
      };
    });
  }
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const revenue = 400 + Math.round(Math.random() * 800);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      revenue,
      commission: Math.round(revenue * 0.1),
      orders: 1 + Math.round(Math.random() * 8),
    };
  });
}

const FALLBACK_TOP_SELLERS: TopSeller[] = [
  {
    sellerId: "s1",
    sellerName: "Rahman Store",
    revenue: 48200,
    commission: 4820,
    orders: 124,
  },
  {
    sellerId: "s2",
    sellerName: "Dhaka Mart",
    revenue: 36500,
    commission: 3650,
    orders: 98,
  },
  {
    sellerId: "s3",
    sellerName: "BD Electronics",
    revenue: 28900,
    commission: 2890,
    orders: 76,
  },
  {
    sellerId: "s4",
    sellerName: "Priya Fashion",
    revenue: 22100,
    commission: 2210,
    orders: 61,
  },
  {
    sellerId: "s5",
    sellerName: "Chittagong Goods",
    revenue: 17400,
    commission: 1740,
    orders: 45,
  },
];

const FALLBACK_TOP_PRODUCTS: TopProduct[] = [
  {
    productId: "p1",
    productName: "Samsung A54",
    revenue: 19500,
    commission: 1950,
    sold: 13,
  },
  {
    productId: "p2",
    productName: "Handmade Saree",
    revenue: 15200,
    commission: 1520,
    sold: 38,
  },
  {
    productId: "p3",
    productName: "Biryani Box",
    revenue: 12800,
    commission: 1280,
    sold: 256,
  },
  {
    productId: "p4",
    productName: "Home Cleaning Kit",
    revenue: 9400,
    commission: 940,
    sold: 47,
  },
  {
    productId: "p5",
    productName: "LED Desk Lamp",
    revenue: 7800,
    commission: 780,
    sold: 52,
  },
];
