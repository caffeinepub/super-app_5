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
import SecurityTypes "types/security";
import AuditTypes "types/audit";
import ReferralTypes "types/referral";
import Common "types/common";
import ProductTypes "types/products";
import ShopOwnerTypes "types/shop-owner";
import ProfilesApi "mixins/profiles-api";
import FeaturedApi "mixins/featured-api";
import AdminApi "mixins/admin-api";
import OrdersApi "mixins/orders-api";
import RolesApi "mixins/roles-api";
import CommissionPaymentWalletApi "mixins/commission-payment-wallet-api";
import SellerDashboardApi "mixins/seller-dashboard-api";
import SecurityApi "mixins/security-api";
import AuditApi "mixins/audit-api";
import ReferralApi "mixins/referral-api";
import ProductsApi "mixins/products-api";

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

  // State for security (login lockout + OTP)
  let lockouts = Map.empty<Text, SecurityTypes.LockoutRecord>();
  let otps = Map.empty<Text, SecurityTypes.OtpRecord>();

  // State for per-seller withdrawal limits (key = sellerId Text, value = limit Float)
  let sellerLimits = Map.empty<Text, Float>();

  // State for audit log (append-only, immutable entries)
  let auditLog = List.empty<AuditTypes.AuditEntry>();
  let auditCounter : { var value : Nat } = { var value = 0 };

  // State for referral system
  let referrals = List.empty<ReferralTypes.ReferralRecord>();
  let userToCode = Map.empty<Text, Text>();
  let codeToUser = Map.empty<Text, Text>();
  let referralCounter : { var value : Nat } = { var value = 0 };

  // State for products and shop owner profiles
  let productsMap = Map.empty<Text, ProductTypes.Product>();
  let shopOwnersMap = Map.empty<ProductTypes.UserId, ShopOwnerTypes.ShopOwnerProfile>();

  // Existing mixins — unchanged
  include ProfilesApi(profiles);
  include FeaturedApi(featured);
  include AdminApi(adminState, featured, lockouts);

  // Role and order mixins (roles-api now receives audit state)
  include RolesApi(roles, auditLog, auditCounter);
  include OrdersApi(orders, roles);

  // Commission, payment, and wallet mixin (now receives audit state + sellerLimits)
  include CommissionPaymentWalletApi(
    payments,
    withdrawals,
    wallets,
    commissions,
    counters,
    roles,
    orders,
    auditLog,
    auditCounter,
    sellerLimits,
  );

  // Seller dashboard mixin
  include SellerDashboardApi(orders, commissions, wallets);

  // Security mixin (login lockout + OTP)
  include SecurityApi(lockouts, otps);

  // Audit log mixin
  include AuditApi(auditLog, auditCounter);

  // Referral mixin
  include ReferralApi(referrals, userToCode, codeToUser, referralCounter, wallets);

  // Products and shop owner profile mixin
  include ProductsApi(productsMap, shopOwnersMap, roles);
};
