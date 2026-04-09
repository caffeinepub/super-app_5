import { useRouter, useRouterState } from "@tanstack/react-router";
import {
  Gift,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  User,
  UserPlus,
  Wallet,
  Wrench,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/delivery", label: "Delivery", icon: Truck },
  { to: "/service", label: "Service", icon: Wrench },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const routerState = useRouterState();
  const router = useRouter();
  const currentPath = routerState.location.pathname;

  const { isAuthenticated, email, logout, isInitializing, role } = useAuth();
  const { cartCount, toastMessage, dismissToast } = useCart();

  const isAdminActive = currentPath === "/admin";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            type="button"
            onClick={() => void router.navigate({ to: "/" })}
            className="flex items-center gap-2 group"
            aria-label="Go to homepage"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src="/logo192.png"
                alt="Super App Logo"
                loading="eager"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight">
              SuperApp
            </span>
          </button>

          {/* Desktop nav + auth */}
          <div className="hidden sm:flex items-center gap-1">
            <nav
              className="flex items-center gap-1 mr-2"
              aria-label="Main navigation"
            >
              {navItems.slice(1).map(({ to, label, icon: Icon }) => (
                <button
                  key={to}
                  type="button"
                  onClick={() => void router.navigate({ to })}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-medium transition-smooth ${
                    currentPath === to ||
                    (to === "/shop" && currentPath.startsWith("/shop/"))
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                  data-ocid={`nav-${label.toLowerCase()}`}
                >
                  <Icon size={15} />
                  {label}
                  {label === "Shop" && cartCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void router.navigate({ to: "/cart" });
                      }}
                      className="cart-badge ml-0.5 cursor-pointer"
                      aria-label={`${cartCount} items in cart — view cart`}
                      data-ocid="nav-cart-badge"
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </button>
                  )}
                </button>
              ))}

              {/* Admin link — always visible, boldly styled */}
              <button
                type="button"
                onClick={() => void router.navigate({ to: "/admin" })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-semibold transition-smooth ml-1 ${
                  isAdminActive
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-violet-100 text-violet-700 hover:bg-violet-200 hover:text-violet-900 border border-violet-300"
                }`}
                data-ocid="nav-admin"
                aria-label="Admin panel"
              >
                <ShieldCheck size={15} strokeWidth={2.5} />
                Admin
              </button>

              {/* Wallet link — visible for authenticated sellers */}
              {isAuthenticated && role === "Seller" && (
                <button
                  type="button"
                  onClick={() => void router.navigate({ to: "/wallet" })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-semibold transition-smooth ml-1 ${
                    currentPath === "/wallet"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-300"
                  }`}
                  data-ocid="nav-wallet"
                  aria-label="My wallet"
                >
                  <Wallet size={15} strokeWidth={2.5} />
                  Wallet
                </button>
              )}

              {/* Seller Dashboard link — visible for authenticated sellers */}
              {isAuthenticated && role === "Seller" && (
                <button
                  type="button"
                  onClick={() =>
                    void router.navigate({ to: "/seller-dashboard" })
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-semibold transition-smooth ml-1 ${
                    currentPath === "/seller-dashboard"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-300"
                  }`}
                  data-ocid="nav-seller-dashboard"
                  aria-label="Seller dashboard"
                >
                  <LayoutDashboard size={15} strokeWidth={2.5} />
                  Dashboard
                </button>
              )}

              {/* Referral link — visible for logged-in Customers and Sellers */}
              {isAuthenticated &&
                (role === "Customer" || role === "Seller") && (
                  <button
                    type="button"
                    onClick={() => void router.navigate({ to: "/referral" })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-semibold transition-smooth ml-1 ${
                      currentPath === "/referral"
                        ? "bg-teal-600 text-white shadow-md"
                        : "bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-900 border border-teal-300"
                    }`}
                    data-ocid="nav-referral"
                    aria-label="Refer and earn"
                  >
                    <Gift size={15} strokeWidth={2.5} />
                    Refer &amp; Earn
                  </button>
                )}
            </nav>

            {/* Auth section */}
            {!isInitializing &&
              (isAuthenticated ? (
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5">
                    <User size={14} className="text-primary" />
                    <span className="text-xs font-body font-medium text-foreground max-w-[120px] truncate">
                      {email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="header-user-button text-sm font-body font-medium text-muted-foreground hover:text-foreground"
                    aria-label="Log out"
                    data-ocid="auth-logout"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <button
                    type="button"
                    onClick={() => void router.navigate({ to: "/login" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-smooth"
                    data-ocid="auth-login"
                  >
                    <LogIn size={15} />
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => void router.navigate({ to: "/signup" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-body font-semibold transition-smooth hover:opacity-90 active:scale-95"
                    data-ocid="auth-signup"
                  >
                    <UserPlus size={15} />
                    Sign Up
                  </button>
                </div>
              ))}
          </div>

          {/* Mobile header right: cart + auth icon */}
          <div className="sm:hidden flex items-center gap-2">
            {cartCount > 0 && (
              <button
                type="button"
                onClick={() => void router.navigate({ to: "/cart" })}
                className="relative w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center transition-smooth hover:bg-primary/20"
                aria-label={`Cart: ${cartCount} items`}
                data-ocid="mobile-cart"
              >
                <ShoppingCart size={18} className="text-primary" />
                <span
                  className="cart-badge absolute -top-1 -right-1"
                  aria-hidden
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              </button>
            )}
            {!isInitializing &&
              (isAuthenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center transition-smooth hover:bg-primary/20"
                  aria-label="Log out"
                  data-ocid="auth-logout-mobile"
                >
                  <User size={18} className="text-primary" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void router.navigate({ to: "/login" })}
                  className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center transition-smooth hover:opacity-90"
                  aria-label="Log in"
                  data-ocid="auth-login-mobile"
                >
                  <LogIn size={16} className="text-primary-foreground" />
                </button>
              ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50"
        aria-label="Mobile navigation"
      >
        <div
          className={`grid h-16 ${isAuthenticated && role === "Seller" ? "grid-cols-8" : isAuthenticated ? "grid-cols-6" : "grid-cols-5"}`}
        >
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive =
              currentPath === to ||
              (to === "/shop" && currentPath.startsWith("/shop/"));
            return (
              <button
                key={to}
                type="button"
                onClick={() => void router.navigate({ to })}
                className={`relative flex flex-col items-center justify-center gap-0.5 transition-smooth ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                aria-label={label}
                data-ocid={`mobile-nav-${label.toLowerCase()}`}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  {label === "Shop" && cartCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void router.navigate({ to: "/cart" });
                      }}
                      className="cart-badge absolute -top-1.5 -right-2"
                      aria-label={`${cartCount} items in cart`}
                      data-ocid="mobile-nav-cart-badge"
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </button>
                  )}
                </span>
                <span className="text-[10px] font-body font-medium">
                  {label}
                </span>
              </button>
            );
          })}

          {/* Wallet — visible for sellers only */}
          {isAuthenticated && role === "Seller" && (
            <button
              type="button"
              onClick={() => void router.navigate({ to: "/wallet" })}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-smooth ${
                currentPath === "/wallet"
                  ? "text-white bg-emerald-600"
                  : "text-emerald-600 bg-emerald-50"
              }`}
              aria-label="My wallet"
              data-ocid="mobile-nav-wallet"
            >
              <Wallet
                size={20}
                strokeWidth={currentPath === "/wallet" ? 2.5 : 2}
              />
              <span className="text-[10px] font-body font-bold">Wallet</span>
            </button>
          )}

          {/* Seller Dashboard — visible for sellers only */}
          {isAuthenticated && role === "Seller" && (
            <button
              type="button"
              onClick={() => void router.navigate({ to: "/seller-dashboard" })}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-smooth ${
                currentPath === "/seller-dashboard"
                  ? "text-white bg-indigo-600"
                  : "text-indigo-600 bg-indigo-50"
              }`}
              aria-label="Seller dashboard"
              data-ocid="mobile-nav-seller-dashboard"
            >
              <LayoutDashboard
                size={20}
                strokeWidth={currentPath === "/seller-dashboard" ? 2.5 : 2}
              />
              <span className="text-[10px] font-body font-bold">Dash</span>
            </button>
          )}

          {/* Admin — always visible with purple accent */}
          <button
            type="button"
            onClick={() => void router.navigate({ to: "/admin" })}
            className={`relative flex flex-col items-center justify-center gap-0.5 transition-smooth ${
              isAdminActive
                ? "text-white bg-violet-600"
                : "text-violet-600 bg-violet-50"
            }`}
            aria-label="Admin panel"
            data-ocid="mobile-nav-admin"
          >
            {/* Admin badge pill */}
            {!isAdminActive && (
              <span className="absolute top-1 right-1 text-[8px] font-bold bg-violet-600 text-white rounded-full px-1 py-px leading-none tracking-wide">
                ADMIN
              </span>
            )}
            <ShieldCheck size={20} strokeWidth={isAdminActive ? 2.5 : 2} />
            <span className="text-[10px] font-body font-bold">Admin</span>
          </button>

          {/* Referral — visible for logged-in Customers and Sellers */}
          {isAuthenticated && (role === "Customer" || role === "Seller") && (
            <button
              type="button"
              onClick={() => void router.navigate({ to: "/referral" })}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-smooth ${
                currentPath === "/referral"
                  ? "text-white bg-teal-600"
                  : "text-teal-600 bg-teal-50"
              }`}
              aria-label="Refer and earn"
              data-ocid="mobile-nav-referral"
            >
              <Gift
                size={20}
                strokeWidth={currentPath === "/referral" ? 2.5 : 2}
              />
              <span className="text-[10px] font-body font-bold">Refer</span>
            </button>
          )}
        </div>
      </nav>

      {/* Footer — sits above mobile bottom nav */}
      <footer className="bg-card border-t border-border mt-auto pb-16 sm:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground font-body">
            © {new Date().getFullYear()} SuperApp. All rights reserved.
          </span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground font-body hover:text-foreground transition-smooth"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </footer>

      {/* Global toast notification */}
      {toastMessage && (
        <button
          type="button"
          aria-live="polite"
          className="fixed top-20 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border shadow-lg text-sm font-body text-foreground max-w-xs text-left"
          onClick={dismissToast}
        >
          <span className="text-chart-3 text-base">✓</span>
          <span>{toastMessage}</span>
        </button>
      )}
    </div>
  );
}
