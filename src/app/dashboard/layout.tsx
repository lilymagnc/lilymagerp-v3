
"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Boxes, ShoppingCart, Users, UserCog, LogOut, ClipboardList, Store, BookUser, Hammer, History, Briefcase, MapPin, Truck, Images, DollarSign, Target, BarChart3, Package, Receipt } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import React from 'react';
import Image from 'next/image';
import { ROLE_LABELS } from '@/types/user-role';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading, isHQManager, isBranchUser, isBranchManager } = useUserRole();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 지점 사용자가 로그인 후 주문접수 페이지로 리다이렉트 (허용된 페이지 제외)
  React.useEffect(() => {
    if (!loading && !roleLoading && user && !isHQManager()) {
      const currentPath = window.location.pathname;
      // 허용된 페이지 목록 (지점 사용자가 접근 가능한 페이지들)
      const allowedPages = [
        '/dashboard/orders/new',           // 주문접수
        '/dashboard/material-request',     // 자재요청
        '/dashboard/orders',               // 주문현황
        '/dashboard/pickup-delivery',      // 픽업/배송관리
        '/dashboard/recipients',           // 수령자관리
        '/dashboard/materials',            // 자재관리
        '/dashboard/simple-expenses',      // 간편지출관리
        '/dashboard/customers',            // 고객관리
        '/dashboard/partners',             // 거래처관리
        '/dashboard/sample-albums'         // 샘플앨범
      ];
      
      // 허용된 페이지가 아닌 경우에만 주문접수 페이지로 리다이렉트
      if (!allowedPages.includes(currentPath)) {
        router.push('/dashboard/orders/new');
      }
    }
  }, [user, loading, roleLoading, isHQManager, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || roleLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  const getRoleDisplayName = () => {
    if (user.isAnonymous) return '익명 사용자';
    if (userRole) return ROLE_LABELS[userRole.role];
    return '사용자';
  };

  return (
    <SidebarProvider defaultOpen={true}>
        <Sidebar className="no-print">
            <SidebarHeader className="p-4">
                <div className="flex items-center justify-center">
                    <Image 
                      src="https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg" 
                      alt="Logo" 
                      width={150} 
                      height={40} 
                      className="w-36 h-auto"
                      priority 
                    />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {/* 1. 대시보드 (본사 관리자만) */}
                    {isHQManager() && (
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => router.push('/dashboard')}><LayoutDashboard />대시보드</SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    
                    {/* 2. 샘플앨범 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/sample-albums')}><Images />샘플앨범</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 3. 주문 접수 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/orders/new')}><ShoppingCart />주문 접수</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 4. 주문 현황 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/orders')}><ClipboardList />주문 현황</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 5. 픽업/배송 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/pickup-delivery')}><Truck />픽업/배송 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 6. 수령자 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/recipients')}><MapPin />수령자 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 7. 자재 요청 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/material-request')}><Package />자재 요청</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 본사 관리자만 접근 가능한 메뉴들 */}
                    {isHQManager() && (
                        <>
                            {/* 8. 구매 관리 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/purchase-management')}><ShoppingCart />구매 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 9. 상품 관리 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/products')}><Boxes />상품 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 10. 재고 변동 기록 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/stock-history')}><History />재고 변동 기록</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 11. 인사 관리 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/hr')}><Users />인사 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 12. 지점 관리 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/branches')}><Store />지점 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 13. 사용자 관리 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/users')}><UserCog />사용자 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 14. 비용 관리 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/expenses')}><DollarSign />비용 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 15. 예산 관리 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/budgets')}><Target />예산 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            
                            {/* 16. 리포트 분석 (본사 관리자만) */}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/reports')}><BarChart3 />리포트 분석</SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}
                    
                    {/* 17. 자재 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/materials')}><Hammer />자재 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 18. 간편 지출관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/simple-expenses')}><Receipt />간편 지출관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 19. 고객 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/customers')}><BookUser />고객 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {/* 20. 거래처 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/partners')}><Briefcase />거래처 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4">
                <div className="flex items-center gap-3 mb-2">
                    <Avatar>
                        <AvatarImage src={user.photoURL ?? ''} />
                        <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.isAnonymous ? '익명 사용자' : user.email}</p>
                        <p className="text-xs text-muted-foreground">역할: {getRoleDisplayName()}</p>
                        {userRole?.branchName && (
                            <p className="text-xs text-muted-foreground">지점: {userRole.branchName}</p>
                        )}
                    </div>
                </div>

                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />로그아웃</Button>
            </SidebarFooter>
        </Sidebar>
        <main className="flex-1 print:flex-grow-0 print:w-full print:max-w-full print:p-0 print:m-0">
             <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="w-full flex-1">
                    {/* Header content can go here if needed */}
                </div>
             </header>
            <div className="p-4 lg:p-6">
                {children}
            </div>
        </main>
    </SidebarProvider>
  );
}
