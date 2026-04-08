import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import OrdersLib "../lib/orders";
import RolesLib "../lib/roles";
import OrderTypes "../types/orders";
import RoleTypes "../types/roles";

mixin (
  orders : List.List<OrderTypes.Order>,
  roles : Map.Map<RoleTypes.UserId, RoleTypes.UserRole>,
) {
  var nextOrderId : Nat = 0;

  /// Creates a new order for the calling user.
  /// Returns the created order.
  public shared ({ caller }) func createOrder(
    items : [OrderTypes.OrderItem]
  ) : async OrderTypes.Order {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous caller not allowed");
    };
    let order = OrdersLib.createOrder(orders, nextOrderId, caller, items, Time.now());
    nextOrderId += 1;
    order;
  };

  /// Returns all orders for the calling user.
  public shared query ({ caller }) func getMyOrders() : async [OrderTypes.Order] {
    OrdersLib.getOrdersByUser(orders, caller);
  };

  /// Admin-only: returns all orders from all users.
  /// Traps if caller does not have the #Admin role.
  public shared query ({ caller }) func getAllOrders() : async [OrderTypes.Order] {
    if (not RolesLib.isAdmin(roles, caller)) {
      Runtime.trap("Unauthorized: Admin role required");
    };
    OrdersLib.getAllOrders(orders);
  };

  /// Admin-only: updates the status of an order.
  /// Returns #err if caller does not have the #Admin role or order not found.
  public shared ({ caller }) func updateOrderStatus(
    orderId : Nat,
    status : OrderTypes.OrderStatus,
  ) : async { #ok; #err : Text } {
    if (not RolesLib.isAdmin(roles, caller)) {
      return #err("Unauthorized: Admin role required");
    };
    OrdersLib.updateOrderStatus(orders, orderId, status);
  };
};
