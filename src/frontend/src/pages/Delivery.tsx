import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  LogIn,
  Package,
  Search,
  Star,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { deliveryItems } from "../data/deliveryItems";
import { useAuth } from "../hooks/useAuth";
import { useFeaturedIds } from "../hooks/useFeaturedIds";
import { useOrders } from "../hooks/useOrders";
import type { Order } from "../types";

type Tab = "browse" | "orders";

export function DeliveryPage() {
  const [tab, setTab] = useState<Tab>("browse");
  const [search, setSearch] = useState("");
  const { featuredIds } = useFeaturedIds("delivery");
  const { isAuthenticated } = useAuth();

  const filtered = deliveryItems.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase()),
  );

  const trending = filtered.filter((r) => featuredIds.includes(r.id));
  const all = filtered.filter((r) => !featuredIds.includes(r.id));
  const isSearching = search.trim().length > 0;

  return (
    <div className="pb-20 sm:pb-0">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-7 pb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
              <Truck size={20} className="text-accent" strokeWidth={1.75} />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Delivery
            </h1>
          </div>
          <p className="text-muted-foreground font-body text-sm mb-4">
            Food &amp; groceries at your door
          </p>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-border -mb-px">
            <button
              type="button"
              onClick={() => setTab("browse")}
              className={`px-4 py-2.5 text-sm font-body font-semibold border-b-2 transition-colors ${
                tab === "browse"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="tab-browse"
            >
              Browse
            </button>
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={`px-4 py-2.5 text-sm font-body font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === "orders"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="tab-orders"
            >
              <Package size={14} strokeWidth={2} />
              My Orders
            </button>
          </div>
        </div>
      </section>

      {tab === "browse" ? (
        <BrowseTab
          search={search}
          onSearch={setSearch}
          trending={trending}
          all={all}
          filtered={filtered}
          isSearching={isSearching}
        />
      ) : (
        <OrdersTab isAuthenticated={isAuthenticated} />
      )}
    </div>
  );
}

/* ── Browse Tab ─────────────────────────────────────────────────── */
interface BrowseTabProps {
  search: string;
  onSearch: (v: string) => void;
  trending: (typeof deliveryItems)[number][];
  all: (typeof deliveryItems)[number][];
  filtered: (typeof deliveryItems)[number][];
  isSearching: boolean;
}

function BrowseTab({
  search,
  onSearch,
  trending,
  all,
  filtered,
  isSearching,
}: BrowseTabProps) {
  return (
    <>
      {/* Stats strip */}
      <section className="bg-accent/5 border-b border-accent/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-accent">
            <Clock size={14} strokeWidth={2} />
            <span className="font-body text-xs font-semibold">
              30 min average delivery
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-accent">
            <Truck size={14} strokeWidth={2} />
            <span className="font-body text-xs font-semibold">
              Free delivery over $25
            </span>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              className="search-input text-sm py-2.5"
              placeholder="Search restaurants or cuisines…"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search restaurants"
              data-ocid="delivery-search"
            />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
          {filtered.length === 0 && (
            <div className="text-center py-20" data-ocid="delivery-empty">
              <Truck
                size={48}
                className="mx-auto text-muted-foreground/40 mb-4"
                strokeWidth={1}
              />
              <p className="font-display font-semibold text-foreground">
                No restaurants found
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Try a different search
              </p>
            </div>
          )}

          {trending.length > 0 && (
            <div data-ocid="trending-section">
              <div className="flex items-center gap-2 mb-3">
                <Flame size={18} className="text-accent" strokeWidth={2} />
                <h2 className="font-display font-bold text-lg text-foreground">
                  Trending Now
                </h2>
              </div>
              <div className="featured-section flex flex-col gap-3">
                {trending.map((r) => (
                  <RestaurantCard key={r.id} item={r} isTrending />
                ))}
              </div>
            </div>
          )}

          {(all.length > 0 ||
            (filtered.length > 0 && trending.length === 0)) && (
            <div data-ocid="all-section">
              {!isSearching && (
                <div className="flex items-center gap-2 mb-3">
                  <UtensilsCrossed
                    size={18}
                    className="text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <h2 className="font-display font-bold text-lg text-foreground">
                    All Restaurants &amp; Grocers
                  </h2>
                </div>
              )}
              {isSearching && trending.length === 0 && all.length > 0 && (
                <p className="text-sm text-muted-foreground mb-3 font-body">
                  {all.length} result{all.length !== 1 ? "s" : ""} found
                </p>
              )}
              <div className="flex flex-col gap-3">
                {(isSearching && trending.length === 0 ? filtered : all).map(
                  (r) => (
                    <RestaurantCard key={r.id} item={r} isTrending={false} />
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ── Orders Tab ─────────────────────────────────────────────────── */
interface OrdersTabProps {
  isAuthenticated: boolean;
}

function OrdersTab({ isAuthenticated }: OrdersTabProps) {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useOrders(isAuthenticated);

  if (!isAuthenticated) {
    return (
      <section className="bg-background">
        <div
          className="max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center"
          data-ocid="orders-unauthenticated"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Package size={32} className="text-accent" strokeWidth={1.5} />
          </div>
          <h2 className="font-display font-bold text-xl text-foreground mb-2">
            Sign in to view your orders
          </h2>
          <p className="text-muted-foreground font-body text-sm mb-6 max-w-xs">
            Log in to see your full order history, track deliveries, and manage
            past purchases.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/login" })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-body font-semibold text-sm transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-ocid="orders-login-btn"
          >
            <LogIn size={16} strokeWidth={2} />
            Go to Sign In
          </button>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="bg-background">
        <div
          className="max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center gap-3"
          data-ocid="orders-loading"
        >
          <Loader2
            size={32}
            className="text-accent animate-spin"
            strokeWidth={1.75}
          />
          <p className="font-body text-sm text-muted-foreground">
            Loading your orders…
          </p>
        </div>
      </section>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <section className="bg-background">
        <div
          className="max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center"
          data-ocid="orders-empty"
        >
          <Package
            size={48}
            className="mx-auto text-muted-foreground/40 mb-4"
            strokeWidth={1}
          />
          <p className="font-display font-semibold text-foreground">
            No orders yet
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Your order history will appear here
          </p>
        </div>
      </section>
    );
  }

  const sorted = [...orders].sort((a, b) => b.date - a.date);

  return (
    <section className="bg-background">
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4"
        data-ocid="orders-list"
      >
        <p className="font-body text-sm text-muted-foreground">
          {sorted.length} order{sorted.length !== 1 ? "s" : ""}
        </p>
        {sorted.map((order) => (
          <OrderCard key={String(order.id)} order={order} />
        ))}
      </div>
    </section>
  );
}

/* ── Order Card ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  Pending: {
    label: "Pending",
    progress: 10,
    color: "bg-secondary",
    textColor: "text-secondary-foreground",
    bgColor: "bg-secondary/10",
    icon: Clock,
  },
  Ongoing: {
    label: "On the way",
    progress: 55,
    color: "bg-accent",
    textColor: "text-accent-foreground",
    bgColor: "bg-accent/10",
    icon: Truck,
  },
  Delivered: {
    label: "Delivered",
    progress: 100,
    color: "bg-primary",
    textColor: "text-primary-foreground",
    bgColor: "bg-primary/10",
    icon: CheckCircle2,
  },
} as const;

function OrderCard({ order }: { order: Order }) {
  const cfg = STATUS_CONFIG[order.status];
  const StatusIcon = cfg.icon;
  const dateStr = new Date(order.date / 1_000_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
      data-ocid={`order-${order.id}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-body font-semibold text-sm text-foreground">
            Order #{String(order.id)}
          </span>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {dateStr}
          </p>
        </div>
        <span
          className={`flex items-center gap-1 text-xs font-body font-semibold px-2.5 py-1 rounded-full ${cfg.bgColor} ${
            order.status === "Delivered"
              ? "text-primary"
              : order.status === "Ongoing"
                ? "text-accent"
                : "text-secondary"
          }`}
        >
          <StatusIcon size={11} strokeWidth={2.5} />
          {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-muted-foreground font-body mb-1">
          <span>Pending</span>
          <span>On the way</span>
          <span>Delivered</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${cfg.color}`}
            style={{ width: `${cfg.progress}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <ul className="flex flex-col gap-1">
        {order.items.map((item) => (
          <li
            key={`${item.name}-${item.qty}`}
            className="flex items-center justify-between text-sm font-body"
          >
            <span className="text-foreground">
              {item.name}
              <span className="text-muted-foreground ml-1">× {item.qty}</span>
            </span>
            <span className="text-muted-foreground">
              ${(item.price * item.qty).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      {/* Total */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground font-body">Total</span>
        <span className="font-body font-bold text-sm text-foreground">
          ${order.total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ── Restaurant Card (browse) ────────────────────────────────────── */
interface RestaurantCardProps {
  item: (typeof deliveryItems)[number];
  isTrending: boolean;
}

function RestaurantCard({ item, isTrending }: RestaurantCardProps) {
  return (
    <button
      type="button"
      className="group text-left bg-card border border-border rounded-xl p-4 flex items-center gap-4 transition-smooth hover:shadow-md hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      data-ocid={`restaurant-${item.id}`}
    >
      <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-3xl shrink-0">
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-body font-semibold text-foreground truncate">
            {item.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isTrending && (
              <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground flex items-center gap-0.5">
                <Flame size={9} strokeWidth={2.5} />
                Trending
              </span>
            )}
            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {item.tag}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-body mt-0.5 truncate">
          {item.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-0.5">
            <Star size={11} className="text-accent fill-accent" />
            <span className="text-xs font-body font-medium text-foreground">
              {item.rating}
            </span>
            <span className="text-xs text-muted-foreground">
              ({item.reviews})
            </span>
          </div>
          <span className="text-xs text-muted-foreground">•</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} />
            {item.time}
          </div>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{item.cuisine}</span>
        </div>
      </div>
    </button>
  );
}
