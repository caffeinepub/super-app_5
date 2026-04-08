import Map "mo:core/Map";
import RolesLib "../lib/roles";
import RoleTypes "../types/roles";

mixin (roles : Map.Map<RoleTypes.UserId, RoleTypes.UserRole>) {

  /// Returns the role of the calling user.
  /// Defaults to #Customer if the user has no assigned role.
  public shared query ({ caller }) func getMyRole() : async RoleTypes.UserRole {
    RolesLib.getRole(roles, caller);
  };

  /// Returns the role of any user by principal.
  public shared query func getUserRole(userId : RoleTypes.UserId) : async RoleTypes.UserRole {
    RolesLib.getRole(roles, userId);
  };

  /// Allows a user to request the #Admin role.
  /// If no admin exists yet, auto-promotes the caller (bootstrap).
  /// Otherwise returns a message indicating the request must be approved by an admin.
  public shared ({ caller }) func requestAdminRole() : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Anonymous caller not allowed");
    };
    if (not RolesLib.hasAnyAdmin(roles)) {
      // Bootstrap: first requester becomes admin automatically
      RolesLib.setRole(roles, caller, #Admin);
      return #ok("You have been granted Admin role (bootstrap)");
    };
    if (RolesLib.isAdmin(roles, caller)) {
      return #err("You already have the Admin role");
    };
    // Non-bootstrap: signal to the frontend that approval is needed
    #ok("Admin role request submitted — awaiting approval from an existing admin");
  };

  /// Admin-only: directly assigns a role to a user.
  /// Returns #err if caller does not have the #Admin role.
  public shared ({ caller }) func assignRole(
    userId : RoleTypes.UserId,
    role : RoleTypes.UserRole,
  ) : async { #ok; #err : Text } {
    if (not RolesLib.isAdmin(roles, caller)) {
      return #err("Unauthorized: Admin role required");
    };
    RolesLib.setRole(roles, userId, role);
    #ok;
  };
};
