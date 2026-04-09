import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";

export type WithdrawalStatus = "Pending" | "Approved" | "Rejected";
export type WithdrawalMethod = "bkash" | "nagad";

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  method: WithdrawalMethod;
  accountNumber: string;
  status: WithdrawalStatus;
  requestedAt: number;
}

export interface SellerLimit {
  sellerId: string;
  limit: number;
}

type ExtendedActor = {
  listPendingWithdrawals(): Promise<WithdrawalRequest[]>;
  listAllWithdrawals(): Promise<WithdrawalRequest[]>;
  approveWithdrawal(id: string): Promise<{ ok: null } | { err: string }>;
  rejectWithdrawal(id: string): Promise<{ ok: null } | { err: string }>;
  getAllSellerLimits(): Promise<Array<[string, number]>>;
  setSellerWithdrawalLimit(
    sellerId: string,
    limit: number,
  ): Promise<{ ok: null } | { err: string }>;
  getSellerWithdrawalLimit(sellerId: string): Promise<[] | [number]>;
};

const WITHDRAWALS_KEY = "superapp_withdrawals";
const SELLER_LIMITS_KEY = "superapp_seller_limits";

function loadWithdrawals(): WithdrawalRequest[] {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    return raw ? (JSON.parse(raw) as WithdrawalRequest[]) : SAMPLE_WITHDRAWALS;
  } catch {
    return SAMPLE_WITHDRAWALS;
  }
}

function saveWithdrawals(data: WithdrawalRequest[]): void {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(data));
}

function loadLimits(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SELLER_LIMITS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveLimits(limits: Record<string, number>): void {
  localStorage.setItem(SELLER_LIMITS_KEY, JSON.stringify(limits));
}

export function useAdminPendingWithdrawals() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<WithdrawalRequest[]>({
    queryKey: ["adminPendingWithdrawals"],
    queryFn: async () => {
      if (ext && !isFetching) {
        try {
          return await ext.listPendingWithdrawals();
        } catch {
          // method not yet deployed
        }
      }
      return loadWithdrawals().filter((w) => w.status === "Pending");
    },
    enabled: !!ext && !isFetching,
    staleTime: 15_000,
  });
}

export function useAdminAllWithdrawals() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<WithdrawalRequest[]>({
    queryKey: ["adminAllWithdrawals"],
    queryFn: async () => {
      if (ext && !isFetching) {
        try {
          return await ext.listAllWithdrawals();
        } catch {
          // fall through
        }
      }
      return loadWithdrawals();
    },
    enabled: !!ext && !isFetching,
    staleTime: 15_000,
  });
}

export function useAdminWithdrawalAction() {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useMutation<void, Error, { id: string; action: "approve" | "reject" }>(
    {
      mutationFn: async ({ id, action }) => {
        if (ext) {
          try {
            const result =
              action === "approve"
                ? await ext.approveWithdrawal(id)
                : await ext.rejectWithdrawal(id);
            if ("err" in result) throw new Error(result.err);
            return;
          } catch (e) {
            if (e instanceof Error && e.message !== "Method not found") throw e;
          }
        }
        const status: WithdrawalStatus =
          action === "approve" ? "Approved" : "Rejected";
        const all = loadWithdrawals();
        saveWithdrawals(all.map((w) => (w.id === id ? { ...w, status } : w)));
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ["adminPendingWithdrawals"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["adminAllWithdrawals"],
        });
      },
    },
  );
}

// ─── Per-seller withdrawal limits ─────────────────────────────────────────────

export function useAllSellerLimits() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<SellerLimit[]>({
    queryKey: ["allSellerLimits"],
    queryFn: async () => {
      if (ext && !isFetching) {
        try {
          const pairs = await ext.getAllSellerLimits();
          return pairs.map(([sellerId, limit]) => ({ sellerId, limit }));
        } catch {
          // fall through to localStorage
        }
      }
      const limits = loadLimits();
      return Object.entries(limits).map(([sellerId, limit]) => ({
        sellerId,
        limit,
      }));
    },
    enabled: !!ext && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetSellerWithdrawalLimit(sellerId: string) {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<number | null>({
    queryKey: ["sellerLimit", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;
      if (ext && !isFetching) {
        try {
          const result = await ext.getSellerWithdrawalLimit(sellerId);
          // Motoko ?Float returns [] or [value]
          return result.length > 0 ? (result[0] ?? null) : null;
        } catch {
          // fall through
        }
      }
      const limits = loadLimits();
      return limits[sellerId] ?? null;
    },
    enabled: !!sellerId && !!ext && !isFetching,
    staleTime: 30_000,
  });
}

export function useSetSellerWithdrawalLimit() {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useMutation<void, Error, { sellerId: string; limit: number | null }>({
    mutationFn: async ({ sellerId, limit }) => {
      const effectiveLimit = limit ?? 0;
      if (ext) {
        try {
          const result = await ext.setSellerWithdrawalLimit(
            sellerId,
            effectiveLimit,
          );
          if ("err" in result) throw new Error(result.err);
          return;
        } catch (e) {
          if (e instanceof Error && e.message !== "Method not found") throw e;
        }
      }
      // localStorage fallback
      const limits = loadLimits();
      if (effectiveLimit <= 0) {
        delete limits[sellerId];
      } else {
        limits[sellerId] = effectiveLimit;
      }
      saveLimits(limits);
    },
    onSuccess: (_data, { sellerId }) => {
      void queryClient.invalidateQueries({ queryKey: ["allSellerLimits"] });
      void queryClient.invalidateQueries({
        queryKey: ["sellerLimit", sellerId],
      });
      void queryClient.invalidateQueries({ queryKey: ["myWithdrawalLimit"] });
    },
  });
}

// --- Sample withdrawal data shown before backend is deployed ---
const SAMPLE_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: "wr_001",
    sellerId: "s1",
    sellerName: "Rahman Store",
    amount: 4200,
    method: "bkash",
    accountNumber: "01712345678",
    status: "Pending",
    requestedAt: Date.now() - 3600_000,
  },
  {
    id: "wr_002",
    sellerId: "s2",
    sellerName: "Dhaka Mart",
    amount: 3100,
    method: "nagad",
    accountNumber: "01898765432",
    status: "Pending",
    requestedAt: Date.now() - 7200_000,
  },
  {
    id: "wr_003",
    sellerId: "s3",
    sellerName: "BD Electronics",
    amount: 2750,
    method: "bkash",
    accountNumber: "01556789012",
    status: "Approved",
    requestedAt: Date.now() - 86400_000,
  },
];
