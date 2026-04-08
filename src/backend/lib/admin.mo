import Types "../types/admin";
import Principal "mo:core/Principal";

module {
  public type AdminState = Types.AdminState;

  /// Creates a fresh, unconfigured AdminState.
  public func empty() : AdminState {
    { var adminOwner = null; var passwordHash = null };
  };

  /// Returns true if the admin password has already been configured.
  public func isSetup(state : AdminState) : Bool {
    switch (state.adminOwner, state.passwordHash) {
      case (?_, ?_) true;
      case _ false;
    };
  };

  /// Sets up the admin password on first call.
  /// Stores the hashed password and binds the caller as adminOwner.
  /// Returns #err if already configured.
  public func setupPassword(
    state : AdminState,
    caller : Principal,
    passwordHash : Text,
  ) : { #ok; #err : Text } {
    if (isSetup(state)) {
      return #err("Admin already configured");
    };
    if (caller.isAnonymous()) {
      return #err("Anonymous caller not allowed");
    };
    if (passwordHash.size() == 0) {
      return #err("Password hash cannot be empty");
    };
    state.adminOwner := ?caller;
    state.passwordHash := ?passwordHash;
    #ok;
  };

  /// Verifies that caller is the adminOwner AND the hash matches.
  /// Returns false (never traps) so callers can branch on result.
  public func verify(
    state : AdminState,
    caller : Principal,
    passwordHash : Text,
  ) : Bool {
    switch (state.adminOwner, state.passwordHash) {
      case (?owner, ?stored) {
        Principal.equal(caller, owner) and stored == passwordHash;
      };
      case _ false;
    };
  };

  /// Changes the password after verifying caller identity and old hash.
  /// Returns #err if not set up, caller mismatch, or old hash wrong.
  public func resetPassword(
    state : AdminState,
    caller : Principal,
    oldHash : Text,
    newHash : Text,
  ) : { #ok; #err : Text } {
    if (not isSetup(state)) {
      return #err("Admin not configured");
    };
    if (not verify(state, caller, oldHash)) {
      return #err("Unauthorized");
    };
    if (newHash.size() == 0) {
      return #err("New password hash cannot be empty");
    };
    state.passwordHash := ?newHash;
    #ok;
  };
};
