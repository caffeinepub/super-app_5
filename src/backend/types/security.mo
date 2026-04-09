import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;

  /// The sensitive actions that require OTP verification before proceeding.
  public type OtpAction = {
    #WithdrawalRequest;
    #ApprovePayment;
    #SuspendUser;
  };

  /// Tracks a single failed login attempt for a user account.
  public type LoginAttempt = {
    userId : Text;
    attemptTime : Timestamp;
    ipHint : Text;
  };

  /// Records the active lockout state for a user after too many failed attempts.
  /// Lockout lasts 15 minutes after 5 consecutive failures.
  /// failedCount resets to 0 upon successful login.
  public type LockoutRecord = {
    userId : Text;
    lockedUntil : Timestamp;
    failedCount : Nat;
  };

  /// A one-time password record issued for a sensitive action.
  /// Expires after a short window; attemptsRemaining prevents brute-force.
  public type OtpRecord = {
    userId : Text;
    code : Text;
    action : OtpAction;
    generatedAt : Timestamp;
    expiresAt : Timestamp;
    attemptsRemaining : Nat;
  };
};
