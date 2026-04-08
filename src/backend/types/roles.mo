import Common "common";

module {
  public type UserId = Common.UserId;

  public type UserRole = {
    #Customer;
    #Seller;
    #Admin;
  };

  /// Role assignment record stored per user.
  public type RoleRecord = {
    userId : UserId;
    role : UserRole;
  };
};
