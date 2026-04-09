import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { createActor } from "../backend";
import type { Product } from "../backend.d";
import type { BackendProduct } from "../types";

function mapProduct(p: Product): BackendProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    images: p.images,
    sellerId:
      typeof p.sellerId === "string"
        ? p.sellerId
        : (p.sellerId as { toText(): string }).toText(),
    sellerName: p.sellerName,
    shopName: p.shopName,
    shopDescription: p.shopDescription,
    subcategory: p.subcategory,
    price: p.price,
    stockStatus: p.stockStatus as BackendProduct["stockStatus"],
    rating: p.rating,
    reviewCount: p.reviewCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/** Fetches all products from the backend. */
export function useAllProducts() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<BackendProduct[]>({
    queryKey: ["allProducts"],
    queryFn: async () => {
      if (!actor) return [];
      const products = await actor.getAllProducts();
      return products.map(mapProduct);
    },
    enabled: !!actor && !isFetching,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetches a single product by ID. */
export function useProductById(id: string) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<BackendProduct | null>({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      const product = await actor.getProductById(id);
      return product ? mapProduct(product) : null;
    },
    enabled: !!actor && !isFetching && !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetches all products belonging to a specific seller. */
export function useProductsBySeller(sellerId: string) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<BackendProduct[]>({
    queryKey: ["productsBySeller", sellerId],
    queryFn: async () => {
      if (!actor || !sellerId) return [];
      const products = await actor.getProductsBySeller(
        sellerId as unknown as import("@icp-sdk/core/principal").Principal,
      );
      return products.map(mapProduct);
    },
    enabled: !!actor && !isFetching && !!sellerId,
    staleTime: 2 * 60 * 1000,
  });
}
