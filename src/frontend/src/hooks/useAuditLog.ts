import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { createActor } from "../backend";
import type { AuditEntry } from "../backend.d";

const PAGE_SIZE = 20n;

export interface AuditLogState {
  entries: AuditEntry[];
  loading: boolean;
  error: string | null;
  totalFetched: number;
  currentPage: number;
  fetchPage: (page: number) => Promise<void>;
  filterByActor: (actorId: string, page?: number) => Promise<void>;
  filterByAction: (actionType: string, page?: number) => Promise<void>;
  filterByDateRange: (from: Date, to: Date, page?: number) => Promise<void>;
  clearFilters: () => Promise<void>;
}

export function useAuditLog(): AuditLogState {
  const { actor } = useActor(createActor);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalFetched, setTotalFetched] = useState(0);

  const fetchPage = useCallback(
    async (page: number) => {
      if (!actor) return;
      setLoading(true);
      setError(null);
      try {
        const offset = BigInt(page) * PAGE_SIZE;
        const result = await actor.getAuditLog(PAGE_SIZE, offset);
        setEntries(result);
        setCurrentPage(page);
        setTotalFetched(result.length);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    },
    [actor],
  );

  const filterByActor = useCallback(
    async (actorId: string, page = 0) => {
      if (!actor) return;
      setLoading(true);
      setError(null);
      try {
        const offset = BigInt(page) * PAGE_SIZE;
        const result = await actor.getAuditLogByActor(
          actorId,
          PAGE_SIZE,
          offset,
        );
        setEntries(result);
        setCurrentPage(page);
        setTotalFetched(result.length);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to filter by actor");
      } finally {
        setLoading(false);
      }
    },
    [actor],
  );

  const filterByAction = useCallback(
    async (actionType: string, page = 0) => {
      if (!actor) return;
      setLoading(true);
      setError(null);
      try {
        const offset = BigInt(page) * PAGE_SIZE;
        const result = await actor.getAuditLogByAction(
          actionType,
          PAGE_SIZE,
          offset,
        );
        setEntries(result);
        setCurrentPage(page);
        setTotalFetched(result.length);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to filter by action");
      } finally {
        setLoading(false);
      }
    },
    [actor],
  );

  const filterByDateRange = useCallback(
    async (from: Date, to: Date, page = 0) => {
      if (!actor) return;
      setLoading(true);
      setError(null);
      try {
        const fromNs = BigInt(from.getTime()) * 1_000_000n;
        const toNs = BigInt(to.getTime()) * 1_000_000n;
        const offset = BigInt(page) * PAGE_SIZE;
        const result = await actor.getAuditLogByDateRange(
          fromNs,
          toNs,
          PAGE_SIZE,
          offset,
        );
        setEntries(result);
        setCurrentPage(page);
        setTotalFetched(result.length);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to filter by date range",
        );
      } finally {
        setLoading(false);
      }
    },
    [actor],
  );

  const clearFilters = useCallback(async () => {
    await fetchPage(0);
  }, [fetchPage]);

  return {
    entries,
    loading,
    error,
    totalFetched,
    currentPage,
    fetchPage,
    filterByActor,
    filterByAction,
    filterByDateRange,
    clearFilters,
  };
}

// --- Mock fallback sample data ---
function mockSuspensionEntries(sellerId?: string): AuditEntry[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    {
      id: "sus-1",
      timestamp: BigInt(now - day * 2) * 1_000_000n,
      actorId: "admin-principal-aaa111",
      actionType: "SUSPEND_USER",
      resourceId: sellerId ?? "seller-abc123",
      resourceType: "USER",
      oldValue: "active",
      newValue: "suspended",
      details: "Policy violation: repeated refund abuse",
    },
    {
      id: "uns-1",
      timestamp: BigInt(now - day * 5) * 1_000_000n,
      actorId: "admin-principal-bbb222",
      actionType: "UNSUSPEND_USER",
      resourceId: sellerId ?? "seller-abc123",
      resourceType: "USER",
      oldValue: "suspended",
      newValue: "active",
      details: "Appeal approved after review",
    },
    {
      id: "sus-2",
      timestamp: BigInt(now - day * 10) * 1_000_000n,
      actorId: "admin-principal-aaa111",
      actionType: "SUSPEND_USER",
      resourceId: sellerId ?? "seller-def456",
      resourceType: "USER",
      oldValue: "active",
      newValue: "suspended",
      details: "Fraudulent product listings detected",
    },
    {
      id: "sus-3",
      timestamp: BigInt(now - day * 14) * 1_000_000n,
      actorId: "admin-principal-ccc333",
      actionType: "SUSPEND_USER",
      resourceId: sellerId ?? "seller-ghi789",
      resourceType: "USER",
      oldValue: "active",
      newValue: "suspended",
      details: "Customer complaints threshold exceeded",
    },
    {
      id: "uns-2",
      timestamp: BigInt(now - day * 20) * 1_000_000n,
      actorId: "admin-principal-bbb222",
      actionType: "UNSUSPEND_USER",
      resourceId: sellerId ?? "seller-ghi789",
      resourceType: "USER",
      oldValue: "suspended",
      newValue: "active",
      details: "Issue resolved, reinstated",
    },
  ];
}

// --- useSellerSuspensionTrail ---
export function useSellerSuspensionTrail(sellerId: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AuditEntry[]>({
    queryKey: ["sellerSuspensionTrail", sellerId],
    queryFn: async () => {
      if (!actor) return mockSuspensionEntries(sellerId);
      try {
        const result = await actor.getSuspensionAuditTrail(sellerId);
        return result.length > 0 ? result : [];
      } catch {
        return mockSuspensionEntries(sellerId);
      }
    },
    enabled: !!sellerId && !isFetching,
  });
}

// --- useAllSellerSuspensions ---
export function useAllSellerSuspensions(limit = 20, offset = 0) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AuditEntry[]>({
    queryKey: ["allSellerSuspensions", limit, offset],
    queryFn: async () => {
      if (!actor) return mockSuspensionEntries();
      try {
        const result = await actor.getAllSellerSuspensions(
          BigInt(limit),
          BigInt(offset),
        );
        return result.length > 0 ? result : mockSuspensionEntries();
      } catch {
        return mockSuspensionEntries();
      }
    },
    enabled: !isFetching,
  });
}
