import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import { deliveryItems } from "../data/deliveryItems";
import { serviceItems } from "../data/serviceItems";
import { shopItems } from "../data/shopItems";
import type { CategoryType } from "../types";

function getLocalFeaturedIds(category: CategoryType): string[] {
  switch (category) {
    case "shop":
      return shopItems.filter((i) => i.isFeatured).map((i) => i.id);
    case "delivery":
      return deliveryItems.filter((i) => i.isFeatured).map((i) => i.id);
    case "service":
      return serviceItems.filter((i) => i.isFeatured).map((i) => i.id);
  }
}

/**
 * Returns the list of featured IDs for the given category.
 * Calls backend getFeaturedIds — falls back to local isFeatured data
 * if the backend is unavailable or returns an empty array.
 */
export function useFeaturedIds(category: CategoryType) {
  const { actor, isFetching } = useActor(createActor);

  const localFallback = getLocalFeaturedIds(category);

  const query = useQuery<string[]>({
    queryKey: ["featuredIds", category],
    queryFn: async () => {
      if (!actor) return localFallback;
      try {
        const ids = await actor.getFeaturedIdsByCategory(category);
        return ids.length > 0 ? ids : localFallback;
      } catch {
        return localFallback;
      }
    },
    enabled: !!actor && !isFetching,
    placeholderData: localFallback,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    featuredIds: query.data ?? localFallback,
    isLoading: query.isLoading,
  };
}
