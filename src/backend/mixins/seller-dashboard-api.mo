import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import OrderTypes "../types/orders";
import WalletTypes "../types/wallet";
import Common "../types/common";
import SellerDashboardTypes "../types/seller-dashboard";

/// Public API mixin for the seller dashboard domain.
///
/// Approach for getMySellerOrders:
///   The Order model has no sellerId on items — orders belong to the buying user.
///   CommissionRecord is written per approved payment and carries sellerId + orderId.
///   We use commission records to identify which order IDs belong to the calling seller,
///   then fetch those orders from the orders list.  If a seller has no commission records
///   yet (e.g. no approved payments) the result is an empty list — this is correct behaviour.
mixin (
  orders : List.List<OrderTypes.Order>,
  commissions : List.List<WalletTypes.CommissionRecord>,
  wallets : Map.Map<Common.UserId, WalletTypes.SellerWallet>,
) {

  // ── Seller order history ─────────────────────────────────────────────────

  /// Returns all orders that contain products sold by the calling seller.
  /// Determined by finding commission records where sellerId == caller,
  /// collecting the unique orderIds, then fetching those orders.
  public shared query ({ caller }) func getMySellerOrders() : async [OrderTypes.Order] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    // Collect unique order IDs from commission records for this seller
    let orderIdSet = Map.empty<Nat, Bool>();
    commissions.forEach(func(c) {
      if (c.sellerId == caller) {
        orderIdSet.add(c.orderId, true);
      };
    });
    // Return the matching orders
    orders.filter(func(o) {
      switch (orderIdSet.get(o.id)) {
        case (?_) true;
        case null false;
      };
    }).toArray();
  };

  // ── Product performance stats ────────────────────────────────────────────

  /// Returns per-product aggregated sales stats for the calling seller.
  /// Looks back `days` days (0 = all time).
  /// Uses commission records (which carry productId and amount) for the caller.
  public shared query ({ caller }) func getMyProductStats(days : Nat) : async [SellerDashboardTypes.SellerProductStat] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    let cutoff : Int = cutoffFromDays(days);
    // Map productId -> (salesCount, grossRevenue, commissionDeducted)
    let statsMap = Map.empty<Text, (Nat, Float, Float)>();
    commissions.forEach(func(c) {
      if (c.sellerId == caller and (days == 0 or c.timestamp >= cutoff)) {
        // Reconstruct gross: commission = gross * rate, so gross = commission / rate
        let gross : Float = if (c.rate > 0.0) c.amount / c.rate else 0.0;
        let prev = switch (statsMap.get(c.productId)) {
          case (?(cnt, rev, comm)) (cnt, rev, comm);
          case null (0, 0.0, 0.0);
        };
        statsMap.add(c.productId, (prev.0 + 1, prev.1 + gross, prev.2 + c.amount));
      };
    });
    let result = statsMap.toArray();
    result.map<(Text, (Nat, Float, Float)), SellerDashboardTypes.SellerProductStat>(
      func((pid, (cnt, gross, comm))) {
        {
          productId = pid;
          productName = pid; // productName falls back to productId — no product catalogue in scope
          salesCount = cnt;
          totalRevenue = gross;
          commissionDeducted = comm;
          netRevenue = gross - comm;
        };
      }
    );
  };

  // ── Earnings summary ─────────────────────────────────────────────────────

  /// Returns the earnings summary for the calling seller.
  /// `days` = 0 means all-time; otherwise restricts commission lookback.
  /// Wallet totals (withdrawn, balance) are always all-time from the wallet record.
  public shared query ({ caller }) func getMyEarningsSummary(days : Nat) : async SellerDashboardTypes.SellerDashboardSummary {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    let cutoff : Int = cutoffFromDays(days);
    var grossRevenue : Float = 0.0;
    var commissionDeducted : Float = 0.0;
    commissions.forEach(func(c) {
      if (c.sellerId == caller and (days == 0 or c.timestamp >= cutoff)) {
        let gross : Float = if (c.rate > 0.0) c.amount / c.rate else 0.0;
        grossRevenue += gross;
        commissionDeducted += c.amount;
      };
    });
    let netEarnings = grossRevenue - commissionDeducted;
    // Wallet provides lifetime totals for withdrawn and balance
    let wallet = switch (wallets.get(caller)) {
      case (?w) w;
      case null ({ sellerId = caller; totalEarnings = 0.0; totalWithdrawn = 0.0; pendingWithdrawal = 0.0 });
    };
    let remainingBalance = wallet.totalEarnings - wallet.totalWithdrawn - wallet.pendingWithdrawal;
    let pLabel : Text = if (days == 0) "All time" else "Last " # days.toText() # " days";
    {
      totalGrossRevenue = grossRevenue;
      totalCommissionDeducted = commissionDeducted;
      totalNetEarnings = netEarnings;
      totalWithdrawn = wallet.totalWithdrawn;
      remainingBalance = remainingBalance;
      periodLabel = pLabel;
    };
  };

  // ── Earnings trend ───────────────────────────────────────────────────────

  /// Returns earnings bucketed by period for trend charts.
  /// granularity: "daily" | "weekly" | "monthly" (default monthly)
  /// days: lookback window (0 = all time, i.e. no cutoff)
  public shared query ({ caller }) func getMyEarningsByPeriod(
    days : Nat,
    granularity : Text,
  ) : async [SellerDashboardTypes.SellerEarningsByPeriod] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    let cutoff : Int = cutoffFromDays(days);
    // Map period label -> (grossRevenue, commissionDeducted)
    let buckets = Map.empty<Text, (Float, Float)>();
    commissions.forEach(func(c) {
      if (c.sellerId == caller and (days == 0 or c.timestamp >= cutoff)) {
        let gross : Float = if (c.rate > 0.0) c.amount / c.rate else 0.0;
         let lbl = periodLabel(c.timestamp, granularity);
        let prev = switch (buckets.get(lbl)) {
          case (?(g, comm)) (g, comm);
          case null (0.0, 0.0);
        };
        buckets.add(lbl, (prev.0 + gross, prev.1 + c.amount));
      };
    });
    let arr = buckets.toArray();
    arr.map<(Text, (Float, Float)), SellerDashboardTypes.SellerEarningsByPeriod>(
      func((lbl2, (gross, comm))) {
        {
          period = lbl2;
          grossRevenue = gross;
          commissionDeducted = comm;
          netRevenue = gross - comm;
        };
      }
    );
  };

  // ── Private helpers ──────────────────────────────────────────────────────

  /// Returns a nanosecond cutoff timestamp for `days` days ago.
  /// Returns 0 (no cutoff) when days == 0.
  func cutoffFromDays(days : Nat) : Int {
    if (days == 0) return 0;
    let dayNs : Int = 86_400 * 1_000_000_000;
    let daysInt : Int = days;
    Time.now() - (daysInt * dayNs);
  };

  /// Bucket a nanosecond timestamp into a human-readable period label.
  func periodLabel(ns : Int, granularity : Text) : Text {
    if (granularity == "daily") {
      timestampToDayLabel(ns);
    } else if (granularity == "weekly") {
      timestampToWeekLabel(ns);
    } else {
      timestampToMonthLabel(ns);
    };
  };

  func timestampToMonthLabel(ns : Int) : Text {
    let secs : Int = ns / 1_000_000_000;
    let days : Int = secs / 86400;
    let (year, month, _) = civilFromDays(days);
    let mText = if (month < 10) "0" # month.toText() else month.toText();
    year.toText() # "-" # mText;
  };

  func timestampToDayLabel(ns : Int) : Text {
    let secs : Int = ns / 1_000_000_000;
    let days : Int = secs / 86400;
    let (year, month, day) = civilFromDays(days);
    let mText = if (month < 10) "0" # month.toText() else month.toText();
    let dText = if (day < 10) "0" # day.toText() else day.toText();
    year.toText() # "-" # mText # "-" # dText;
  };

  func timestampToWeekLabel(ns : Int) : Text {
    let secs : Int = ns / 1_000_000_000;
    let days : Int = secs / 86400;
    let dow : Int = ((days + 3) % 7) + 1;
    let thursDays : Int = days + (4 - dow);
    let (thurY, _, _) = civilFromDays(thursDays);
    let jan4 = daysFromCivil(thurY, 1, 4);
    let jan4Dow : Int = ((jan4 + 3) % 7) + 1;
    let week1Mon : Int = jan4 - (jan4Dow - 1);
    let weekNum : Int = (thursDays - week1Mon) / 7 + 1;
    let wText = if (weekNum < 10) "0" # weekNum.toText() else weekNum.toText();
    thurY.toText() # "-W" # wText;
  };

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

  func daysFromCivil(y : Int, m : Int, d : Int) : Int {
    let y2 : Int = y - (if (m <= 2) 1 else 0);
    let era : Int = (if (y2 >= 0) y2 else y2 - 399) / 400;
    let yoe : Int = y2 - era * 400;
    let m2 : Int = m + (if (m > 2) -3 else 9);
    let doy : Int = (153 * m2 + 2) / 5 + d - 1;
    let doe : Int = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468;
  };
};
