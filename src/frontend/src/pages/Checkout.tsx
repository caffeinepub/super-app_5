import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useActor } from "@caffeineai/core-infrastructure";
import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  ClipboardCopy,
  Clock,
  Loader2,
  Smartphone,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useSubmitPayment } from "../hooks/usePayments";
import type { PaymentMethod } from "../types";

// ─── Payment method config ───────────────────────────────────────────────────

const BKASH_NUMBER = "01712-345678";
const NAGAD_NUMBER = "01856-789012";

interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  number: string;
  tagline: string;
  steps: string[];
  colorClass: string;
  cardBg: CSSProperties;
  cardBorder: string;
  cardShadow: string;
  badgeStyle: CSSProperties;
  instructionsBorder: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "bkash",
    label: "bKash",
    number: BKASH_NUMBER,
    tagline: "Bangladesh's #1 mobile banking",
    steps: [
      `Open bKash app and tap "Send Money"`,
      `Enter the number: ${BKASH_NUMBER}`,
      "Enter the exact order amount",
      "Use your Order ID as the reference/note",
      "Complete the payment and copy your Transaction ID",
    ],
    colorClass: "text-[oklch(0.60_0.25_305)]",
    cardBg: {
      background:
        "linear-gradient(135deg, oklch(0.60 0.25 305 / 0.08) 0%, oklch(0.60 0.25 305 / 0.04) 100%)",
    },
    cardBorder: "2px solid oklch(0.60 0.25 305)",
    cardShadow: "0 0 0 3px oklch(0.60 0.25 305 / 0.12)",
    badgeStyle: {
      background: "oklch(0.60 0.25 305 / 0.15)",
      color: "oklch(0.35 0.20 305)",
      border: "1px solid oklch(0.60 0.25 305 / 0.4)",
    },
    instructionsBorder: "1px solid oklch(0.60 0.25 305 / 0.25)",
  },
  {
    id: "nagad",
    label: "Nagad",
    number: NAGAD_NUMBER,
    tagline: "Fast & secure mobile payment",
    steps: [
      `Open Nagad app and tap "Send Money"`,
      `Enter the number: ${NAGAD_NUMBER}`,
      "Enter the exact order amount",
      "Use your Order ID as the reference/note",
      "Complete the payment and copy your Transaction ID",
    ],
    colorClass: "text-[oklch(0.65_0.26_40)]",
    cardBg: {
      background:
        "linear-gradient(135deg, oklch(0.65 0.26 40 / 0.08) 0%, oklch(0.65 0.26 40 / 0.04) 100%)",
    },
    cardBorder: "2px solid oklch(0.65 0.26 40)",
    cardShadow: "0 0 0 3px oklch(0.65 0.26 40 / 0.12)",
    badgeStyle: {
      background: "oklch(0.65 0.26 40 / 0.15)",
      color: "oklch(0.38 0.20 40)",
      border: "1px solid oklch(0.65 0.26 40 / 0.4)",
    },
    instructionsBorder: "1px solid oklch(0.65 0.26 40 / 0.25)",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const { actor, isFetching } = useActor(createActor);
  const submitPayment = useSubmitPayment();

  const [step, setStep] = useState<"summary" | "payment" | "txid">("summary");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [txId, setTxId] = useState("");
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const txInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      void router.navigate({ to: "/login" });
    }
  }, [isAuthenticated, isInitializing, router]);

  useEffect(() => {
    if (!isInitializing && items.length === 0 && status === "idle") {
      void router.navigate({ to: "/cart" });
    }
  }, [items, isInitializing, status, router]);

  // ── Copy account number ──
  async function handleCopyNumber() {
    const method = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
    if (!method) return;
    try {
      await navigator.clipboard.writeText(method.number.replace("-", ""));
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } catch {
      // ignore
    }
  }

  // ── Place order + submit payment ──
  async function handlePlaceOrder() {
    if (!actor || isFetching || !selectedMethod || !txId.trim()) return;
    setStatus("loading");
    setErrorMsg(null);

    try {
      // 1. Create the order
      const orderItems = items.map((item) => ({
        name: item.name,
        qty: BigInt(item.quantity),
        price: item.price,
      }));
      const order = await actor.createOrder(orderItems);
      const orderId = order.id.toString();
      setPlacedOrderId(orderId);

      // 2. Submit payment record
      await submitPayment.mutateAsync({
        orderId,
        method: selectedMethod,
        transactionId: txId.trim(),
        amount: cartTotal,
      });

      clearCart();
      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setStatus("error");
    }
  }

  // ── Success state ──
  if (status === "success") {
    return (
      <div
        className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4"
        data-ocid="checkout-success"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.70 0.24 142 / 0.15) 0%, oklch(0.70 0.24 142 / 0.05) 100%)",
            border: "2px solid oklch(0.70 0.24 142 / 0.5)",
          }}
        >
          <CheckCircle size={36} className="text-[oklch(0.70_0.24_142)]" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Order Placed! 🎉
          </h2>
          <p className="text-muted-foreground font-body text-sm leading-relaxed mb-3">
            Your payment is <strong>under review</strong>. Once our team
            verifies your transaction, your order will be confirmed.
          </p>
          {placedOrderId && (
            <div
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-mono"
              style={{
                background: "oklch(0.70 0.24 142 / 0.08)",
                border: "1px solid oklch(0.70 0.24 142 / 0.25)",
              }}
            >
              <Clock size={14} className="text-[oklch(0.70_0.24_142)]" />
              <span className="text-foreground font-medium">
                Order #{placedOrderId}
              </span>
            </div>
          )}
        </div>
        <div
          className="rounded-xl p-4 max-w-sm w-full text-sm font-body text-muted-foreground"
          style={{
            background: "oklch(0.88 0 0 / 0.5)",
            border: "1px solid oklch(0.88 0 0)",
          }}
        >
          You will see your order in{" "}
          <strong className="text-foreground">Order History</strong> once your
          payment is confirmed by our admin team.
        </div>
        <Button
          variant="outline"
          onClick={() => void router.navigate({ to: "/delivery" })}
          className="mt-2"
          data-ocid="checkout-view-orders"
        >
          View Order History
        </Button>
      </div>
    );
  }

  const selectedConfig = PAYMENT_METHODS.find((m) => m.id === selectedMethod);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 sm:pb-10">
      {/* Back nav */}
      <button
        type="button"
        onClick={() =>
          step === "summary"
            ? void router.navigate({ to: "/cart" })
            : step === "payment"
              ? setStep("summary")
              : setStep("payment")
        }
        className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
        data-ocid="checkout-back"
      >
        <ArrowLeft size={15} />
        {step === "summary"
          ? "Back to Cart"
          : step === "payment"
            ? "Back to Summary"
            : "Back to Payment"}
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {(["summary", "payment", "txid"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-smooth"
              style={
                step === s
                  ? {
                      background: "var(--gradient-primary)",
                      color: "oklch(0.98 0 0)",
                    }
                  : ["summary", "payment", "txid"].indexOf(step) > i
                    ? {
                        background: "oklch(0.70 0.24 142 / 0.15)",
                        color: "oklch(0.70 0.24 142)",
                        border: "1px solid oklch(0.70 0.24 142 / 0.4)",
                      }
                    : {
                        background: "oklch(0.88 0 0)",
                        color: "oklch(0.50 0 0)",
                      }
              }
            >
              {["summary", "payment", "txid"].indexOf(step) > i ? "✓" : i + 1}
            </div>
            <span
              className={`text-xs font-body hidden sm:inline ${step === s ? "text-foreground font-semibold" : "text-muted-foreground"}`}
            >
              {s === "summary"
                ? "Summary"
                : s === "payment"
                  ? "Payment"
                  : "Confirm"}
            </span>
            {i < 2 && (
              <ChevronRight size={12} className="text-muted-foreground/50" />
            )}
          </div>
        ))}
      </div>

      <h1 className="text-2xl font-display font-bold text-foreground mb-6">
        {step === "summary"
          ? "Order Summary"
          : step === "payment"
            ? "Choose Payment"
            : "Enter Transaction ID"}
      </h1>

      {/* ── STEP 1: Order Summary ── */}
      {step === "summary" && (
        <>
          {/* Gradient summary card */}
          <div
            className="rounded-2xl p-5 mb-6"
            style={{
              background: "var(--gradient-card)",
              border: "1px solid oklch(0.88 0 0)",
            }}
          >
            <div className="space-y-3" data-ocid="checkout-items">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
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
                      Qty: {item.quantity} × ৳{item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-body font-semibold text-foreground flex-shrink-0">
                    ৳{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Commission breakdown */}
            <div className="space-y-1.5 text-sm font-body mb-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>৳{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Platform fee
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 ml-1"
                  >
                    10%
                  </Badge>
                </span>
                <span>−৳{(cartTotal * 0.1).toFixed(2)}</span>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Highlighted total */}
            <div className="flex justify-between items-center">
              <span className="font-display font-bold text-foreground text-base">
                Total
              </span>
              <span
                className="font-display font-bold text-2xl px-3 py-1 rounded-lg"
                style={{
                  background: "var(--gradient-primary)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ৳{cartTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            className="w-full h-12 text-base font-body font-semibold"
            onClick={() => setStep("payment")}
            data-ocid="checkout-to-payment"
          >
            Continue to Payment
            <ChevronRight size={18} className="ml-1" />
          </Button>
        </>
      )}

      {/* ── STEP 2: Payment Method Selection ── */}
      {step === "payment" && (
        <>
          <p className="text-sm font-body text-muted-foreground mb-5">
            Select your preferred payment method below. Instructions will appear
            after selection.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className="text-left rounded-2xl p-5 transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{
                    ...method.cardBg,
                    border: isSelected
                      ? method.cardBorder
                      : "2px solid oklch(0.88 0 0)",
                    boxShadow: isSelected ? method.cardShadow : "none",
                  }}
                  data-ocid={`checkout-method-${method.id}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone size={18} className={method.colorClass} />
                      <span
                        className={`font-display font-bold text-lg ${method.colorClass}`}
                      >
                        {method.label}
                      </span>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-smooth"
                      style={{
                        borderColor: isSelected
                          ? method.badgeStyle.color
                          : "oklch(0.75 0 0)",
                        background: isSelected
                          ? method.badgeStyle.color
                          : "transparent",
                      }}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-body text-muted-foreground mb-3">
                    {method.tagline}
                  </p>
                  <div
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-mono font-semibold"
                    style={method.badgeStyle}
                  >
                    <span>{method.number}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Payment instructions panel */}
          {selectedConfig && (
            <div
              className="rounded-2xl p-5 mb-6 transition-smooth"
              style={{
                ...selectedConfig.cardBg,
                border: selectedConfig.instructionsBorder,
              }}
              data-ocid="checkout-payment-instructions"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display font-bold text-foreground mb-0.5">
                    {selectedConfig.label} Payment Instructions
                  </h3>
                  <p className="text-xs text-muted-foreground font-body">
                    Follow these steps carefully
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyNumber()}
                  className="flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-lg transition-smooth hover:opacity-80 flex-shrink-0"
                  style={selectedConfig.badgeStyle}
                  data-ocid="checkout-copy-number"
                >
                  <ClipboardCopy size={12} />
                  {copiedNumber ? "Copied!" : "Copy Number"}
                </button>
              </div>

              <ol className="space-y-2.5">
                {selectedConfig.steps.map((stepText, i) => (
                  <li
                    key={stepText}
                    className="flex items-start gap-3 text-sm font-body"
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={selectedConfig.badgeStyle}
                    >
                      {i + 1}
                    </span>
                    <span className="text-foreground leading-snug">
                      {stepText}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Button
            className="w-full h-12 text-base font-body font-semibold"
            disabled={!selectedMethod}
            onClick={() => {
              setStep("txid");
              setTimeout(() => txInputRef.current?.focus(), 100);
            }}
            data-ocid="checkout-to-txid"
          >
            I've Completed the Payment
            <ChevronRight size={18} className="ml-1" />
          </Button>
        </>
      )}

      {/* ── STEP 3: Transaction ID ── */}
      {step === "txid" && selectedConfig && (
        <>
          {/* Mini receipt */}
          <div
            className="rounded-2xl p-4 mb-6 flex items-center justify-between"
            style={{
              ...selectedConfig.cardBg,
              border: selectedConfig.instructionsBorder,
            }}
          >
            <div className="flex items-center gap-3">
              <Smartphone size={20} className={selectedConfig.colorClass} />
              <div>
                <p
                  className={`font-display font-bold ${selectedConfig.colorClass}`}
                >
                  {selectedConfig.label}
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  To: {selectedConfig.number}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-foreground">
                ৳{cartTotal.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground font-body">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="txid-input"
              className="block text-sm font-body font-semibold text-foreground mb-2"
            >
              Transaction ID <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground font-body mb-3">
              Enter the transaction ID from your {selectedConfig.label} payment
              confirmation.
            </p>
            <Input
              id="txid-input"
              ref={txInputRef}
              type="text"
              value={txId}
              onChange={(e) => setTxId(e.target.value)}
              placeholder={`e.g. ${selectedConfig.label === "bKash" ? "8N6B3H7K2M" : "4X9D2F5L1P"}`}
              className="h-12 font-mono text-base"
              data-ocid="checkout-txid-input"
            />
          </div>

          {/* Error */}
          {status === "error" && errorMsg && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
              style={{
                background: "oklch(0.55 0.22 25 / 0.08)",
                border: "1px solid oklch(0.55 0.22 25 / 0.25)",
              }}
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

          <Button
            className="w-full h-12 text-base font-body font-semibold"
            onClick={() => void handlePlaceOrder()}
            disabled={
              !txId.trim() || status === "loading" || !actor || isFetching
            }
            data-ocid="checkout-place-order"
          >
            {status === "loading" ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Placing Order…
              </>
            ) : (
              <>
                <CheckCircle size={18} className="mr-2" />
                Confirm Order & Submit Payment
              </>
            )}
          </Button>

          <p className="mt-3 text-xs text-center font-body text-muted-foreground">
            Your order will be confirmed after admin verifies your payment.
          </p>
        </>
      )}
    </div>
  );
}
