import apiClient from './client';

export interface LoginPayload { email: string; password: string; recaptchaToken: string; }
export interface RegisterPayload { email: string; password: string; name: string; recaptchaToken: string; referredBy?: string; }
export type RoleKey = 'super_admin' | 'manager' | 'sales_lead' | 'sales_staff' | 'sales_intern' | 'cs_lead' | 'cs_staff' | 'data_entry';
export interface AuthUser { id: string; email: string; name: string; roleKey: RoleKey | null; twoFactorEnabled: boolean; }
export interface LoginResponse {
  accessToken?: string;
  user?: AuthUser;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}
export interface UpdateProfilePayload { name?: string; currentPassword?: string; newPassword?: string; }

export const authService = {
  register: (payload: RegisterPayload) =>
    apiClient.post<{ accessToken: string; user: AuthUser }>('/auth/register', payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  verifyTwoFactor: (tempToken: string, code: string) =>
    apiClient.post<{ accessToken: string; user: AuthUser }>('/auth/2fa/verify', { tempToken, code }).then((r) => r.data),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient.patch<AuthUser>('/auth/profile', payload).then((r) => r.data),

  setupTwoFactor: () =>
    apiClient.post<{ otpauthUrl: string; secret: string }>('/auth/2fa/setup').then((r) => r.data),

  enableTwoFactor: (code: string) =>
    apiClient.post<{ enabled: boolean }>('/auth/2fa/enable', { code }).then((r) => r.data),

  disableTwoFactor: (code: string) =>
    apiClient.delete<{ enabled: boolean }>('/auth/2fa/disable', { data: { code } }).then((r) => r.data),
};
