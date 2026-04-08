import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "@tanstack/react-router";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";

export function CartPage() {
  const router = useRouter();
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();

  function handleIncrease(item: (typeof items)[number]) {
    updateQuantity(item.id, item.quantity + 1);
  }

  function handleDecrease(item: (typeof items)[number]) {
    if (item.quantity <= 1) return;
    updateQuantity(item.id, item.quantity - 1);
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      void router.navigate({ to: "/login" });
    } else {
      void router.navigate({ to: "/checkout" });
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4"
        data-ocid="cart-empty"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <ShoppingCart size={36} className="text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            Add some items from the shop to get started.
          </p>
        </div>
        <Button
          onClick={() => void router.navigate({ to: "/shop" })}
          className="font-body"
          data-ocid="cart-empty-shop-cta"
        >
          Browse Shop
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
      <h1 className="text-2xl font-display font-bold text-foreground mb-6">
        Your Cart
      </h1>

      <div className="space-y-4" data-ocid="cart-items">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4"
            data-ocid={`cart-item-${item.id}`}
          >
            {/* Product image */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/assets/images/placeholder.svg";
                }}
              />
            </div>

            {/* Item details */}
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-foreground truncate">
                {item.name}
              </p>
              <p className="text-sm text-muted-foreground font-body">
                ${item.price.toFixed(2)} each
              </p>
              <p className="text-sm font-semibold text-primary font-body mt-0.5">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDecrease(item)}
                disabled={item.quantity <= 1}
                className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                aria-label="Decrease quantity"
                data-ocid={`cart-item-decrease-${item.id}`}
              >
                <Minus size={14} />
              </button>
              <span
                className="w-8 text-center font-body font-semibold text-foreground text-sm"
                aria-label={`Quantity: ${item.quantity}`}
              >
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => handleIncrease(item)}
                className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors duration-200"
                aria-label="Increase quantity"
                data-ocid={`cart-item-increase-${item.id}`}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeFromCart(item.id)}
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-200"
              aria-label={`Remove ${item.name} from cart`}
              data-ocid={`cart-item-remove-${item.id}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="mt-6 bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-foreground mb-4">
          Order Summary
        </h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground font-body truncate mr-2">
                {item.name} × {item.quantity}
              </span>
              <span className="font-body font-medium text-foreground flex-shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between items-center">
          <span className="font-display font-bold text-foreground text-lg">
            Total
          </span>
          <span className="font-display font-bold text-primary text-xl">
            ${cartTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="mt-6">
        <Button
          className="w-full h-12 text-base font-body font-semibold"
          onClick={handleCheckout}
          data-ocid="cart-checkout-cta"
        >
          Proceed to Checkout
        </Button>
        <button
          type="button"
          onClick={() => void router.navigate({ to: "/shop" })}
          className="w-full mt-3 text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-200 text-center"
          data-ocid="cart-continue-shopping"
        >
          ← Continue Shopping
        </button>
      </div>
    </div>
  );
}
