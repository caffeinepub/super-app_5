import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;

  /// Immutable audit log entry. Records must never be updated or deleted.
  /// Retained for a minimum of 12 months as required by platform policy.
  public type AuditEntry = {
    id : Text;
    timestamp : Timestamp;
    actorId : Text;
    actionType : Text;
    resourceId : Text;
    resourceType : Text;
    oldValue : ?Text;
    newValue : ?Text;
    details : Text;
  };

  /// Well-known action type constants for AuditEntry.actionType.
  /// Using Text constants keeps the type shared-safe and extensible.
  module AuditActionType {
    public let APPROVE_PAYMENT    = "APPROVE_PAYMENT";
    public let REJECT_PAYMENT     = "REJECT_PAYMENT";
    public let APPROVE_WITHDRAWAL = "APPROVE_WITHDRAWAL";
    public let REJECT_WITHDRAWAL  = "REJECT_WITHDRAWAL";
    public let SUSPEND_USER       = "SUSPEND_USER";
    public let UNSUSPEND_USER     = "UNSUSPEND_USER";
    public let LOGIN_LOCKOUT      = "LOGIN_LOCKOUT";
    public let OTP_ISSUED         = "OTP_ISSUED";
    public let OTP_VERIFIED       = "OTP_VERIFIED";
    public let OTP_FAILED         = "OTP_FAILED";
    public let ADMIN_ROLE_GRANTED = "ADMIN_ROLE_GRANTED";
    public let ADMIN_ROLE_REVOKED = "ADMIN_ROLE_REVOKED";
  };

  // Re-export so callers can use Types.AuditActionType.APPROVE_PAYMENT, etc.
  public let ActionType = AuditActionType;
};
