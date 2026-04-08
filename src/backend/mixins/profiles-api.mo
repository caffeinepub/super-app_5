import Map "mo:core/Map";
import ProfilesLib "../lib/profiles";
import Types "../types/profiles";

mixin (profiles : Map.Map<Types.UserId, ProfilesLib.UserProfile>) {

  /// Returns the caller's principal as text (for display on the frontend).
  public shared query ({ caller }) func getMyPrincipal() : async Text {
    caller.toText();
  };

  /// Returns the profile for the given principal, or null if not set.
  public shared query func getUserProfile(userId : Types.UserId) : async ?ProfilesLib.UserProfile {
    ProfilesLib.getProfile(profiles, userId);
  };

  /// Creates or updates the caller's display name.
  public shared ({ caller }) func setUserProfile(displayName : Text) : async () {
    ProfilesLib.setProfile(profiles, caller, displayName);
  };
};
