import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import ReferralLib "../lib/referral";
import ReferralTypes "../types/referral";
import WalletTypes "../types/wallet";
import Common "../types/common";

/// Public API mixin for the referral system.
mixin (
  referrals : List.List<ReferralTypes.ReferralRecord>,
  userToCode : Map.Map<Text, Text>,
  codeToUser : Map.Map<Text, Text>,
  referralCounter : { var value : Nat },
  wallets : Map.Map<Common.UserId, WalletTypes.SellerWallet>,
) {

  // ── Code management ───────────────────────────────────────────────────────

  /// Generate (or retrieve) a referral code for the calling user.
  public shared ({ caller }) func createReferralCode(userId : Text) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    ReferralLib.getOrCreateCode(userToCode, codeToUser, userId, Time.now());
  };

  /// Look up the referral code for any userId.
  public query func getReferralCode(userId : Text) : async ?Text {
    ReferralLib.getReferralCode(userToCode, userId);
  };

  // ── Referral processing ───────────────────────────────────────────────────

  /// Process a referral at signup. The referee submits their referral code.
  /// Returns true if the referral was accepted (new, valid, non-self).
  /// On success: credits wallet balance to both referrer and referee.
  public shared ({ caller }) func processReferral(refereeId : Text, referralCode : Text) : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    let now = Time.now();
    let ok = ReferralLib.processReferral(
      referrals,
      userToCode,
      codeToUser,
      referralCounter,
      refereeId,
      referralCode,
      now,
    );
    if (ok) {
      // Credit referrer wallet
      switch (codeToUser.get(referralCode)) {
        case null {};
        case (?referrerId) {
          let referrerPrincipal = Principal.fromText(referrerId);
          let referrerReward = ReferralTypes.defaults.referrerReward.toFloat();
          switch (wallets.get(referrerPrincipal)) {
            case (?w) {
              wallets.add(
                referrerPrincipal,
                { w with totalEarnings = w.totalEarnings + referrerReward },
              );
            };
            case null {
              wallets.add(
                referrerPrincipal,
                {
                  sellerId = referrerPrincipal;
                  totalEarnings = referrerReward;
                  totalWithdrawn = 0.0;
                  pendingWithdrawal = 0.0;
                },
              );
            };
          };
          // Credit referee (signup bonus)
          let refereePrincipal = Principal.fromText(refereeId);
          let refereeBonus = ReferralTypes.defaults.refereeBonus.toFloat();
          switch (wallets.get(refereePrincipal)) {
            case (?w) {
              wallets.add(
                refereePrincipal,
                { w with totalEarnings = w.totalEarnings + refereeBonus },
              );
            };
            case null {
              wallets.add(
                refereePrincipal,
                {
                  sellerId = refereePrincipal;
                  totalEarnings = refereeBonus;
                  totalWithdrawn = 0.0;
                  pendingWithdrawal = 0.0;
                },
              );
            };
          };
        };
      };
    };
    ok;
  };

  // ── Referral history ──────────────────────────────────────────────────────

  /// Get the calling user's outbound referral history.
  public shared query ({ caller }) func getMyReferrals() : async [ReferralTypes.ReferralRecord] {
    if (caller.isAnonymous()) return [];
    ReferralLib.getReferralsByReferrer(referrals, caller.toText());
  };

  /// Get the calling user's total referral earnings.
  public shared query ({ caller }) func getMyReferralEarnings() : async Nat {
    if (caller.isAnonymous()) return 0;
    ReferralLib.getTotalReferralEarnings(referrals, caller.toText());
  };

  // ── Leaderboard ───────────────────────────────────────────────────────────

  /// Get the top-50 referral leaderboard, sorted by totalReferrals descending.
  /// Tie-breaks use totalRewardEarned descending.
  public query func getReferralLeaderboard() : async [ReferralTypes.LeaderboardEntry] {
    Runtime.trap("not implemented");
  };
};
