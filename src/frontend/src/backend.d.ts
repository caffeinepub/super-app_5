import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SellerDashboardSummary {
    totalNetEarnings: number;
    remainingBalance: number;
    totalWithdrawn: number;
    periodLabel: string;
    totalGrossRevenue: number;
    totalCommissionDeducted: number;
}
export type Timestamp = bigint;
export interface SellerWallet {
    pendingWithdrawal: number;
    totalWithdrawn: number;
    totalEarnings: number;
    sellerId: UserId;
}
export interface ShopOwnerProfile {
    userId: UserId;
    shopDescription: string;
    updatedAt: Timestamp;
    shopName: string;
}
export interface Product {
    id: string;
    subcategory: string;
    stockStatus: StockStatus;
    shopDescription: string;
    name: string;
    createdAt: Timestamp;
    description: string;
    sellerName: string;
    updatedAt: Timestamp;
    shopName: string;
    sellerId: UserId;
    rating: number;
    price: number;
    reviewCount: bigint;
    images: Array<string>;
}
export interface PaymentRecord {
    id: bigint;
    status: PaymentStatus;
    method: PaymentMethod;
    sellerEarnings: number;
    userId: UserId;
    submittedAt: Timestamp;
    commission: number;
    reviewedAt?: Timestamp;
    orderId: bigint;
    amount: number;
    transactionId: string;
}
export type StockStatus = string;
export interface OrderItem {
    qty: bigint;
    name: string;
    price: number;
}
export interface LeaderboardEntry {
    totalRewardEarned: number;
    totalReferrals: bigint;
    rank: bigint;
    lastReferralDate: bigint;
    referrerId: string;
}
export interface WithdrawRequest {
    id: bigint;
    status: WithdrawStatus;
    method: PaymentMethod;
    reviewedAt?: Timestamp;
    sellerId: UserId;
    accountNumber: string;
    amount: number;
    requestedAt: Timestamp;
}
export interface Order {
    id: bigint;
    status: OrderStatus;
    total: number;
    userId: UserId;
    date: Timestamp;
    items: Array<OrderItem>;
}
export interface AuditEntry {
    id: string;
    oldValue?: string;
    resourceId: string;
    newValue?: string;
    actionType: string;
    actorId: string;
    resourceType: string;
    timestamp: Timestamp;
    details: string;
}
export type UserId = Principal;
export interface ReferralRecord {
    id: string;
    status: ReferralStatus;
    completedAt: Timestamp;
    referrerReward: bigint;
    code: string;
    refereeId: string;
    refereeBonus: bigint;
    referrerId: string;
}
export interface CommissionRecord {
    id: bigint;
    rate: number;
    productId: string;
    orderId: bigint;
    timestamp: Timestamp;
    sellerId: UserId;
    amount: number;
}
export interface CommissionSummary {
    totalCommission: number;
    topProducts: Array<[string, number]>;
    topSellers: Array<[UserId, number]>;
    byPeriod: Array<[string, number]>;
}
export interface SellerProductStat {
    productId: string;
    productName: string;
    netRevenue: number;
    salesCount: bigint;
    totalRevenue: number;
    commissionDeducted: number;
}
export interface UserProfile {
    displayName: string;
}
export interface SellerEarningsByPeriod {
    period: string;
    grossRevenue: number;
    netRevenue: number;
    commissionDeducted: number;
}
export enum OrderStatus {
    Delivered = "Delivered",
    Ongoing = "Ongoing",
    Pending = "Pending"
}
export enum PaymentMethod {
    Nagad = "Nagad",
    bKash = "bKash"
}
export enum ReferralStatus {
    Invalid = "Invalid",
    Completed = "Completed",
    Pending = "Pending"
}
export enum UserRole {
    Customer = "Customer",
    Seller = "Seller",
    Admin = "Admin"
}
export enum WithdrawStatus {
    Approved = "Approved",
    Rejected = "Rejected",
    Pending = "Pending"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    approvePayment(id: bigint): Promise<boolean>;
    approveWithdrawal(id: bigint): Promise<boolean>;
    assignRole(userId: UserId, role: UserRole): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    checkLoginLockout(userId: string): Promise<{
        locked: boolean;
        remainingSecs: bigint;
    }>;
    clearLoginAttempts(userId: string): Promise<void>;
    createOrder(items: Array<OrderItem>): Promise<Order>;
    createReferralCode(userId: string): Promise<string>;
    deleteProduct(id: string): Promise<void>;
    generateOtp(userId: string, action: string): Promise<string>;
    getAdminStats(): Promise<{
        newOrders: bigint;
        pendingPayments: bigint;
        pendingWithdrawals: bigint;
    }>;
    getAllOrders(): Promise<Array<Order>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllSellerLimits(): Promise<Array<[string, number]>>;
    getAllSellerSuspensions(limit: bigint, offset: bigint): Promise<Array<AuditEntry>>;
    getAuditLog(limit: bigint, offset: bigint): Promise<Array<AuditEntry>>;
    getAuditLogByAction(actionType: string, limit: bigint, offset: bigint): Promise<Array<AuditEntry>>;
    getAuditLogByActor(actorId: string, limit: bigint, offset: bigint): Promise<Array<AuditEntry>>;
    getAuditLogByDateRange(from: bigint, to: bigint, limit: bigint, offset: bigint): Promise<Array<AuditEntry>>;
    getCommissionByMonth(months: bigint): Promise<Array<[string, number]>>;
    getCommissionByPeriod(filter: string): Promise<Array<[string, number]>>;
    getCommissionSummary(): Promise<CommissionSummary>;
    getFeaturedIds(category: string): Promise<Array<string>>;
    getFeaturedIdsByCategory(category: string): Promise<Array<string>>;
    getMyEarningsByPeriod(days: bigint, granularity: string): Promise<Array<SellerEarningsByPeriod>>;
    getMyEarningsSummary(days: bigint): Promise<SellerDashboardSummary>;
    getMyOrders(): Promise<Array<Order>>;
    getMyPrincipal(): Promise<string>;
    getMyProductStats(days: bigint): Promise<Array<SellerProductStat>>;
    getMyReferralEarnings(): Promise<bigint>;
    getMyReferrals(): Promise<Array<ReferralRecord>>;
    getMyRole(): Promise<UserRole>;
    getMySellerOrders(): Promise<Array<Order>>;
    getPayment(id: bigint): Promise<PaymentRecord | null>;
    getProductById(id: string): Promise<Product | null>;
    getProductsBySeller(sellerId: UserId): Promise<Array<Product>>;
    getReferralCode(userId: string): Promise<string | null>;
    getReferralLeaderboard(): Promise<Array<LeaderboardEntry>>;
    getSellerWallet(sellerId: UserId): Promise<SellerWallet | null>;
    getSellerWithdrawalLimit(sellerId: string): Promise<number | null>;
    getShopOwnerProfile(userId: UserId): Promise<ShopOwnerProfile | null>;
    getSuspensionAuditTrail(sellerId: string): Promise<Array<AuditEntry>>;
    getTopProducts(limit: bigint): Promise<Array<[string, number]>>;
    getTopSellers(limit: bigint): Promise<Array<[UserId, number]>>;
    getUserProfile(userId: UserId): Promise<UserProfile | null>;
    getUserRole(userId: UserId): Promise<UserRole>;
    isAdminSetup(): Promise<boolean>;
    listAllPayments(): Promise<Array<PaymentRecord>>;
    listAllWithdrawals(): Promise<Array<WithdrawRequest>>;
    listCommissions(): Promise<Array<CommissionRecord>>;
    listPendingPayments(): Promise<Array<PaymentRecord>>;
    listPendingWithdrawals(): Promise<Array<WithdrawRequest>>;
    myPayments(): Promise<Array<PaymentRecord>>;
    myWallet(): Promise<SellerWallet>;
    myWithdrawals(): Promise<Array<WithdrawRequest>>;
    processReferral(refereeId: string, referralCode: string): Promise<boolean>;
    recordLoginFailure(userId: string): Promise<bigint>;
    rejectPayment(id: bigint): Promise<boolean>;
    rejectWithdrawal(id: bigint): Promise<boolean>;
    requestAdminRole(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestWithdrawal(amount: number, method: PaymentMethod, accountNumber: string): Promise<bigint>;
    resetAdminPassword(oldHash: string, newHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSellerWithdrawalLimit(sellerId: string, limit: number): Promise<void>;
    setUserProfile(displayName: string): Promise<void>;
    setupAdminPassword(passwordHash: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitPayment(orderId: bigint, method: PaymentMethod, transactionId: string, amount: number): Promise<bigint>;
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
    updateProduct(product: Product): Promise<void>;
    updateShopOwnerProfile(profile: ShopOwnerProfile): Promise<void>;
    verifyAdminPassword(passwordHash: string): Promise<boolean>;
    verifyOtp(userId: string, action: string, code: string): Promise<boolean>;
}
