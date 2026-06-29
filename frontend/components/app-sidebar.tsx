"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Bell,
  UserCircle,
  LogOut,
  ChevronUp,
  Home,
  KeyRound,
  ShoppingCart,
  Key,
  BookOpen,
  Settings2,
  TrendingUp,
  BarChart2,
  Tag,
  PackageSearch,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/store/auth.store";
import { canAccessAdmin } from "@/lib/role-keys";

const MAIN_NAV = [
  { href: "/dashboard", label: "Tổng quan", icon: Home, exact: true },
  { href: "/dashboard/profile", label: "Hồ sơ cá nhân", icon: UserCircle },
  { href: "/dashboard/buy", label: "Mua key", icon: ShoppingCart },
  { href: "/dashboard/my-keys", label: "Keys của tôi", icon: Key },
  { href: "/dashboard/guide", label: "Hướng dẫn", icon: BookOpen },
];

const ADMIN_NAV_GROUPS = [
  {
    label: "Người dùng",
    items: [
      { href: "/admin/users", label: "Người dùng & Phân quyền", icon: Users },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingCart },
      { href: "/admin/subscriptions", label: "Key người dùng", icon: Key },
      { href: "/admin/plans", label: "Gói dịch vụ", icon: PackageSearch },
      { href: "/admin/coupons", label: "Mã giảm giá", icon: Tag },
      { href: "/admin/referrals", label: "Hoa hồng giới thiệu", icon: TrendingUp },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/admin/master-keys", label: "Master Keys (9Router)", icon: KeyRound },
      { href: "/admin/notifications", label: "Thông báo", icon: Bell },
      { href: "/admin/stats", label: "Thống kê & Doanh thu", icon: BarChart2 },
      { href: "/admin/activity-logs", label: "Nhật ký hoạt động", icon: ScrollText },
      { href: "/admin/config", label: "Cấu hình hệ thống", icon: Settings2 },
    ],
  },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link href={href} />}
        isActive={active}
        tooltip={label}
      >
        <Icon />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm">AI Key</span>
                <span className="text-xs text-muted-foreground">
                  Quản lý API Key
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tổng quan</SidebarGroupLabel>
          <SidebarMenu>
            {MAIN_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {canAccessAdmin(user?.roleKey ?? null) && ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-0.5 leading-none text-left">
                      <span className="truncate font-medium text-sm">
                        {user?.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto size-4 shrink-0" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent side="top" className="w-56" align="start">
                <DropdownMenuItem render={<Link href="/dashboard/profile" />}>
                  <UserCircle className="size-4" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    logout();
                    router.replace("/login");
                  }}
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
