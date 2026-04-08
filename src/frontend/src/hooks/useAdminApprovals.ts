import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import { UserRole } from "../backend.d";
import type { UserId } from "../backend.d";

export interface PendingApproval {
  userId: UserId;
  principalText: string;
  requestedAt: number;
}

/** Extended actor interface for user-approval extension methods */
interface ApprovalActor {
  getPendingRoleRequests(): Promise<
    Array<{ userId: UserId; requestedAt: bigint }>
  >;
  assignRole(
    userId: UserId,
    role: UserRole,
  ): Promise<{ __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }>;
}

const DISMISSED_KEY = "dismissedApprovals";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function addDismissed(principalText: string): void {
  const current = getDismissed();
  if (!current.includes(principalText)) {
    localStorage.setItem(
      DISMISSED_KEY,
      JSON.stringify([...current, principalText]),
    );
  }
}

export function useAdminApprovals() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();

  // Cast actor to extended interface that includes approval extension methods
  const approvalActor = actor as unknown as ApprovalActor | null;

  const query = useQuery<PendingApproval[]>({
    queryKey: ["adminApprovals"],
    queryFn: async () => {
      if (!approvalActor) return [];
      try {
        const raw = await approvalActor.getPendingRoleRequests();
        const dismissed = getDismissed();
        return raw
          .map((r) => ({
            userId: r.userId,
            principalText: r.userId.toText(),
            requestedAt: Number(r.requestedAt) / 1_000_000, // nanoseconds → ms
          }))
          .filter((r) => !dismissed.includes(r.principalText));
      } catch {
        // user-approval extension may not expose this; return empty gracefully
        return [];
      }
    },
    enabled: !!approvalActor && !isFetching,
    staleTime: 15_000,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: UserId;
      role: UserRole;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.assignRole(userId, role);
      if ("err" in result) throw new Error(result.err);
      return { ok: true as const };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminApprovals"] });
    },
  });

  const approve = async (
    userId: UserId,
  ): Promise<{ ok: true } | { err: string }> => {
    try {
      return await assignRoleMutation.mutateAsync({
        userId,
        role: UserRole.Admin,
      });
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Unknown error" };
    }
  };

  const reject = (userId: UserId) => {
    const principalText = userId.toText();
    // Persist dismissal to localStorage so it survives page refresh
    addDismissed(principalText);
    // Also update the React Query cache immediately for instant UI feedback
    queryClient.setQueryData<PendingApproval[]>(
      ["adminApprovals"],
      (prev) => prev?.filter((r) => r.principalText !== principalText) ?? [],
    );
  };

  return {
    approvals: query.data ?? [],
    isLoading: query.isLoading,
    approve,
    reject,
    isActionPending: assignRoleMutation.isPending,
  };
}
