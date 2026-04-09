import Types "../types/admin";
import Principal "mo:core/Principal";

module {
  public type AdminState = Types.AdminState;

  /// Creates the initial AdminState with no password set.
  /// The first call to verify() will accept any non-empty hash from a
  /// non-anonymous caller, save it as the password, and bind that caller
  /// as adminOwner — no separate setup step required.
  public func empty() : AdminState {
    {
      var adminOwner = null;
      var passwordHash = null;
    };
  };

  /// Returns true only when BOTH adminOwner and passwordHash are set.
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

  /// Verifies the password hash.
  /// If neither adminOwner nor passwordHash is set (first login), accepts any
  /// non-empty hash from a non-anonymous caller, saves it, and binds the caller
  /// as adminOwner — login succeeds immediately.
  /// If adminOwner is not yet bound but a password is pre-seeded, binds the
  /// caller on first successful hash match.
  /// If adminOwner is already bound, both the owner AND the hash must match.
  /// Returns false (never traps) so callers can branch on result.
  public func verify(
    state : AdminState,
    caller : Principal,
    passwordHash : Text,
  ) : Bool {
    switch (state.adminOwner, state.passwordHash) {
      case (null, null) {
        // First login — no password configured yet; accept and save
        if (caller.isAnonymous() or passwordHash.size() == 0) {
          false;
        } else {
          state.adminOwner := ?caller;
          state.passwordHash := ?passwordHash;
          true;
        };
      };
      case (null, ?stored) {
        // Password pre-seeded but no owner yet — bind on first successful login
        if (stored == passwordHash and not caller.isAnonymous()) {
          state.adminOwner := ?caller;
          true;
        } else {
          false;
        };
      };
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
