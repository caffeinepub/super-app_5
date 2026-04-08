import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useActor } from "@caffeineai/core-infrastructure";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createActor } from "../backend";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";

export function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const { actor, isFetching } = useActor(createActor);

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      void router.navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, router]);

  // Redirect if cart is empty (and not just placed an order)
  useEffect(() => {
    if (!isInitializing && items.length === 0 && status === "idle") {
      void router.navigate({ to: "/cart" });
    }
  }, [items, isInitializing, status, router]);

  async function handlePlaceOrder() {
    if (!actor || isFetching) return;
    setStatus("loading");
    setErrorMsg(null);

    try {
      const orderItems = items.map((item) => ({
        name: item.name,
        qty: BigInt(item.quantity),
        price: item.price,
      }));

      await actor.createOrder(orderItems);
      clearCart();
      setStatus("success");

      // Navigate to delivery after a short success flash
      setTimeout(() => {
        void router.navigate({ to: "/delivery" });
      }, 1500);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4"
        data-ocid="checkout-success"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle size={32} className="text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-display font-bold text-foreground mb-1">
            Order Placed!
          </h2>
          <p className="text-muted-foreground font-body text-sm">
            Redirecting to your orders…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => void router.navigate({ to: "/cart" })}
        className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
        data-ocid="checkout-back"
      >
        <ArrowLeft size={15} />
        Back to Cart
      </button>

      <h1 className="text-2xl font-display font-bold text-foreground mb-6">
        Checkout
      </h1>

      {/* Order summary */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-display font-semibold text-foreground mb-4">
          Order Summary
        </h2>

        <div className="space-y-3" data-ocid="checkout-items">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
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
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  Qty: {item.quantity} × ${item.price.toFixed(2)}
                </p>
              </div>
              <span className="font-body font-semibold text-foreground flex-shrink-0">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <span className="font-display font-bold text-foreground text-base">
            Total
          </span>
          <span className="font-display font-bold text-primary text-xl">
            ${cartTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Error state */}
      {status === "error" && errorMsg && (
        <div
          className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-4"
          role="alert"
          data-ocid="checkout-error"
        >
          <AlertCircle
            size={16}
            className="text-destructive mt-0.5 flex-shrink-0"
          />
          <p className="text-sm font-body text-destructive">{errorMsg}</p>
        </div>
      )}

      {/* Place Order button */}
      <Button
        className="w-full h-12 text-base font-body font-semibold"
        onClick={() => void handlePlaceOrder()}
        disabled={status === "loading" || !actor || isFetching}
        data-ocid="checkout-place-order"
      >
        {status === "loading" ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            Placing Order…
          </>
        ) : (
          "Place Order"
        )}
      </Button>

      <p className="mt-3 text-xs text-center font-body text-muted-foreground">
        By placing your order, you agree to our terms of service.
      </p>
    </div>
  );
}
