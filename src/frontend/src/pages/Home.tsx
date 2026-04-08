import { useRouter } from "@tanstack/react-router";
import {
  ArrowRight,
  Clock,
  LogIn,
  LogOut,
  Search,
  Shield,
  ShoppingBag,
  Star,
  TrendingUp,
  Truck,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deliveryItems } from "../data/deliveryItems";
import { serviceItems } from "../data/serviceItems";
import { shopItems } from "../data/shopItems";
import { useAuth } from "../hooks/useAuth";
import type { CategoryType } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: CategoryType;
  emoji: string;
}

// ─── Static data ─────────────────────────────────────────────────────────────

const allSearchItems: SearchResult[] = [
  ...shopItems.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category as CategoryType,
    emoji: i.emoji,
  })),
  ...deliveryItems.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category as CategoryType,
    emoji: i.emoji,
  })),
  ...serviceItems.map((i) => ({
    id: i.id,
    name: i.name,
    description: i.description,
    category: i.category as CategoryType,
    emoji: i.emoji,
  })),
];

const featuredItemIds = new Set<string>([
  ...shopItems.filter((i) => i.isFeatured).map((i) => i.id),
  ...deliveryItems.filter((i) => i.isFeatured).map((i) => i.id),
  ...serviceItems.filter((i) => i.isFeatured).map((i) => i.id),
]);

const categories = [
  {
    id: "shop",
    label: "Shop",
    description:
      "Browse thousands of products across electronics, fashion, home & more.",
    icon: ShoppingBag,
    to: "/shop",
    iconBg: "bg-secondary/15",
    iconColor: "text-secondary",
    borderColor: "border-secondary/60",
    hoverBorder: "hover:border-secondary",
    badge: "1,200+ Products",
  },
  {
    id: "delivery",
    label: "Delivery",
    description:
      "Fast food & grocery delivery from local restaurants and stores near you.",
    icon: Truck,
    to: "/delivery",
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
    borderColor: "border-accent/60",
    hoverBorder: "hover:border-accent",
    badge: "30 min avg",
  },
  {
    id: "service",
    label: "Services",
    description:
      "Book trusted home repair, cleaning, plumbing, and other professional services.",
    icon: Wrench,
    to: "/service",
    iconBg: "bg-chart-3/15",
    iconColor: "text-chart-3",
    borderColor: "border-chart-3/60",
    hoverBorder: "hover:border-chart-3",
    badge: "500+ Experts",
  },
] as const;

const highlights = [
  { icon: Star, label: "Top Rated", value: "4.9 avg rating" },
  { icon: Clock, label: "Fast", value: "Same-day available" },
  { icon: Shield, label: "Secure", value: "100% guaranteed" },
];

const CATEGORY_LABELS: Record<CategoryType, string> = {
  shop: "🛒 Shop",
  delivery: "🚚 Delivery",
  service: "👨‍🔧 Service",
};

const CATEGORY_BADGE_CLASS: Record<CategoryType, string> = {
  shop: "badge-shop",
  delivery: "badge-delivery",
  service: "badge-service",
};

const CATEGORY_ROUTES: Record<CategoryType, string> = {
  shop: "/shop",
  delivery: "/delivery",
  service: "/service",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function HomePage() {
  const router = useRouter();
  const { isAuthenticated, email, logout, isInitializing } = useAuth();

  const [searchValue, setSearchValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Search filtering ────────────────────────────────────────────────────────
  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return [];
    return allSearchItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [searchValue]);

  // ── Dropdown state ──────────────────────────────────────────────────────────
  useEffect(() => {
    setDropdownOpen(searchValue.trim().length > 0);
  }, [searchValue]);

  // Outside click → close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key → close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        inputRef.current?.blur();
      } else if (e.key === "Enter") {
        if (searchValue.trim()) {
          setDropdownOpen(false);
          const firstResult = searchResults[0];
          const route = firstResult
            ? CATEGORY_ROUTES[firstResult.category]
            : "/shop";
          void router.navigate({ to: route });
        }
      }
    },
    [searchValue, searchResults, router],
  );

  // Click a result → navigate
  const handleResultClick = useCallback(
    (category: CategoryType) => {
      setDropdownOpen(false);
      setSearchValue("");
      void router.navigate({ to: CATEGORY_ROUTES[category] });
    },
    [router],
  );

  // ── Greeting text ───────────────────────────────────────────────────────────
  const greetingText = isAuthenticated
    ? `Welcome back${email ? `, ${email.split("@")[0]}` : ""}! 👋`
    : "Welcome to Super App! 👋";

  const greetingSubText = isAuthenticated
    ? "Great to see you again. What are you looking for today?"
    : "Your one-stop app for shopping, delivery & services.";

  return (
    <div className="pb-20 sm:pb-0">
      {/* ── Hero / Personalized Welcome ─────────────────────────────────── */}
      <section className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-8">
          {/* Personalized greeting card */}
          <div
            className="personalized-greeting flex items-start justify-between gap-4"
            data-ocid="personalized-greeting"
          >
            <div className="min-w-0">
              <h1 className="greeting-text" data-ocid="greeting-headline">
                {isInitializing ? "Loading…" : greetingText}
              </h1>
              <p className="greeting-subtext">{greetingSubText}</p>
            </div>

            {/* Auth button */}
            {!isInitializing && (
              <div className="shrink-0">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={logout}
                    className="header-user-button text-sm font-body font-medium text-muted-foreground"
                    aria-label="Log out"
                    data-ocid="logout-btn"
                  >
                    <User size={16} className="text-primary" />
                    <span className="hidden sm:inline">Sign out</span>
                    <LogOut size={14} className="text-muted-foreground" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void router.navigate({ to: "/login" })}
                    className="header-user-button text-sm font-body font-semibold text-primary"
                    aria-label="Sign in with Internet Identity"
                    data-ocid="login-btn"
                  >
                    <LogIn size={16} />
                    <span>Sign in</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Live Search ─────────────────────────────────────────────── */}
          <div className="relative max-w-2xl" ref={searchContainerRef}>
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              className="search-input"
              placeholder="Search products, food, or services…"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search across all categories"
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              aria-controls="search-results-listbox"
              autoComplete="off"
              data-ocid="search-input"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setDropdownOpen(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
                data-ocid="search-clear"
              >
                <X size={16} />
              </button>
            )}

            {/* ── Dropdown results ────────────────────────────────────── */}
            {dropdownOpen && (
              <div
                id="search-results-listbox"
                role="menu"
                aria-label="Search results"
                className="search-results-dropdown"
                data-ocid="search-results-dropdown"
              >
                {searchResults.length === 0 ? (
                  <div
                    className="px-4 py-6 text-center text-sm text-muted-foreground font-body"
                    data-ocid="search-no-results"
                  >
                    No results found across categories
                  </div>
                ) : (
                  searchResults.map((result) => (
                    <div
                      key={result.id}
                      role="menuitem"
                      className="search-result-item flex items-center gap-3"
                      onClick={() => handleResultClick(result.category)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          handleResultClick(result.category);
                      }}
                      tabIndex={0}
                      data-ocid={`search-result-${result.id}`}
                    >
                      {/* Emoji icon */}
                      <span className="text-2xl shrink-0" aria-hidden="true">
                        {result.emoji}
                      </span>

                      {/* Name + description */}
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-semibold text-sm text-foreground truncate">
                          {result.name}
                        </p>
                        <p className="font-body text-xs text-muted-foreground truncate">
                          {result.description}
                        </p>
                      </div>

                      {/* Category badge */}
                      <span
                        className={`search-result-badge shrink-0 ${CATEGORY_BADGE_CLASS[result.category]}`}
                      >
                        {CATEGORY_LABELS[result.category]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Category Cards ──────────────────────────────────────────────────── */}
      <section className="bg-background" aria-label="Categories">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <h2 className="font-display font-semibold text-lg text-foreground mb-5">
            Browse Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map(
              ({
                id,
                label,
                description,
                icon: Icon,
                to,
                iconBg,
                iconColor,
                borderColor,
                hoverBorder,
                badge,
              }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => void router.navigate({ to })}
                  className={`group text-left bg-card border-2 ${borderColor} ${hoverBorder} rounded-xl p-5 transition-smooth hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                  data-ocid={`category-${id}`}
                  aria-label={`Browse ${label}`}
                >
                  <div
                    className={`${iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-smooth group-hover:scale-105`}
                  >
                    <Icon size={28} className={iconColor} strokeWidth={1.75} />
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-display font-bold text-xl text-foreground">
                      {label}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] font-body font-medium px-2 py-0.5 rounded-full ${iconBg} ${iconColor}`}
                    >
                      {badge}
                    </span>
                  </div>

                  <p className="text-muted-foreground font-body text-sm leading-snug mb-4 line-clamp-2">
                    {description}
                  </p>

                  <div
                    className={`flex items-center gap-1 text-sm font-body font-semibold ${iconColor} transition-smooth group-hover:gap-2`}
                  >
                    Explore {label}
                    <ArrowRight size={14} />
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Featured Trending Strip ─────────────────────────────────────────── */}
      <section className="bg-muted/20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="featured-section">
            <div className="flex items-center gap-3 mb-3">
              <span className="featured-badge">
                <TrendingUp size={14} />
                Trending Now
              </span>
            </div>
            <h3 className="featured-title">Featured Deals This Week</h3>
            <p className="featured-description">
              Hand-picked top items across shop, delivery, and services.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {allSearchItems
                .filter((i) => featuredItemIds.has(i.id))
                .slice(0, 6)
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      void router.navigate({
                        to: CATEGORY_ROUTES[item.category],
                      })
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-body font-semibold transition-smooth hover:opacity-80 search-result-badge ${CATEGORY_BADGE_CLASS[item.category]}`}
                    data-ocid={`featured-${item.id}`}
                  >
                    <span aria-hidden="true">{item.emoji}</span>
                    {item.name}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Highlights strip ────────────────────────────────────────────────── */}
      <section className="bg-muted/30 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-3 gap-4">
            {highlights.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-center sm:text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm text-foreground">
                    {label}
                  </p>
                  <p className="font-body text-xs text-muted-foreground truncate">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
