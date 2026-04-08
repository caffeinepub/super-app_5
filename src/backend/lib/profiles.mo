import Map "mo:core/Map";
import Types "../types/profiles";

module {
  public type UserProfile = Types.UserProfile;
  public type ProfileStore = Map.Map<Types.UserId, UserProfile>;

  public func getProfile(
    store : ProfileStore,
    userId : Types.UserId,
  ) : ?UserProfile {
    store.get(userId);
  };

  public func setProfile(
    store : ProfileStore,
    userId : Types.UserId,
    displayName : Text,
  ) {
    store.add(userId, { displayName });
  };
};
