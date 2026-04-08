import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { Order, OrderStatus } from "../backend.d";

export type { Order, OrderStatus };

export function useAdminOrders() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  const query = useQuery<Order[]>({
    queryKey: ["adminOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: bigint;
      status: OrderStatus;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.updateOrderStatus(orderId, status);
      if ("err" in result) throw new Error(result.err);
      return { ok: true as const };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
    },
  });

  const updateStatus = async (
    orderId: bigint,
    status: OrderStatus,
  ): Promise<{ ok: true } | { err: string }> => {
    try {
      return await updateStatusMutation.mutateAsync({ orderId, status });
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Unknown error" };
    }
  };

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    updateStatus,
    isUpdatePending: updateStatusMutation.isPending,
    refetch: query.refetch,
  };
}
