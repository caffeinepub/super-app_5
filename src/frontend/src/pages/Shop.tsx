import { Link } from "@tanstack/react-router";
import { Filter, Search, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { shopItems } from "../data/shopItems";
import { useCart } from "../hooks/useCart";
import { useFeaturedIds } from "../hooks/useFeaturedIds";
import type { ShopItem } from "../types";

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

        <div className="flex items-center gap-1.5 mt-1.5">
          <StarRating rating={item.rating} />
          <span className="text-[11px] text-muted-foreground font-body">
            ({item.reviews.toLocaleString()})
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="product-price text-base mt-0">
            ${item.price.toFixed(2)}
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

export function ShopPage() {
  const [search, setSearch] = useState("");
  const { featuredIds } = useFeaturedIds("shop");
  const { addToCart, cartCount } = useCart();

  const featuredSet = new Set(featuredIds);

  const filtered = shopItems.filter(
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
            <div>
              <h2 className="font-display font-bold text-lg text-foreground mb-4">
                {search ? "Search Results" : "All Products"}
              </h2>
              <div className="product-grid" data-ocid="shop-product-grid">
                {filtered.map((item) => (
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
        </div>
      </section>
    </div>
  );
}
