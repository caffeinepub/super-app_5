import Map "mo:core/Map";
import FeaturedLib "../lib/featured";
import Types "../types/featured";

mixin (featured : Map.Map<Types.Category, [Text]>) {

  /// Returns featured item IDs for the given category.
  /// Category is one of: "shop", "delivery", "service".
  public shared query func getFeaturedIds(category : Text) : async [Text] {
    FeaturedLib.getFeaturedIds(featured, category);
  };
};
