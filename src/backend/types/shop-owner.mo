import CommonTypes "common";

module {
  public type UserId = CommonTypes.UserId;
  public type Timestamp = CommonTypes.Timestamp;

  public type ShopOwnerProfile = {
    userId : UserId;
    shopName : Text;
    shopDescription : Text;
    updatedAt : Timestamp;
  };
};
