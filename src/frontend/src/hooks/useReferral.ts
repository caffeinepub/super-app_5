import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { createActor } from "../backend";
import type { ReferralRecord } from "../backend";

export interface ReferralState {
  referralCode: string | null;
  referralLink: string | null;
  referrals: ReferralRecord[];
  totalEarnings: bigint;
  loading: boolean;
  copied: boolean;
  createCode: (userId: string) => Promise<string>;
  copyLink: () => Promise<void>;
  processSignupReferral: (refereeId: string, code: string) => Promise<boolean>;
}

export interface LeaderboardEntry {
  rank: bigint;
  referrerId: string;
  totalReferrals: bigint;
  totalRewardEarned: number;
  lastReferralDate: bigint;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: BigInt(1),
    referrerId: "user_bd_mahfuz_8821",
    totalReferrals: BigInt(47),
    totalRewardEarned: 2350,
    lastReferralDate: BigInt(Date.now() - 2 * 86400000),
  },
  {
    rank: BigInt(2),
    referrerId: "user_bd_rakib_2294",
    totalReferrals: BigInt(39),
    totalRewardEarned: 1950,
    lastReferralDate: BigInt(Date.now() - 1 * 86400000),
  },
  {
    rank: BigInt(3),
    referrerId: "user_bd_nasrin_5560",
    totalReferrals: BigInt(31),
    totalRewardEarned: 1550,
    lastReferralDate: BigInt(Date.now() - 3 * 86400000),
  },
  {
    rank: BigInt(4),
    referrerId: "user_bd_karim_7743",
    totalReferrals: BigInt(24),
    totalRewardEarned: 1200,
    lastReferralDate: BigInt(Date.now() - 4 * 86400000),
  },
  {
    rank: BigInt(5),
    referrerId: "user_bd_sumaiya_3301",
    totalReferrals: BigInt(19),
    totalRewardEarned: 950,
    lastReferralDate: BigInt(Date.now() - 5 * 86400000),
  },
  {
    rank: BigInt(6),
    referrerId: "user_bd_farhan_6612",
    totalReferrals: BigInt(15),
    totalRewardEarned: 750,
    lastReferralDate: BigInt(Date.now() - 6 * 86400000),
  },
  {
    rank: BigInt(7),
    referrerId: "user_bd_tania_9977",
    totalReferrals: BigInt(12),
    totalRewardEarned: 600,
    lastReferralDate: BigInt(Date.now() - 7 * 86400000),
  },
  {
    rank: BigInt(8),
    referrerId: "user_bd_imran_4450",
    totalReferrals: BigInt(9),
    totalRewardEarned: 450,
    lastReferralDate: BigInt(Date.now() - 8 * 86400000),
  },
  {
    rank: BigInt(9),
    referrerId: "user_bd_mitu_1123",
    totalReferrals: BigInt(6),
    totalRewardEarned: 300,
    lastReferralDate: BigInt(Date.now() - 10 * 86400000),
  },
  {
    rank: BigInt(10),
    referrerId: "user_bd_roman_8801",
    totalReferrals: BigInt(3),
    totalRewardEarned: 150,
    lastReferralDate: BigInt(Date.now() - 12 * 86400000),
  },
];

export function useReferralLeaderboard() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<LeaderboardEntry[]>({
    queryKey: ["referralLeaderboard"],
    queryFn: async () => {
      if (!actor) return MOCK_LEADERBOARD;
      try {
        const result = await (
          actor as unknown as {
            getReferralLeaderboard: () => Promise<LeaderboardEntry[]>;
          }
        ).getReferralLeaderboard();
        return result ?? MOCK_LEADERBOARD;
      } catch {
        return MOCK_LEADERBOARD;
      }
    },
    enabled: !isFetching,
    staleTime: 2 * 60 * 1000,
    placeholderData: MOCK_LEADERBOARD,
  });
}

export function useReferral(userId: string | null): ReferralState {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: referralCode = null, isLoading: codeLoading } = useQuery<
    string | null
  >({
    queryKey: ["referralCode", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      return actor.getReferralCode(userId);
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery<
    ReferralRecord[]
  >({
    queryKey: ["myReferrals", userId],
    queryFn: async () => {
      if (!actor || !userId) return [];
      return actor.getMyReferrals();
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 60 * 1000,
  });

  const { data: totalEarnings = BigInt(0), isLoading: earningsLoading } =
    useQuery<bigint>({
      queryKey: ["referralEarnings", userId],
      queryFn: async () => {
        if (!actor || !userId) return BigInt(0);
        return actor.getMyReferralEarnings();
      },
      enabled: !!actor && !isFetching && !!userId,
      staleTime: 60 * 1000,
    });

  const referralLink = referralCode
    ? `${window.location.origin}/signup?ref=${referralCode}`
    : null;

  const createCode = useCallback(
    async (uid: string): Promise<string> => {
      if (!actor) return "";
      const code = await actor.createReferralCode(uid);
      await queryClient.invalidateQueries({ queryKey: ["referralCode", uid] });
      return code;
    },
    [actor, queryClient],
  );

  const copyLink = useCallback(async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [referralLink]);

  const processSignupReferral = useCallback(
    async (refereeId: string, code: string): Promise<boolean> => {
      if (!actor) return false;
      const result = await actor.processReferral(refereeId, code);
      await queryClient.invalidateQueries({ queryKey: ["myReferrals"] });
      await queryClient.invalidateQueries({ queryKey: ["referralEarnings"] });
      return result;
    },
    [actor, queryClient],
  );

  return {
    referralCode,
    referralLink,
    referrals,
    totalEarnings,
    loading: codeLoading || referralsLoading || earningsLoading || isFetching,
    copied,
    createCode,
    copyLink,
    processSignupReferral,
  };
}
