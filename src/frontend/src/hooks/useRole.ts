import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { UserRole } from "../backend.d";
import { useAuth } from "./useAuth";

/**
 * Fetches the current user's role from the backend (Internet Identity flow).
 * For email/password users, role is derived from session (see useAuth).
 */
export function useRole() {
  const { actor, isFetching } = useActor(createActor);
  const { iiIsAuthenticated } = useAuth();

  const query = useQuery<UserRole | null>({
    queryKey: ["myRole"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getMyRole();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && iiIsAuthenticated,
    staleTime: 60_000,
  });

  return {
    role: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
