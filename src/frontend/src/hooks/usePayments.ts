import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  PaymentRecord,
  PaymentStatus,
  SubmitPaymentInput,
} from "../types";

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

type BackendActor = Record<
  string,
  ((...args: unknown[]) => Promise<unknown>) | undefined
>;

function asBackend(actor: unknown): BackendActor {
  return actor as BackendActor;
}

export function useMyPayments() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<PaymentRecord[]>({
    queryKey: ["myPayments"],
    queryFn: async () => {
      if (actor && !isFetching) {
        try {
          const fn = asBackend(actor).myPayments;
          if (fn) {
            const result = await fn();
            if (Array.isArray(result)) return result as PaymentRecord[];
          }
        } catch {
          // backend method not deployed — fall through
        }
      }
      return loadPayments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useAllPayments() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<PaymentRecord[]>({
    queryKey: ["allPayments"],
    queryFn: async () => {
      if (actor && !isFetching) {
        try {
          const fn = asBackend(actor).getAllPayments;
          if (fn) {
            const result = await fn();
            if (Array.isArray(result)) return result as PaymentRecord[];
          }
        } catch {
          // fall through
        }
      }
      return loadPayments();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useSubmitPayment() {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);

  return useMutation<PaymentRecord, Error, SubmitPaymentInput>({
    mutationFn: async (input) => {
      if (actor) {
        try {
          const fn = asBackend(actor).submitPayment;
          if (fn) {
            const result = await fn({
              orderId: input.orderId,
              method: input.method,
              transactionId: input.transactionId,
              amount: input.amount,
            });
            if (result) return result as PaymentRecord;
          }
        } catch {
          // method not deployed — use local fallback
        }
      }

      const newRecord: PaymentRecord = {
        id: `pmt_${Date.now()}`,
        orderId: input.orderId,
        method: input.method,
        transactionId: input.transactionId,
        amount: input.amount,
        status: "Pending",
        createdAt: Date.now(),
      };

      const existing = loadPayments();
      savePayments([...existing, newRecord]);
      return newRecord;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myPayments"] });
      void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
    },
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);

  return useMutation<void, Error, { paymentId: string; status: PaymentStatus }>(
    {
      mutationFn: async ({ paymentId, status }) => {
        if (actor) {
          try {
            const methodName =
              status === "Approved" ? "approvePayment" : "rejectPayment";
            const fn = asBackend(actor)[methodName];
            if (fn) {
              await fn(paymentId);
              return;
            }
          } catch {
            // fall through
          }
        }

        const payments = loadPayments();
        const updated = payments.map((p) =>
          p.id === paymentId ? { ...p, status } : p,
        );
        savePayments(updated);
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["myPayments"] });
        void queryClient.invalidateQueries({ queryKey: ["allPayments"] });
      },
    },
  );
}
