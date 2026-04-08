import Map "mo:core/Map";
import List "mo:core/List";
import ProfileTypes "types/profiles";
import ProfilesLib "lib/profiles";
import FeaturedTypes "types/featured";
import AdminTypes "types/admin";
import AdminLib "lib/admin";
import OrderTypes "types/orders";
import RoleTypes "types/roles";
import ProfilesApi "mixins/profiles-api";
import FeaturedApi "mixins/featured-api";
import AdminApi "mixins/admin-api";
import OrdersApi "mixins/orders-api";
import RolesApi "mixins/roles-api";

actor {
  // Existing state — unchanged
  let profiles = Map.empty<ProfileTypes.UserId, ProfilesLib.UserProfile>();
  let featured = Map.empty<FeaturedTypes.Category, [Text]>();
  let adminState : AdminTypes.AdminState = AdminLib.empty();

  // New state for roles
  let roles = Map.empty<RoleTypes.UserId, RoleTypes.UserRole>();

  // New state for orders
  let orders = List.empty<OrderTypes.Order>();

  // Existing mixins — unchanged
  include ProfilesApi(profiles);
  include FeaturedApi(featured);
  include AdminApi(adminState, featured);

  // New mixins
  include RolesApi(roles);
  include OrdersApi(orders, roles);
};
