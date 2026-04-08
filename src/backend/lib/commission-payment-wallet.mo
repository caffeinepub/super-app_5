import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import PaymentTypes "../types/payments";
import WalletTypes "../types/wallet";
import Common "../types/common";

module {
  public type PaymentRecord = PaymentTypes.PaymentRecord;
  public type PaymentStatus = PaymentTypes.PaymentStatus;
  public type PaymentMethod = PaymentTypes.PaymentMethod;
  public type WithdrawRequest = WalletTypes.WithdrawRequest;
  public type WithdrawStatus = WalletTypes.WithdrawStatus;
  public type SellerWallet = WalletTypes.SellerWallet;
  public type CommissionRecord = WalletTypes.CommissionRecord;
  public type CommissionSummary = WalletTypes.CommissionSummary;
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;

  let COMMISSION_RATE : Float = 0.10;

  // ── Payment helpers ──────────────────────────────────────────────────────

  /// Create a new payment record. Commission is fixed at 10%.
  public func newPayment(
    id : Nat,
    orderId : Nat,
    userId : UserId,
    method : PaymentMethod,
    transactionId : Text,
    amount : Float,
    now : Timestamp,
  ) : PaymentRecord {
    let commission = amount * COMMISSION_RATE;
    {
      id;
      orderId;
      userId;
      method;
      transactionId;
      amount;
      commission;
      sellerEarnings = amount - commission;
      status = #Pending;
      submittedAt = now;
      reviewedAt = null;
    };
  };

  /// Find a payment by ID.
  public func getPayment(payments : List.List<PaymentRecord>, id : Nat) : ?PaymentRecord {
    payments.find(func(p) { p.id == id });
  };

  /// List all payments for a given order.
  public func paymentsForOrder(payments : List.List<PaymentRecord>, orderId : Nat) : [PaymentRecord] {
    payments.filter(func(p) { p.orderId == orderId }).toArray();
  };

  /// List all payments for a given user.
  public func paymentsForUser(payments : List.List<PaymentRecord>, userId : UserId) : [PaymentRecord] {
    payments.filter(func(p) { p.userId == userId }).toArray();
  };

  /// Update payment status (admin approve/reject).
  public func updatePaymentStatus(payments : List.List<PaymentRecord>, id : Nat, status : PaymentStatus, now : Timestamp) {
    switch (payments.findIndex(func(p) { p.id == id })) {
      case null {};
      case (?idx) {
        let p = payments.at(idx);
        payments.put(idx, { p with status; reviewedAt = ?now });
      };
    };
  };

  // ── Withdrawal helpers ───────────────────────────────────────────────────

  /// Create a new withdrawal request.
  public func newWithdrawRequest(
    id : Nat,
    sellerId : UserId,
    amount : Float,
    method : PaymentMethod,
    accountNumber : Text,
    now : Timestamp,
  ) : WithdrawRequest {
    {
      id;
      sellerId;
      amount;
      method;
      accountNumber;
      status = #Pending;
      requestedAt = now;
      reviewedAt = null;
    };
  };

  /// Find a withdrawal request by ID.
  public func getWithdrawRequest(withdrawals : List.List<WithdrawRequest>, id : Nat) : ?WithdrawRequest {
    withdrawals.find(func(w) { w.id == id });
  };

  /// List all withdrawal requests for a seller.
  public func withdrawalsForSeller(withdrawals : List.List<WithdrawRequest>, sellerId : UserId) : [WithdrawRequest] {
    withdrawals.filter(func(w) { w.sellerId == sellerId }).toArray();
  };

  /// Update withdrawal status (admin approve/reject) and adjust wallet.
  public func updateWithdrawStatus(
    withdrawals : List.List<WithdrawRequest>,
    wallets : Map.Map<UserId, SellerWallet>,
    id : Nat,
    status : WithdrawStatus,
    now : Timestamp,
  ) {
    switch (withdrawals.findIndex(func(w) { w.id == id })) {
      case null {};
      case (?idx) {
        let w = withdrawals.at(idx);
        withdrawals.put(idx, { w with status; reviewedAt = ?now });
        if (status == #Approved) {
          let wallet = getOrCreateWallet(wallets, w.sellerId);
          wallets.add(
            w.sellerId,
            {
              wallet with
              totalWithdrawn = wallet.totalWithdrawn + w.amount;
              pendingWithdrawal = if (wallet.pendingWithdrawal >= w.amount) {
                wallet.pendingWithdrawal - w.amount;
              } else { 0.0 };
            },
          );
        } else if (status == #Rejected) {
          // Release the pending hold back to available balance
          let wallet = getOrCreateWallet(wallets, w.sellerId);
          wallets.add(
            w.sellerId,
            {
              wallet with
              pendingWithdrawal = if (wallet.pendingWithdrawal >= w.amount) {
                wallet.pendingWithdrawal - w.amount;
              } else { 0.0 };
            },
          );
        };
      };
    };
  };

  // ── Wallet helpers ───────────────────────────────────────────────────────

  /// Get or initialise a seller wallet.
  public func getOrCreateWallet(wallets : Map.Map<UserId, SellerWallet>, sellerId : UserId) : SellerWallet {
    switch (wallets.get(sellerId)) {
      case (?w) w;
      case null {
        let empty : SellerWallet = {
          sellerId;
          totalEarnings = 0.0;
          totalWithdrawn = 0.0;
          pendingWithdrawal = 0.0;
        };
        wallets.add(sellerId, empty);
        empty;
      };
    };
  };

  /// Credit seller earnings (called when a payment is approved).
  public func creditEarnings(wallets : Map.Map<UserId, SellerWallet>, sellerId : UserId, amount : Float) {
    let wallet = getOrCreateWallet(wallets, sellerId);
    wallets.add(sellerId, { wallet with totalEarnings = wallet.totalEarnings + amount });
  };

  // ── Commission helpers ───────────────────────────────────────────────────

  /// Create a commission record for a completed payment.
  public func newCommissionRecord(
    id : Nat,
    orderId : Nat,
    sellerId : UserId,
    productId : Text,
    orderAmount : Float,
    now : Timestamp,
  ) : CommissionRecord {
    {
      id;
      orderId;
      sellerId;
      productId;
      amount = orderAmount * COMMISSION_RATE;
      rate = COMMISSION_RATE;
      timestamp = now;
    };
  };

  /// Aggregate commission records into a summary for the admin dashboard.
  public func buildCommissionSummary(commissions : List.List<CommissionRecord>) : CommissionSummary {
    let totalCommission = commissions.foldLeft(0.0, func(acc : Float, c : CommissionRecord) : Float { acc + c.amount });

    // Build seller totals map
    let sellerMap = Map.empty<UserId, Float>();
    commissions.forEach(func(c) {
      let prev = switch (sellerMap.get(c.sellerId)) { case (?v) v; case null 0.0 };
      sellerMap.add(c.sellerId, prev + c.amount);
    });

    // Build product totals map
    let productMap = Map.empty<Text, Float>();
    commissions.forEach(func(c) {
      let prev = switch (productMap.get(c.productId)) { case (?v) v; case null 0.0 };
      productMap.add(c.productId, prev + c.amount);
    });

    let topSellers = sellerMap.toArray();
    let topProducts = productMap.toArray();

    // Build period data (monthly) for all commission records
    let periodMap = Map.empty<Text, Float>();
    commissions.forEach(func(c) {
      let monthKey = timestampToMonthLabel(c.timestamp);
      let prev = switch (periodMap.get(monthKey)) { case (?v) v; case null 0.0 };
      periodMap.add(monthKey, prev + c.amount);
    });
    let byPeriod = periodMap.toArray();

    { totalCommission; byPeriod; topSellers; topProducts };
  };

  /// Return commission data bucketed by month for the last N months.
  public func commissionByMonth(commissions : List.List<CommissionRecord>, months : Nat) : [(Text, Float)] {
    let cap = if (months > 12) 12 else months;
    let nowNs : Int = Time.now();
    // 30-day approximation in nanoseconds
    let monthNs : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let cutoff : Int = nowNs - (cap.toInt() * monthNs);

    let periodMap = Map.empty<Text, Float>();
    commissions.forEach(func(c) {
      if (c.timestamp >= cutoff) {
        let monthKey = timestampToMonthLabel(c.timestamp);
        let prev = switch (periodMap.get(monthKey)) { case (?v) v; case null 0.0 };
        periodMap.add(monthKey, prev + c.amount);
      };
    });
    periodMap.toArray();
  };

  /// Return top N sellers sorted by commission desc.
  public func topSellersN(commissions : List.List<CommissionRecord>, limit : Nat) : [(UserId, Float)] {
    let sellerMap = Map.empty<UserId, Float>();
    commissions.forEach(func(c) {
      let prev = switch (sellerMap.get(c.sellerId)) { case (?v) v; case null 0.0 };
      sellerMap.add(c.sellerId, prev + c.amount);
    });
    let arr = sellerMap.toArray();
    let sorted = sortPairsByValueDesc(arr);
    if (sorted.size() <= limit) sorted
    else sorted.sliceToArray(0, limit);
  };

  /// Return top N products sorted by commission desc.
  public func topProductsN(commissions : List.List<CommissionRecord>, limit : Nat) : [(Text, Float)] {
    let productMap = Map.empty<Text, Float>();
    commissions.forEach(func(c) {
      let prev = switch (productMap.get(c.productId)) { case (?v) v; case null 0.0 };
      productMap.add(c.productId, prev + c.amount);
    });
    let arr = productMap.toArray();
    let sorted = sortPairsByValueDesc(arr);
    if (sorted.size() <= limit) sorted
    else sorted.sliceToArray(0, limit);
  };

  /// Return commission data bucketed by day ("YYYY-MM-DD") for the last N days (max 365).
  public func commissionByDay(commissions : List.List<CommissionRecord>, days : Nat) : [(Text, Float)] {
    let cap = if (days > 365) 365 else days;
    let dayNs : Int = 86_400 * 1_000_000_000;
    let nowNs : Int = Time.now();
    let cutoff : Int = nowNs - (cap.toInt() * dayNs);

    let buckets = Map.empty<Text, Float>();
    commissions.forEach(func(c) {
      if (c.timestamp >= cutoff) {
        let key = timestampToDayLabel(c.timestamp);
        let prev = switch (buckets.get(key)) { case (?v) v; case null 0.0 };
        buckets.add(key, prev + c.amount);
      };
    });
    buckets.toArray();
  };

  /// Return commission data bucketed by ISO week ("YYYY-Www") for the last N weeks (max 52).
  public func commissionByWeek(commissions : List.List<CommissionRecord>, weeks : Nat) : [(Text, Float)] {
    let cap = if (weeks > 52) 52 else weeks;
    let weekNs : Int = 7 * 86_400 * 1_000_000_000;
    let nowNs : Int = Time.now();
    let cutoff : Int = nowNs - (cap.toInt() * weekNs);

    let buckets = Map.empty<Text, Float>();
    commissions.forEach(func(c) {
      if (c.timestamp >= cutoff) {
        let key = timestampToWeekLabel(c.timestamp);
        let prev = switch (buckets.get(key)) { case (?v) v; case null 0.0 };
        buckets.add(key, prev + c.amount);
      };
    });
    buckets.toArray();
  };

  // ── Private helpers ──────────────────────────────────────────────────────

  /// Sort [(K, Float)] pairs by Float value descending.
  func sortPairsByValueDesc<K>(arr : [(K, Float)]) : [(K, Float)] {
    arr.sort(func(a, b) {
      if (b.1 > a.1) #less else if (b.1 < a.1) #greater else #equal
    });
  };

  /// Convert a nanosecond timestamp to a "YYYY-MM-DD" label.
  func timestampToDayLabel(ns : Int) : Text {
    let secs : Int = ns / 1_000_000_000;
    let days : Int = secs / 86400;
    let (year, month, day) = civilFromDays(days);
    let mText = if (month < 10) "0" # month.toText() else month.toText();
    let dText = if (day < 10) "0" # day.toText() else day.toText();
    year.toText() # "-" # mText # "-" # dText;
  };

  /// Convert a nanosecond timestamp to an ISO week label "YYYY-Www".
  func timestampToWeekLabel(ns : Int) : Text {
    let secs : Int = ns / 1_000_000_000;
    let days : Int = secs / 86400;
    // ISO week: Thu = weekday 4 (Mon=1)
    let dow : Int = ((days + 3) % 7) + 1; // Mon=1..Sun=7
    let thursDays : Int = days + (4 - dow);
    let (thurY, _, _) = civilFromDays(thursDays);
    // Day of year for Jan 4 of thurY (Jan 4 is always in week 1)
    let jan4 = daysFromCivil(thurY, 1, 4);
    let jan4Dow : Int = ((jan4 + 3) % 7) + 1;
    let week1Mon : Int = jan4 - (jan4Dow - 1);
    let weekNum : Int = (thursDays - week1Mon) / 7 + 1;
    let wText = if (weekNum < 10) "0" # weekNum.toText() else weekNum.toText();
    thurY.toText() # "-W" # wText;
  };

  /// Gregorian calendar: days-since-epoch → (year, month, day).
  func civilFromDays(days : Int) : (Int, Int, Int) {
    let z : Int = days + 719468;
    let era : Int = (if (z >= 0) z else z - 146096) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y0 : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let month : Int = mp + (if (mp < 10) 3 else -9);
    let day : Int = doy - (153 * mp + 2) / 5 + 1;
    let year : Int = y0 + (if (month <= 2) 1 else 0);
    (year, month, day);
  };

  /// Gregorian calendar: (year, month, day) → days-since-epoch.
  func daysFromCivil(y : Int, m : Int, d : Int) : Int {
    let y2 : Int = y - (if (m <= 2) 1 else 0);
    let era : Int = (if (y2 >= 0) y2 else y2 - 399) / 400;
    let yoe : Int = y2 - era * 400;
    let m2 : Int = m + (if (m > 2) -3 else 9);
    let doy : Int = (153 * m2 + 2) / 5 + d - 1;
    let doe : Int = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468;
  };

  /// Convert a nanosecond timestamp to a "YYYY-MM" label.
  func timestampToMonthLabel(ns : Int) : Text {
    // Convert ns → seconds
    let secs : Int = ns / 1_000_000_000;
    // Days since Unix epoch
    let days : Int = secs / 86400;
    // Approximate year and month using integer arithmetic
    // Algorithm: civil_from_days (Gregorian calendar)
    let z : Int = days + 719468;
    let era : Int = (if (z >= 0) z else z - 146096) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let month : Int = mp + (if (mp < 10) 3 else -9);
    let year : Int = y + (if (month <= 2) 1 else 0);

    let yText = year.toText();
    let mText = if (month < 10) "0" # month.toText() else month.toText();
    yText # "-" # mText;
  };
};
