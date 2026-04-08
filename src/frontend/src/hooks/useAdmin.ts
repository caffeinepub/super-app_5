import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { createActor } from "../backend";

/** SHA-256 hash of a string, returned as lowercase hex */
async function sha256Hex(input: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Extended actor interface that includes admin methods (post-bindgen) */
interface AdminActor {
  isAdminSetup(): Promise<boolean>;
  setupAdminPassword(
    passwordHash: string,
  ): Promise<{ ok: null } | { err: string }>;
  verifyAdminPassword(passwordHash: string): Promise<boolean>;
  resetAdminPassword(
    oldHash: string,
    newHash: string,
  ): Promise<{ ok: null } | { err: string }>;
  updateFeaturedIds(
    category: string,
    ids: string[],
    passwordHash: string,
  ): Promise<{ ok: null } | { err: string }>;
  getFeaturedIdsByCategory(category: string): Promise<string[]>;
}

export type AdminCategory = "shop" | "delivery" | "service";

export interface UseAdminResult {
  /** Whether admin password has been configured on the backend */
  isSetup: boolean;
  isSetupLoading: boolean;
  /** Local session state — cleared on page reload */
  isVerified: boolean;
  /** Set local verified state (used after successful verifyPassword) */
  setIsVerified: (v: boolean) => void;
  /** Hash + send setup password — first-time only */
  setupPassword: (pw: string) => Promise<{ ok: true } | { err: string }>;
  /** Hash + verify password, updates isVerified on success */
  verifyPassword: (pw: string) => Promise<boolean>;
  /** Hash + reset password */
  resetPassword: (
    oldPw: string,
    newPw: string,
  ) => Promise<{ ok: true } | { err: string }>;
  /** Update featured IDs for a category (authenticated) */
  updateFeatured: (
    category: AdminCategory,
    ids: string[],
    pw: string,
  ) => Promise<{ ok: true } | { err: string }>;
  /** Fetch featured IDs for a category */
  getFeaturedByCategory: (category: AdminCategory) => Promise<string[]>;
  /** Mutation loading states */
  isSetupPending: boolean;
  isVerifyPending: boolean;
  isResetPending: boolean;
  isUpdatePending: boolean;
}

export function useAdmin(): UseAdminResult {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [isVerified, setIsVerified] = useState(false);

  // Cast actor to admin-extended interface — methods exist on canister
  const adminActor = actor as unknown as AdminActor | null;

  // Query: is admin already set up?
  const setupQuery = useQuery<boolean>({
    queryKey: ["adminIsSetup"],
    queryFn: async () => {
      if (!adminActor) return false;
      return adminActor.isAdminSetup();
    },
    enabled: !!adminActor && !isFetching,
    staleTime: 30_000,
  });

  // Mutation: setup password (first-time)
  const setupMutation = useMutation({
    mutationFn: async (pw: string) => {
      if (!adminActor) throw new Error("Actor not ready");
      const hash = await sha256Hex(pw);
      const result = await adminActor.setupAdminPassword(hash);
      if ("err" in result) throw new Error(result.err);
      return { ok: true as const };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminIsSetup"] });
      setIsVerified(true);
    },
  });

  // Mutation: verify password
  const verifyMutation = useMutation({
    mutationFn: async (pw: string) => {
      if (!adminActor) throw new Error("Actor not ready");
      const hash = await sha256Hex(pw);
      const ok = await adminActor.verifyAdminPassword(hash);
      return ok;
    },
    onSuccess: (ok) => {
      if (ok) setIsVerified(true);
    },
  });

  // Mutation: reset password
  const resetMutation = useMutation({
    mutationFn: async ({ oldPw, newPw }: { oldPw: string; newPw: string }) => {
      if (!adminActor) throw new Error("Actor not ready");
      const [oldHash, newHash] = await Promise.all([
        sha256Hex(oldPw),
        sha256Hex(newPw),
      ]);
      const result = await adminActor.resetAdminPassword(oldHash, newHash);
      if ("err" in result) throw new Error(result.err);
      return { ok: true as const };
    },
  });

  // Mutation: update featured IDs
  const updateMutation = useMutation({
    mutationFn: async ({
      category,
      ids,
      pw,
    }: {
      category: AdminCategory;
      ids: string[];
      pw: string;
    }) => {
      if (!adminActor) throw new Error("Actor not ready");
      const hash = await sha256Hex(pw);
      const result = await adminActor.updateFeaturedIds(category, ids, hash);
      if ("err" in result) throw new Error(result.err);
      return { ok: true as const };
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ["featuredIds", vars.category],
      });
    },
  });

  const setupPassword = async (
    pw: string,
  ): Promise<{ ok: true } | { err: string }> => {
    try {
      return await setupMutation.mutateAsync(pw);
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Unknown error" };
    }
  };

  const verifyPassword = async (pw: string): Promise<boolean> => {
    try {
      return await verifyMutation.mutateAsync(pw);
    } catch {
      return false;
    }
  };

  const resetPassword = async (
    oldPw: string,
    newPw: string,
  ): Promise<{ ok: true } | { err: string }> => {
    try {
      return await resetMutation.mutateAsync({ oldPw, newPw });
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Unknown error" };
    }
  };

  const updateFeatured = async (
    category: AdminCategory,
    ids: string[],
    pw: string,
  ): Promise<{ ok: true } | { err: string }> => {
    try {
      return await updateMutation.mutateAsync({ category, ids, pw });
    } catch (e) {
      return { err: e instanceof Error ? e.message : "Unknown error" };
    }
  };

  const getFeaturedByCategory = useCallback(
    async (category: AdminCategory): Promise<string[]> => {
      if (!adminActor) return [];
      try {
        return await adminActor.getFeaturedIdsByCategory(category);
      } catch {
        return [];
      }
    },
    [adminActor],
  );

  return {
    isSetup: setupQuery.data ?? false,
    isSetupLoading: setupQuery.isLoading,
    isVerified,
    setIsVerified,
    setupPassword,
    verifyPassword,
    resetPassword,
    updateFeatured,
    getFeaturedByCategory,
    isSetupPending: setupMutation.isPending,
    isVerifyPending: verifyMutation.isPending,
    isResetPending: resetMutation.isPending,
    isUpdatePending: updateMutation.isPending,
  };
}
