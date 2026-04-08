import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, ShoppingCart, Star } from "lucide-react";
import { useState } from "react";
import { shopItems } from "../data/shopItems";
import { useCart } from "../hooks/useCart";

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
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

export function ProductDetailsPage() {
  const { id } = useParams({ from: "/shop/$id" });
  const product = shopItems.find((p) => p.id === id);
  const { addToCart, toastMessage, dismissToast } = useCart();
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center pb-20 sm:pb-0">
        <span className="text-6xl mb-4">🔍</span>
        <h1 className="font-display font-bold text-2xl text-foreground mb-2">
          Product Not Found
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          We couldn't find the product you're looking for.
        </p>
        <Link
          to="/shop"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-body font-semibold text-sm transition-smooth hover:opacity-90"
          data-ocid="product-not-found-back"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>
    );
  }

  function handleAddToCart() {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const stockLabel = product.inStock ? "In Stock" : "Out of Stock";

  return (
    <div className="pb-24 sm:pb-0">
      {/* Breadcrumb */}
      <section className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link
              to="/shop"
              className="hover:text-foreground transition-colors duration-200"
              data-ocid="breadcrumb-shop"
            >
              Shop
            </Link>
            <ChevronRight size={13} className="breadcrumb-separator" />
            <span className="text-foreground font-medium line-clamp-1 max-w-[180px]">
              {product.name}
            </span>
          </nav>

          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors duration-200"
            data-ocid="back-to-shop"
          >
            <ArrowLeft size={13} />
            Back to Shop
          </Link>
        </div>
      </section>

      {/* Product Content */}
      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="product-details-container">
            {/* Image Section */}
            <div className="product-image-section">
              {imgError ? (
                <div className="product-image-hero flex items-center justify-center text-8xl">
                  {product.emoji}
                </div>
              ) : (
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image-hero"
                  onError={() => setImgError(true)}
                />
              )}
            </div>

            {/* Info Section */}
            <div className="product-info-section">
              <span className="text-xs font-body font-semibold text-secondary uppercase tracking-wide">
                {product.subcategory}
              </span>

              <h1 className="product-details-title mt-1">{product.name}</h1>

              {/* Rating */}
              <div className="product-rating">
                <StarRating rating={product.rating} />
                <span className="font-body font-semibold text-foreground ml-1">
                  {product.rating}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({product.reviews.toLocaleString()} reviews)
                </span>
              </div>

              {/* Price */}
              <p className="product-details-price">
                ${product.price.toFixed(2)}
              </p>

              {/* Stock badge */}
              {product.inStock ? (
                <span className="product-details-badge bg-chart-3/15 text-chart-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-chart-3 inline-block" />
                  {stockLabel}
                </span>
              ) : (
                <span className="product-details-badge bg-muted text-muted-foreground">
                  {stockLabel}
                </span>
              )}

              {/* Description */}
              <p className="product-description">{product.description}</p>

              {/* Add to Cart — inline on desktop */}
              <div className="hidden lg:block mt-6">
                <button
                  type="button"
                  className="add-to-cart-button py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!product.inStock}
                  onClick={handleAddToCart}
                  data-ocid="add-to-cart-desktop"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart size={18} />
                    {!product.inStock
                      ? "Out of Stock"
                      : added
                        ? "✓ Added to Cart!"
                        : "Add to Cart"}
                  </span>
                </button>
                {!product.inStock && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    This item is currently unavailable.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Add to Cart — mobile only */}
      <div
        className="lg:hidden add-to-cart-sticky z-40"
        data-ocid="add-to-cart-sticky"
      >
        <button
          type="button"
          className="add-to-cart-button py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!product.inStock}
          onClick={handleAddToCart}
        >
          <span className="flex items-center justify-center gap-2">
            <ShoppingCart size={18} />
            {!product.inStock
              ? "Out of Stock"
              : added
                ? "✓ Added to Cart!"
                : `Add to Cart · $${product.price.toFixed(2)}`}
          </span>
        </button>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <button
          type="button"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border shadow-lg text-sm font-body text-foreground max-w-xs text-left"
          onClick={dismissToast}
        >
          <span className="text-chart-3 text-lg">✓</span>
          <span>{toastMessage}</span>
        </button>
      )}
    </div>
  );
}
