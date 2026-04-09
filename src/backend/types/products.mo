import CommonTypes "common";

module {
  public type UserId = CommonTypes.UserId;
  public type Timestamp = CommonTypes.Timestamp;

  public type StockStatus = Text; // "in_stock" | "out_of_stock" | "limited"

  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    images : [Text];
    sellerId : UserId;
    sellerName : Text;
    shopName : Text;
    shopDescription : Text;
    subcategory : Text;
    price : Float;
    stockStatus : StockStatus;
    rating : Float;
    reviewCount : Nat;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };
};
