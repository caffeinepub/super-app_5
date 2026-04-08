import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { Order } from "../types";

/**
 * Fetches the authenticated caller's own orders from the backend.
 * Returns an empty array when the user is not authenticated.
 */
export function useOrders(enabled: boolean) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: async () => {
      if (!actor) return [];
      const orders = await actor.getMyOrders();
      return orders.map((o) => ({
        id: o.id,
        userId: o.userId.toText(),
        items: o.items.map((i) => ({
          name: i.name,
          qty: Number(i.qty),
          price: i.price,
        })),
        status: o.status as Order["status"],
        date: Number(o.date),
        total: o.total,
      }));
    },
    enabled: enabled && !!actor && !isFetching,
    staleTime: 60 * 1000, // 1 minute
  });
}
