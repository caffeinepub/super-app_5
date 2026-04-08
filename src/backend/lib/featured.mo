import Map "mo:core/Map";
import Types "../types/featured";

module {
  public type FeaturedStore = Map.Map<Types.Category, [Text]>;

  /// Returns featured item IDs for the given category.
  /// Returns an empty array if the category has no featured items.
  public func getFeaturedIds(
    store : FeaturedStore,
    category : Types.Category,
  ) : [Text] {
    switch (store.get(category)) {
      case (?ids) ids;
      case null [];
    };
  };

  /// Sets featured item IDs for the given category.
  public func setFeaturedIds(
    store : FeaturedStore,
    category : Types.Category,
    ids : [Text],
  ) {
    store.add(category, ids);
  };

  /// Seeds default empty entries for the three built-in categories.
  public func initDefaults(store : FeaturedStore) {
    store.add("shop", []);
    store.add("delivery", []);
    store.add("service", []);
  };
};
