import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaymentMethod = "bKash" | "Nagad";
export type WithdrawStatus = "Pending" | "Approved" | "Rejected";

export interface WithdrawRequest {
  id: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  accountNumber: string;
  status: WithdrawStatus;
  date: number;
  note?: string;
}

export interface SellerWallet {
  userId: string;
  totalEarnings: number;
  withdrawnAmount: number;
  remainingBalance: number;
  withdrawals: WithdrawRequest[];
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const WALLETS_KEY = "sa_wallets";
const WITHDRAWALS_KEY = "sa_withdrawals";

function loadWallets(): Record<
  string,
  { totalEarnings: number; withdrawnAmount: number }
> {
  try {
    const raw = localStorage.getItem(WALLETS_KEY);
    return raw
      ? (JSON.parse(raw) as Record<
          string,
          { totalEarnings: number; withdrawnAmount: number }
        >)
      : {};
  } catch {
    return {};
  }
}

function saveWallets(
  wallets: Record<string, { totalEarnings: number; withdrawnAmount: number }>,
): void {
  localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
}

function loadAllWithdrawals(): WithdrawRequest[] {
  try {
    const raw = localStorage.getItem(WITHDRAWALS_KEY);
    return raw ? (JSON.parse(raw) as WithdrawRequest[]) : [];
  } catch {
    return [];
  }
}

function saveWithdrawals(withdrawals: WithdrawRequest[]): void {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(withdrawals));
}

// ─── Seed demo earnings for sellers ──────────────────────────────────────────

function ensureWalletExists(userId: string): {
  totalEarnings: number;
  withdrawnAmount: number;
} {
  const wallets = loadWallets();
  if (!wallets[userId]) {
    // Demo earnings seeded for new sellers
    wallets[userId] = { totalEarnings: 12450, withdrawnAmount: 3200 };
    saveWallets(wallets);
  }
  return wallets[userId];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWallet() {
  const { userId, isAuthenticated, role } = useAuth();
  const [wallet, setWallet] = useState<SellerWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(() => {
    if (!isAuthenticated || !userId) {
      setWallet(null);
      setIsLoading(false);
      return;
    }

    const raw = ensureWalletExists(userId);
    const withdrawals = loadAllWithdrawals().filter((w) => w.userId === userId);
    const withdrawnAmount = withdrawals
      .filter((w) => w.status === "Approved")
      .reduce((sum, w) => sum + w.amount, 0);

    setWallet({
      userId,
      totalEarnings: raw.totalEarnings,
      withdrawnAmount,
      remainingBalance: raw.totalEarnings - withdrawnAmount,
      withdrawals: withdrawals.sort((a, b) => b.date - a.date),
    });
    setIsLoading(false);
  }, [userId, isAuthenticated]);

  useEffect(() => {
    setIsLoading(true);
    loadWallet();
  }, [loadWallet]);

  const requestWithdrawal = useCallback(
    async (
      amount: number,
      method: PaymentMethod,
      accountNumber: string,
    ): Promise<{ ok: true } | { err: string }> => {
      if (!userId || !wallet) return { err: "Not authenticated." };
      if (amount <= 0) return { err: "Amount must be greater than 0." };
      if (amount > wallet.remainingBalance)
        return {
          err: `Insufficient balance. Available: ৳${wallet.remainingBalance.toLocaleString()}`,
        };
      if (!accountNumber.trim()) return { err: "Account number is required." };
      if (!/^\d{11}$/.test(accountNumber.replace(/\s/g, "")))
        return { err: "Please enter a valid 11-digit mobile number." };

      const pendingTotal = wallet.withdrawals
        .filter((w) => w.status === "Pending")
        .reduce((sum, w) => sum + w.amount, 0);
      if (amount + pendingTotal > wallet.remainingBalance)
        return {
          err: "You have pending requests that already cover your balance.",
        };

      setError(null);
      const all = loadAllWithdrawals();
      const newRequest: WithdrawRequest = {
        id: `wr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        amount,
        method,
        accountNumber: accountNumber.trim(),
        status: "Pending",
        date: Date.now(),
      };
      all.push(newRequest);
      saveWithdrawals(all);
      loadWallet();
      return { ok: true };
    },
    [userId, wallet, loadWallet],
  );

  return {
    wallet,
    isLoading,
    error,
    setError,
    requestWithdrawal,
    isSeller: role === "Seller",
    refresh: loadWallet,
  };
}

// ─── Admin wallet utilities ───────────────────────────────────────────────────

export function useAdminWallet() {
  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(() => {
    setWithdrawals(loadAllWithdrawals().sort((a, b) => b.date - a.date));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const updateStatus = useCallback(
    (id: string, status: "Approved" | "Rejected", note?: string) => {
      const all = loadAllWithdrawals().map((w) =>
        w.id === id ? { ...w, status, note } : w,
      );
      saveWithdrawals(all);
      loadAll();
    },
    [loadAll],
  );

  const pendingCount = withdrawals.filter((w) => w.status === "Pending").length;

  return {
    withdrawals,
    isLoading,
    updateStatus,
    pendingCount,
    refresh: loadAll,
  };
}
