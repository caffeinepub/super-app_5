import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import AdminLib "../lib/admin";
import SecurityLib "../lib/security";
import FeaturedLib "../lib/featured";
import AdminTypes "../types/admin";
import FeaturedTypes "../types/featured";
import SecurityTypes "../types/security";
import Time "mo:core/Time";

mixin (
  adminState : AdminTypes.AdminState,
  featured : Map.Map<FeaturedTypes.Category, [Text]>,
  lockouts : Map.Map<Text, SecurityTypes.LockoutRecord>,
) {

  /// Returns true if the admin password has already been configured.
  public shared query func isAdminSetup() : async Bool {
    AdminLib.isSetup(adminState);
  };

  /// One-time setup: stores the hashed password and binds the caller as adminOwner.
  /// Returns #err if admin is already configured or caller is anonymous.
  public shared ({ caller }) func setupAdminPassword(
    passwordHash : Text
  ) : async { #ok; #err : Text } {
    AdminLib.setupPassword(adminState, caller, passwordHash);
  };

  /// Returns true if the hash matches the stored hash.
  /// Correct password always clears any lockout so admin is never permanently blocked.
  /// Wrong password records a failure for "admin:<caller>" (up to 5 attempts allowed).
  /// NOTE: must be an update call (not query) because it may mutate adminOwner.
  public shared ({ caller }) func verifyAdminPassword(
    passwordHash : Text
  ) : async Bool {
    let adminKey = "admin:" # caller.toText();
    let verified = AdminLib.verify(adminState, caller, passwordHash);
    if (verified) {
      // Correct password — clear any existing lockout so admin is never blocked
      SecurityLib.clearAttempts(lockouts, adminKey);
      true;
    } else {
      // Wrong password — record the failure (lockout kicks in after 5 consecutive misses)
      ignore SecurityLib.recordFailedAttempt(lockouts, adminKey, Time.now());
      false;
    };
  };

  /// Changes the admin password after verifying the old hash and caller identity.
  /// Returns #err if not set up, caller mismatch, or old hash is wrong.
  public shared ({ caller }) func resetAdminPassword(
    oldHash : Text,
    newHash : Text,
  ) : async { #ok; #err : Text } {
    AdminLib.resetPassword(adminState, caller, oldHash, newHash);
  };

  /// Clears ALL admin lockout entries immediately so any locked admin can retry.
  /// No authentication required — removes lockout records only, not passwords.
  public func resetAdminLockout() : async () {
    // Collect keys with "admin:" prefix first (cannot remove during iteration)
    let toRemove = List.empty<Text>();
    let adminPrefix : Text.Pattern = #text "admin:";
    for ((key, _) in lockouts.entries()) {
      if (key.startsWith(adminPrefix)) {
        toRemove.add(key);
      };
    };
    for (key in toRemove.values()) {
      lockouts.remove(key);
    };
  };

  /// Admin-only: updates featured IDs for a category.
  /// Requires caller to be adminOwner AND passwordHash to match stored hash.
  public shared ({ caller }) func updateFeaturedIds(
    category : Text,
    ids : [Text],
    passwordHash : Text,
  ) : async { #ok; #err : Text } {
    if (not AdminLib.verify(adminState, caller, passwordHash)) {
      return #err("Unauthorized");
    };
    FeaturedLib.setFeaturedIds(featured, category, ids);
    #ok;
  };

  /// Query: returns featured IDs for the given category.
  public shared query func getFeaturedIdsByCategory(category : Text) : async [Text] {
    FeaturedLib.getFeaturedIds(featured, category);
  };
};
