import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;

  /// Lifecycle status of a referral.
  public type ReferralStatus = {
    #Pending;    // Referee signed up but reward not yet credited
    #Completed;  // Reward credited to referrer, bonus credited to referee
    #Invalid;    // Code was invalid or conditions were not met
  };

  /// A referral code owned by a user, generated via the invite-links extension.
  public type ReferralCode = {
    code : Text;
    ownerId : Text;
    createdAt : Timestamp;
  };

  /// A single referral event linking a referrer to a new user (referee).
  /// Default referrerReward = 50 (wallet credit in BDT).
  /// Default refereeBonus  = 100 (signup wallet bonus in BDT).
  public type ReferralRecord = {
    id : Text;
    code : Text;
    referrerId : Text;
    refereeId : Text;
    completedAt : Timestamp;
    referrerReward : Nat;  // flat wallet credit — default 50
    refereeBonus : Nat;    // signup bonus — default 100
    status : ReferralStatus;
  };

  /// Platform-wide defaults for referral rewards (in BDT).
  module Defaults {
    public let referrerReward : Nat = 50;
    public let refereeBonus   : Nat = 100;
  };

  public let defaults = Defaults;

  /// A single row in the referral leaderboard.
  /// Returned by getReferralLeaderboard(), sorted by totalReferrals descending.
  public type LeaderboardEntry = {
    rank : Nat;
    referrerId : Text;
    totalReferrals : Nat;
    totalRewardEarned : Float;
    lastReferralDate : Int;
  };
};
