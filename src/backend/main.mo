import Map "mo:core/Map";
import List "mo:core/List";
import ProfileTypes "types/profiles";
import ProfilesLib "lib/profiles";
import FeaturedTypes "types/featured";
import AdminTypes "types/admin";
import AdminLib "lib/admin";
import OrderTypes "types/orders";
import RoleTypes "types/roles";
import PaymentTypes "types/payments";
import WalletTypes "types/wallet";
import Common "types/common";
import ProfilesApi "mixins/profiles-api";
import FeaturedApi "mixins/featured-api";
import AdminApi "mixins/admin-api";
import OrdersApi "mixins/orders-api";
import RolesApi "mixins/roles-api";
import CommissionPaymentWalletApi "mixins/commission-payment-wallet-api";

actor {
  // Existing state — unchanged
  let profiles = Map.empty<ProfileTypes.UserId, ProfilesLib.UserProfile>();
  let featured = Map.empty<FeaturedTypes.Category, [Text]>();
  let adminState : AdminTypes.AdminState = AdminLib.empty();

  // State for roles
  let roles = Map.empty<RoleTypes.UserId, RoleTypes.UserRole>();

  // State for orders
  let orders = List.empty<OrderTypes.Order>();

  // State for payments, withdrawals, wallets, and commissions
  let payments = List.empty<PaymentTypes.PaymentRecord>();
  let withdrawals = List.empty<WalletTypes.WithdrawRequest>();
  let wallets = Map.empty<Common.UserId, WalletTypes.SellerWallet>();
  let commissions = List.empty<WalletTypes.CommissionRecord>();
  let counters : PaymentTypes.Counters = {
    var nextPaymentId = 0;
    var nextWithdrawId = 0;
    var nextCommissionId = 0;
  };

  // Existing mixins — unchanged
  include ProfilesApi(profiles);
  include FeaturedApi(featured);
  include AdminApi(adminState, featured);

  // Role and order mixins
  include RolesApi(roles);
  include OrdersApi(orders, roles);

  // Commission, payment, and wallet mixin
  include CommissionPaymentWalletApi(
    payments,
    withdrawals,
    wallets,
    commissions,
    counters,
    roles,
    orders,
  );
};
