import { CheckCircle, Clock, Search, Star, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { serviceItems } from "../data/serviceItems";
import { useFeaturedIds } from "../hooks/useFeaturedIds";
import type { ServiceItem } from "../types";

function ServiceCard({
  item,
  featured = false,
}: {
  item: ServiceItem;
  featured?: boolean;
}) {
  return (
    <button
      key={item.id}
      type="button"
      className="group text-left bg-card border border-border rounded-xl p-4 flex items-start gap-4 transition-smooth hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative"
      data-ocid={`service-${item.id}`}
    >
      {featured && (
        <span className="absolute top-3 right-3 text-[10px] font-body font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-chart-3/15 text-chart-3">
          ⭐ Featured
        </span>
      )}
      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-chart-3/15">
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0 pr-16">
        <div className="flex items-start gap-2">
          <span className="font-body font-semibold text-foreground truncate">
            {item.name}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-body mt-0.5 truncate">
          {item.provider}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-1">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="font-display font-bold text-sm text-foreground">
            {item.price}
          </span>
          <div className="flex items-center gap-0.5">
            <Star size={11} className="fill-chart-3 text-chart-3" />
            <span className="text-xs font-body font-medium text-foreground">
              {item.rating}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock size={11} />
            {item.time}
          </div>
        </div>
      </div>
    </button>
  );
}

export function ServicePage() {
  const [search, setSearch] = useState("");
  const { featuredIds } = useFeaturedIds("service");

  const filtered = useMemo(
    () =>
      serviceItems.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.provider.toLowerCase().includes(search.toLowerCase()) ||
          (s.description ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const featuredItems = useMemo(
    () => serviceItems.filter((s) => featuredIds.includes(s.id)),
    [featuredIds],
  );

  const allItems = filtered;
  const isSearching = search.trim().length > 0;

  return (
    <div className="pb-20 sm:pb-0">
      {/* Header */}
      <section className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-7 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-chart-3/15">
              <Wrench size={20} className="text-chart-3" strokeWidth={1.75} />
            </div>
            <h1 className="font-display font-bold text-2xl text-foreground">
              Services
            </h1>
          </div>
          <p className="text-muted-foreground font-body text-sm mb-5">
            Trusted professionals at your service
          </p>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              className="search-input text-sm py-2.5"
              placeholder="Search services or providers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search services"
              data-ocid="service-search"
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-chart-3/20 bg-chart-3/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-chart-3">
            <CheckCircle size={14} strokeWidth={2} />
            <span className="font-body text-xs font-semibold">
              Background-checked pros
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-chart-3">
            <Star size={14} strokeWidth={2} />
            <span className="font-body text-xs font-semibold">
              4.7+ average rating
            </span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
          {/* Featured Services — hidden while searching */}
          {!isSearching && featuredItems.length > 0 && (
            <div data-ocid="featured-services-section">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⭐</span>
                <h2 className="font-display font-bold text-lg text-foreground">
                  Featured Services
                </h2>
              </div>
              <div className="featured-section">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {featuredItems.map((item) => (
                    <ServiceCard key={item.id} item={item} featured />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Services */}
          <div data-ocid="all-services-section">
            <h2 className="font-display font-bold text-lg text-foreground mb-4">
              {isSearching ? `Results for "${search}"` : "All Services"}
            </h2>

            {allItems.length === 0 ? (
              <div className="text-center py-20" data-ocid="service-empty">
                <Wrench
                  size={48}
                  className="mx-auto text-muted-foreground/40 mb-4"
                  strokeWidth={1}
                />
                <p className="font-display font-semibold text-foreground">
                  No services found
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Try a different search
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {allItems.map((item) => (
                  <ServiceCard
                    key={item.id}
                    item={item}
                    featured={featuredIds.includes(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
