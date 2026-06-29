export const ROLE_KEYS = [
  // Ban Giám Đốc
  { key: 'super_admin', label: 'Super Admin' },
  { key: 'manager', label: 'Quản Lý' },

  // Kinh Doanh
  { key: 'sales_lead', label: 'Trưởng Nhóm Kinh Doanh' },
  { key: 'sales_staff', label: 'Nhân Viên Kinh Doanh' },
  { key: 'sales_intern', label: 'Nhân Viên Thử Việc' },

  // Chăm Sóc Khách Hàng
  { key: 'cs_lead', label: 'Trưởng Nhóm CSKH' },
  { key: 'cs_staff', label: 'Nhân Viên CSKH' },

  // Nhập Liệu & Vận Hành
  { key: 'data_entry', label: 'Nhân Viên Nhập Liệu' },
] as const;

export type RoleKey = (typeof ROLE_KEYS)[number]['key'];

/**
 * Danh sách permission hành động trong hệ thống.
 * Guard check permission thay vì so sánh roleKey string trực tiếp,
 * để thêm role mới không cần sửa từng controller.
 */
export type Permission =
  | 'admin:all'        // xem/sửa toàn bộ hệ thống, mọi phòng ban
  | 'admin:dept'       // xem/sửa trong phạm vi phòng ban của mình
  | 'users:manage'     // tạo/sửa/khóa nhân viên
  | 'roles:manage'     // quản lý vai trò
  | 'settings:manage'  // cấu hình hệ thống
  | 'plans:manage'     // quản lý gói dịch vụ
  | 'coupons:manage'   // quản lý mã giảm giá
  | 'orders:manage';   // quản lý đơn hàng

/** Mỗi roleKey khai báo tập permissions của nó */
export const ROLE_PERMISSIONS: Record<RoleKey, Permission[]> = {
  super_admin:  ['admin:all', 'users:manage', 'roles:manage', 'settings:manage', 'plans:manage', 'coupons:manage', 'orders:manage'],
  manager:      ['admin:dept', 'users:manage', 'plans:manage', 'coupons:manage', 'orders:manage'],
  sales_lead:   ['admin:dept'],
  sales_staff:  [],
  sales_intern: [],
  cs_lead:      ['admin:dept'],
  cs_staff:     [],
  data_entry:   [],
};

export function hasPermission(roleKey: RoleKey | null, permission: Permission): boolean {
  if (!roleKey) return false;
  const perms = ROLE_PERMISSIONS[roleKey] ?? [];
  // admin:all is a superset of admin:dept
  if (permission === 'admin:dept' && perms.includes('admin:all')) return true;
  return perms.includes(permission);
}

/** Mô tả từng permission để FE admin hiển thị khi tạo/sửa role */
export const PERMISSION_LABELS: Record<Permission, { label: string; description: string }> = {
  'admin:all':      { label: 'Quản trị toàn hệ thống', description: 'Xem và thao tác dữ liệu của mọi phòng ban, không giới hạn phạm vi' },
  'admin:dept':     { label: 'Quản trị phòng ban', description: 'Xem và thao tác dữ liệu trong phạm vi phòng ban của mình' },
  'users:manage':   { label: 'Quản lý nhân viên', description: 'Tạo, sửa, khóa tài khoản nhân viên' },
  'roles:manage':   { label: 'Quản lý vai trò', description: 'Tạo, sửa, xóa vai trò trong hệ thống' },
  'settings:manage':{ label: 'Cấu hình hệ thống', description: 'Quản lý phòng ban, danh mục, cấu hình chung' },
  'plans:manage':   { label: 'Quản lý gói dịch vụ', description: 'Tạo, sửa, ẩn gói token' },
  'coupons:manage': { label: 'Quản lý mã giảm giá', description: 'Tạo, sửa, ẩn mã giảm giá' },
  'orders:manage':  { label: 'Quản lý đơn hàng', description: 'Xem và xác nhận đơn hàng thanh toán' },
};
