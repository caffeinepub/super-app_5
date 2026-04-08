import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { AdminPage } from "./pages/Admin";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { DeliveryPage } from "./pages/Delivery";
import { HomePage } from "./pages/Home";
import { LoginPage } from "./pages/Login";
import { ProductDetailsPage } from "./pages/ProductDetails";
import { ServicePage } from "./pages/Service";
import { ShopPage } from "./pages/Shop";
import { SignupPage } from "./pages/Signup";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const shopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop",
  component: ShopPage,
});

const shopProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop/$id",
  component: ProductDetailsPage,
});

const deliveryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/delivery",
  component: DeliveryPage,
});

const serviceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/service",
  component: ServicePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const signupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignupPage,
});

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  shopRoute,
  shopProductRoute,
  deliveryRoute,
  serviceRoute,
  adminRoute,
  loginRoute,
  signupRoute,
  cartRoute,
  checkoutRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
