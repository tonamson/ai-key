import apiClient from './client';

export interface Role {
  id: string; name: string; key: string; description?: string;
  group?: string; isActive: boolean; createdAt: string;
}

export interface AdminUser {
  id: string; email: string; name: string;
  role: string; roleId?: string; roleDetail?: Role;
  isActive: boolean; twoFactorEnabled: boolean; createdAt: string; updatedAt: string;
}

export interface Paginated<T> { items: T[]; total: number; page: number; limit: number; }

// Roles
export const roleApi = {
  list: () => apiClient.get<Role[]>('/admin/roles').then(r => r.data),
  create: (data: Partial<Role>) => apiClient.post<Role>('/admin/roles', data).then(r => r.data),
  update: (id: string, data: Partial<Role>) => apiClient.patch<Role>(`/admin/roles/${id}`, data).then(r => r.data),
  remove: (id: string) => apiClient.delete(`/admin/roles/${id}`).then(r => r.data),
};

// Users
export const adminUserApi = {
  list: (params?: { search?: string; roleId?: string; isActive?: string; page?: number; limit?: number }) =>
    apiClient.get<Paginated<AdminUser>>('/admin/users', { params }).then(r => r.data),
  get: (id: string) => apiClient.get<AdminUser>(`/admin/users/${id}`).then(r => r.data),
  create: (data: any) => apiClient.post<AdminUser>('/admin/users', data).then(r => r.data),
  update: (id: string, data: any) => apiClient.patch<AdminUser>(`/admin/users/${id}`, data).then(r => r.data),
  deactivate: (id: string) => apiClient.patch(`/admin/users/${id}/deactivate`).then(r => r.data),
  activate: (id: string) => apiClient.patch(`/admin/users/${id}/activate`).then(r => r.data),
};

// Role keys (hardcoded on backend)
export interface RoleKeyDef { key: string; label: string; }
export const roleKeyApi = {
  list: () => apiClient.get<RoleKeyDef[]>('/auth/role-keys').then(r => r.data),
};

// Activity Logs
export interface ActivityLog {
  id: string; userId?: string; user?: AdminUser; action: string;
  module: string; targetId?: string; metadata?: any; ipAddress?: string; createdAt: string;
}
export const activityLogApi = {
  list: (params?: { userId?: string; action?: string; module?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    apiClient.get<Paginated<ActivityLog>>('/admin/activity-logs', { params }).then(r => r.data),
};

// Notifications
export type NotificationType = 'system' | 'deal' | 'reminder' | 'matching';
export interface Notification {
  id: string; userId?: string; user?: AdminUser; type: NotificationType;
  title: string; body?: string; link?: string; isRead: boolean; createdAt: string;
}

// ─── 9Router Keys ────────────────────────────────────────────────────────────
export interface NineRouterKey {
  id: string; name: string; key: string;
  isActive: boolean; machineId?: string; createdAt?: string;
}

export const nineRouterApi = {
  list: () => apiClient.get<NineRouterKey[]>('/admin/master-keys').then(r => r.data),
  create: (name: string) => apiClient.post<NineRouterKey>('/admin/master-keys', { name }).then(r => r.data),
  update: (id: string, isActive: boolean) => apiClient.put<NineRouterKey>(`/admin/master-keys/${id}`, { isActive }).then(r => r.data),
  remove: (id: string) => apiClient.delete(`/admin/master-keys/${id}`).then(r => r.data),
};

// ─── Plans ──────────────────────────────────────────────────────────────────
export interface Plan { id: string; name: string; tokenQuota: number; durationDays: number; price: number; isActive: boolean; createdAt: string; }
export const planApi = {
  list: () => apiClient.get<Plan[]>('/admin/plans').then(r => r.data),
  listPublic: () => apiClient.get<Plan[]>('/plans').then(r => r.data),
  create: (data: Partial<Plan>) => apiClient.post<Plan>('/admin/plans', data).then(r => r.data),
  update: (id: string, data: Partial<Plan>) => apiClient.patch<Plan>(`/admin/plans/${id}`, data).then(r => r.data),
  remove: (id: string) => apiClient.delete(`/admin/plans/${id}`).then(r => r.data),
};

// ─── Coupons ─────────────────────────────────────────────────────────────────
export interface Coupon { id: string; code: string; discountType: 'percent' | 'fixed'; discountValue: number; maxUses?: number; usedCount: number; expiresAt?: string; isActive: boolean; }
export const couponApi = {
  list: () => apiClient.get<Coupon[]>('/admin/coupons').then(r => r.data),
  create: (data: Partial<Coupon>) => apiClient.post<Coupon>('/admin/coupons', data).then(r => r.data),
  update: (id: string, data: Partial<Coupon>) => apiClient.patch<Coupon>(`/admin/coupons/${id}`, data).then(r => r.data),
  remove: (id: string) => apiClient.delete(`/admin/coupons/${id}`).then(r => r.data),
  validate: (code: string) => apiClient.post<Coupon>('/coupons/validate', { code }).then(r => r.data),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export interface Order { id: string; userId: string; user?: AdminUser; planId: string; plan?: Plan; couponId?: string; referralCode?: string; originalPrice: number; discountAmount: number; finalPrice: number; status: 'pending' | 'paid' | 'cancelled'; paidAt?: string; nineRouterKey?: string; renewSubscriptionId?: string | null; createdAt: string; }
export const orderApi = {
  listAdmin: () => apiClient.get<Order[]>('/admin/orders').then(r => r.data),
  listMine: () => apiClient.get<Order[]>('/orders/my').then(r => r.data),
  create: (data: { planId: string; couponCode?: string; useWallet?: boolean; renewSubscriptionId?: string }) =>
    apiClient.post<{ order: Order; vietQRUrl: string }>('/orders', data).then(r => r.data),
  confirm: (id: string) => apiClient.patch<Order>(`/admin/orders/${id}/confirm`).then(r => r.data),
  cancel: (id: string) => apiClient.patch<void>(`/orders/${id}/cancel`).then(r => r.data),
};

// ─── Subscriptions ───────────────────────────────────────────────────────────
export interface KeySubscription { id: string; nineRouterKey: string; nineRouterKeyMasked?: string; tokenQuota: number; tokenUsed: number; startsAt: string; expiresAt: string; isActive: boolean; order?: { plan?: Plan }; }
export const subscriptionApi = {
  listMine: () => apiClient.get<KeySubscription[]>('/subscriptions/my').then(r => r.data),
  refreshKey: (id: string) => apiClient.post<KeySubscription>(`/subscriptions/${id}/refresh-key`).then(r => r.data),
};

// ─── Referral ────────────────────────────────────────────────────────────────
export interface WalletTransaction { id: string; amount: number; type: string; description: string | null; orderId: string | null; createdAt: string; }

export const walletApi = {
  getMe: () => apiClient.get<{ balance: number; history: WalletTransaction[] }>('/wallet/me').then(r => r.data),
  adminHistory: (userId: string) => apiClient.get<WalletTransaction[]>(`/admin/wallet/${userId}/history`).then(r => r.data),
};

export const referralApi = {
  getMyCode: () => apiClient.get<{ code: string; totalEarned: number }>('/referrals/my-code').then(r => r.data),
};

export const notificationApi = {
  list: (params?: { isRead?: boolean; page?: number; limit?: number }) =>
    apiClient.get<Paginated<Notification>>('/notifications', { params }).then(r => r.data),
  unreadCount: () =>
    apiClient.get<{ count: number }>('/notifications/unread-count').then(r => r.data),
  markRead: (id: string) =>
    apiClient.patch<Notification>(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () =>
    apiClient.patch('/notifications/read-all').then(r => r.data),
  adminList: (params?: { userId?: string; type?: string; isRead?: boolean; from?: string; to?: string; page?: number; limit?: number }) =>
    apiClient.get<Paginated<Notification>>('/admin/notifications', { params }).then(r => r.data),
  adminCreate: (data: { userId?: string; type: NotificationType; title: string; body?: string; link?: string }) =>
    apiClient.post<Notification>('/admin/notifications', data).then(r => r.data),
};

export interface StatsSummary { orders: number; revenue: number; inputTokens: number; outputTokens: number; }
export interface RevenuePoint { period: string; orders: number; revenue: number; }
export interface TokenPoint { hour: string; input: number; output: number; }

export const statsApi = {
  summary: (from: string, to: string) =>
    apiClient.get<StatsSummary>('/admin/stats/summary', { params: { from, to } }).then(r => r.data),
  revenue: (from: string, to: string, granularity: 'day' | 'week' | 'month') =>
    apiClient.get<RevenuePoint[]>('/admin/stats/revenue', { params: { from, to, granularity } }).then(r => r.data),
  tokens: (from: string, to: string) =>
    apiClient.get<TokenPoint[]>('/admin/stats/tokens', { params: { from, to } }).then(r => r.data),
};
