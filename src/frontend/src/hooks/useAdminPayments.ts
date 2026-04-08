import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { PaymentRecord, PaymentStatus } from "../types";

type ExtendedActor = {
  listPendingPayments(): Promise<PaymentRecord[]>;
  listAllPayments(): Promise<PaymentRecord[]>;
  approvePayment(id: string): Promise<{ ok: null } | { err: string }>;
  rejectPayment(id: string): Promise<{ ok: null } | { err: string }>;
};

// Local storage fallback helpers (mirrors usePayments.ts)
const PAYMENTS_KEY = "superapp_payments";

function loadPayments(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    return raw ? (JSON.parse(raw) as PaymentRecord[]) : [];
  } catch {
    return [];
  }
}

function savePayments(payments: PaymentRecord[]): void {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function useAdminPendingPayments() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<PaymentRecord[]>({
    queryKey: ["adminPendingPayments"],
    queryFn: async () => {
      if (ext && !isFetching) {
        try {
          return await ext.listPendingPayments();
        } catch {
          // backend method not deployed yet
        }
      }
      return loadPayments().filter((p) => p.status === "Pending");
    },
    enabled: !!ext && !isFetching,
    staleTime: 15_000,
  });
}

export function useAdminAllPayments() {
  const { actor, isFetching } = useActor(createActor);
  const ext = actor as unknown as ExtendedActor | null;

  return useQuery<PaymentRecord[]>({
    queryKey: ["adminAllPayments"],
    queryFn: async () => {
      if (ext && !isFetching) {
        try {
          return await ext.listAllPayments();
        } catch {
          // fall through
        }
      }
      return loadPayments();
    },
    enabled: !!ext && !isFetching,
    staleTime: 15_000,
  });
}

export function useApproveAdminPayment() {
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
                ? await ext.approvePayment(id)
                : await ext.rejectPayment(id);
            if ("err" in result) throw new Error(result.err);
            return;
          } catch (e) {
            if (e instanceof Error && e.message !== "Method not found") throw e;
          }
        }
        // Local fallback
        const status: PaymentStatus =
          action === "approve" ? "Approved" : "Rejected";
        const payments = loadPayments();
        savePayments(payments.map((p) => (p.id === id ? { ...p, status } : p)));
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ["adminPendingPayments"],
        });
        void queryClient.invalidateQueries({ queryKey: ["adminAllPayments"] });
        void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
        void queryClient.invalidateQueries({ queryKey: ["myPayments"] });
      },
    },
  );
}
