import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = Principal;
export type Timestamp = bigint;
export interface OrderItem {
    qty: bigint;
    name: string;
    price: number;
}
export interface Order {
    id: bigint;
    status: OrderStatus;
    total: number;
    userId: UserId;
    date: Timestamp;
    items: Array<OrderItem>;
}
export interface UserProfile {
    displayName: string;
}
export enum OrderStatus {
    Delivered = "Delivered",
    Ongoing = "Ongoing",
    Pending = "Pending"
}
export enum UserRole {
    Customer = "Customer",
    Seller = "Seller",
    Admin = "Admin"
}
export interface backendInterface {
    assignRole(userId: UserId, role: UserRole): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createOrder(items: Array<OrderItem>): Promise<Order>;
    getAllOrders(): Promise<Array<Order>>;
    getFeaturedIds(category: string): Promise<Array<string>>;
    getFeaturedIdsByCategory(category: string): Promise<Array<string>>;
    getMyOrders(): Promise<Array<Order>>;
    getMyPrincipal(): Promise<string>;
    getMyRole(): Promise<UserRole>;
    getUserProfile(userId: UserId): Promise<UserProfile | null>;
    getUserRole(userId: UserId): Promise<UserRole>;
    isAdminSetup(): Promise<boolean>;
    requestAdminRole(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resetAdminPassword(oldHash: string, newHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setUserProfile(displayName: string): Promise<void>;
    setupAdminPassword(passwordHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateFeaturedIds(category: string, ids: Array<string>, passwordHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateOrderStatus(orderId: bigint, status: OrderStatus): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    verifyAdminPassword(passwordHash: string): Promise<boolean>;
}
