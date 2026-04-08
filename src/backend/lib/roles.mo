import Map "mo:core/Map";
import Types "../types/roles";

module {
  public type UserRole = Types.UserRole;
  public type RoleStore = Map.Map<Types.UserId, UserRole>;

  /// Returns the role of a user, defaulting to #Customer if not found.
  public func getRole(
    store : RoleStore,
    userId : Types.UserId,
  ) : UserRole {
    switch (store.get(userId)) {
      case (?role) role;
      case null #Customer;
    };
  };

  /// Assigns a role to a user unconditionally (used internally for bootstrapping).
  public func setRole(
    store : RoleStore,
    userId : Types.UserId,
    role : UserRole,
  ) {
    store.add(userId, role);
  };

  /// Returns true if the user has the #Admin role.
  public func isAdmin(store : RoleStore, userId : Types.UserId) : Bool {
    switch (store.get(userId)) {
      case (? #Admin) true;
      case _ false;
    };
  };

  /// Returns true if any admin exists in the store (used for bootstrap detection).
  public func hasAnyAdmin(store : RoleStore) : Bool {
    store.any(func(_id, role) {
      switch (role) {
        case (#Admin) true;
        case _ false;
      };
    });
  };
};
