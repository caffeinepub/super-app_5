import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import PaymentTypes "../types/payments";
import WalletTypes "../types/wallet";
import Common "../types/common";
import CommLib "../lib/commission-payment-wallet";
import RolesLib "../lib/roles";
import RoleTypes "../types/roles";
import OrdersLib "../lib/orders";
import OrderTypes "../types/orders";
import AuditLib "../lib/audit";
import AuditTypes "../types/audit";

/// Public API mixin for the commission-payment-wallet domain.
/// Receives only the state slices it needs.
mixin (
  payments : List.List<PaymentTypes.PaymentRecord>,
  withdrawals : List.List<WalletTypes.WithdrawRequest>,
  wallets : Map.Map<Common.UserId, WalletTypes.SellerWallet>,
  commissions : List.List<WalletTypes.CommissionRecord>,
  counters : PaymentTypes.Counters,
  roles : Map.Map<RoleTypes.UserId, RoleTypes.UserRole>,
  orders : List.List<OrderTypes.Order>,
  auditLog : List.List<AuditTypes.AuditEntry>,
  auditCounter : { var value : Nat },
  sellerLimits : Map.Map<Text, Float>,
) {

  // ── Payment submission (buyer) ───────────────────────────────────────────

  /// Submit a manual payment (bKash or Nagad) for an order.
  /// Stores a PaymentRecord with #Pending status; order stays Pending until admin approves.
  public shared ({ caller }) func submitPayment(
    orderId : Nat,
    method : PaymentTypes.PaymentMethod,
    transactionId : Text,
    amount : Float,
  ) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    let id = counters.nextPaymentId;
    counters.nextPaymentId += 1;
    let record = CommLib.newPayment(id, orderId, caller, method, transactionId, amount, Time.now());
    payments.add(record);
    id;
  };

  /// Get a single payment record by ID.
  public query func getPayment(id : Nat) : async ?PaymentTypes.PaymentRecord {
    CommLib.getPayment(payments, id);
  };

  /// List all payments for the calling user.
  public shared query ({ caller }) func myPayments() : async [PaymentTypes.PaymentRecord] {
    CommLib.paymentsForUser(payments, caller);
  };

  // ── Payment verification (admin) ─────────────────────────────────────────

  /// List all pending payments awaiting admin review.
  public shared query ({ caller }) func listPendingPayments() : async [PaymentTypes.PaymentRecord] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    payments.filter(func(p) { p.status == #Pending }).toArray();
  };

  /// List all payment records (admin).
  public shared query ({ caller }) func listAllPayments() : async [PaymentTypes.PaymentRecord] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    payments.toArray();
  };

  /// Approve a payment submission and credit seller earnings.
  /// Also transitions the linked order from #Pending to #Ongoing.
  public shared ({ caller }) func approvePayment(id : Nat) : async Bool {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    switch (CommLib.getPayment(payments, id)) {
      case null false;
      case (?p) {
        let now = Time.now();
        CommLib.updatePaymentStatus(payments, id, #Approved, now);
        // Credit the seller's wallet
        CommLib.creditEarnings(wallets, p.userId, p.sellerEarnings);
        // Create a commission record
        let commRecord = CommLib.newCommissionRecord(
          counters.nextCommissionId,
          p.orderId,
          p.userId,
          "order-" # p.orderId.toText(),
          p.amount,
          now,
        );
        counters.nextCommissionId += 1;
        commissions.add(commRecord);
        // Advance the order to #Ongoing
        ignore OrdersLib.updateOrderStatus(orders, p.orderId, #Ongoing);
        // Audit
        AuditLib.logAction(
          auditLog, auditCounter,
          caller.toText(), AuditTypes.ActionType.APPROVE_PAYMENT,
          id.toText(), "Payment",
          "Payment approved; orderId=" # p.orderId.toText(),
          ?"Pending", ?"Approved", now,
        );
        true;
      };
    };
  };

  /// Reject a payment submission.
  public shared ({ caller }) func rejectPayment(id : Nat) : async Bool {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    switch (CommLib.getPayment(payments, id)) {
      case null false;
      case (?p) {
        let now = Time.now();
        CommLib.updatePaymentStatus(payments, id, #Rejected, now);
        // Audit
        AuditLib.logAction(
          auditLog, auditCounter,
          caller.toText(), AuditTypes.ActionType.REJECT_PAYMENT,
          id.toText(), "Payment",
          "Payment rejected; orderId=" # p.orderId.toText(),
          ?"Pending", ?"Rejected", now,
        );
        true;
      };
    };
  };

  // ── Seller wallet ────────────────────────────────────────────────────────

  /// Get the calling seller's wallet balance.
  public shared query ({ caller }) func myWallet() : async WalletTypes.SellerWallet {
    switch (wallets.get(caller)) {
      case (?w) w;
      case null {
        {
          sellerId = caller;
          totalEarnings = 0.0;
          totalWithdrawn = 0.0;
          pendingWithdrawal = 0.0;
        };
      };
    };
  };

  /// Get any seller's wallet (admin).
  public shared query ({ caller }) func getSellerWallet(sellerId : Common.UserId) : async ?WalletTypes.SellerWallet {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    wallets.get(sellerId);
  };

  // ── Withdrawal requests (seller) ─────────────────────────────────────────

  /// Submit a withdrawal request.
  /// Validates that the requested amount does not exceed available balance.
  public shared ({ caller }) func requestWithdrawal(
    amount : Float,
    method : PaymentTypes.PaymentMethod,
    accountNumber : Text,
  ) : async Nat {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    if (amount <= 0.0) {
      Runtime.trap("Amount must be greater than zero");
    };
    let wallet = CommLib.getOrCreateWallet(wallets, caller);
    let available = wallet.totalEarnings - wallet.totalWithdrawn - wallet.pendingWithdrawal;
    if (amount > available) {
      Runtime.trap("Insufficient balance");
    };
    // Enforce per-seller withdrawal limit when set
    switch (sellerLimits.get(caller.toText())) {
      case (?lim) {
        if (lim > 0.0 and amount > lim) {
          Runtime.trap("Amount exceeds your withdrawal limit");
        };
      };
      case null {};
    };
    // Reserve the amount as pending
    wallets.add(caller, { wallet with pendingWithdrawal = wallet.pendingWithdrawal + amount });

    let id = counters.nextWithdrawId;
    counters.nextWithdrawId += 1;
    let req = CommLib.newWithdrawRequest(id, caller, amount, method, accountNumber, Time.now());
    withdrawals.add(req);
    id;
  };

  /// List the calling seller's withdrawal history.
  public shared query ({ caller }) func myWithdrawals() : async [WalletTypes.WithdrawRequest] {
    CommLib.withdrawalsForSeller(withdrawals, caller);
  };

  // ── Withdrawal management (admin) ────────────────────────────────────────

  /// List all pending withdrawal requests.
  public shared query ({ caller }) func listPendingWithdrawals() : async [WalletTypes.WithdrawRequest] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    withdrawals.filter(func(w) { w.status == #Pending }).toArray();
  };

  /// List all withdrawal requests (admin).
  public shared query ({ caller }) func listAllWithdrawals() : async [WalletTypes.WithdrawRequest] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    withdrawals.toArray();
  };

  /// Approve a withdrawal request and update the seller wallet.
  public shared ({ caller }) func approveWithdrawal(id : Nat) : async Bool {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    switch (CommLib.getWithdrawRequest(withdrawals, id)) {
      case null false;
      case (?w) {
        let now = Time.now();
        CommLib.updateWithdrawStatus(withdrawals, wallets, id, #Approved, now);
        // Audit
        AuditLib.logAction(
          auditLog, auditCounter,
          caller.toText(), AuditTypes.ActionType.APPROVE_WITHDRAWAL,
          id.toText(), "Withdrawal",
          "Withdrawal approved; seller=" # w.sellerId.toText() # " amount=" # debug_show(w.amount),
          ?"Pending", ?"Approved", now,
        );
        true;
      };
    };
  };

  /// Reject a withdrawal request.
  public shared ({ caller }) func rejectWithdrawal(id : Nat) : async Bool {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    switch (CommLib.getWithdrawRequest(withdrawals, id)) {
      case null false;
      case (?w) {
        let now = Time.now();
        CommLib.updateWithdrawStatus(withdrawals, wallets, id, #Rejected, now);
        // Audit
        AuditLib.logAction(
          auditLog, auditCounter,
          caller.toText(), AuditTypes.ActionType.REJECT_WITHDRAWAL,
          id.toText(), "Withdrawal",
          "Withdrawal rejected; seller=" # w.sellerId.toText() # " amount=" # debug_show(w.amount),
          ?"Pending", ?"Rejected", now,
        );
        true;
      };
    };
  };

  // ── Commission analytics (admin) ─────────────────────────────────────────

  /// Get the system-wide commission summary.
  public shared query ({ caller }) func getCommissionSummary() : async WalletTypes.CommissionSummary {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    CommLib.buildCommissionSummary(commissions);
  };

  /// Get commission data bucketed by month for the last N months (max 12).
  public shared query ({ caller }) func getCommissionByMonth(months : Nat) : async [(Text, Float)] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    CommLib.commissionByMonth(commissions, months);
  };

  /// List all raw commission records (admin).
  public shared query ({ caller }) func listCommissions() : async [WalletTypes.CommissionRecord] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    commissions.toArray();
  };

  // ── Extended analytics ───────────────────────────────────────────────────

  /// Get commission data by period filter: "daily" | "weekly" | "monthly".
  /// Returns up to 12 of the most recent periods.
  public shared query ({ caller }) func getCommissionByPeriod(filter : Text) : async [(Text, Float)] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    if (filter == "daily") {
      CommLib.commissionByDay(commissions, 12);
    } else if (filter == "weekly") {
      CommLib.commissionByWeek(commissions, 12);
    } else {
      CommLib.commissionByMonth(commissions, 12);
    };
  };

  /// Get top N sellers ranked by total commission generated (desc).
  public shared query ({ caller }) func getTopSellers(limit : Nat) : async [(Common.UserId, Float)] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    CommLib.topSellersN(commissions, limit);
  };

  /// Get top N products ranked by total commission generated (desc).
  public shared query ({ caller }) func getTopProducts(limit : Nat) : async [(Text, Float)] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    CommLib.topProductsN(commissions, limit);
  };

  // ── Admin stats for notification badges ─────────────────────────────────

  /// Returns pending counts for notification badges (admin only).
  public shared query ({ caller }) func getAdminStats() : async {
    pendingPayments : Nat;
    pendingWithdrawals : Nat;
    newOrders : Nat;
  } {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    let pendingPayments = payments.filter(func(p) { p.status == #Pending }).size();
    let pendingWithdrawals = withdrawals.filter(func(w) { w.status == #Pending }).size();
    let newOrders = orders.filter(func(o) { o.status == #Pending }).size();
    { pendingPayments; pendingWithdrawals; newOrders };
  };

  // ── Per-seller withdrawal limits (admin) ─────────────────────────────────

  /// Set or update the withdrawal limit for a specific seller (admin only).
  /// Pass limit = 0.0 to remove the cap (unlimited).
  public shared ({ caller }) func setSellerWithdrawalLimit(sellerId : Text, limit : Float) : async () {
    Runtime.trap("not implemented");
  };

  /// Get the withdrawal limit for a specific seller. Returns null if no limit is set.
  public query func getSellerWithdrawalLimit(sellerId : Text) : async ?Float {
    Runtime.trap("not implemented");
  };

  /// Get all seller-specific withdrawal limits (admin).
  public shared query ({ caller }) func getAllSellerLimits() : async [(Text, Float)] {
    Runtime.trap("not implemented");
  };
};
