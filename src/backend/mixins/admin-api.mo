import Map "mo:core/Map";
import AdminLib "../lib/admin";
import FeaturedLib "../lib/featured";
import AdminTypes "../types/admin";
import FeaturedTypes "../types/featured";

mixin (
  adminState : AdminTypes.AdminState,
  featured : Map.Map<FeaturedTypes.Category, [Text]>,
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

  /// Returns true if the caller is the adminOwner AND the hash matches the stored hash.
  /// Plain-text password is NEVER stored; comparison is hash-to-hash only.
  public shared query ({ caller }) func verifyAdminPassword(
    passwordHash : Text
  ) : async Bool {
    AdminLib.verify(adminState, caller, passwordHash);
  };

  /// Changes the admin password after verifying the old hash and caller identity.
  /// Returns #err if not set up, caller mismatch, or old hash is wrong.
  public shared ({ caller }) func resetAdminPassword(
    oldHash : Text,
    newHash : Text,
  ) : async { #ok; #err : Text } {
    AdminLib.resetPassword(adminState, caller, oldHash, newHash);
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
