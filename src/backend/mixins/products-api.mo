import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import ProductTypes "../types/products";
import ShopOwnerTypes "../types/shop-owner";
import ProductLib "../lib/products";
import RoleTypes "../types/roles";
import RolesLib "../lib/roles";

mixin (
  products : Map.Map<Text, ProductTypes.Product>,
  shopOwners : Map.Map<ProductTypes.UserId, ShopOwnerTypes.ShopOwnerProfile>,
  roles : Map.Map<RoleTypes.UserId, RoleTypes.UserRole>,
) {

  // --- Admin-only mutations ---

  public shared ({ caller }) func addProduct(product : ProductTypes.Product) : async () {
    if (not RolesLib.isAdmin(roles, caller)) {
      return Runtime.trap("Unauthorized: admin only");
    };
    let now = Time.now();
    let stamped : ProductTypes.Product = {
      product with
      createdAt = now;
      updatedAt = now;
    };
    ProductLib.addProduct(products, stamped);
  };

  public shared ({ caller }) func updateProduct(product : ProductTypes.Product) : async () {
    if (not RolesLib.isAdmin(roles, caller)) {
      return Runtime.trap("Unauthorized: admin only");
    };
    let now = Time.now();
    let stamped : ProductTypes.Product = { product with updatedAt = now };
    ProductLib.updateProduct(products, stamped);
  };

  public shared ({ caller }) func deleteProduct(id : Text) : async () {
    if (not RolesLib.isAdmin(roles, caller)) {
      return Runtime.trap("Unauthorized: admin only");
    };
    ProductLib.deleteProduct(products, id);
  };

  // --- Public queries ---

  public query func getAllProducts() : async [ProductTypes.Product] {
    ProductLib.getAllProducts(products);
  };

  public query func getProductById(id : Text) : async ?ProductTypes.Product {
    ProductLib.getProductById(products, id);
  };

  public query func getProductsBySeller(sellerId : ProductTypes.UserId) : async [ProductTypes.Product] {
    ProductLib.getProductsBySeller(products, sellerId);
  };

  // --- Shop owner profile ---

  public shared ({ caller }) func updateShopOwnerProfile(profile : ShopOwnerTypes.ShopOwnerProfile) : async () {
    // Caller can update their own profile; admin can update any
    if (
      not Principal.equal(caller, profile.userId) and
      not RolesLib.isAdmin(roles, caller)
    ) {
      return Runtime.trap("Unauthorized: can only update own profile");
    };
    let now = Time.now();
    let stamped : ShopOwnerTypes.ShopOwnerProfile = { profile with updatedAt = now };
    ProductLib.updateShopOwnerProfile(shopOwners, stamped);
  };

  public query func getShopOwnerProfile(userId : ProductTypes.UserId) : async ?ShopOwnerTypes.ShopOwnerProfile {
    ProductLib.getShopOwnerProfile(shopOwners, userId);
  };
};
