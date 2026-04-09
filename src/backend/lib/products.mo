import Map "mo:core/Map";
import Int "mo:core/Int";
import ProductTypes "../types/products";
import ShopOwnerTypes "../types/shop-owner";

module {
  public type Product = ProductTypes.Product;
  public type ShopOwnerProfile = ShopOwnerTypes.ShopOwnerProfile;
  public type UserId = ProductTypes.UserId;

  // --- Products ---

  public func addProduct(
    products : Map.Map<Text, Product>,
    product : Product,
  ) {
    products.add(product.id, product);
  };

  public func updateProduct(
    products : Map.Map<Text, Product>,
    product : Product,
  ) {
    products.add(product.id, product);
  };

  public func deleteProduct(
    products : Map.Map<Text, Product>,
    id : Text,
  ) {
    products.remove(id);
  };

  public func getAllProducts(
    products : Map.Map<Text, Product>,
  ) : [Product] {
    let all = products.values().toArray();
    // Sort by createdAt descending (newest first)
    all.sort(func(a : Product, b : Product) : { #less; #equal; #greater } {
      Int.compare(b.createdAt, a.createdAt)
    });
  };

  public func getProductById(
    products : Map.Map<Text, Product>,
    id : Text,
  ) : ?Product {
    products.get(id);
  };

  public func getProductsBySeller(
    products : Map.Map<Text, Product>,
    sellerId : UserId,
  ) : [Product] {
    products.values().filter(func(p : Product) : Bool {
      p.sellerId == sellerId
    }).toArray();
  };

  // --- Shop Owner Profiles ---

  public func updateShopOwnerProfile(
    shopOwners : Map.Map<UserId, ShopOwnerProfile>,
    profile : ShopOwnerProfile,
  ) {
    shopOwners.add(profile.userId, profile);
  };

  public func getShopOwnerProfile(
    shopOwners : Map.Map<UserId, ShopOwnerProfile>,
    userId : UserId,
  ) : ?ShopOwnerProfile {
    shopOwners.get(userId);
  };
};
