
"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Building, DollarSign, Package, Users, TrendingUp, Calendar, CalendarDays } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBranches } from "@/hooks/use-branches";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

interface DashboardStats {
  totalRevenue: number;
  newCustomers: number;
  totalProducts: number;
  pendingOrders: number;
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
}

interface BranchSalesData {
  branch: string;
  sales: number;
  color: string;
}

export default function DashboardPage() {
  const { branches } = useBranches();
  const { user } = useAuth();
  
  // 사용자 권한에 따른 지점 필터링
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise;
  
  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return branches.filter(b => b.type !== '본사'); // 본사 관리자는 모든 지점 (본사 제외)
    } else {
      return branches.filter(branch => branch.name === userBranch); // 지점 직원은 자신의 지점만
    }
  }, [branches, isAdmin, userBranch]);

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    newCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 차트별 데이터 상태
  const [dailySales, setDailySales] = useState<BranchSalesData[]>([]);
  const [weeklySales, setWeeklySales] = useState<BranchSalesData[]>([]);
  const [monthlySales, setMonthlySales] = useState<BranchSalesData[]>([]);
  
  // 검색 날짜 상태
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), 'yyyy-\'W\'ww'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // 매장별 색상 정의
  const branchColors = [
    '#FF8C00', '#32CD32', '#4682B4', '#DAA520', '#FF6347', '#9370DB', '#20B2AA', '#FF69B4'
  ];
  
  const getBranchColor = (index: number) => {
    return branchColors[index % branchColors.length];
  };

  // 실제 파이어스토어 데이터로 일별 매출 생성 (필터링 적용) - 단순화된 쿼리
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
      const orders = isAdmin ? allOrders : allOrders.filter(order => order.branchName === userBranch);
      
      const branchNames = availableBranches.map(b => b.name);
      const salesByBranch: { [key: string]: number } = {};
      
      // 각 매장별 매출 계산
      branchNames.forEach(branchName => {
        salesByBranch[branchName] = 0;
      });
      
      orders.forEach((order: any) => {
        const branchName = order.branchName || '지점 미지정';
        const total = order.summary?.total || order.total || 0;
        if (salesByBranch.hasOwnProperty(branchName)) {
          salesByBranch[branchName] += total;
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

  // 실제 파이어스토어 데이터로 주간 매출 생성 (필터링 적용) - 단순화된 쿼리
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
      const orders = isAdmin ? allOrders : allOrders.filter(order => order.branchName === userBranch);
      
      const branchNames = availableBranches.map(b => b.name);
      const salesByBranch: { [key: string]: number } = {};
      
      branchNames.forEach(branchName => {
        salesByBranch[branchName] = 0;
      });
      
      orders.forEach((order: any) => {
        const branchName = order.branchName || '지점 미지정';
        const total = order.summary?.total || order.total || 0;
        if (salesByBranch.hasOwnProperty(branchName)) {
          salesByBranch[branchName] += total;
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

  // 실제 파이어스토어 데이터로 월별 매출 생성 (필터링 적용) - 단순화된 쿼리
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
      const orders = isAdmin ? allOrders : allOrders.filter(order => order.branchName === userBranch);
      
      const branchNames = availableBranches.map(b => b.name);
      const salesByBranch: { [key: string]: number } = {};
      
      branchNames.forEach(branchName => {
        salesByBranch[branchName] = 0;
      });
      
      orders.forEach((order: any) => {
        const branchName = order.branchName || '지점 미지정';
        const total = order.summary?.total || order.total || 0;
        if (salesByBranch.hasOwnProperty(branchName)) {
          salesByBranch[branchName] += total;
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

  // 날짜 변경 핸들러
  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    const salesData = await generateRealDailySales(date);
    setDailySales(salesData);
  };

  const handleWeekChange = async (week: string) => {
    setSelectedWeek(week);
    const salesData = await generateRealWeeklySales(week);
    setWeeklySales(salesData);
  };

  const handleMonthChange = async (month: string) => {
    setSelectedMonth(month);
    const salesData = await generateRealMonthlySales(month);
    setMonthlySales(salesData);
  };

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        console.log("대시보드 데이터 로딩 시작...");
        console.log("사용자 정보:", { isAdmin, userBranch });
        
        // 주문 데이터 가져오기 (필터링 적용) - 단순화된 쿼리
        let ordersQuery;
        if (isAdmin) {
          ordersQuery = collection(db, "orders");
          console.log("본사 관리자: 모든 주문 데이터 조회");
        } else {
          // 지점 사용자는 클라이언트 사이드에서 필터링
          ordersQuery = collection(db, "orders");
          console.log(`지점 사용자: 모든 주문 데이터 조회 후 필터링`);
        }
        
        const ordersSnapshot = await getDocs(ordersQuery);
        const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // 클라이언트 사이드에서 필터링
        const orders = isAdmin ? allOrders : allOrders.filter(order => order.branchName === userBranch);
        console.log(`주문 데이터 로드 완료: ${orders.length}개 (전체: ${allOrders.length}개)`);

        // 최근 주문 (실제 데이터) - 단순화된 쿼리
        let recentOrdersQuery;
        if (isAdmin) {
          recentOrdersQuery = query(
            collection(db, "orders"),
            orderBy("orderDate", "desc"),
            limit(10) // 더 많은 데이터를 가져와서 클라이언트에서 필터링
          );
        } else {
          // 지점 사용자는 모든 주문을 가져와서 클라이언트에서 필터링
          recentOrdersQuery = query(
            collection(db, "orders"),
            orderBy("orderDate", "desc"),
            limit(20)
          );
        }
        
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const allRecentOrders = recentOrdersSnapshot.docs.map(doc => {
          const orderData = doc.data() as any;
          return {
            id: doc.id,
            orderer: orderData.orderer || { name: '주문자 정보 없음' },
            orderDate: orderData.orderDate,
            total: orderData.summary?.total || orderData.total || 0,
            status: orderData.status || 'pending',
            branchName: orderData.branchName || '지점 미지정'
          };
        });
        
        // 클라이언트 사이드에서 필터링
        const recentOrdersData = isAdmin 
          ? allRecentOrders.slice(0, 5)
          : allRecentOrders.filter(order => order.branchName === userBranch).slice(0, 5);
          
        setRecentOrders(recentOrdersData);
        console.log(`최근 주문 데이터 로드 완료: ${recentOrdersData.length}개`);

        // 기본 통계 (필터링 적용)
        const totalRevenue = orders.reduce((acc, order: any) => acc + (order.summary?.total || order.total || 0), 0);
        const pendingOrders = orders.filter((order: any) => order.status === 'pending' || order.status === 'processing').length;

        // 상품 수 (필터링 적용) - 단순화된 쿼리
        let productsQuery = collection(db, "products");
        const productsSnapshot = await getDocs(productsQuery);
        const allProducts = productsSnapshot.docs.map(doc => doc.data());
        
        // 클라이언트 사이드에서 필터링
        const products = isAdmin ? allProducts : allProducts.filter(product => product.branch === userBranch);
        console.log(`상품 데이터 로드 완료: ${products.length}개 (전체: ${allProducts.length}개)`);
        
        // 고유한 상품 ID를 기준으로 바코드 수 계산
        const uniqueProductIds = new Set(products.map(product => product.id).filter(Boolean));
        const totalProducts = uniqueProductIds.size;

        // 고객 수 (필터링 적용) - 단순화된 쿼리
        let customersQuery = collection(db, "customers");
        const customersSnapshot = await getDocs(customersQuery);
        const allCustomers = customersSnapshot.docs;
        
        // 클라이언트 사이드에서 필터링
        const customers = isAdmin ? allCustomers : allCustomers.filter(doc => {
          const data = doc.data();
          return data.branch === userBranch;
        });
        const newCustomers = customers.length;
        console.log(`고객 데이터 로드 완료: ${newCustomers}개 (전체: ${allCustomers.length}개)`);

        const statsData = {
          totalRevenue,
          newCustomers,
          totalProducts,
          pendingOrders
        };
        
        setStats(statsData);
        console.log("통계 데이터 설정 완료:", statsData);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // 오류 발생 시 기본값 설정
        setStats({
          totalRevenue: 0,
          newCustomers: 0,
          totalProducts: 0,
          pendingOrders: 0
        });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (branches.length > 0 && user) {
      console.log("대시보드 데이터 로딩 시작 조건 충족");
      fetchDashboardData().then(async () => {
        try {
          console.log("차트 데이터 생성 시작...");
          // 초기 차트 데이터 생성 (실제 데이터)
          const dailyData = await generateRealDailySales(selectedDate);
          const weeklyData = await generateRealWeeklySales(selectedWeek);
          const monthlyData = await generateRealMonthlySales(selectedMonth);
          setDailySales(dailyData);
          setWeeklySales(weeklyData);
          setMonthlySales(monthlyData);
          console.log("차트 데이터 생성 완료:", { dailyData, weeklyData, monthlyData });
        } catch (error) {
          console.error("차트 데이터 생성 오류:", error);
        }
      });
    } else {
      console.log("대시보드 데이터 로딩 조건 미충족:", { branchesLength: branches.length, user: !!user });
    }
  }, [branches, user, isAdmin, userBranch]);

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
          <p className="text-sm" style={{ color: payload[0].color }}>
            매출: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader 
          title={`${isAdmin ? '전체' : userBranch} 대시보드`} 
          description={`${isAdmin ? '시스템의 현재 상태를 한 눈에 파악하세요.' : `${userBranch}의 현재 상태를 한 눈에 파악하세요.`}`} 
        />
        <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
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
    <div className="space-y-8">
      <PageHeader
        title={`${isAdmin ? '전체' : userBranch} 대시보드`}
        description={`${isAdmin ? '시스템의 현재 상태를 한 눈에 파악하세요.' : `${userBranch}의 현재 상태를 한 눈에 파악하세요.`}`}
      />
      
      {/* 상단 통계 카드 */}
      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin ? '총 매출' : `${userBranch} 매출`}
            </CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs opacity-90 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {isAdmin ? '실시간 매출 현황' : '실시간 매출 현황'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin ? '등록 고객' : `${userBranch} 고객`}
            </CardTitle>
            <Users className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCustomers}</div>
            <p className="text-xs opacity-90 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {isAdmin ? '전체 등록 고객' : '등록된 고객'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin ? '등록된 상품 수' : `${userBranch} 상품`}
            </CardTitle>
            <Package className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs opacity-90">고유 바코드 기준</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              {isAdmin ? '처리 대기' : `${userBranch} 대기`}
            </CardTitle>
            <Calendar className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs opacity-90">처리 필요한 주문</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 - 그리드 레이아웃으로 변경 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 일별 매출 현황 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {isAdmin ? '일별 매출 현황' : `${userBranch} 일별 매출`}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedDate), 'yyyy년 M월 d일', { locale: ko })} 
                  {isAdmin ? ' 매장별 매출' : ' 매출'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" fontSize={12} />
                <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {dailySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 주간 매출 현황 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-green-600" />
                  {isAdmin ? '주간 매출 현황' : `${userBranch} 주간 매출`}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {isAdmin ? '선택된 주간의 매장별 매출' : '선택된 주간의 매출'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="week"
                  value={selectedWeek}
                  onChange={(e) => handleWeekChange(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" fontSize={12} />
                <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {weeklySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 월별 매출 현황 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                {isAdmin ? '월별 매출 현황' : `${userBranch} 월별 매출`}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {format(new Date(selectedMonth + '-01'), 'yyyy년 M월', { locale: ko })} 
                {isAdmin ? ' 매장별 매출' : ' 매출'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branch" fontSize={12} />
              <YAxis tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                {monthlySales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 최근 주문 목록 (실제 데이터) - 테이블 형태로 개선 */}
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? '최근 주문' : `${userBranch} 최근 주문`}</CardTitle>
          <p className="text-sm text-gray-600">실시간 주문 현황</p>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">주문자</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">주문일</th>
                    {isAdmin && (
                      <th className="text-left py-3 px-4 font-medium text-gray-600">출고지점</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium">{order.orderer?.name || '주문자 정보 없음'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <p className="text-sm">{order.branchName}</p>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold">{formatCurrency(order.total)}</p>
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
    </div>
  );
}
