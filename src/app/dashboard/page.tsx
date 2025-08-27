
"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Building, DollarSign, Package, Users, TrendingUp, Calendar, CalendarDays, ShoppingCart, CheckSquare } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBranches } from "@/hooks/use-branches";
import { useAuth } from "@/hooks/use-auth";
import { useCalendar } from "@/hooks/use-calendar";
import { useOrders } from "@/hooks/use-orders";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import { getWeatherInfo, getWeatherEmoji, WeatherInfo } from "@/lib/weather-service";
import BulletinBoard from '@/components/dashboard/bulletin-board';

interface DashboardStats {
  totalRevenue: number;
  newCustomers: number;
  weeklyOrders: number; // 총 주문 건수에서 주간 주문 건수로 변경
  pendingOrders: number;
  pendingPaymentCount: number; // 미결 주문 건수
  pendingPaymentAmount: number; // 미결 주문 금액
}

interface Order {
  id: string;
  orderer: {
    name: string;
    contact: string;
    company: string;
    email: string;
  };
  orderDate: any;
  total: number;
  status: string;
  branchName: string;
  productNames?: string; // 상품명 필드 추가
}

interface BranchSalesData {
  branch: string;
  sales: number;
  color: string;
}

// 14일간 차트 데이터 타입
interface DailySalesData {
  date: string;
  sales?: number; // 가맹점/지점 직원용
  totalSales?: number; // 본사 관리자용
  branchSales?: { [branchName: string]: number }; // 본사 관리자용
  [key: string]: any; // 지점별 매출을 동적 속성으로 추가
}

// 8주간 차트 데이터 타입
interface WeeklySalesData {
  week: string;
  sales?: number; // 가맹점/지점 직원용
  totalSales?: number; // 본사 관리자용
  branchSales?: { [branchName: string]: number }; // 본사 관리자용
  [key: string]: any; // 지점별 매출을 동적 속성으로 추가
}

// 12개월간 차트 데이터 타입
interface MonthlySalesData {
  month: string;
  sales?: number; // 가맹점/지점 직원용
  totalSales?: number; // 본사 관리자용
  branchSales?: { [branchName: string]: number }; // 본사 관리자용
  [key: string]: any; // 지점별 매출을 동적 속성으로 추가
}

export default function DashboardPage() {
  const router = useRouter();
  const { branches } = useBranches();
  const { user } = useAuth();
  const { events: calendarEvents } = useCalendar();
  const { orders } = useOrders();
  
  // 한국어 요일 배열
  const koreanWeekdays = ['일', '월', '화', '수', '목', '금', '토'];
  
  // 사용자 권한에 따른 지점 필터링
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise;
  
  // 본사 관리자용 지점 필터링 상태
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('전체');
  
  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return branches.filter(b => b.type !== '본사'); // 본사 관리자는 모든 지점 (본사 제외)
    } else {
      return branches.filter(branch => branch.name === userBranch); // 지점 직원은 자신의 지점만
    }
  }, [branches, isAdmin, userBranch]);

  // 현재 필터링된 지점 (본사 관리자는 선택된 지점, 지점 사용자는 자신의 지점)
  const currentFilteredBranch = useMemo(() => {
    if (isAdmin) {
      return selectedBranchFilter === '전체' ? null : selectedBranchFilter;
    } else {
      return userBranch;
    }
  }, [isAdmin, selectedBranchFilter, userBranch]);

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    newCustomers: 0,
    weeklyOrders: 0, // 총 주문 건수에서 주간 주문 건수로 변경
    pendingOrders: 0,
    pendingPaymentCount: 0,
    pendingPaymentAmount: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 주문 상세보기 다이얼로그 상태
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailDialogOpen, setOrderDetailDialogOpen] = useState(false);
  
  // 차트별 데이터 상태
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [weeklySales, setWeeklySales] = useState<WeeklySalesData[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  
  // 차트별 날짜 필터링 상태
  const [dailyStartDate, setDailyStartDate] = useState(format(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dailyEndDate, setDailyEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [weeklyStartDate, setWeeklyStartDate] = useState(format(new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [weeklyEndDate, setWeeklyEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [monthlyStartDate, setMonthlyStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1), 'yyyy-MM-dd'));
  const [monthlyEndDate, setMonthlyEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // 기존 날짜 상태 (다른 용도로 사용)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), 'yyyy-\'W\'ww'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // 날씨 정보 상태
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  
  // 주문 데이터를 캘린더 이벤트로 변환 (일정관리와 동일한 로직)
  const convertOrdersToEvents = useMemo(() => {
    const pickupDeliveryEvents: any[] = [];
    
    orders.forEach(order => {
      // 관리자가 아닌 경우 해당 지점의 주문만 처리
      if (!isAdmin && order.branchName !== userBranch) {
        return;
      }
      
      // 픽업 예약 처리 (즉시픽업 제외, 처리 중이거나 완료된 주문)
      if (order.pickupInfo && order.receiptType === 'pickup_reservation' && (order.status === 'processing' || order.status === 'completed')) {
        // date와 time 필드를 조합하여 날짜 객체 생성
        const pickupDateStr = order.pickupInfo.date;
        const pickupTimeStr = order.pickupInfo.time;
        if (pickupDateStr && pickupTimeStr) {
          const pickupDate = new Date(`${pickupDateStr}T${pickupTimeStr}`);
          if (!isNaN(pickupDate.getTime())) {
            pickupDeliveryEvents.push({
              id: `pickup-${order.id}`,
              title: `픽업: ${order.orderer?.name || '고객'} (${order.branchName})`,
              startDate: pickupDate,
              endDate: pickupDate,
              type: 'pickup',
              orderId: order.id,
              branchName: order.branchName,
              customerName: order.orderer?.name || '고객'
            });
          }
        }
      }
      
      // 배송 예약 처리 (즉시픽업 제외, 처리 중이거나 완료된 주문)
      if (order.deliveryInfo && order.receiptType === 'delivery_reservation' && (order.status === 'processing' || order.status === 'completed')) {
        // date와 time 필드를 조합하여 날짜 객체 생성
        const deliveryDateStr = order.deliveryInfo.date;
        const deliveryTimeStr = order.deliveryInfo.time;
        if (deliveryDateStr && deliveryTimeStr) {
          const deliveryDate = new Date(`${deliveryDateStr}T${deliveryTimeStr}`);
          if (!isNaN(deliveryDate.getTime())) {
            pickupDeliveryEvents.push({
              id: `delivery-${order.id}`,
              title: `배송: ${order.orderer?.name || '고객'} (${order.branchName})`,
              startDate: deliveryDate,
              endDate: deliveryDate,
              type: 'delivery',
              orderId: order.id,
              branchName: order.branchName,
              customerName: order.orderer?.name || '고객'
            });
          }
        }
      }
    });
    
    return pickupDeliveryEvents;
  }, [orders, isAdmin, userBranch]);

  // 오늘과 내일의 일정 데이터 (수동 일정 + 배송/픽업 이벤트)
  const todayAndTomorrowEvents = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const allEvents = [...calendarEvents, ...convertOrdersToEvents];
    
    return allEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      
      return eventDateOnly.getTime() === todayOnly.getTime() || 
             eventDateOnly.getTime() === tomorrowOnly.getTime();
    }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [calendarEvents, convertOrdersToEvents]);
  
  // 매장별 색상 정의
  const branchColors = [
    '#FF8C00', '#32CD32', '#4682B4', '#DAA520', '#FF6347', '#9370DB', '#20B2AA', '#FF69B4'
  ];
  
  const getBranchColor = (index: number) => {
    return branchColors[index % branchColors.length];
  };

  // 본사 관리자용: 선택된 기간 지점별 매출 비율 차트 데이터 생성
  const generateAdminDailySales = async (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - 13); // 기본 14일간
        return date;
      })();
      
      // 날짜 범위를 정확히 설정 (시작일 00:00:00 ~ 종료일 23:59:59)
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 선택된 기간 주문 데이터 조회
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      

      
      // 날짜별로 데이터 그룹화
      const salesByDate: { [key: string]: { [branchName: string]: number } } = {};
      
      // 선택된 기간 날짜 초기화
      const daysDiff = Math.ceil((endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(startOfDay);
        date.setDate(startOfDay.getDate() + i);
        const dateKey = format(date, 'yyyy-MM-dd');
        salesByDate[dateKey] = {};
        
        // 각 지점별 매출 초기화
        availableBranches.forEach(branch => {
          salesByDate[dateKey][branch.name] = 0;
        });
      }
      
      // 주문 데이터로 매출 계산
      console.log(`🔍 총 ${allOrders.length}개의 주문을 처리 중...`);
      let paidOrdersCount = 0;
      let completedOrdersCount = 0;
      let pendingOrdersCount = 0;
      
      allOrders.forEach((order: any) => {
        const total = order.summary?.total || order.total || 0;
        const branchName = order.branchName || '지점 미지정';
        const paymentStatus = order.payment?.status;
        
        // 상태별 카운트
        if (paymentStatus === 'paid') {
          paidOrdersCount++;
        } else if (paymentStatus === 'completed') {
          completedOrdersCount++;
        } else if (paymentStatus === 'pending') {
          pendingOrdersCount++;
        }
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (paymentStatus === 'paid' || paymentStatus === 'completed') {
          // 완결처리된 주문: 결제 완료일 기준
          let revenueDate;
          if (order.payment?.completedAt) {
            revenueDate = order.payment.completedAt.toDate();
          } else {
            // 결제 완료일이 없는 경우 주문일 기준
            const orderDate = order.orderDate;
            if (!orderDate) return;
            
            if (orderDate.toDate) {
              revenueDate = orderDate.toDate();
            } else {
              revenueDate = new Date(orderDate);
            }
          }
          
          const dateKey = format(revenueDate, 'yyyy-MM-dd');
          
          if (salesByDate[dateKey] && salesByDate[dateKey].hasOwnProperty(branchName)) {
            salesByDate[dateKey][branchName] += total;
          } else if (salesByDate[dateKey]) {
            // 지점이 availableBranches에 없지만 해당 날짜에 데이터가 있는 경우
            salesByDate[dateKey][branchName] = total;
          }
        }
      });
      
      console.log(`📊 Payment Status 통계: paid=${paidOrdersCount}, completed=${completedOrdersCount}, pending=${pendingOrdersCount}`);
      
      // 차트 데이터 형식으로 변환
      return Object.entries(salesByDate).map(([date, branchSales]) => {
        const totalSales = Object.values(branchSales).reduce((sum, sales) => sum + sales, 0);
        const dateObj = parseISO(date);
        const weekday = koreanWeekdays[dateObj.getDay()];
        
        return {
          date: `${format(dateObj, 'M/d')} (${weekday})`,
          totalSales,
          branchSales,
          ...branchSales // 각 지점별 매출을 개별 속성으로 추가
        };
      });
    } catch (error) {
      console.error("Error generating admin daily sales:", error);
      return [];
    }
  };

  // 가맹점/지점 직원용: 선택된 기간 자신의 지점 매출 차트 데이터 생성
  const generateBranchDailySales = async (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - 13); // 기본 14일간
        return date;
      })();
      
      // 날짜 범위를 정확히 설정 (시작일 00:00:00 ~ 종료일 23:59:59)
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 선택된 기간 주문 데이터 조회 (자신의 지점만)
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 자신의 지점 주문만 필터링
      const userBranchOrders = allOrders.filter((order: any) => 
        order.branchName === userBranch
      );
      

      
      // 날짜별로 매출 계산
      const salesByDate: { [key: string]: number } = {};
      
      // 선택된 기간 날짜 초기화
      const daysDiff = Math.ceil((endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24));
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(startOfDay);
        date.setDate(startOfDay.getDate() + i);
        const dateKey = format(date, 'yyyy-MM-dd');
        salesByDate[dateKey] = 0;
      }
      
      // 주문 데이터로 매출 계산
      userBranchOrders.forEach((order: any) => {
        const total = order.summary?.total || order.total || 0;
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (order.payment?.status === 'paid' || order.payment?.status === 'completed') {
          // 완결처리된 주문: 결제 완료일 기준
          let revenueDate;
          if (order.payment?.completedAt) {
            revenueDate = order.payment.completedAt.toDate();
          } else {
            // 결제 완료일이 없는 경우 주문일 기준
            const orderDate = order.orderDate;
            if (!orderDate) return;
            
            if (orderDate.toDate) {
              revenueDate = orderDate.toDate();
            } else {
              revenueDate = new Date(orderDate);
            }
          }
          
          const dateKey = format(revenueDate, 'yyyy-MM-dd');
          
          if (salesByDate[dateKey] !== undefined) {
            salesByDate[dateKey] += total;
          }
        }
      });
      
      // 차트 데이터 형식으로 변환
      return Object.entries(salesByDate).map(([date, sales]) => {
        const dateObj = parseISO(date);
        const weekday = koreanWeekdays[dateObj.getDay()];
        
        return {
          date: `${format(dateObj, 'M/d')} (${weekday})`,
          sales
        };
      });
    } catch (error) {
      console.error("Error generating branch daily sales:", error);
      return [];
    }
  };

  // 기존 함수는 유지 (다른 차트에서 사용)
  const generateRealDailySales = async (date: string) => {
    try {
      const selectedDateObj = parseISO(date);
      const startDate = startOfDay(selectedDateObj);
      const endDate = endOfDay(selectedDateObj);
      
      // 단순화된 쿼리 - 날짜만 필터링
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startDate)),
        where("orderDate", "<=", Timestamp.fromDate(endDate))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 클라이언트 사이드에서 지점 필터링
      const orders = currentFilteredBranch 
        ? allOrders.filter(order => order.branchName === currentFilteredBranch)
        : allOrders;
      
      const branchNames = availableBranches.map(b => b.name);
      const salesByBranch: { [key: string]: number } = {};
      
      // 각 매장별 매출 계산
      branchNames.forEach(branchName => {
        salesByBranch[branchName] = 0;
      });
      
      orders.forEach((order: any) => {
        const branchName = order.branchName || '지점 미지정';
        const total = order.summary?.total || order.total || 0;
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (order.payment?.status === 'paid' || order.payment?.status === 'completed') {
          if (salesByBranch.hasOwnProperty(branchName)) {
            salesByBranch[branchName] += total;
          }
        }
      });
      
      return branchNames.map((branchName, index) => ({
        branch: branchName,
        sales: salesByBranch[branchName],
        color: getBranchColor(index)
      }));
    } catch (error) {
      console.error("Error generating daily sales:", error);
      return [];
    }
  };

  // 본사 관리자용: 선택된 기간 지점별 매출 비율 차트 데이터 생성
  const generateAdminWeeklySales = async (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - 56); // 기본 8주간 (8 * 7 = 56일)
        return date;
      })();
      
      // 날짜 범위를 정확히 설정 (시작일 00:00:00 ~ 종료일 23:59:59)
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 선택된 기간 주문 데이터 조회
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      

      
      // 주별로 데이터 그룹화
      const salesByWeek: { [key: string]: { [branchName: string]: number } } = {};
      
      // 선택된 기간 주차 초기화
      const weeksDiff = Math.ceil((endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24 * 7));
      for (let i = 0; i <= weeksDiff; i++) {
        const weekStart = new Date(startOfDay);
        weekStart.setDate(startOfDay.getDate() + (i * 7));
        const weekKey = format(weekStart, 'yyyy-\'W\'ww');
        salesByWeek[weekKey] = {};
        
        // 각 지점별 매출 초기화
        availableBranches.forEach(branch => {
          salesByWeek[weekKey][branch.name] = 0;
        });
      }
      
      // 주문 데이터로 매출 계산
      allOrders.forEach((order: any) => {
        const total = order.summary?.total || order.total || 0;
        const branchName = order.branchName || '지점 미지정';
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (order.payment?.status === 'paid' || order.payment?.status === 'completed') {
          // 완결처리된 주문: 결제 완료일 기준
          let revenueDate;
          if (order.payment?.completedAt) {
            revenueDate = order.payment.completedAt.toDate();
          } else {
            // 결제 완료일이 없는 경우 주문일 기준
            const orderDate = order.orderDate;
            if (!orderDate) return;
            
            if (orderDate.toDate) {
              revenueDate = orderDate.toDate();
            } else {
              revenueDate = new Date(orderDate);
            }
          }
          
          const weekKey = format(revenueDate, 'yyyy-\'W\'ww');
          
          if (salesByWeek[weekKey] && salesByWeek[weekKey].hasOwnProperty(branchName)) {
            salesByWeek[weekKey][branchName] += total;
          } else if (salesByWeek[weekKey]) {
            // 지점이 availableBranches에 없지만 해당 주에 데이터가 있는 경우
            salesByWeek[weekKey][branchName] = total;
          }
        }
      });
      
      // 차트 데이터 형식으로 변환
      return Object.entries(salesByWeek).map(([week, branchSales]) => {
        const totalSales = Object.values(branchSales).reduce((sum, sales) => sum + sales, 0);
        
        return {
          week: week.replace('W', '주차 '),
          totalSales,
          branchSales,
          ...branchSales // 각 지점별 매출을 개별 속성으로 추가
        };
      });
    } catch (error) {
      console.error("Error generating admin weekly sales:", error);
      return [];
    }
  };

  // 가맹점/지점 직원용: 선택된 기간 자신의 지점 매출 차트 데이터 생성
  const generateBranchWeeklySales = async (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - 56); // 기본 8주간 (8 * 7 = 56일)
        return date;
      })();
      
      // 날짜 범위를 정확히 설정 (시작일 00:00:00 ~ 종료일 23:59:59)
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 선택된 기간 주문 데이터 조회 (자신의 지점만)
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 자신의 지점 주문만 필터링
      const userBranchOrders = allOrders.filter((order: any) => 
        order.branchName === userBranch
      );
      

      
      // 주별로 매출 계산
      const salesByWeek: { [key: string]: number } = {};
      
      // 선택된 기간 주차 초기화
      const weeksDiff = Math.ceil((endOfDay.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24 * 7));
      for (let i = 0; i <= weeksDiff; i++) {
        const weekStart = new Date(startOfDay);
        weekStart.setDate(startOfDay.getDate() + (i * 7));
        const weekKey = format(weekStart, 'yyyy-\'W\'ww');
        salesByWeek[weekKey] = 0;
      }
      
      // 주문 데이터로 매출 계산
      console.log(`🔍 지점 ${userBranch}의 총 ${userBranchOrders.length}개의 주문을 처리 중...`);
      let paidOrdersCount = 0;
      let completedOrdersCount = 0;
      let pendingOrdersCount = 0;
      
      userBranchOrders.forEach((order: any) => {
        const total = order.summary?.total || order.total || 0;
        const paymentStatus = order.payment?.status;
        
        // 상태별 카운트
        if (paymentStatus === 'paid') {
          paidOrdersCount++;
        } else if (paymentStatus === 'completed') {
          completedOrdersCount++;
        } else if (paymentStatus === 'pending') {
          pendingOrdersCount++;
        }
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (paymentStatus === 'paid' || paymentStatus === 'completed') {
          // 완결처리된 주문: 결제 완료일 기준
          let revenueDate;
          if (order.payment?.completedAt) {
            revenueDate = order.payment.completedAt.toDate();
          } else {
            // 결제 완료일이 없는 경우 주문일 기준
            const orderDate = order.orderDate;
            if (!orderDate) return;
            
            if (orderDate.toDate) {
              revenueDate = orderDate.toDate();
            } else {
              revenueDate = new Date(orderDate);
            }
          }
          
          const weekKey = format(revenueDate, 'yyyy-\'W\'ww');
          
          if (salesByWeek[weekKey] !== undefined) {
            salesByWeek[weekKey] += total;
          }
        }
      });
      
      console.log(`📊 지점 ${userBranch} Payment Status 통계: paid=${paidOrdersCount}, completed=${completedOrdersCount}, pending=${pendingOrdersCount}`);
      
      // 차트 데이터 형식으로 변환
      return Object.entries(salesByWeek).map(([week, sales]) => ({
        week: week.replace('W', '주차 '),
        sales
      }));
    } catch (error) {
      console.error("Error generating branch weekly sales:", error);
      return [];
    }
  };

  // 기존 함수는 유지 (다른 차트에서 사용)
  const generateRealWeeklySales = async (weekString: string) => {
    try {
      const [year, week] = weekString.split('-W');
      const startDate = startOfWeek(new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7));
      const endDate = endOfWeek(startDate);
      
      // 단순화된 쿼리 - 날짜만 필터링
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startDate)),
        where("orderDate", "<=", Timestamp.fromDate(endDate))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 클라이언트 사이드에서 지점 필터링
      const orders = currentFilteredBranch 
        ? allOrders.filter(order => order.branchName === currentFilteredBranch)
        : allOrders;
      
      const branchNames = availableBranches.map(b => b.name);
      const salesByBranch: { [key: string]: number } = {};
      
      branchNames.forEach(branchName => {
        salesByBranch[branchName] = 0;
      });
      
      orders.forEach((order: any) => {
        const branchName = order.branchName || '지점 미지정';
        const total = order.summary?.total || order.total || 0;
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (order.payment?.status === 'paid' || order.payment?.status === 'completed') {
          if (salesByBranch.hasOwnProperty(branchName)) {
            salesByBranch[branchName] += total;
          }
        }
      });
      
      return branchNames.map((branchName, index) => ({
        branch: branchName,
        sales: salesByBranch[branchName],
        color: getBranchColor(index)
      }));
    } catch (error) {
      console.error("Error generating weekly sales:", error);
      return [];
    }
  };

  // 본사 관리자용: 선택된 기간 지점별 매출 비율 차트 데이터 생성
  const generateAdminMonthlySales = async (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11); // 기본 12개월간
        date.setDate(1); // 월 첫째 날로 설정
        return date;
      })();
      
      // 날짜 범위를 정확히 설정 (시작일 00:00:00 ~ 종료일 23:59:59)
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 선택된 기간 주문 데이터 조회
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      

      
      // 월별로 데이터 그룹화
      const salesByMonth: { [key: string]: { [branchName: string]: number } } = {};
      
      // 선택된 기간 월 초기화
      const monthsDiff = (endOfDay.getFullYear() - startOfDay.getFullYear()) * 12 + (endOfDay.getMonth() - startOfDay.getMonth());
      for (let i = 0; i <= monthsDiff; i++) {
        const monthDate = new Date(startOfDay);
        monthDate.setMonth(startOfDay.getMonth() + i);
        const monthKey = format(monthDate, 'yyyy-MM');
        salesByMonth[monthKey] = {};
        
        // 각 지점별 매출 초기화
        availableBranches.forEach(branch => {
          salesByMonth[monthKey][branch.name] = 0;
        });
      }
      
      // 주문 데이터로 매출 계산
      allOrders.forEach((order: any) => {
        const total = order.summary?.total || order.total || 0;
        const branchName = order.branchName || '지점 미지정';
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (order.payment?.status === 'paid' || order.payment?.status === 'completed') {
          // 완결처리된 주문: 결제 완료일 기준
          let revenueDate;
          if (order.payment?.completedAt) {
            revenueDate = order.payment.completedAt.toDate();
          } else {
            // 결제 완료일이 없는 경우 주문일 기준
            const orderDate = order.orderDate;
            if (!orderDate) return;
            
            if (orderDate.toDate) {
              revenueDate = orderDate.toDate();
            } else {
              revenueDate = new Date(orderDate);
            }
          }
          
          const monthKey = format(revenueDate, 'yyyy-MM');
          
          if (salesByMonth[monthKey] && salesByMonth[monthKey].hasOwnProperty(branchName)) {
            salesByMonth[monthKey][branchName] += total;
          } else if (salesByMonth[monthKey]) {
            // 지점이 availableBranches에 없지만 해당 월에 데이터가 있는 경우
            salesByMonth[monthKey][branchName] = total;
          }
        }
      });
      
      // 차트 데이터 형식으로 변환
      return Object.entries(salesByMonth).map(([month, branchSales]) => {
        const totalSales = Object.values(branchSales).reduce((sum, sales) => sum + sales, 0);
        
        return {
          month: format(parseISO(month + '-01'), 'M월'),
          totalSales,
          branchSales,
          ...branchSales // 각 지점별 매출을 개별 속성으로 추가
        };
      });
    } catch (error) {
      console.error("Error generating admin monthly sales:", error);
      return [];
    }
  };

  // 가맹점/지점 직원용: 선택된 기간 자신의 지점 매출 차트 데이터 생성
  const generateBranchMonthlySales = async (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11); // 기본 12개월간
        date.setDate(1); // 월 첫째 날로 설정
        return date;
      })();
      
      // 날짜 범위를 정확히 설정 (시작일 00:00:00 ~ 종료일 23:59:59)
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 선택된 기간 주문 데이터 조회 (자신의 지점만)
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 자신의 지점 주문만 필터링
      const userBranchOrders = allOrders.filter((order: any) => 
        order.branchName === userBranch
      );
      

      
      // 월별로 매출 계산
      const salesByMonth: { [key: string]: number } = {};
      
      // 선택된 기간 월 초기화
      const monthsDiff = (endOfDay.getFullYear() - startOfDay.getFullYear()) * 12 + (endOfDay.getMonth() - startOfDay.getMonth());
      for (let i = 0; i <= monthsDiff; i++) {
        const monthDate = new Date(startOfDay);
        monthDate.setMonth(startOfDay.getMonth() + i);
        const monthKey = format(monthDate, 'yyyy-MM');
        salesByMonth[monthKey] = 0;
      }
      
      // 주문 데이터로 매출 계산
      userBranchOrders.forEach((order: any) => {
        const total = order.summary?.total || order.total || 0;
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (order.payment?.status === 'paid' || order.payment?.status === 'completed') {
          // 완결처리된 주문: 결제 완료일 기준
          let revenueDate;
          if (order.payment?.completedAt) {
            revenueDate = order.payment.completedAt.toDate();
          } else {
            // 결제 완료일이 없는 경우 주문일 기준
            const orderDate = order.orderDate;
            if (!orderDate) return;
            
            if (orderDate.toDate) {
              revenueDate = orderDate.toDate();
            } else {
              revenueDate = new Date(orderDate);
            }
          }
          
          const monthKey = format(revenueDate, 'yyyy-MM');
          
          if (salesByMonth[monthKey] !== undefined) {
            salesByMonth[monthKey] += total;
          }
        }
      });
      
      // 차트 데이터 형식으로 변환
      return Object.entries(salesByMonth).map(([month, sales]) => ({
        month: format(parseISO(month + '-01'), 'M월'),
        sales
      }));
    } catch (error) {
      console.error("Error generating branch monthly sales:", error);
      return [];
    }
  };

  // 기존 함수는 유지 (다른 차트에서 사용)
  const generateRealMonthlySales = async (monthString: string) => {
    try {
      const [year, month] = monthString.split('-');
      const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const endDate = endOfMonth(startDate);
      
      // 단순화된 쿼리 - 날짜만 필터링
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startDate)),
        where("orderDate", "<=", Timestamp.fromDate(endDate))
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 클라이언트 사이드에서 지점 필터링
      const orders = currentFilteredBranch 
        ? allOrders.filter(order => order.branchName === currentFilteredBranch)
        : allOrders;
      
      const branchNames = availableBranches.map(b => b.name);
      const salesByBranch: { [key: string]: number } = {};
      
      branchNames.forEach(branchName => {
        salesByBranch[branchName] = 0;
      });
      
      orders.forEach((order: any) => {
        const branchName = order.branchName || '지점 미지정';
        const total = order.summary?.total || order.total || 0;
        
        // 완결처리된 주문만 매출에 포함 (미결 주문 제외)
        if (order.payment?.status === 'paid' || order.payment?.status === 'completed') {
          if (salesByBranch.hasOwnProperty(branchName)) {
            salesByBranch[branchName] += total;
          }
        }
      });
      
      return branchNames.map((branchName, index) => ({
        branch: branchName,
        sales: salesByBranch[branchName],
        color: getBranchColor(index)
      }));
    } catch (error) {
      console.error("Error generating monthly sales:", error);
      return [];
    }
  };

  // 차트별 날짜 필터링 핸들러
  const handleDailyDateChange = async (startDate: string, endDate: string) => {
    setDailyStartDate(startDate);
    setDailyEndDate(endDate);
    
    try {
      if (isAdmin) {
        const adminDailyData = await generateAdminDailySales(new Date(startDate), new Date(endDate));
        setDailySales(adminDailyData);
      } else {
        const branchDailyData = await generateBranchDailySales(new Date(startDate), new Date(endDate));
        setDailySales(branchDailyData);
      }
    } catch (error) {
      console.error("Error updating daily chart data:", error);
    }
  };

  const handleWeeklyDateChange = async (startDate: string, endDate: string) => {
    setWeeklyStartDate(startDate);
    setWeeklyEndDate(endDate);
    
    try {
      if (isAdmin) {
        const adminWeeklyData = await generateAdminWeeklySales(new Date(startDate), new Date(endDate));
        setWeeklySales(adminWeeklyData);
      } else {
        const branchWeeklyData = await generateBranchWeeklySales(new Date(startDate), new Date(endDate));
        setWeeklySales(branchWeeklyData);
      }
    } catch (error) {
      console.error("Error updating weekly chart data:", error);
    }
  };

  const handleMonthlyDateChange = async (startDate: string, endDate: string) => {
    setMonthlyStartDate(startDate);
    setMonthlyEndDate(endDate);
    
    try {
      if (isAdmin) {
        const adminMonthlyData = await generateAdminMonthlySales(new Date(startDate), new Date(endDate));
        setMonthlySales(adminMonthlyData);
      } else {
        const branchMonthlyData = await generateBranchMonthlySales(new Date(startDate), new Date(endDate));
        setMonthlySales(branchMonthlyData);
      }
    } catch (error) {
      console.error("Error updating monthly chart data:", error);
    }
  };

  // 기존 날짜 변경 핸들러 (다른 용도)
  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
  };

  const handleWeekChange = async (week: string) => {
    setSelectedWeek(week);
  };

  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
  };

  // 지점 필터링 변경 핸들러
  const handleBranchFilterChange = async (branch: string) => {
    
    setSelectedBranchFilter(branch);
    // 필터링 변경 시 차트 데이터도 업데이트
    try {
      if (isAdmin) {
        // 본사 관리자: 선택된 기간 지점별 매출 비율
        const adminDailyData = await generateAdminDailySales(new Date(dailyStartDate), new Date(dailyEndDate));
        setDailySales(adminDailyData);

      } else {
        // 가맹점/지점 직원: 선택된 기간 자신의 지점 매출
        const branchDailyData = await generateBranchDailySales(new Date(dailyStartDate), new Date(dailyEndDate));
        setDailySales(branchDailyData);

      }
      
      if (isAdmin) {
        // 본사 관리자: 선택된 기간 지점별 매출 비율
        const adminWeeklyData = await generateAdminWeeklySales(new Date(weeklyStartDate), new Date(weeklyEndDate));
        const adminMonthlyData = await generateAdminMonthlySales(new Date(monthlyStartDate), new Date(monthlyEndDate));
        setWeeklySales(adminWeeklyData);
        setMonthlySales(adminMonthlyData);
      } else {
        // 가맹점/지점 직원: 선택된 기간 자신의 지점 매출
        const branchWeeklyData = await generateBranchWeeklySales(new Date(weeklyStartDate), new Date(weeklyEndDate));
        const branchMonthlyData = await generateBranchMonthlySales(new Date(monthlyStartDate), new Date(monthlyEndDate));
        setWeeklySales(branchWeeklyData);
        setMonthlySales(branchMonthlyData);
      }
    } catch (error) {
      console.error("Error updating chart data after branch filter change:", error);
    }
  };

  // 주문 상세보기 핸들러
  const handleOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailDialogOpen(true);
  };

  // 주문 상세보기 다이얼로그 닫기
  const handleCloseOrderDetail = () => {
    setSelectedOrder(null);
    setOrderDetailDialogOpen(false);
  };

  // 날씨 정보 가져오기
  useEffect(() => {
    async function fetchWeatherData() {
      try {
        const weather = await getWeatherInfo();
        setWeatherInfo(weather);
      } catch (error) {
        console.error('날씨 정보 가져오기 실패:', error);
      }
    }
    
    fetchWeatherData();
    
    // 30분마다 날씨 정보 업데이트
    const weatherInterval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    
    return () => clearInterval(weatherInterval);
  }, []);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {

        
        // 주문 데이터 가져오기 (필터링 적용) - 단순화된 쿼리
        let ordersQuery = collection(db, "orders");
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        

        
        // 클라이언트 사이드에서 필터링
        const orders = currentFilteredBranch 
          ? allOrders.filter(order => order.branchName === currentFilteredBranch)
          : allOrders;
        


        // 최근 주문 (실제 데이터) - 단순화된 쿼리
        let recentOrdersQuery = query(
          collection(db, "orders"),
          orderBy("orderDate", "desc"),
          limit(50)
        );
        
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const allRecentOrders = recentOrdersSnapshot.docs.map(doc => {
          const orderData = doc.data() as any;
          
          // 상품명 추출 로직
          let productNames = '상품 정보 없음';
          if (orderData.items && Array.isArray(orderData.items)) {
            const names = orderData.items.map((item: any) => item.name || item.productName || '상품명 없음');
            productNames = names.length > 0 ? names.join(', ') : '상품 정보 없음';
          } else if (orderData.products && Array.isArray(orderData.products)) {
            const names = orderData.products.map((product: any) => product.name || product.productName || '상품명 없음');
            productNames = names.length > 0 ? names.join(', ') : '상품 정보 없음';
          }
          
          return {
            id: doc.id,
            orderer: orderData.orderer || { name: '주문자 정보 없음' },
            orderDate: orderData.orderDate,
            total: orderData.summary?.total || orderData.total || 0,
            status: orderData.status || 'pending',
            branchName: orderData.branchName || '지점 미지정',
            productNames: productNames
          };
        });
        
                 // 클라이언트 사이드에서 필터링
         const recentOrdersData = currentFilteredBranch 
           ? allRecentOrders.filter(order => order.branchName === currentFilteredBranch).slice(0, 10)
           : allRecentOrders.slice(0, 10);
          
        setRecentOrders(recentOrdersData);

        // 기본 통계 (필터링 적용)
        // 년 매출 계산 (현재 년도의 매출만)
        const currentYear = new Date().getFullYear();
        const yearlyRevenue = orders.filter((order: any) => {
          const orderDate = order.orderDate;
          if (!orderDate) return false;
          
          let orderDateObj;
          if (orderDate.toDate) {
            orderDateObj = orderDate.toDate();
          } else {
            orderDateObj = new Date(orderDate);
          }
          
          return orderDateObj.getFullYear() === currentYear;
        }).reduce((acc, order: any) => acc + (order.summary?.total || order.total || 0), 0);
        
        const pendingOrders = orders.filter((order: any) => order.status === 'pending' || order.status === 'processing').length;
        
        // 주간 주문 건수 계산 (이번 주 월요일부터 일요일까지)
        const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // 월요일부터 시작
        const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // 일요일까지
        const weeklyOrders = orders.filter((order: any) => {
          const orderDate = order.orderDate;
          if (!orderDate) return false;
          
          let orderDateObj;
          if (orderDate.toDate) {
            orderDateObj = orderDate.toDate();
          } else {
            orderDateObj = new Date(orderDate);
          }
          
          return orderDateObj >= currentWeekStart && orderDateObj <= currentWeekEnd;
        }).length;



        // 고객 수 (필터링 적용) - 단순화된 쿼리
        let customersQuery = collection(db, "customers");
        const customersSnapshot = await getDocs(customersQuery);
        const allCustomers = customersSnapshot.docs;
        
        // 클라이언트 사이드에서 필터링
        const customers = currentFilteredBranch ? allCustomers.filter(doc => {
          const data = doc.data();
          return data.branch === currentFilteredBranch;
        }) : allCustomers;
        const newCustomers = customers.length;

        // 미결 주문 통계 계산
        const pendingPaymentOrders = orders.filter((order: any) => 
          order.payment?.status === 'pending'
        );
        const pendingPaymentCount = pendingPaymentOrders.length;
        const pendingPaymentAmount = pendingPaymentOrders.reduce((acc, order: any) => 
          acc + (order.summary?.total || order.total || 0), 0
        );

        const statsData = {
          totalRevenue: yearlyRevenue, // 총 매출을 년 매출로 변경
          newCustomers,
          weeklyOrders, // 주간 주문 건수로 변경
          pendingOrders,
          pendingPaymentCount,
          pendingPaymentAmount
        };
        

        setStats(statsData);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // 오류 발생 시 기본값 설정
        setStats({
          totalRevenue: 0,
          newCustomers: 0,
          weeklyOrders: 0, // 주간 주문 건수로 변경
          pendingOrders: 0,
          pendingPaymentCount: 0,
          pendingPaymentAmount: 0
        });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (branches.length > 0 && user) {
      fetchDashboardData().then(async () => {
        try {

          // 권한별 차트 데이터 생성
          if (isAdmin) {
            // 본사 관리자: 선택된 기간 지점별 매출 비율
            const adminDailyData = await generateAdminDailySales(new Date(dailyStartDate), new Date(dailyEndDate));
            setDailySales(adminDailyData);

          } else {
            // 가맹점/지점 직원: 선택된 기간 자신의 지점 매출
            const branchDailyData = await generateBranchDailySales(new Date(dailyStartDate), new Date(dailyEndDate));
            setDailySales(branchDailyData);

          }
          
          // 권한별 주간/월간 차트 데이터 생성
          if (isAdmin) {
            // 본사 관리자: 선택된 기간 지점별 매출 비율
            const adminWeeklyData = await generateAdminWeeklySales(new Date(weeklyStartDate), new Date(weeklyEndDate));
            const adminMonthlyData = await generateAdminMonthlySales(new Date(monthlyStartDate), new Date(monthlyEndDate));
            setWeeklySales(adminWeeklyData);
            setMonthlySales(adminMonthlyData);
          } else {
            // 가맹점/지점 직원: 선택된 기간 자신의 지점 매출
            const branchWeeklyData = await generateBranchWeeklySales(new Date(weeklyStartDate), new Date(weeklyEndDate));
            const branchMonthlyData = await generateBranchMonthlySales(new Date(monthlyStartDate), new Date(monthlyEndDate));
            setWeeklySales(branchWeeklyData);
            setMonthlySales(branchMonthlyData);
          }
        } catch (error) {
          console.error("차트 데이터 생성 오류:", error);
        }
      });
    }
  }, [branches, user, currentFilteredBranch]);

  const formatCurrency = (value: number) => `₩${value.toLocaleString()}`;
  
  const formatDate = (date: any) => {
    if (!date) return '날짜 없음';
    if (date.toDate) {
      return date.toDate().toLocaleDateString('ko-KR');
    }
    return new Date(date).toLocaleDateString('ko-KR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'completed': { text: '완료', color: 'bg-green-100 text-green-800' },
      'processing': { text: '처리중', color: 'bg-blue-100 text-blue-800' },
      'pending': { text: '대기', color: 'bg-yellow-100 text-yellow-800' },
      'cancelled': { text: '취소', color: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  // 차트용 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {isAdmin ? (
            // 본사 관리자용: 지점별 매출 + 총액 표시
            <div>
              {payload.map((entry: any, index: number) => (
                <p key={index} className="text-sm" style={{ color: entry.color }}>
                  {entry.name}: {formatCurrency(entry.value)}
                </p>
              ))}
              {/* 총액 계산 및 표시 */}
              {payload.length > 1 && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm font-semibold text-gray-800">
                    총액: {formatCurrency(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // 가맹점/지점 직원용: 자신의 지점 매출 표시
            <p className="text-sm" style={{ color: payload[0].color }}>
              매출: {formatCurrency(payload[0].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // 대시보드 제목 생성
  const getDashboardTitle = () => {
    if (isAdmin) {
      if (currentFilteredBranch) {
        return `${currentFilteredBranch} 대시보드`;
      } else {
        return '전체 대시보드';
      }
    } else {
      return `${userBranch} 대시보드`;
    }
  };

  // 대시보드 설명 생성
  const getDashboardDescription = () => {
    if (isAdmin) {
      if (currentFilteredBranch) {
        return `${currentFilteredBranch}의 현재 상태를 한 눈에 파악하세요.`;
      } else {
        return '시스템의 현재 상태를 한 눈에 파악하세요.';
      }
    } else {
      return `${userBranch}의 현재 상태를 한 눈에 파악하세요.`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-h-screen overflow-y-auto">
        <PageHeader 
          title={getDashboardTitle()} 
          description={getDashboardDescription()} 
        />
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-screen overflow-y-auto">
      <PageHeader
        title={getDashboardTitle()}
        description={getDashboardDescription()}
      />
      <BulletinBoard />
      

        
       {/* 메뉴바 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                             <Button 
                 variant="outline" 
                 size="sm" 
                 className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                 onClick={() => router.push('/dashboard/calendar')}
               >
                 <CalendarDays className="h-4 w-4 mr-2" />
                 일정관리
               </Button>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                 onClick={() => router.push('/dashboard/checklist')}
               >
                 <CheckSquare className="h-4 w-4 mr-2" />
                 체크리스트
               </Button>
              {/* 향후 다른 메뉴 버튼들을 여기에 추가할 수 있습니다 */}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 본사 관리자용 지점 필터링 드롭다운 */}
      {isAdmin && (
        <Card>
                     <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-sm font-medium text-gray-700">지점 선택:</label>
                <Select value={selectedBranchFilter} onValueChange={handleBranchFilterChange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="지점을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체 지점</SelectItem>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">
                  {currentFilteredBranch ? `${currentFilteredBranch} 데이터` : '전체 지점 데이터'}
                </span>
              </div>
           </CardContent>
        </Card>
      )}
      
      {/* 상단 통계 카드 */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin 
                ? (currentFilteredBranch ? `${currentFilteredBranch} 년 매출` : '총 년 매출')
                : `${userBranch} 년 매출`
              }
            </CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs opacity-90 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {new Date().getFullYear()}년 매출 현황
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin 
                ? (currentFilteredBranch ? `${currentFilteredBranch} 고객` : '등록 고객')
                : `${userBranch} 고객`
              }
            </CardTitle>
            <Users className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCustomers}</div>
            <p className="text-xs opacity-90 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {isAdmin && !currentFilteredBranch ? '전체 등록 고객' : '등록된 고객'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin 
                ? (currentFilteredBranch ? `${currentFilteredBranch} 주문` : '총 주문')
                : `${userBranch} 주문`
              }
            </CardTitle>
            <ShoppingCart className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyOrders.toLocaleString()}</div>
            <p className="text-xs opacity-90">이번 주 주문 건수</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin 
                ? (currentFilteredBranch ? `${currentFilteredBranch} 대기` : '처리 대기')
                : `${userBranch} 대기`
              }
            </CardTitle>
            <Calendar className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs opacity-90">처리 필요한 주문</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin 
                ? (currentFilteredBranch ? `${currentFilteredBranch} 미결` : '미결 주문')
                : `${userBranch} 미결`
              }
            </CardTitle>
            <Package className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPaymentCount}</div>
            <p className="text-xs opacity-90">{formatCurrency(stats.pendingPaymentAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 - 그리드 레이아웃으로 변경 */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* 일별 매출 현황 */}
        <Card>
                     <CardHeader>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div>
                 <CardTitle className="flex items-center gap-2">
                   <Calendar className="h-5 w-5 text-blue-600" />
                   {isAdmin 
                      ? (currentFilteredBranch ? `${currentFilteredBranch} 일별 매출` : '일별 지점별 매출 현황')
                     : `${userBranch} 일별 매출`
                   }
                 </CardTitle>
                 <p className="text-sm text-gray-600">
                    {isAdmin && !currentFilteredBranch 
                      ? '선택된 기간 지점별 매출 비율' 
                      : '선택된 기간 매출 트렌드'
                    }
                 </p>
               </div>
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                 <Input
                   type="date"
                    value={dailyStartDate}
                    onChange={(e) => handleDailyDateChange(e.target.value, dailyEndDate)}
                    className="w-full sm:w-32"
                  />
                  <span className="text-sm text-gray-500">~</span>
                  <Input
                    type="date"
                    value={dailyEndDate}
                    onChange={(e) => handleDailyDateChange(dailyStartDate, e.target.value)}
                    className="w-full sm:w-32"
                 />
               </div>
             </div>
           </CardHeader>
                     <CardContent>
             <ResponsiveContainer width="100%" height={200}>
               {isAdmin ? (
                 // 본사 관리자용: 지점별 매출 비율 차트
               <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                  {availableBranches.map((branch, index) => (
                    <Bar 
                      key={branch.name} 
                      dataKey={branch.name} 
                      stackId="a" 
                      radius={[4, 4, 0, 0]}
                      fill={getBranchColor(index)}
                    />
                  ))}
              </BarChart>
              ) : (
                // 가맹점/지점 직원용: 자신의 지점 매출 차트
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]} fill="#3B82F6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 주간 매출 현황 */}
        <Card>
                     <CardHeader>
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div>
                 <CardTitle className="flex items-center gap-2">
                   <CalendarDays className="h-5 w-5 text-green-600" />
                   {isAdmin 
                      ? (currentFilteredBranch ? `${currentFilteredBranch} 주간 매출` : '주간 지점별 매출 현황')
                     : `${userBranch} 주간 매출`
                   }
                 </CardTitle>
                 <p className="text-sm text-gray-600">
                    {isAdmin && !currentFilteredBranch 
                      ? '선택된 기간 지점별 매출 비율' 
                      : '선택된 기간 매출 트렌드'
                    }
                 </p>
               </div>
               <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                 <Input
                    type="date"
                    value={weeklyStartDate}
                    onChange={(e) => handleWeeklyDateChange(e.target.value, weeklyEndDate)}
                    className="w-full sm:w-32"
                  />
                  <span className="text-sm text-gray-500">~</span>
                  <Input
                    type="date"
                    value={weeklyEndDate}
                    onChange={(e) => handleWeeklyDateChange(weeklyStartDate, e.target.value)}
                    className="w-full sm:w-32"
                 />
               </div>
             </div>
           </CardHeader>
                     <CardContent>
             <ResponsiveContainer width="100%" height={200}>
               {isAdmin ? (
                 // 본사 관리자용: 지점별 매출 비율 차트
               <BarChart data={weeklySales}>
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" fontSize={12} />
                <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                  {availableBranches.map((branch, index) => (
                    <Bar 
                      key={branch.name} 
                      dataKey={branch.name} 
                      stackId="a" 
                      radius={[4, 4, 0, 0]}
                      fill={getBranchColor(index)}
                    />
                  ))}
              </BarChart>
              ) : (
                // 가맹점/지점 직원용: 자신의 지점 매출 차트
                <BarChart data={weeklySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]} fill="#10B981" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 월별 매출 현황 */}
      <Card>
                 <CardHeader>
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             <div>
               <CardTitle className="flex items-center gap-2">
                 <Building className="h-5 w-5 text-purple-600" />
                 {isAdmin 
                    ? (currentFilteredBranch ? `${currentFilteredBranch} 월별 매출` : '월별 지점별 매출 현황')
                   : `${userBranch} 월별 매출`
                 }
               </CardTitle>
               <p className="text-sm text-gray-600">
                  {isAdmin && !currentFilteredBranch 
                    ? '선택된 기간 지점별 매출 비율' 
                    : '선택된 기간 매출 트렌드'
                  }
               </p>
             </div>
             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
               <Input
                  type="date"
                  value={monthlyStartDate}
                  onChange={(e) => handleMonthlyDateChange(e.target.value, monthlyEndDate)}
                  className="w-full sm:w-32"
                />
                <span className="text-sm text-gray-500">~</span>
                <Input
                  type="date"
                  value={monthlyEndDate}
                  onChange={(e) => handleMonthlyDateChange(monthlyStartDate, e.target.value)}
                  className="w-full sm:w-32"
               />
             </div>
           </div>
         </CardHeader>
                 <CardContent>
           <ResponsiveContainer width="100%" height={200}>
             {isAdmin ? (
               // 본사 관리자용: 지점별 매출 비율 차트
             <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
              <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
                {availableBranches.map((branch, index) => (
                  <Bar 
                    key={branch.name} 
                    dataKey={branch.name} 
                    stackId="a" 
                    radius={[4, 4, 0, 0]}
                    fill={getBranchColor(index)}
                  />
                ))}
            </BarChart>
            ) : (
              // 가맹점/지점 직원용: 자신의 지점 매출 차트
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]} fill="#8B5CF6" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 최근 주문 목록 (실제 데이터) - 테이블 형태로 개선 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin 
              ? (currentFilteredBranch ? `${currentFilteredBranch} 최근 주문` : '최근 주문')
              : `${userBranch} 최근 주문`
            }
          </CardTitle>
          <p className="text-sm text-gray-600">실시간 주문 현황</p>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">주문ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">주문자</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">상품명</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">주문일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">출고지점</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">금액</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="text-sm font-mono text-gray-500">#{order.id.slice(-6)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{order.orderer?.name || '주문자 정보 없음'}</p>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-sm text-gray-600 truncate" title={order.productNames}>
                          {order.productNames || '상품 정보 없음'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{order.branchName}</p>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold">{formatCurrency(order.total)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                          onClick={() => handleOrderDetail(order)}
                        >
                          상세보기
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">주문 데이터가 없습니다.</p>
          )}
        </CardContent>
      </Card>

                    {/* 주문 상세보기 다이얼로그 */}
       <Dialog open={orderDetailDialogOpen} onOpenChange={handleCloseOrderDetail}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <ShoppingCart className="h-5 w-5" />
               주문 상세 정보
             </DialogTitle>
           </DialogHeader>
           {selectedOrder ? (
             <div className="space-y-6">
               {/* 기본 정보 */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <p className="text-sm font-medium text-gray-500">주문 ID</p>
                   <p className="font-mono text-lg">#{selectedOrder.id.slice(-6)}</p>
                 </div>
                 <div className="space-y-2">
                   <p className="text-sm font-medium text-gray-500">주문 상태</p>
                   <div>{getStatusBadge(selectedOrder.status)}</div>
                 </div>
                 <div className="space-y-2">
                   <p className="text-sm font-medium text-gray-500">주문일</p>
                   <p>{formatDate(selectedOrder.orderDate)}</p>
                 </div>
                 <div className="space-y-2">
                   <p className="text-sm font-medium text-gray-500">출고지점</p>
                   <p>{selectedOrder.branchName}</p>
                 </div>
               </div>

               {/* 주문자 정보 */}
               <div className="border-t pt-4">
                 <h3 className="font-medium mb-3">주문자 정보</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <p className="text-sm font-medium text-gray-500">이름</p>
                     <p>{selectedOrder.orderer?.name || '정보 없음'}</p>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm font-medium text-gray-500">연락처</p>
                     <p>{selectedOrder.orderer?.contact || '정보 없음'}</p>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm font-medium text-gray-500">회사</p>
                     <p>{selectedOrder.orderer?.company || '정보 없음'}</p>
                   </div>
                   <div className="space-y-2">
                     <p className="text-sm font-medium text-gray-500">이메일</p>
                     <p>{selectedOrder.orderer?.email || '정보 없음'}</p>
                   </div>
                 </div>
               </div>

               {/* 상품 정보 */}
               <div className="border-t pt-4">
                 <h3 className="font-medium mb-3">상품 정보</h3>
                 <div className="bg-gray-50 p-3 rounded-lg">
                   <p className="text-sm">{selectedOrder.productNames || '상품 정보 없음'}</p>
                 </div>
               </div>

               {/* 금액 정보 */}
               <div className="border-t pt-4">
                 <h3 className="font-medium mb-3">금액 정보</h3>
                 <div className="bg-blue-50 p-4 rounded-lg">
                   <p className="text-2xl font-bold text-blue-600">
                     {formatCurrency(selectedOrder.total)}
                   </p>
                 </div>
               </div>

               {/* 액션 버튼 */}
               <div className="border-t pt-4 flex justify-end gap-2">
                 <Button 
                   variant="outline" 
                   onClick={handleCloseOrderDetail}
                 >
                   닫기
                 </Button>
                 <Button 
                   onClick={() => {
                     // 주문 관리 페이지로 이동
                     window.location.href = `/dashboard/orders`;
                   }}
                 >
                   주문 관리로 이동
                 </Button>
               </div>
             </div>
           ) : (
             <div className="text-center py-8">
               <p className="text-gray-500">주문 상세를 불러올 수 없습니다.</p>
             </div>
           )}
         </DialogContent>
       </Dialog>
    </div>
  );
}

