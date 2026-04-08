import type { ShopItem } from "../types";

export const shopItems: ShopItem[] = [
  {
    id: "shop-1",
    name: "Wireless ANC Headphones",
    description:
      "Studio-quality sound with adaptive active noise cancellation. Up to 30 hours of playtime on a single charge, with a premium over-ear design built for all-day comfort.",
    category: "shop",
    subcategory: "Electronics",
    price: 79.99,
    rating: 4.8,
    reviews: 1240,
    emoji: "🎧",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    isFeatured: true,
    inStock: true,
  },
  {
    id: "shop-2",
    name: "Smart Fitness Watch",
    description:
      "Track your health, workouts, and sleep with a sleek smartwatch. Includes heart-rate monitoring, GPS, SpO2 sensor, and 7-day battery life with a gorgeous AMOLED display.",
    category: "shop",
    subcategory: "Wearables",
    price: 149.99,
    rating: 4.6,
    reviews: 387,
    emoji: "⌚",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    isFeatured: true,
    inStock: true,
  },
  {
    id: "shop-3",
    name: "Portable Bluetooth Speaker",
    description:
      "360° surround sound in a waterproof, compact form. Drop-resistant with 20 hours of playtime. Perfect for outdoor adventures, beach trips, or kitchen countertops.",
    category: "shop",
    subcategory: "Electronics",
    price: 59.99,
    rating: 4.4,
    reviews: 652,
    emoji: "🔊",
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
    isFeatured: false,
    inStock: true,
  },
  {
    id: "shop-4",
    name: "Eco-Friendly Yoga Mat",
    description:
      "Made from natural tree rubber with a non-slip grip surface. Extra-thick 6mm cushioning supports joints during yoga, pilates, and stretching. Includes carrying strap.",
    category: "shop",
    subcategory: "Sports",
    price: 44.99,
    rating: 4.7,
    reviews: 2104,
    emoji: "🧘",
    image:
      "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=600&q=80",
    isFeatured: false,
    inStock: false,
  },
  {
    id: "shop-5",
    name: "Minimalist Leather Wallet",
    description:
      "Slim, RFID-blocking bifold wallet crafted from genuine full-grain leather. Holds up to 8 cards and cash without the bulk. Available in tan, black, and navy.",
    category: "shop",
    subcategory: "Accessories",
    price: 34.99,
    rating: 4.5,
    reviews: 918,
    emoji: "👜",
    image:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80",
    isFeatured: false,
    inStock: true,
  },
  {
    id: "shop-6",
    name: "Running Shoes – Cloud X",
    description:
      "Ultra-lightweight road runners with patented cloud cushioning technology. Engineered for daily training and race-day performance. Breathable mesh upper, carbon plate midsole.",
    category: "shop",
    subcategory: "Sports",
    price: 119.99,
    rating: 4.8,
    reviews: 3041,
    emoji: "👟",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    isFeatured: false,
    inStock: true,
  },
];
