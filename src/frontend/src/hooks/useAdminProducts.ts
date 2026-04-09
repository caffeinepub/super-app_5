import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  ShopOwnerProfile as BackendShopOwnerProfile,
  Product,
} from "../backend.d";
import type { BackendProduct, ShopOwnerProfile } from "../types";

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

function mapShopOwnerProfile(p: BackendShopOwnerProfile): ShopOwnerProfile {
  return {
    userId:
      typeof p.userId === "string"
        ? p.userId
        : (p.userId as { toText(): string }).toText(),
    shopName: p.shopName,
    shopDescription: p.shopDescription,
    updatedAt: p.updatedAt,
  };
}

/** Admin: fetch all products */
export function useAdminAllProducts() {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<BackendProduct[]>({
    queryKey: ["admin", "allProducts"],
    queryFn: async () => {
      if (!actor) return [];
      const products = await actor.getAllProducts();
      return products.map(mapProduct);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60 * 1000,
  });
}

/** Admin: add a new product */
export function useAddProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.addProduct(product);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "allProducts"],
      });
      void queryClient.invalidateQueries({ queryKey: ["allProducts"] });
    },
  });
}

/** Admin: update an existing product */
export function useUpdateProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateProduct(product);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "allProducts"],
      });
      void queryClient.invalidateQueries({ queryKey: ["allProducts"] });
      void queryClient.invalidateQueries({
        queryKey: ["product", variables.id],
      });
    },
  });
}

/** Admin: delete a product by ID */
export function useDeleteProduct() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteProduct(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "allProducts"],
      });
      void queryClient.invalidateQueries({ queryKey: ["allProducts"] });
    },
  });
}

/** Admin: update shop owner profile */
export function useUpdateShopOwnerProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: BackendShopOwnerProfile) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateShopOwnerProfile(profile);
    },
    onSuccess: (_data, variables) => {
      const userId =
        typeof variables.userId === "string"
          ? variables.userId
          : (variables.userId as { toText(): string }).toText();
      void queryClient.invalidateQueries({
        queryKey: ["shopOwnerProfile", userId],
      });
    },
  });
}

/** Admin: get shop owner profile by user ID */
export function useGetShopOwnerProfile(userId: string) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<ShopOwnerProfile | null>({
    queryKey: ["shopOwnerProfile", userId],
    queryFn: async () => {
      if (!actor || !userId) return null;
      const profile = await actor.getShopOwnerProfile(
        userId as unknown as import("@icp-sdk/core/principal").Principal,
      );
      return profile ? mapShopOwnerProfile(profile) : null;
    },
    enabled: !!actor && !isFetching && !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
