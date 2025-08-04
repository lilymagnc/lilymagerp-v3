
"use client";

import { useRouter } from 'next/navigation';
import { useAuth, UserProfile } from '@/hooks/use-auth';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Boxes, ShoppingCart, Users, UserCog, LogOut, ClipboardList, Store, BookUser, Hammer, History, Briefcase, MapPin, Truck, Images } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import React from 'react';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user) {
    return null; // or a loading spinner
  }

  const getRoleDisplayName = (user: UserProfile) => {
    if (user.isAnonymous) return '익명 사용자';
    return user.role || '사용자';
  }

  // 본사 관리자 여부 확인
  const isHeadquartersAdmin = user.role === '본사 관리자';

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
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard')}><LayoutDashboard />대시보드</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/sample-albums')}><Images />샘플앨범</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/orders/new')}><ShoppingCart />주문 접수</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/orders')}><ClipboardList />주문 현황</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 본사 관리자만 접근 가능한 메뉴들 */}
                    {isHeadquartersAdmin && (
                        <>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/products')}><Boxes />상품 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={() => router.push('/dashboard/users')}><UserCog />사용자 관리</SidebarMenuButton>
                            </SidebarMenuItem>
                        </>
                    )}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/materials')}><Hammer />자재 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/stock-history')}><History />재고 변동 기록</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/customers')}><BookUser />고객 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/partners')}><Briefcase />거래처 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/branches')}><Store />지점 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/hr')}><Users />인사 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/pickup-delivery')}><Truck />픽업/배송 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/recipients')}><MapPin />수령자 관리</SidebarMenuButton>
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
                        <p className="text-xs text-muted-foreground">역할: {getRoleDisplayName(user)}</p>
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
