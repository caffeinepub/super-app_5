import Common "common";
import PaymentTypes "payments";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type PaymentMethod = PaymentTypes.PaymentMethod;

  /// Lifecycle status of a seller withdrawal request.
  public type WithdrawStatus = {
    #Pending;
    #Approved;
    #Rejected;
  };

  /// A seller's request to withdraw their earnings via bKash or Nagad.
  public type WithdrawRequest = {
    id : Nat;
    sellerId : UserId;
    amount : Float;
    method : PaymentMethod;
    accountNumber : Text;
    status : WithdrawStatus;
    requestedAt : Timestamp;
    reviewedAt : ?Timestamp;
  };

  /// Running balance for a seller — all amounts in BDT.
  public type SellerWallet = {
    sellerId : UserId;
    totalEarnings : Float;
    totalWithdrawn : Float;
    pendingWithdrawal : Float;
  };

  /// Single commission deduction record for analytics.
  public type CommissionRecord = {
    id : Nat;
    orderId : Nat;
    sellerId : UserId;
    productId : Text;
    amount : Float;
    rate : Float; // always 0.10
    timestamp : Timestamp;
  };

  /// Aggregated commission analytics for the admin dashboard.
  public type CommissionSummary = {
    totalCommission : Float;
    byPeriod : [(Text, Float)]; // e.g. ("2025-03", 1250.0)
    topSellers : [(UserId, Float)];
    topProducts : [(Text, Float)];
  };
};
