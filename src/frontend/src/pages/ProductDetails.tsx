import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  ShoppingCart,
  Star,
  Store,
} from "lucide-react";
import { useState } from "react";
import { shopItems } from "../data/shopItems";
import { useCart } from "../hooks/useCart";
import { useProductById } from "../hooks/useProducts";
import type { BackendProduct } from "../types";

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

function StockStatusBadge({ status }: { status: string }) {
  if (status === "in_stock") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-chart-3/15 text-chart-3 border border-chart-3/30">
        <span className="w-2 h-2 rounded-full bg-chart-3 inline-block" />
        In Stock
      </span>
    );
  }
  if (status === "limited") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-secondary/15 text-secondary border border-secondary/30">
        <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
        Limited Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-muted text-muted-foreground border border-border">
      Out of Stock
    </span>
  );
}

/** Multi-image gallery with thumbnail selector */
function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [mainErr, setMainErr] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});

  const validImages = images.filter(Boolean);

  if (validImages.length === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 aspect-square flex items-center justify-center text-8xl border border-border">
        📦
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border border-border aspect-square flex items-center justify-center">
        {mainErr ? (
          <div className="text-8xl">📦</div>
        ) : (
          <img
            src={validImages[active]}
            alt={`${name} – view ${active + 1}`}
            className="w-full h-full object-contain"
            onError={() => setMainErr(true)}
          />
        )}
      </div>

      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validImages.map((src, i) => (
            <button
              key={`thumb-${i}-${src.slice(-12)}`}
              type="button"
              onClick={() => {
                setActive(i);
                setMainErr(false);
              }}
              className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                active === i
                  ? "border-primary shadow-md scale-105"
                  : "border-border hover:border-primary/50"
              }`}
              aria-label={`View image ${i + 1}`}
              data-ocid={`product-thumb-${i}`}
            >
              {thumbErrors[i] ? (
                <div className="w-full h-full flex items-center justify-center text-xl bg-muted/40">
                  📦
                </div>
              ) : (
                <img
                  src={src}
                  alt={`${name} thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={() =>
                    setThumbErrors((prev) => ({ ...prev, [i]: true }))
                  }
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shop owner card shown for backend products */
function ShopOwnerCard({ product }: { product: BackendProduct }) {
  if (!product.sellerName && !product.shopName) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-primary/20 mt-6"
      data-ocid="shop-owner-card"
    >
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-primary/20 via-accent/15 to-secondary/20 px-4 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Store size={14} className="text-primary" />
          </div>
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            Shop Owner
          </span>
        </div>
      </div>

      <div className="bg-card px-4 py-4 space-y-2">
        {product.shopName && (
          <div>
            <p className="text-xs text-muted-foreground font-medium">
              Shop Name
            </p>
            <p className="text-sm font-bold text-foreground">
              {product.shopName}
            </p>
          </div>
        )}
        {product.sellerName && (
          <div>
            <p className="text-xs text-muted-foreground font-medium">Seller</p>
            <p className="text-sm font-medium text-foreground">
              {product.sellerName}
            </p>
          </div>
        )}
        {product.shopDescription && (
          <div className="pt-1 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {product.shopDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Backend product detail view */
function BackendProductDetail({ product }: { product: BackendProduct }) {
  const { addToCart, toastMessage, dismissToast } = useCart();
  const [added, setAdded] = useState(false);
  const isAvailable = product.stockStatus !== "out_of_stock";

  function handleAddToCart() {
    addToCart({
      id: `backend-${product.id}`,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

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
            {/* Image Gallery */}
            <div className="product-image-section">
              <ImageGallery images={product.images} name={product.name} />
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
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({Number(product.reviewCount).toLocaleString()} reviews)
                </span>
              </div>

              {/* Price */}
              <p className="product-details-price">
                ৳{product.price.toFixed(2)}
              </p>

              {/* Stock status badge */}
              <div className="mt-3">
                <StockStatusBadge status={product.stockStatus} />
              </div>

              {/* Description */}
              <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Description
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Shop Owner Card */}
              <ShopOwnerCard product={product} />

              {/* Add to Cart — desktop */}
              <div className="hidden lg:block mt-6">
                <button
                  type="button"
                  className="add-to-cart-button py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isAvailable}
                  onClick={handleAddToCart}
                  data-ocid="add-to-cart-desktop"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart size={18} />
                    {!isAvailable
                      ? "Out of Stock"
                      : added
                        ? "✓ Added to Cart!"
                        : "Add to Cart"}
                  </span>
                </button>
                {!isAvailable && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    This item is currently unavailable.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Add to Cart — mobile */}
      <div
        className="lg:hidden add-to-cart-sticky z-40"
        data-ocid="add-to-cart-sticky"
      >
        <button
          type="button"
          className="add-to-cart-button py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!isAvailable}
          onClick={handleAddToCart}
        >
          <span className="flex items-center justify-center gap-2">
            <ShoppingCart size={18} />
            {!isAvailable
              ? "Out of Stock"
              : added
                ? "✓ Added to Cart!"
                : `Add to Cart · ৳${product.price.toFixed(2)}`}
          </span>
        </button>
      </div>

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

/** Static product detail (fallback to shopItems) */
function StaticProductDetail({ id }: { id: string }) {
  // strip "backend-" prefix if somehow routed here
  const cleanId = id.startsWith("backend-") ? id.slice(8) : id;
  const product =
    shopItems.find((p) => p.id === cleanId) ??
    shopItems.find((p) => p.id === id);
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

      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="product-details-container">
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
            <div className="product-info-section">
              <span className="text-xs font-body font-semibold text-secondary uppercase tracking-wide">
                {product.subcategory}
              </span>
              <h1 className="product-details-title mt-1">{product.name}</h1>
              <div className="product-rating">
                <StarRating rating={product.rating} />
                <span className="font-body font-semibold text-foreground ml-1">
                  {product.rating}
                </span>
                <span className="text-muted-foreground ml-1">
                  ({product.reviews.toLocaleString()} reviews)
                </span>
              </div>
              <p className="product-details-price">
                ৳{product.price.toFixed(2)}
              </p>
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
              <p className="product-description">{product.description}</p>
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
              </div>
            </div>
          </div>
        </div>
      </section>

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
                : `Add to Cart · ৳${product.price.toFixed(2)}`}
          </span>
        </button>
      </div>

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

export function ProductDetailsPage() {
  const { id } = useParams({ from: "/shop/$id" });

  // Determine if this is a backend product ID
  const isBackendId = id.startsWith("backend-");
  const backendId = isBackendId ? id.slice(8) : id;

  // Always try to load the backend product
  const { data: backendProduct, isLoading } = useProductById(backendId);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  // If found in backend, show backend view
  if (backendProduct) {
    return <BackendProductDetail product={backendProduct} />;
  }

  // Fallback to static shopItems
  return <StaticProductDetail id={id} />;
}
