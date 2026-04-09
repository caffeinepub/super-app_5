import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import ReferralTypes "../types/referral";

module {
  public type ReferralCode = ReferralTypes.ReferralCode;
  public type ReferralRecord = ReferralTypes.ReferralRecord;
  public type ReferralStatus = ReferralTypes.ReferralStatus;

  let REFERRER_REWARD : Nat = ReferralTypes.defaults.referrerReward;
  let REFEREE_BONUS : Nat = ReferralTypes.defaults.refereeBonus;

  // 32-char alphanumeric alphabet (no ambiguous chars 0/O/1/I)
  let ALPHABET : Text = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  /// Derive a 6-character alphanumeric code via polynomial hash.
  func deriveCode(userId : Text, salt : Int) : Text {
    let seed = userId # salt.toText();
    var h : Nat = 5381;
    for (c in seed.toIter()) {
      let charLen = Text.fromChar(c).size(); // always 1 per char
      h := (h * 33 + charLen) % 1_000_000_000;
    };
    let base : Nat = 32;
    var n = h;
    var result = "";
    var i = 0;
    while (i < 6) {
      let idx = n % base;
      // Extract the idx-th character from ALPHABET
      var ci = 0;
      var found = "";
      for (ac in ALPHABET.toIter()) {
        if (ci == idx) { found := Text.fromChar(ac) };
        ci += 1;
      };
      result := found # result;
      n := n / base;
      i += 1;
    };
    result;
  };

  /// Generate or return the existing referral code for a user.
  public func getOrCreateCode(
    userToCode : Map.Map<Text, Text>,
    codeToUser : Map.Map<Text, Text>,
    userId : Text,
    now : Int,
  ) : Text {
    switch (userToCode.get(userId)) {
      case (?code) code;
      case null {
        var salt = now;
        var code = deriveCode(userId, salt);
        var attempts = 0;
        while (codeToUser.containsKey(code) and attempts < 20) {
          salt += 1;
          code := deriveCode(userId, salt);
          attempts += 1;
        };
        userToCode.add(userId, code);
        codeToUser.add(code, userId);
        code;
      };
    };
  };

  /// Look up the owner of a referral code.
  public func lookupReferrer(codeToUser : Map.Map<Text, Text>, code : Text) : ?Text {
    codeToUser.get(code);
  };

  /// Get the referral code for a user.
  public func getReferralCode(userToCode : Map.Map<Text, Text>, userId : Text) : ?Text {
    userToCode.get(userId);
  };

  /// Process a referral: validate, record, return true if successful.
  public func processReferral(
    referrals : List.List<ReferralRecord>,
    userToCode : Map.Map<Text, Text>,
    codeToUser : Map.Map<Text, Text>,
    nextId : { var value : Nat },
    refereeId : Text,
    code : Text,
    now : Int,
  ) : Bool {
    switch (codeToUser.get(code)) {
      case null false;
      case (?referrerId) {
        if (referrerId == refereeId) return false;
        let alreadyExists = referrals.find(func(r : ReferralRecord) : Bool {
          r.referrerId == referrerId and r.refereeId == refereeId
        });
        switch (alreadyExists) {
          case (?_) false;
          case null {
            let id = nextId.value.toText();
            nextId.value += 1;
            referrals.add({
              id;
              code;
              referrerId;
              refereeId;
              completedAt = now;
              referrerReward = REFERRER_REWARD;
              refereeBonus = REFEREE_BONUS;
              status = #Completed;
            });
            true;
          };
        };
      };
    };
  };

  /// Get all referral records for a referrer.
  public func getReferralsByReferrer(
    referrals : List.List<ReferralRecord>,
    referrerId : Text,
  ) : [ReferralRecord] {
    referrals.filter(func(r : ReferralRecord) : Bool { r.referrerId == referrerId }).toArray();
  };

  /// Calculate total wallet earnings from completed referrals for a user.
  public func getTotalReferralEarnings(
    referrals : List.List<ReferralRecord>,
    userId : Text,
  ) : Nat {
    referrals.foldLeft(
      0,
      func(acc : Nat, r : ReferralRecord) : Nat {
        if (r.referrerId == userId and r.status == #Completed) {
          acc + r.referrerReward;
        } else acc;
      },
    );
  };

  /// Build the top-50 referral leaderboard sorted by totalReferrals desc,
  /// tie-broken by totalRewardEarned desc.
  public func buildLeaderboard(
    referrals : List.List<ReferralRecord>,
  ) : [ReferralTypes.LeaderboardEntry] {
    Runtime.trap("not implemented");
  };
};
