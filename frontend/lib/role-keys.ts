import type { RoleKey } from '@/lib/api/auth.service';

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager:     'Quản Lý',
  sales_lead:  'Trưởng Nhóm Kinh Doanh',
  sales_staff: 'Nhân Viên Kinh Doanh',
  sales_intern:'Nhân Viên Thử Việc',
  cs_lead:     'Trưởng Nhóm CSKH',
  cs_staff:    'Nhân Viên CSKH',
  data_entry:  'Nhân Viên Nhập Liệu',
};

// Các role được phép vào trang admin
const ADMIN_KEYS: RoleKey[] = ['super_admin', 'manager'];

export const canAccessAdmin = (roleKey: RoleKey | null) =>
  roleKey !== null && ADMIN_KEYS.includes(roleKey);

export const getRoleLabel = (roleKey: RoleKey | null) =>
  roleKey ? (ROLE_LABELS[roleKey] ?? roleKey) : 'Chưa có vai trò';
