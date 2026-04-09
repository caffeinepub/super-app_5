import { Link } from "@tanstack/react-router";
import {
  Filter,
  Loader2,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
} from "lucide-react";
import { useState } from "react";
import { shopItems } from "../data/shopItems";
import { useCart } from "../hooks/useCart";
import { useFeaturedIds } from "../hooks/useFeaturedIds";
import { useAllProducts } from "../hooks/useProducts";
import type { BackendProduct, ShopItem } from "../types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={
            s <= Math.round(rating)
              ? "text-secondary fill-secondary"
              : "text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

function StockBadge({ inStock }: { inStock: boolean }) {
  return inStock ? (
    <span className="stock-in">
      <span className="w-1.5 h-1.5 rounded-full bg-chart-3 inline-block" />
      In Stock
    </span>
  ) : (
    <span className="stock-out">Out of Stock</span>
  );
}

function SellerBadge({ name }: { name: string }) {
  if (!name) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary/80 bg-primary/8 border border-primary/15 rounded-full px-2 py-0.5 mt-1 truncate max-w-full">
      <Store size={9} className="shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

function ProductCard({
  item,
  isFeatured,
  onAddToCart,
}: {
  item: ShopItem;
  isFeatured: boolean;
  onAddToCart: (item: ShopItem) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="group relative product-card"
      data-ocid={`product-${item.id}`}
    >
      {isFeatured && (
        <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-body font-semibold text-secondary-foreground shadow-sm">
          ⭐ Featured
        </span>
      )}

      <Link to="/shop/$id" params={{ id: item.id }} className="block">
        <div className="bg-muted/50 overflow-hidden">
          {imgError ? (
            <div className="aspect-square flex items-center justify-center text-5xl bg-secondary/8">
              {item.emoji}
            </div>
          ) : (
            <img
              src={item.image}
              alt={item.name}
              className="product-image w-full aspect-square hover:scale-105 transition-smooth"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          )}
        </div>
      </Link>

      <div className="product-card-content">
        <span className="text-[10px] font-body font-medium text-secondary uppercase tracking-wide">
          {item.subcategory}
        </span>
        <Link to="/shop/$id" params={{ id: item.id }}>
          <p className="product-name mt-0.5 hover:text-primary transition-colors duration-200">
            {item.name}
          </p>
        </Link>

        {"sellerBadge" in item &&
          typeof (item as ShopItem & { sellerBadge?: string }).sellerBadge ===
            "string" && (
            <SellerBadge
              name={(item as ShopItem & { sellerBadge: string }).sellerBadge}
            />
          )}

        <div className="flex items-center gap-1.5 mt-1.5">
          <StarRating rating={item.rating} />
          <span className="text-[11px] text-muted-foreground font-body">
            ({item.reviews.toLocaleString()})
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="product-price text-base mt-0">
            ৳{item.price.toFixed(2)}
          </span>
          <StockBadge inStock={item.inStock} />
        </div>

        {item.inStock ? (
          <button
            type="button"
            className="add-to-cart-button mt-3 text-sm py-2"
            onClick={() => onAddToCart(item)}
            data-ocid={`add-to-cart-${item.id}`}
          >
            <span className="flex items-center justify-center gap-2">
              <ShoppingCart size={14} />
              Add to Cart
            </span>
          </button>
        ) : (
          <Link
            to="/shop/$id"
            params={{ id: item.id }}
            className="add-to-cart-button mt-3 text-sm py-2 text-center block opacity-70"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}

/** Convert a BackendProduct to a ShopItem for unified display */
function backendToShopItem(
  p: BackendProduct,
): ShopItem & { sellerBadge: string } {
  return {
    id: `backend-${p.id}`,
    name: p.name,
    description: p.description,
    category: "shop",
    subcategory: p.subcategory || "Other",
    price: p.price,
    rating: p.rating,
    reviews: Number(p.reviewCount),
    emoji: "📦",
    image: p.images[0] ?? "",
    isFeatured: false,
    inStock: p.stockStatus !== "out_of_stock",
    sellerBadge: p.shopName || p.sellerName || "",
  };
}

export function ShopPage() {
  const [search, setSearch] = useState("");
  const { featuredIds } = useFeaturedIds("shop");
  const { addToCart, cartCount } = useCart();
  const {
    data: backendProducts,
    isLoading: bpLoading,
    isError: bpError,
  } = useAllProducts();

  const featuredSet = new Set(featuredIds);

  // Convert backend products to ShopItem format
  const backendShopItems = (backendProducts ?? []).map(backendToShopItem);

  // Static items merged below backend items
  const allItems = [...backendShopItems, ...shopItems];

  const filtered = allItems.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subcategory.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  const featuredItems = filtered.filter((p) => featuredSet.has(p.id));
  const showFeatured = !search && featuredItems.length > 0;

  function handleAddToCart(item: ShopItem) {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
    });
  }

  return (
    <div className="pb-20 sm:pb-0">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-7 pb-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/15 flex items-center justify-center">
                <ShoppingBag
                  size={20}
                  className="text-secondary"
                  strokeWidth={1.75}
                />
              </div>
              <h1 className="font-display font-bold text-2xl text-foreground">
                Shop
              </h1>
            </div>
            {cartCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <ShoppingCart size={15} className="text-primary" />
                <span className="text-xs font-body font-semibold text-primary">
                  {cartCount} item{cartCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <p className="text-muted-foreground font-body text-sm mb-5">
            Discover thousands of products
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                className="search-input text-sm py-2.5"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
                data-ocid="shop-search"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:border-input transition-smooth"
              aria-label="Filter products"
              data-ocid="shop-filter"
            >
              <Filter size={15} /> Filter
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          {/* Backend loading / error banner */}
          {bpLoading && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3 bg-primary/8 border border-primary/20 text-sm text-primary"
              data-ocid="shop-backend-loading"
            >
              <Loader2 size={16} className="animate-spin shrink-0" />
              Loading products from store…
            </div>
          )}
          {bpError && (
            <div
              className="rounded-xl px-4 py-3 bg-destructive/8 border border-destructive/20 text-sm text-destructive"
              data-ocid="shop-backend-error"
            >
              ⚠️ Could not load store products. Showing sample products below.
            </div>
          )}

          {/* Featured Section */}
          {showFeatured && (
            <div>
              <div className="featured-section">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⭐</span>
                  <h2 className="featured-title">Featured Products</h2>
                  <span className="ml-auto text-xs font-body text-muted-foreground">
                    Hand-picked for you
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {featuredItems.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      isFeatured={true}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Products Section */}
          {filtered.length === 0 ? (
            <div className="text-center py-20" data-ocid="shop-empty">
              <ShoppingBag
                size={48}
                className="mx-auto text-muted-foreground/40 mb-4"
                strokeWidth={1}
              />
              <p className="font-display font-semibold text-foreground">
                No products found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              {/* Backend products section */}
              {!bpLoading && backendShopItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Store size={11} className="text-white" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-foreground">
                      {search ? "Store Results" : "Store Products"}
                    </h2>
                    <span className="ml-2 text-xs font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
                      {
                        backendShopItems.filter(
                          (i) =>
                            !search ||
                            i.name
                              .toLowerCase()
                              .includes(search.toLowerCase()) ||
                            i.subcategory
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                        ).length
                      }{" "}
                      items
                    </span>
                  </div>
                  <div className="product-grid" data-ocid="shop-backend-grid">
                    {filtered
                      .filter((i) => i.id.startsWith("backend-"))
                      .map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          isFeatured={featuredSet.has(item.id)}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Sample products section */}
              {filtered.filter((i) => !i.id.startsWith("backend-")).length >
                0 && (
                <div>
                  {backendShopItems.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border">
                        Sample Products
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  {!backendShopItems.length && (
                    <h2 className="font-display font-bold text-lg text-foreground mb-4">
                      {search ? "Search Results" : "All Products"}
                    </h2>
                  )}
                  <div className="product-grid" data-ocid="shop-product-grid">
                    {filtered
                      .filter((i) => !i.id.startsWith("backend-"))
                      .map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          isFeatured={featuredSet.has(item.id)}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
