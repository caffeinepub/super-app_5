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

type ExtendedActor = {
  listPendingWithdrawals(): Promise<WithdrawalRequest[]>;
  listAllWithdrawals(): Promise<WithdrawalRequest[]>;
  approveWithdrawal(id: string): Promise<{ ok: null } | { err: string }>;
  rejectWithdrawal(id: string): Promise<{ ok: null } | { err: string }>;
};

const WITHDRAWALS_KEY = "superapp_withdrawals";

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
