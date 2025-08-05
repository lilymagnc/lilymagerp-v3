"use client";

import React from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { UserRoleType, Permission } from '@/types/user-role';

interface RoleBasedMenuItemProps {
  allowedRoles?: UserRoleType[];
  requiredPermissions?: Permission[];
  children: React.ReactNode;
  requireAll?: boolean;
}

export function RoleBasedMenuItem({
  allowedRoles = [],
  requiredPermissions = [],
  children,
  requireAll = false
}: RoleBasedMenuItemProps) {
  const { userRole, hasPermission, hasAnyPermission } = useUserRole();

  // 사용자 역할이 없으면 숨김
  if (!userRole || !userRole.isActive) {
    return null;
  }

  // 역할 기반 접근 제어
  const hasValidRole = allowedRoles.length === 0 || allowedRoles.includes(userRole.role);
  
  // 권한 기반 접근 제어
  let hasValidPermission = true;
  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasValidPermission = requiredPermissions.every(permission => hasPermission(permission));
    } else {
      hasValidPermission = hasAnyPermission(requiredPermissions);
    }
  }

  // 접근 권한이 없으면 숨김
  if (!hasValidRole || !hasValidPermission) {
    return null;
  }

  return <>{children}</>;
}

// 편의를 위한 특정 역할 전용 메뉴 컴포넌트들
export function BranchUserMenu({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedMenuItem allowedRoles={[UserRoleType.BRANCH_USER]}>
      {children}
    </RoleBasedMenuItem>
  );
}

export function HQManagerMenu({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedMenuItem allowedRoles={[UserRoleType.HQ_MANAGER, UserRoleType.ADMIN]}>
      {children}
    </RoleBasedMenuItem>
  );
}

export function AdminMenu({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedMenuItem allowedRoles={[UserRoleType.ADMIN]}>
      {children}
    </RoleBasedMenuItem>
  );
}