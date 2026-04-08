import List "mo:core/List";
import Types "../types/orders";

module {
  public type Order = Types.Order;
  public type OrderItem = Types.OrderItem;
  public type OrderStatus = Types.OrderStatus;
  public type OrderStore = List.List<Order>;

  /// Returns a new empty order ID counter starting at 0.
  public func emptyCounter() : Nat { 0 };

  /// Creates a new order and appends it to the store.
  /// Returns the newly created order.
  public func createOrder(
    store : OrderStore,
    nextId : Nat,
    userId : Types.UserId,
    items : [OrderItem],
    now : Types.Timestamp,
  ) : Order {
    let total : Float = items.foldLeft(
      0.0,
      func(acc : Float, item : OrderItem) : Float { acc + item.price * item.qty.toFloat() },
    );
    let order : Order = {
      id = nextId;
      userId;
      items;
      status = #Pending;
      date = now;
      total;
    };
    store.add(order);
    order;
  };

  /// Returns all orders belonging to the given user.
  public func getOrdersByUser(
    store : OrderStore,
    userId : Types.UserId,
  ) : [Order] {
    store.filter(func(o) { o.userId == userId }).toArray();
  };

  /// Returns every order in the store (admin view).
  public func getAllOrders(store : OrderStore) : [Order] {
    store.toArray();
  };

  /// Updates the status of an order identified by orderId.
  /// Returns #err if the order does not exist.
  public func updateOrderStatus(
    store : OrderStore,
    orderId : Nat,
    newStatus : OrderStatus,
  ) : { #ok; #err : Text } {
    switch (store.findIndex(func(o) { o.id == orderId })) {
      case null #err("Order not found");
      case (?idx) {
        let order = store.at(idx);
        store.put(idx, { order with status = newStatus });
        #ok;
      };
    };
  };
};
