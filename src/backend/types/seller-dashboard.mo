module {
  /// Per-product sales aggregation for a seller's dashboard.
  public type SellerProductStat = {
    productId : Text;
    productName : Text;
    salesCount : Nat;
    totalRevenue : Float;
    commissionDeducted : Float;
    netRevenue : Float;
  };

  /// High-level earnings summary for a seller over a given period.
  public type SellerDashboardSummary = {
    totalGrossRevenue : Float;
    totalCommissionDeducted : Float;
    totalNetEarnings : Float;
    totalWithdrawn : Float;
    remainingBalance : Float;
    periodLabel : Text;
  };

  /// Single time-bucket of earnings for trend charts.
  public type SellerEarningsByPeriod = {
    period : Text;
    grossRevenue : Float;
    commissionDeducted : Float;
    netRevenue : Float;
  };
};
