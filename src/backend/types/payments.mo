import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;

  /// Bangladesh mobile payment methods supported by the platform.
  public type PaymentMethod = {
    #bKash;
    #Nagad;
  };

  /// Lifecycle status of a manual payment submission.
  public type PaymentStatus = {
    #Pending;
    #Approved;
    #Rejected;
  };

  /// Mutable counters for auto-increment IDs shared across the payment/wallet domain.
  public type Counters = {
    var nextPaymentId : Nat;
    var nextWithdrawId : Nat;
    var nextCommissionId : Nat;
  };

  /// Full record of a payment submission tied to an order.
  /// commission = amount * 0.10 (10% system-wide rate)
  /// sellerEarnings = amount - commission
  public type PaymentRecord = {
    id : Nat;
    orderId : Nat;
    userId : UserId;
    method : PaymentMethod;
    transactionId : Text;
    amount : Float;
    commission : Float;
    sellerEarnings : Float;
    status : PaymentStatus;
    submittedAt : Timestamp;
    reviewedAt : ?Timestamp;
  };
};
