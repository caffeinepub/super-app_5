export type CategoryType = "shop" | "delivery" | "service";

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  category: CategoryType;
  emoji: string;
}

export interface UserProfile {
  displayName: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  category: CategoryType;
  emoji: string;
  isFeatured: boolean;
}

export interface ShopItem extends CategoryItem {
  category: "shop";
  subcategory: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  inStock: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface DeliveryItem extends CategoryItem {
  category: "delivery";
  cuisine: string;
  time: string;
  rating: number;
  reviews: number;
  tag: string;
}

export interface ServiceItem extends CategoryItem {
  category: "service";
  provider: string;
  price: string;
  time: string;
  rating: number;
  reviews: number;
  tag: string;
}

export type OrderStatus = "Pending" | "Ongoing" | "Delivered";

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: bigint;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  date: number;
  total: number;
}
