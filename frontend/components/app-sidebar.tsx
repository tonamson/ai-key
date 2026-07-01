"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
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
        className={active ? 'shadow-[0_0_8px_rgba(232,85,0,0.15)]' : ''}
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
      <SidebarHeader className="px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard" />} size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/15 text-primary shadow-[0_0_10px_rgba(232,85,0,0.2)]">
                <Key className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm">cheapaikey<span className="text-muted-foreground">.store</span></span>
                <span className="text-xs text-muted-foreground">Affordable AI API Keys</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 gap-5">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-2 mb-1.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50">Menu</SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {MAIN_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {canAccessAdmin(user?.roleKey ?? null) && ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel className="px-2 mb-1.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50">{group.label}</SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
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
