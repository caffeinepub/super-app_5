import List "mo:core/List";
import Runtime "mo:core/Runtime";
import AuditLib "../lib/audit";
import AuditTypes "../types/audit";

/// Public API mixin exposing the append-only audit log to admins.
mixin (
  auditLog : List.List<AuditTypes.AuditEntry>,
  auditCounter : { var value : Nat },
) {

  /// Get a paginated slice of the audit log, newest first.
  public query func getAuditLog(limit : Nat, offset : Nat) : async [AuditTypes.AuditEntry] {
    AuditLib.getEntries(auditLog, limit, offset);
  };

  /// Get audit entries by a specific actor (user/admin principal text).
  public query func getAuditLogByActor(
    actorId : Text,
    limit : Nat,
    offset : Nat,
  ) : async [AuditTypes.AuditEntry] {
    AuditLib.getEntriesByActor(auditLog, actorId, limit, offset);
  };

  /// Get audit entries by action type constant (e.g. "APPROVE_PAYMENT").
  public query func getAuditLogByAction(
    actionType : Text,
    limit : Nat,
    offset : Nat,
  ) : async [AuditTypes.AuditEntry] {
    AuditLib.getEntriesByAction(auditLog, actionType, limit, offset);
  };

  /// Get audit entries within a nanosecond timestamp range [from, to], newest first.
  public query func getAuditLogByDateRange(
    from : Int,
    to : Int,
    limit : Nat,
    offset : Nat,
  ) : async [AuditTypes.AuditEntry] {
    AuditLib.getEntriesByDateRange(auditLog, from, to, limit, offset);
  };

  // ── Suspension audit trail ────────────────────────────────────────────────

  /// Get all SUSPEND_USER / UNSUSPEND_USER audit entries for a specific seller,
  /// sorted by timestamp descending.
  public query func getSuspensionAuditTrail(sellerId : Text) : async [AuditTypes.AuditEntry] {
    Runtime.trap("not implemented");
  };

  /// Get a paginated view of all suspension events across all sellers (admin).
  public query func getAllSellerSuspensions(limit : Nat, offset : Nat) : async [AuditTypes.AuditEntry] {
    Runtime.trap("not implemented");
  };
};
