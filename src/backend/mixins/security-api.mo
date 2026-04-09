import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import SecurityLib "../lib/security";
import SecurityTypes "../types/security";

/// Public API mixin for login lockout and OTP verification.
mixin (
  lockouts : Map.Map<Text, SecurityTypes.LockoutRecord>,
  otps : Map.Map<Text, SecurityTypes.OtpRecord>,
) {

  // ── Login lockout ─────────────────────────────────────────────────────────

  /// Check whether a userId is currently locked out.
  /// Returns { locked = true; remainingSecs } or { locked = false; remainingSecs = 0 }.
  public query func checkLoginLockout(userId : Text) : async { locked : Bool; remainingSecs : Int } {
    let now = Time.now();
    switch (SecurityLib.checkLockout(lockouts, userId, now)) {
      case (#Open) { { locked = false; remainingSecs = 0 } };
      case (#Locked(secs)) { { locked = true; remainingSecs = secs } };
    };
  };

  /// Record a failed login attempt for a userId.
  /// Returns the new total failure count.
  public func recordLoginFailure(userId : Text) : async Nat {
    SecurityLib.recordFailedAttempt(lockouts, userId, Time.now());
  };

  /// Clear failed login attempts on successful authentication.
  public func clearLoginAttempts(userId : Text) : async () {
    SecurityLib.clearAttempts(lockouts, userId);
  };

  // ── OTP ──────────────────────────────────────────────────────────────────

  /// Generate a 6-digit OTP for a sensitive action.
  /// The action parameter must be one of:
  ///   "WithdrawalRequest" | "ApprovePayment" | "SuspendUser"
  /// Returns the code so the frontend can display it on-screen.
  public func generateOtp(userId : Text, action : Text) : async Text {
    let otpAction = textToOtpAction(action);
    SecurityLib.generateOtp(otps, userId, otpAction, Time.now());
  };

  /// Verify the OTP for a sensitive action. Returns true if the code matches.
  public func verifyOtp(userId : Text, action : Text, code : Text) : async Bool {
    let otpAction = textToOtpAction(action);
    SecurityLib.verifyOtp(otps, userId, otpAction, code, Time.now());
  };

  // ── Private helpers ──────────────────────────────────────────────────────

  func textToOtpAction(action : Text) : SecurityTypes.OtpAction {
    if (action == "WithdrawalRequest") #WithdrawalRequest
    else if (action == "ApprovePayment") #ApprovePayment
    else if (action == "SuspendUser") #SuspendUser
    else Runtime.trap("Unknown OTP action: " # action);
  };
};
