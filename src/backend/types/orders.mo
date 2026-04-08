import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;

  public type OrderStatus = {
    #Pending;
    #Ongoing;
    #Delivered;
  };

  public type OrderItem = {
    name : Text;
    qty : Nat;
    price : Float;
  };

  /// Internal order record stored in canister state.
  public type Order = {
    id : Nat;
    userId : UserId;
    items : [OrderItem];
    status : OrderStatus;
    date : Timestamp;
    total : Float;
  };
};
