import List "mo:core/List";
import AuditTypes "../types/audit";

module {
  public type AuditEntry = AuditTypes.AuditEntry;

  /// Append a new audit entry. Counter is mutated by caller (passed by ref via var).
  public func logAction(
    log : List.List<AuditEntry>,
    nextId : { var value : Nat },
    actorId : Text,
    actionType : Text,
    resourceId : Text,
    resourceType : Text,
    details : Text,
    oldValue : ?Text,
    newValue : ?Text,
    now : Int,
  ) {
    let id = nextId.value.toText();
    nextId.value += 1;
    log.add({
      id;
      timestamp = now;
      actorId;
      actionType;
      resourceId;
      resourceType;
      oldValue;
      newValue;
      details;
    });
  };

  /// Return paginated entries, newest first.
  public func getEntries(log : List.List<AuditEntry>, limit : Nat, offset : Nat) : [AuditEntry] {
    let reversed = log.reverse();
    reversed.sliceToArray(offset, offset + limit);
  };

  /// Return paginated entries for a specific actor, newest first.
  public func getEntriesByActor(
    log : List.List<AuditEntry>,
    actorId : Text,
    limit : Nat,
    offset : Nat,
  ) : [AuditEntry] {
    let filtered = log.filter(func(e : AuditEntry) : Bool { e.actorId == actorId }).reverse();
    filtered.sliceToArray(offset, offset + limit);
  };

  /// Return paginated entries for a specific action type, newest first.
  public func getEntriesByAction(
    log : List.List<AuditEntry>,
    actionType : Text,
    limit : Nat,
    offset : Nat,
  ) : [AuditEntry] {
    let filtered = log.filter(func(e : AuditEntry) : Bool { e.actionType == actionType }).reverse();
    filtered.sliceToArray(offset, offset + limit);
  };

  /// Return paginated entries within a timestamp range [from, to], newest first.
  public func getEntriesByDateRange(
    log : List.List<AuditEntry>,
    from : Int,
    to : Int,
    limit : Nat,
    offset : Nat,
  ) : [AuditEntry] {
    let filtered = log.filter(func(e : AuditEntry) : Bool {
      e.timestamp >= from and e.timestamp <= to
    }).reverse();
    filtered.sliceToArray(offset, offset + limit);
  };
};
