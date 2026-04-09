import Map "mo:core/Map";
import SecurityTypes "../types/security";

module {
  public type OtpAction = SecurityTypes.OtpAction;
  public type LockoutRecord = SecurityTypes.LockoutRecord;
  public type OtpRecord = SecurityTypes.OtpRecord;

  let MAX_ATTEMPTS : Nat = 5;
  let LOCKOUT_SECS : Int = 900; // 15 minutes
  let OTP_EXPIRY_SECS : Int = 600; // 10 minutes
  let OTP_MAX_ATTEMPTS : Nat = 3;

  // ── Login lockout ─────────────────────────────────────────────────────────

  /// Check whether a user account is currently locked out.
  /// Returns #Locked(remainingSecs) or #Open.
  public func checkLockout(
    lockouts : Map.Map<Text, LockoutRecord>,
    userId : Text,
    now : Int,
  ) : { #Locked : Int; #Open } {
    switch (lockouts.get(userId)) {
      case null #Open;
      case (?rec) {
        let remainingSecs = (rec.lockedUntil - now) / 1_000_000_000;
        if (remainingSecs > 0) #Locked(remainingSecs)
        else #Open;
      };
    };
  };

  /// Record a failed login attempt for a user.
  /// Returns the new failure count. Applies a 15-minute lockout after 5 failures.
  public func recordFailedAttempt(
    lockouts : Map.Map<Text, LockoutRecord>,
    userId : Text,
    now : Int,
  ) : Nat {
    let prev = switch (lockouts.get(userId)) {
      case (?rec) rec.failedCount;
      case null 0;
    };
    let newCount = prev + 1;
    let lockedUntil : Int = if (newCount >= MAX_ATTEMPTS) {
      now + LOCKOUT_SECS * 1_000_000_000;
    } else {
      0;
    };
    lockouts.add(
      userId,
      { userId; failedCount = newCount; lockedUntil },
    );
    newCount;
  };

  /// Clear failed login attempts on successful login.
  public func clearAttempts(
    lockouts : Map.Map<Text, LockoutRecord>,
    userId : Text,
  ) {
    lockouts.remove(userId);
  };

  // ── OTP ──────────────────────────────────────────────────────────────────

  /// Convert an OtpAction variant to a stable Text key for map lookup.
  func actionKey(action : OtpAction) : Text {
    switch (action) {
      case (#WithdrawalRequest) "WithdrawalRequest";
      case (#ApprovePayment) "ApprovePayment";
      case (#SuspendUser) "SuspendUser";
    };
  };

  /// Derive a deterministic 6-digit OTP by hashing userId + action + timestamp.
  func deriveCode(userId : Text, action : OtpAction, now : Int) : Text {
    let seed = userId # actionKey(action) # now.toText();
    // Polynomial hash using char index position for variety
    var h : Nat = 0;
    var pos : Nat = 0;
    for (_c in seed.toIter()) {
      h := (h * 31 + pos + 7) % 1_000_000;
      pos += 1;
    };
    // Mix in the length and timestamp for uniqueness
    h := (h + seed.size() * 97 + (if (now >= 0) now.toNat() % 1_000_000 else 0)) % 1_000_000;
    // Zero-pad to 6 digits
    let raw = h.toText();
    let pad = 6 - raw.size();
    if (pad == 0) raw
    else if (pad == 1) "0" # raw
    else if (pad == 2) "00" # raw
    else if (pad == 3) "000" # raw
    else if (pad == 4) "0000" # raw
    else "00000" # raw;
  };

  /// Generate and store an OTP for a userId + action. Returns the 6-digit code.
  public func generateOtp(
    otps : Map.Map<Text, OtpRecord>,
    userId : Text,
    action : OtpAction,
    now : Int,
  ) : Text {
    let code = deriveCode(userId, action, now);
    let key = userId # ":" # actionKey(action);
    otps.add(
      key,
      {
        userId;
        code;
        action;
        generatedAt = now;
        expiresAt = now + OTP_EXPIRY_SECS * 1_000_000_000;
        attemptsRemaining = OTP_MAX_ATTEMPTS;
      },
    );
    code;
  };

  /// Verify an OTP. Returns true on success (and clears the record).
  public func verifyOtp(
    otps : Map.Map<Text, OtpRecord>,
    userId : Text,
    action : OtpAction,
    code : Text,
    now : Int,
  ) : Bool {
    let key = userId # ":" # actionKey(action);
    switch (otps.get(key)) {
      case null false;
      case (?rec) {
        if (now > rec.expiresAt) {
          otps.remove(key);
          return false;
        };
        if (rec.attemptsRemaining == 0) {
          otps.remove(key);
          return false;
        };
        if (rec.code == code) {
          otps.remove(key);
          true;
        } else {
          let remaining = rec.attemptsRemaining - 1;
          if (remaining == 0) {
            otps.remove(key);
          } else {
            otps.add(key, { rec with attemptsRemaining = remaining });
          };
          false;
        };
      };
    };
  };
};
