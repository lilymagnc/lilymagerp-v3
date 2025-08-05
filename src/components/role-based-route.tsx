"use client";

import React from 'react';
import { useUserRole } from '@/hooks/use-user-role';
import { UserRoleType, Permission } from '@/types/user-role';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX, Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  allowedRoles?: UserRoleType[];
  requiredPermissions?: Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean; // true면 모든 권한 필요, false면 하나라도 있으면 됨
}

export function RoleBasedRoute({
  allowedRoles = [],
  requiredPermissions = [],
  children,
  fallback,
  requireAll = false
}: RoleBasedRouteProps) {
  const { userRole, loading, hasPermission, hasAnyPermission } = useUserRole();

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>권한을 확인하는 중...</span>
        </div>
      </div>
    );
  }

  // 디버깅용 로그
  console.log('RoleBasedRoute - userRole:', userRole);
  console.log('RoleBasedRoute - allowedRoles:', allowedRoles);

  // 사용자 역할이 없는 경우
  if (!userRole) {
    return fallback || (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldX className="h-5 w-5" />
            접근 권한 없음
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              사용자 역할이 설정되지 않았습니다. 관리자에게 문의하세요.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // 역할 기반 접근 제어 (문자열 비교로 수정)
  const hasValidRole = allowedRoles.length === 0 || allowedRoles.some(role => role === userRole.role);
  
  // 권한 기반 접근 제어
  let hasValidPermission = true;
  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasValidPermission = requiredPermissions.every(permission => hasPermission(permission));
    } else {
      hasValidPermission = hasAnyPermission(requiredPermissions);
    }
  }

  // 디버깅용 로그
  console.log('RoleBasedRoute - hasValidRole:', hasValidRole);
  console.log('RoleBasedRoute - hasValidPermission:', hasValidPermission);

  // 접근 권한이 없는 경우
  if (!hasValidRole || !hasValidPermission) {
    return fallback || (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldX className="h-5 w-5" />
            접근 권한 없음
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              이 페이지에 접근할 권한이 없습니다. 필요한 권한이나 역할이 부족합니다.
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>현재 역할: {userRole.role}</p>
            {userRole.branchName && <p>소속 지점: {userRole.branchName}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  // 접근 권한이 있는 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
}

// 편의를 위한 특정 역할 전용 컴포넌트들
export function BranchUserRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedRoute allowedRoles={[UserRoleType.BRANCH_USER]} fallback={fallback}>
      {children}
    </RoleBasedRoute>
  );
}

export function HQManagerRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  // 임시로 모든 사용자에게 접근 허용 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>;
  }
  
  return (
    <RoleBasedRoute allowedRoles={[UserRoleType.HQ_MANAGER, UserRoleType.ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedRoute>
  );
}

export function AdminRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleBasedRoute allowedRoles={[UserRoleType.ADMIN]} fallback={fallback}>
      {children}
    </RoleBasedRoute>
  );
}