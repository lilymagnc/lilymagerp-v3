"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, Calendar as CalendarIcon, Download, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useBranches } from "@/hooks/use-branches";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { OrderDetailDialog } from "./components/order-detail-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { exportPickupDeliveryToExcel } from "@/lib/excel-export";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function PickupDeliveryPage() {
  const { orders, loading, updateOrderStatus, updateOrder } = useOrders();
  const { branches, loading: branchesLoading, updateBranch } = useBranches();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [activeTab, setActiveTab] = useState("pickup");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriverInfo, setEditingDriverInfo] = useState<{
    orderId: string;
    driverAffiliation: string;
    driverName: string;
    driverContact: string;
    actualDeliveryCost?: string;
  } | null>(null);
  const [isDriverDialogOpen, setIsDriverDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pickup' | 'delivery'>('pickup');
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(undefined);
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(undefined);
  const [isDeliveryCostDialogOpen, setIsDeliveryCostDialogOpen] = useState(false);
  const [selectedOrderForCost, setSelectedOrderForCost] = useState<Order | null>(null);
  const [deliveryCost, setDeliveryCost] = useState('');
  const [deliveryCostReason, setDeliveryCostReason] = useState('');
  
  // 배송비 설정 관리 상태
  const [isDeliveryFeeSettingsOpen, setIsDeliveryFeeSettingsOpen] = useState(false);
  const [selectedBranchForSettings, setSelectedBranchForSettings] = useState<string>('');
  const [editingDeliveryFees, setEditingDeliveryFees] = useState<Array<{district: string, fee: number}>>([]);
  const [newDistrict, setNewDistrict] = useState('');
  const [newFee, setNewFee] = useState('');
  const [surcharges, setSurcharges] = useState({
    mediumItem: 0,
    largeItem: 0,
    express: 0
  });

  // 사용자 권한에 따른 지점 필터링
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise;

  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return branches; // 관리자는 모든 지점
    } else {
      return branches.filter(branch => branch.name === userBranch); // 직원은 소속 지점만
    }
  }, [branches, isAdmin, userBranch]);

  // 직원의 경우 자동으로 소속 지점으로 필터링
  useEffect(() => {
    if (!isAdmin && userBranch && selectedBranch === "all") {
      setSelectedBranch(userBranch);
    }
  }, [isAdmin, userBranch, selectedBranch]);

  // 픽업 주문 필터링 (예약 주문만)
  const pickupOrders = useMemo(() => {
    let filteredOrders = orders.filter(order => 
      order.receiptType === 'pickup_reservation' && 
      order.status !== 'canceled'
    );

    // 권한에 따른 지점 필터링
    if (!isAdmin && userBranch) {
      filteredOrders = filteredOrders.filter(order => order.branchName === userBranch);
    } else if (selectedBranch !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.branchName === selectedBranch);
    }

    // 검색어 필터링
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order =>
        order.orderer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.pickupInfo?.pickerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredOrders.sort((a, b) => {
      // 처리중인 주문을 먼저 표시
      if (a.status === 'processing' && b.status !== 'processing') return -1;
      if (a.status !== 'processing' && b.status === 'processing') return 1;
      
      // 픽업 예정일 기준 정렬
      const aDate = a.pickupInfo?.date || '';
      const bDate = b.pickupInfo?.date || '';
      return aDate.localeCompare(bDate);
    });
  }, [orders, selectedBranch, searchTerm, isAdmin, userBranch]);

  // 배송 주문 필터링 (예약 주문만)
  const deliveryOrders = useMemo(() => {
    let filteredOrders = orders.filter(order => 
      order.receiptType === 'delivery_reservation' && 
      order.status !== 'canceled'
    );

    // 권한에 따른 지점 필터링
    if (!isAdmin && userBranch) {
      filteredOrders = filteredOrders.filter(order => order.branchName === userBranch);
    } else if (selectedBranch !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.branchName === selectedBranch);
    }

    // 검색어 필터링
    if (searchTerm) {
      filteredOrders = filteredOrders.filter(order =>
        order.orderer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryInfo?.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filteredOrders.sort((a, b) => {
      // 처리중인 주문을 먼저 표시
      if (a.status === 'processing' && b.status !== 'processing') return -1;
      if (a.status !== 'processing' && b.status === 'processing') return 1;
      
      // 배송 예정일 기준 정렬
      const aDate = a.deliveryInfo?.date || '';
      const bDate = b.deliveryInfo?.date || '';
      return aDate.localeCompare(bDate);
    });
  }, [orders, selectedBranch, searchTerm, isAdmin, userBranch]);

  // 배송 주문 필터링 (배송비 관리용 - 완료 전 주문도 포함)
  const completedDeliveryOrders = useMemo(() => {
    let filteredOrders = orders.filter(order => 
      order.receiptType === 'delivery_reservation' && 
      (order.status === 'completed' || order.status === 'processing')
    );

    // 권한에 따른 지점 필터링
    if (!isAdmin && userBranch) {
      filteredOrders = filteredOrders.filter(order => order.branchName === userBranch);
    } else if (selectedBranch !== 'all') {
      filteredOrders = filteredOrders.filter(order => order.branchName === selectedBranch);
    }

    return filteredOrders.sort((a, b) => {
      // 최근 완료된 주문을 먼저 표시
      const aDate = a.orderDate?.toDate?.() || new Date(a.orderDate as any);
      const bDate = b.orderDate?.toDate?.() || new Date(b.orderDate as any);
      return bDate.getTime() - aDate.getTime();
    });
  }, [orders, selectedBranch, isAdmin, userBranch]);

  // 배송비 분석 데이터 계산
  const deliveryCostAnalytics = useMemo(() => {
    const ordersWithCost = completedDeliveryOrders.filter(order => 
      order.actualDeliveryCost !== undefined && order.actualDeliveryCost !== null
    );

    const totalCustomerFees = ordersWithCost.reduce((sum, order) => 
      sum + (order.summary?.deliveryFee || 0), 0
    );
    
    const totalActualCosts = ordersWithCost.reduce((sum, order) => 
      sum + (order.actualDeliveryCost || 0), 0
    );

    const totalProfit = totalCustomerFees - totalActualCosts;
    const averageProfit = ordersWithCost.length > 0 ? totalProfit / ordersWithCost.length : 0;

    // 이번 달 데이터 계산
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthOrders = ordersWithCost.filter(order => {
      const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate as any);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    const thisMonthCustomerFees = thisMonthOrders.reduce((sum, order) => 
      sum + (order.summary?.deliveryFee || 0), 0
    );
    
    const thisMonthActualCosts = thisMonthOrders.reduce((sum, order) => 
      sum + (order.actualDeliveryCost || 0), 0
    );

    const thisMonthProfit = thisMonthCustomerFees - thisMonthActualCosts;

    return {
      totalOrders: completedDeliveryOrders.length,
      ordersWithCost: ordersWithCost.length,
      totalCustomerFees,
      totalActualCosts,
      totalProfit,
      averageProfit,
      thisMonthProfit,
      thisMonthOrders: thisMonthOrders.length
    };
  }, [completedDeliveryOrders]);

  // 차트 데이터 계산 (Stage 3)
  const chartData = useMemo(() => {
    const ordersWithCost = completedDeliveryOrders.filter(order => 
      order.actualDeliveryCost !== undefined && order.actualDeliveryCost !== null
    );

    // 월별 배송비 차익 데이터
    const monthlyData = ordersWithCost.reduce((acc, order) => {
      const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate as any);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          customerFees: 0,
          actualCosts: 0,
          profit: 0,
          orderCount: 0
        };
      }
      
      acc[monthKey].customerFees += order.summary?.deliveryFee || 0;
      acc[monthKey].actualCosts += order.actualDeliveryCost || 0;
      acc[monthKey].profit += (order.summary?.deliveryFee || 0) - (order.actualDeliveryCost || 0);
      acc[monthKey].orderCount += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const monthlyChartData = Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));

    // 지역별 배송비 차익 데이터
    const districtData = ordersWithCost.reduce((acc, order) => {
      const district = order.deliveryInfo?.district || '기타';
      
      if (!acc[district]) {
        acc[district] = {
          district,
          customerFees: 0,
          actualCosts: 0,
          profit: 0,
          orderCount: 0
        };
      }
      
      acc[district].customerFees += order.summary?.deliveryFee || 0;
      acc[district].actualCosts += order.actualDeliveryCost || 0;
      acc[district].profit += (order.summary?.deliveryFee || 0) - (order.actualDeliveryCost || 0);
      acc[district].orderCount += 1;
      
      return acc;
    }, {} as Record<string, any>);

    const districtChartData = Object.values(districtData);

    // 수익성 분포 데이터 (Pie Chart)
    const profitDistribution = {
      profitable: ordersWithCost.filter(order => 
        (order.summary?.deliveryFee || 0) > (order.actualDeliveryCost || 0)
      ).length,
      breakEven: ordersWithCost.filter(order => 
        (order.summary?.deliveryFee || 0) === (order.actualDeliveryCost || 0)
      ).length,
      loss: ordersWithCost.filter(order => 
        (order.summary?.deliveryFee || 0) < (order.actualDeliveryCost || 0)
      ).length
    };

    const pieChartData = [
      { name: '수익', value: profitDistribution.profitable, color: '#10b981' },
      { name: '손익분기', value: profitDistribution.breakEven, color: '#f59e0b' },
      { name: '손실', value: profitDistribution.loss, color: '#ef4444' }
    ];

    return {
      monthlyChartData,
      districtChartData,
      pieChartData
    };
  }, [completedDeliveryOrders]);

  // 배송비 설정 관련 함수들
  const handleOpenDeliveryFeeSettings = (branchName: string) => {
    const branch = branches.find(b => b.name === branchName);
    if (branch) {
      setSelectedBranchForSettings(branchName);
      setEditingDeliveryFees(branch.deliveryFees || []);
      setSurcharges({
        mediumItem: branch.surcharges?.mediumItem || 0,
        largeItem: branch.surcharges?.largeItem || 0,
        express: branch.surcharges?.express || 0
      });
      setIsDeliveryFeeSettingsOpen(true);
    }
  };

  const handleSaveDeliveryFeeSettings = async () => {
    try {
      const branch = branches.find(b => b.name === selectedBranchForSettings);
      if (!branch) return;

      const updatedBranch = {
        ...branch,
        deliveryFees: editingDeliveryFees,
        surcharges
      };

      await updateBranch(branch.id, updatedBranch);
      toast({
        title: '성공',
        description: '배송비 설정이 저장되었습니다.',
      });
      setIsDeliveryFeeSettingsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '배송비 설정 저장 중 오류가 발생했습니다.',
      });
    }
  };

  const addDeliveryFee = () => {
    if (!newDistrict.trim() || !newFee.trim()) return;
    
    const fee = parseInt(newFee);
    if (isNaN(fee)) return;

    setEditingDeliveryFees(prev => [...prev, { district: newDistrict.trim(), fee }]);
    setNewDistrict('');
    setNewFee('');
  };

  const removeDeliveryFee = (index: number) => {
    setEditingDeliveryFees(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompletePickup = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'completed');
      toast({
        title: '픽업 완료',
        description: '픽업이 완료 처리되었습니다.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '픽업 완료 처리 중 오류가 발생했습니다.',
      });
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'completed');
      toast({
        title: '배송 완료',
        description: '배송이 완료 처리되었습니다.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '배송 완료 처리 중 오류가 발생했습니다.',
      });
    }
  };

  const handleUpdateDriverInfo = async () => {
    if (!editingDriverInfo) return;
    
    try {
      const order = orders.find(o => o.id === editingDriverInfo.orderId);
      if (!order || !order.deliveryInfo) return;

      const updatedDeliveryInfo = {
        ...order.deliveryInfo,
        driverAffiliation: editingDriverInfo.driverAffiliation,
        driverName: editingDriverInfo.driverName,
        driverContact: editingDriverInfo.driverContact,
      };

      // 배송비 업데이트 데이터 준비
      const updateData: any = {
        deliveryInfo: updatedDeliveryInfo,
      };

      // 배송비가 입력된 경우 배송비 관련 필드도 업데이트
      if (editingDriverInfo.actualDeliveryCost && editingDriverInfo.actualDeliveryCost.trim() !== '') {
        const actualCost = parseInt(editingDriverInfo.actualDeliveryCost);
        updateData.actualDeliveryCost = actualCost;
        updateData.deliveryCostStatus = 'completed';
        updateData.deliveryCostUpdatedAt = new Date();
        updateData.deliveryCostUpdatedBy = user?.email || 'unknown';
        updateData.deliveryProfit = (order.summary?.deliveryFee || 0) - actualCost;
      }

      await updateOrder(editingDriverInfo.orderId, updateData);

      toast({
        title: '완료',
        description: '배송기사 정보가 업데이트되었습니다.',
      });

      setEditingDriverInfo(null);
      setIsDriverDialogOpen(false);
    } catch (error) {
      console.error('Error updating driver info:', error);
      toast({
        title: '오류',
        description: '배송기사 정보 업데이트 중 오류가 발생했습니다.',
      });
    }
  };

  const handleExportToExcel = () => {
    if (!exportStartDate || !exportEndDate) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '시작일과 종료일을 모두 선택해주세요.',
      });
      return;
    }

    try {
      const startDateStr = format(exportStartDate, 'yyyy-MM-dd');
      const endDateStr = format(exportEndDate, 'yyyy-MM-dd');
      
      const targetOrders = exportType === 'pickup' ? pickupOrders : deliveryOrders;
      
      exportPickupDeliveryToExcel(targetOrders, exportType, startDateStr, endDateStr);
      
      toast({
        title: '성공',
        description: '엑셀 파일이 다운로드되었습니다.',
      });
      
      setIsExportDialogOpen(false);
      setExportStartDate(undefined);
      setExportEndDate(undefined);
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '엑셀 파일 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleDeliveryCostInput = (order: Order) => {
    setSelectedOrderForCost(order);
    setDeliveryCost('');
    setDeliveryCostReason('');
    setIsDeliveryCostDialogOpen(true);
  };

  const handleSaveDeliveryCost = async () => {
    if (!selectedOrderForCost || !deliveryCost) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '배송비를 입력해주세요.',
      });
      return;
    }

    try {
      const actualCost = parseInt(deliveryCost);
      
      await updateOrder(selectedOrderForCost.id, {
        actualDeliveryCost: actualCost,
        deliveryCostStatus: 'completed',
        deliveryCostUpdatedAt: new Date(),
        deliveryCostUpdatedBy: user?.email || 'unknown',
        deliveryCostReason: deliveryCostReason,
        deliveryProfit: (selectedOrderForCost.summary?.deliveryFee || 0) - actualCost,
      });

      toast({
        title: '완료',
        description: '배송비가 입력되었습니다.',
      });

      setIsDeliveryCostDialogOpen(false);
      setSelectedOrderForCost(null);
      setDeliveryCost('');
      setDeliveryCostReason('');
    } catch (error) {
      console.error('Error saving delivery cost:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '배송비 입력 중 오류가 발생했습니다.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />완료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'MM/dd');
    }
    return format(new Date(date), 'MM/dd');
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return '-';
    return `${format(new Date(date), 'MM/dd')} ${time}`;
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  if (loading || branchesLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="픽업/배송 관리" description="픽업 및 배송 현황을 관리합니다." />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="픽업/배송예약관리" 
        description={`픽업 및 배송 예약 현황을 관리하고 처리 상태를 업데이트합니다.${!isAdmin ? ` (${userBranch})` : ''}`}
      />

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
          {!isAdmin && (
            <CardDescription>
              현재 {userBranch} 지점의 주문만 표시됩니다.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="주문자명, 수령자명, 주문번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            {isAdmin && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="지점 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 지점</SelectItem>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              엑셀 출력
            </Button>
          </div>
        </CardContent>
      </Card>

      

      {/* 통계 카드 */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">픽업 대기</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pickupOrders.filter(order => order.status === 'processing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">픽업 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pickupOrders.filter(order => order.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">배송 대기</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveryOrders.filter(order => order.status === 'processing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">배송 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliveryOrders.filter(order => order.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 섹션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
                 <TabsList>
           <TabsTrigger value="pickup" className="flex items-center gap-2">
             <Package className="w-4 h-4" />
             픽업 관리 ({pickupOrders.length})
           </TabsTrigger>
           <TabsTrigger value="delivery" className="flex items-center gap-2">
             <Truck className="w-4 h-4" />
             배송 관리 ({deliveryOrders.length})
           </TabsTrigger>
           <TabsTrigger value="delivery-costs" className="flex items-center gap-2">
             <DollarSign className="w-4 h-4" />
             배송비 관리
           </TabsTrigger>
         </TabsList>

        {/* 픽업 관리 탭 */}
        <TabsContent value="pickup">
          <Card>
            <CardHeader>
              <CardTitle>픽업 현황</CardTitle>
              <CardDescription>
                픽업 예정 및 완료된 주문을 관리합니다. 행을 클릭하면 상세 정보를 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>주문번호</TableHead>
                      <TableHead>주문자</TableHead>
                      <TableHead>픽업자</TableHead>
                      <TableHead>픽업 예정일시</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>지점</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead className="text-center">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pickupOrders.length > 0 ? (
                      pickupOrders.map((order) => (
                        <TableRow 
                          key={order.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(order)}
                        >
                          <TableCell className="font-mono text-xs">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{order.orderer.name}</TableCell>
                          <TableCell>
                            {order.pickupInfo?.pickerName || '-'}
                          </TableCell>
                                                     <TableCell>
                             <div className="flex items-center gap-1">
                               <CalendarIcon className="w-3 h-3" />
                               {formatDateTime(order.pickupInfo?.date || '', order.pickupInfo?.time || '')}
                             </div>
                           </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.pickupInfo?.pickerContact || '-'}
                            </div>
                          </TableCell>
                          <TableCell>{order.branchName}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>₩{order.summary.total.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            {order.status === 'processing' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompletePickup(order.id);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                픽업 완료
                              </Button>
                            )}
                            {order.status === 'completed' && (
                              <Badge variant="default">완료됨</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                          <div className="space-y-2">
                            <p>픽업 예약 주문이 없습니다.</p>
                            <p className="text-sm text-muted-foreground">
                              주문 접수에서 '픽업예약'으로 주문을 생성하면 여기에 표시됩니다.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 배송 관리 탭 */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>배송 현황</CardTitle>
              <CardDescription>
                배송 예정 및 완료된 주문을 관리합니다. 행을 클릭하면 상세 정보를 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>주문번호</TableHead>
                      <TableHead>주문자</TableHead>
                      <TableHead>수령자</TableHead>
                      <TableHead>배송 예정일시</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>배송지</TableHead>
                      <TableHead>배송기사</TableHead>
                      <TableHead>배송비</TableHead>
                      <TableHead>지점</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead className="text-center">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryOrders.length > 0 ? (
                      deliveryOrders.map((order) => (
                        <TableRow 
                          key={order.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(order)}
                        >
                          <TableCell className="font-mono text-xs">
                            {order.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{order.orderer.name}</TableCell>
                          <TableCell>
                            {order.deliveryInfo?.recipientName || '-'}
                          </TableCell>
                                                     <TableCell>
                             <div className="flex items-center gap-1">
                               <CalendarIcon className="w-3 h-3" />
                               {formatDateTime(order.deliveryInfo?.date || '', order.deliveryInfo?.time || '')}
                             </div>
                           </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {order.deliveryInfo?.recipientContact || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 max-w-[200px]">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate" title={order.deliveryInfo?.address}>
                                {order.deliveryInfo?.address || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-xs">
                                <strong>소속:</strong> {order.deliveryInfo?.driverAffiliation || '-'}
                              </div>
                              <div className="text-xs">
                                <strong>이름:</strong> {order.deliveryInfo?.driverName || '-'}
                              </div>
                              <div className="text-xs">
                                <strong>연락처:</strong> {order.deliveryInfo?.driverContact || '-'}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingDriverInfo({
                                    orderId: order.id,
                                    driverAffiliation: order.deliveryInfo?.driverAffiliation || '',
                                    driverName: order.deliveryInfo?.driverName || '',
                                    driverContact: order.deliveryInfo?.driverContact || '',
                                    actualDeliveryCost: order.actualDeliveryCost?.toString() || '',
                                  });
                                  setIsDriverDialogOpen(true);
                                }}
                                className="mt-1 text-xs"
                              >
                                수정
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.actualDeliveryCost ? (
                              <div className="text-sm">
                                <div className="font-medium">₩{order.actualDeliveryCost.toLocaleString()}</div>
                                {order.deliveryProfit !== undefined && (
                                  <div className={`text-xs ${order.deliveryProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {order.deliveryProfit >= 0 ? '+' : ''}₩{order.deliveryProfit.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">미입력</span>
                            )}
                          </TableCell>
                          <TableCell>{order.branchName}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>₩{order.summary.total.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            {order.status === 'processing' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteDelivery(order.id);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                배송 완료
                              </Button>
                            )}
                            {order.status === 'completed' && (
                              <Badge variant="default">완료됨</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center h-24 text-muted-foreground">
                          <div className="space-y-2">
                            <p>배송 예약 주문이 없습니다.</p>
                            <p className="text-sm text-muted-foreground">
                              주문 접수에서 '배송예약'으로 주문을 생성하면 여기에 표시됩니다.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
                 </TabsContent>

         {/* 배송비 관리 탭 */}
         <TabsContent value="delivery-costs">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <DollarSign className="w-5 h-5" />
                 배송비 관리
               </CardTitle>
               <CardDescription>
                 배송 완료된 주문의 실제 배송비를 입력하고 배송비 수익성을 분석합니다.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-6">
                 {/* 배송비 입력 섹션 */}
                 <div>
                   <h3 className="text-lg font-semibold mb-4">배송비 입력</h3>
                   {completedDeliveryOrders.length > 0 ? (
                     <div className="overflow-x-auto">
                       <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead>주문번호</TableHead>
                             <TableHead>주문자</TableHead>
                             <TableHead>수령자</TableHead>
                             <TableHead>배송지</TableHead>
                             <TableHead>고객 배송비</TableHead>
                             <TableHead>실제 배송비</TableHead>
                             <TableHead>배송비 차익</TableHead>
                             <TableHead>상태</TableHead>
                             <TableHead className="text-center">작업</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {completedDeliveryOrders.map((order) => (
                             <TableRow key={order.id}>
                               <TableCell className="font-mono text-xs">
                                 {order.id.slice(0, 8)}...
                               </TableCell>
                               <TableCell>{order.orderer?.name || '-'}</TableCell>
                               <TableCell>
                                 {order.deliveryInfo?.recipientName || '-'}
                               </TableCell>
                               <TableCell>
                                 <div className="flex items-center gap-1 max-w-[200px]">
                                   <MapPin className="w-3 h-3 flex-shrink-0" />
                                   <span className="truncate" title={order.deliveryInfo?.address}>
                                     {order.deliveryInfo?.address || '-'}
                                   </span>
                                 </div>
                               </TableCell>
                               <TableCell>
                                 ₩{(order.summary?.deliveryFee || 0).toLocaleString()}
                               </TableCell>
                               <TableCell>
                                 {order.actualDeliveryCost ? (
                                   `₩${order.actualDeliveryCost.toLocaleString()}`
                                 ) : (
                                   <span className="text-muted-foreground">미입력</span>
                                 )}
                               </TableCell>
                               <TableCell>
                                 {order.deliveryProfit !== undefined ? (
                                   <span className={order.deliveryProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                     {order.deliveryProfit >= 0 ? '+' : ''}₩{order.deliveryProfit.toLocaleString()}
                                   </span>
                                 ) : (
                                   <span className="text-muted-foreground">-</span>
                                 )}
                               </TableCell>
                               <TableCell>
                                 {order.actualDeliveryCost ? (
                                   <Badge variant="default">입력완료</Badge>
                                 ) : (
                                   <Badge variant="secondary">미입력</Badge>
                                 )}
                               </TableCell>
                               <TableCell className="text-center">
                                 {!order.actualDeliveryCost && (
                                   <Button
                                     size="sm"
                                     variant="outline"
                                     onClick={() => handleDeliveryCostInput(order)}
                                   >
                                     배송비 입력
                                   </Button>
                                 )}
                               </TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                     </div>
                   ) : (
                     <div className="bg-muted/50 p-4 rounded-lg">
                       <p className="text-sm text-muted-foreground">
                         배송 주문이 없습니다.
                       </p>
                       <p className="text-sm text-muted-foreground mt-2">
                         배송 관리 탭에서 배송 주문을 확인하고 배송비를 입력해주세요.
                       </p>
                     </div>
                   )}
                 </div>

                 {/* 배송비 분석 섹션 */}
                 <div>
                   <h3 className="text-lg font-semibold mb-4">배송비 분석</h3>
                   <div className="grid gap-4 md:grid-cols-3">
                     <Card>
                       <CardHeader className="pb-2">
                         <CardTitle className="text-sm font-medium">이번 달 배송비 차익</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className={`text-2xl font-bold ${deliveryCostAnalytics.thisMonthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {deliveryCostAnalytics.thisMonthProfit >= 0 ? '+' : ''}₩{deliveryCostAnalytics.thisMonthProfit.toLocaleString()}
                         </div>
                         <p className="text-xs text-muted-foreground">
                           고객 배송비 - 실제 배송비 ({deliveryCostAnalytics.thisMonthOrders}건)
                         </p>
                       </CardContent>
                     </Card>
                     <Card>
                       <CardHeader className="pb-2">
                         <CardTitle className="text-sm font-medium">배송비 입력 완료</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="text-2xl font-bold">
                           {deliveryCostAnalytics.ordersWithCost}건
                         </div>
                         <p className="text-xs text-muted-foreground">
                           총 {deliveryCostAnalytics.totalOrders}건 중 (완료/진행중)
                         </p>
                       </CardContent>
                     </Card>
                     <Card>
                       <CardHeader className="pb-2">
                         <CardTitle className="text-sm font-medium">평균 배송비 차익</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className={`text-2xl font-bold ${deliveryCostAnalytics.averageProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                           ₩{deliveryCostAnalytics.averageProfit.toLocaleString()}
                         </div>
                         <p className="text-xs text-muted-foreground">
                           주문당 평균
                         </p>
                       </CardContent>
                     </Card>
                   </div>
                 </div>

                 {/* 배송비 차트 분석 (Stage 3) */}
                 <div>
                   <h3 className="text-lg font-semibold mb-4">배송비 차트 분석</h3>
                   <div className="grid gap-6 md:grid-cols-2">
                     {/* 월별 배송비 차익 추이 */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm font-medium">월별 배송비 차익 추이</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                           <LineChart data={chartData.monthlyChartData}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis dataKey="month" />
                             <YAxis />
                             <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '']} />
                             <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="차익" />
                           </LineChart>
                         </ResponsiveContainer>
                       </CardContent>
                     </Card>

                     {/* 지역별 배송비 차익 */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm font-medium">지역별 배송비 차익</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                           <BarChart data={chartData.districtChartData}>
                             <CartesianGrid strokeDasharray="3 3" />
                             <XAxis dataKey="district" />
                             <YAxis />
                             <Tooltip formatter={(value: number) => [`₩${value.toLocaleString()}`, '']} />
                             <Bar dataKey="profit" fill="#3b82f6" name="차익" />
                           </BarChart>
                         </ResponsiveContainer>
                       </CardContent>
                     </Card>

                     {/* 수익성 분포 */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm font-medium">배송 수익성 분포</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                           <PieChart>
                             <Pie
                               data={chartData.pieChartData}
                               cx="50%"
                               cy="50%"
                               labelLine={false}
                               label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                               outerRadius={80}
                               fill="#8884d8"
                               dataKey="value"
                             >
                               {chartData.pieChartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                             </Pie>
                             <Tooltip />
                           </PieChart>
                         </ResponsiveContainer>
                       </CardContent>
                     </Card>

                     {/* 최적화 제안 */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm font-medium">배송비 최적화 제안</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           {chartData.districtChartData
                             .filter(item => item.profit < 0)
                             .slice(0, 3)
                             .map((item, index) => (
                               <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                                 <span className="text-sm font-medium">{item.district}</span>
                                 <span className="text-sm text-red-600">
                                   ₩{Math.abs(item.profit).toLocaleString()} 손실
                                 </span>
                               </div>
                             ))}
                           {chartData.districtChartData.filter(item => item.profit < 0).length === 0 && (
                             <div className="text-sm text-muted-foreground">
                               모든 지역에서 수익이 발생하고 있습니다.
                             </div>
                           )}
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 </div>

                 {/* 배송비 설정 섹션 */}
                 <div>
                   <h3 className="text-lg font-semibold mb-4">배송비 설정</h3>
                   <div className="space-y-4">
                     <div className="grid gap-4 md:grid-cols-2">
                       {availableBranches.map(branch => (
                         <Card key={branch.name}>
                           <CardHeader className="pb-2">
                             <CardTitle className="text-sm font-medium">{branch.name}</CardTitle>
                           </CardHeader>
                           <CardContent>
                             <div className="space-y-2">
                               <div className="flex justify-between text-sm">
                                 <span>지역별 배송비:</span>
                                 <span>{branch.deliveryFees?.length || 0}개 지역</span>
                               </div>
                               <div className="flex justify-between text-sm">
                                 <span>추가 요금:</span>
                                 <span>
                                   {branch.surcharges?.mediumItem ? `중간품목 +₩${branch.surcharges.mediumItem.toLocaleString()}` : '없음'}
                                   {branch.surcharges?.largeItem ? `, 대형품목 +₩${branch.surcharges.largeItem.toLocaleString()}` : ''}
                                   {branch.surcharges?.express ? `, 긴급 +₩${branch.surcharges.express.toLocaleString()}` : ''}
                                 </span>
                               </div>
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="w-full mt-2"
                                 onClick={() => handleOpenDeliveryFeeSettings(branch.name)}
                               >
                                 배송비 설정
                               </Button>
                             </div>
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>

      {/* 주문 상세 정보 다이얼로그 */}
      <OrderDetailDialog 
        order={selectedOrder}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

             {/* 배송기사 정보 수정 다이얼로그 */}
       <Dialog open={isDriverDialogOpen} onOpenChange={setIsDriverDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>배송기사 정보 수정</DialogTitle>
             <DialogDescription>
               배송 주문의 배송기사 정보를 수정할 수 있습니다.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label htmlFor="driver-affiliation">소속</Label>
               <Input
                 id="driver-affiliation"
                 value={editingDriverInfo?.driverAffiliation || ''}
                 onChange={(e) => setEditingDriverInfo(prev => prev ? {
                   ...prev,
                   driverAffiliation: e.target.value
                 } : null)}
                 placeholder="배송기사 소속"
               />
             </div>
             <div>
               <Label htmlFor="driver-name">이름</Label>
               <Input
                 id="driver-name"
                 value={editingDriverInfo?.driverName || ''}
                 onChange={(e) => setEditingDriverInfo(prev => prev ? {
                   ...prev,
                   driverName: e.target.value
                 } : null)}
                 placeholder="배송기사 이름"
               />
             </div>
             <div>
               <Label htmlFor="driver-contact">연락처</Label>
               <Input
                 id="driver-contact"
                 value={editingDriverInfo?.driverContact || ''}
                 onChange={(e) => setEditingDriverInfo(prev => prev ? {
                   ...prev,
                   driverContact: e.target.value
                 } : null)}
                 placeholder="배송기사 연락처"
               />
             </div>
             <div>
               <Label htmlFor="driver-cost">실제 배송비</Label>
               <Input
                 id="driver-cost"
                 type="number"
                 value={editingDriverInfo?.actualDeliveryCost || ''}
                 onChange={(e) => setEditingDriverInfo(prev => prev ? {
                   ...prev,
                   actualDeliveryCost: e.target.value
                 } : null)}
                 placeholder="실제 배송비 입력"
               />
             </div>
             <div className="flex justify-end gap-2">
               <Button
                 variant="outline"
                 onClick={() => {
                   setEditingDriverInfo(null);
                   setIsDriverDialogOpen(false);
                 }}
               >
                 취소
               </Button>
               <Button onClick={handleUpdateDriverInfo}>
                 저장
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* 엑셀 출력 다이얼로그 */}
       <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>엑셀 출력 설정</DialogTitle>
             <DialogDescription>
               픽업/배송 예약 현황을 엑셀 파일로 출력할 수 있습니다. 출력 유형과 기간을 선택해주세요.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label>출력 유형</Label>
               <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as 'pickup' | 'delivery')}>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="pickup" id="export-pickup" />
                   <Label htmlFor="export-pickup">픽업 예약 현황</Label>
                 </div>
                 <div className="flex items-center space-x-2">
                   <RadioGroupItem value="delivery" id="export-delivery" />
                   <Label htmlFor="export-delivery">배송 예약 현황</Label>
                 </div>
               </RadioGroup>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label>시작일</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !exportStartDate && "text-muted-foreground"
                       )}
                     >
                                               <CalendarIcon className="mr-2 h-4 w-4" />
                        {exportStartDate ? format(exportStartDate, "PPP", { locale: ko }) : "날짜 선택"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0">
                     <Calendar
                       mode="single"
                       selected={exportStartDate}
                       onSelect={setExportStartDate}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
               
               <div>
                 <Label>종료일</Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button
                       variant="outline"
                       className={cn(
                         "w-full justify-start text-left font-normal",
                         !exportEndDate && "text-muted-foreground"
                       )}
                     >
                                               <CalendarIcon className="mr-2 h-4 w-4" />
                        {exportEndDate ? format(exportEndDate, "PPP", { locale: ko }) : "날짜 선택"}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0">
                     <Calendar
                       mode="single"
                       selected={exportEndDate}
                       onSelect={setExportEndDate}
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
               </div>
             </div>
             
             <div className="flex justify-end gap-2">
               <Button
                 variant="outline"
                 onClick={() => {
                   setIsExportDialogOpen(false);
                   setExportStartDate(undefined);
                   setExportEndDate(undefined);
                 }}
               >
                 취소
               </Button>
               <Button onClick={handleExportToExcel}>
                 엑셀 출력
               </Button>
             </div>
           </div>
                  </DialogContent>
       </Dialog>

       {/* 배송비 입력 다이얼로그 */}
       <Dialog open={isDeliveryCostDialogOpen} onOpenChange={setIsDeliveryCostDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>실제 배송비 입력</DialogTitle>
             <DialogDescription>
               완료된 배송 주문의 실제 배송비를 입력하여 배송비 차익을 계산할 수 있습니다.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             {selectedOrderForCost && (
               <div className="space-y-2">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <p className="text-muted-foreground">주문번호</p>
                     <p className="font-medium">{selectedOrderForCost.id.slice(0, 8)}...</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">수령자</p>
                     <p className="font-medium">{selectedOrderForCost.deliveryInfo?.recipientName || '-'}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">고객 배송비</p>
                     <p className="font-medium">₩{(selectedOrderForCost.summary?.deliveryFee || 0).toLocaleString()}</p>
                   </div>
                   <div>
                     <p className="text-muted-foreground">배송지</p>
                     <p className="font-medium text-xs">{selectedOrderForCost.deliveryInfo?.address || '-'}</p>
                   </div>
                 </div>
               </div>
             )}
             
             <div>
               <Label htmlFor="delivery-cost">실제 배송비</Label>
               <Input
                 id="delivery-cost"
                 type="number"
                 value={deliveryCost}
                 onChange={(e) => setDeliveryCost(e.target.value)}
                 placeholder="실제 지출한 배송비를 입력하세요"
                 className="mt-1"
               />
             </div>
             
             <div>
               <Label htmlFor="delivery-cost-reason">배송비 입력 이유 (선택)</Label>
               <Input
                 id="delivery-cost-reason"
                 value={deliveryCostReason}
                 onChange={(e) => setDeliveryCostReason(e.target.value)}
                 placeholder="예: 거리 추가, 야간 배송, 긴급 배송 등"
                 className="mt-1"
               />
             </div>
             
             <div className="flex justify-end gap-2">
               <Button
                 variant="outline"
                 onClick={() => {
                   setIsDeliveryCostDialogOpen(false);
                   setSelectedOrderForCost(null);
                   setDeliveryCost('');
                   setDeliveryCostReason('');
                 }}
               >
                 취소
               </Button>
               <Button onClick={handleSaveDeliveryCost}>
                 저장
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* 배송비 설정 다이얼로그 */}
       <Dialog open={isDeliveryFeeSettingsOpen} onOpenChange={setIsDeliveryFeeSettingsOpen}>
         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>{selectedBranchForSettings} 배송비 설정</DialogTitle>
             <DialogDescription>
               지점별 지역 배송비와 추가 요금을 설정할 수 있습니다. 설정한 배송비는 해당 지점의 배송 주문에 적용됩니다.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-6">
             {/* 지역별 배송비 설정 */}
             <div>
               <h4 className="text-lg font-semibold mb-4">지역별 배송비</h4>
               <div className="space-y-4">
                 <div className="grid grid-cols-3 gap-4">
                   <div>
                     <Label htmlFor="new-district">지역명</Label>
                     <Input
                       id="new-district"
                       value={newDistrict}
                       onChange={(e) => setNewDistrict(e.target.value)}
                       placeholder="예: 강남구"
                     />
                   </div>
                   <div>
                     <Label htmlFor="new-fee">배송비</Label>
                     <Input
                       id="new-fee"
                       type="number"
                       value={newFee}
                       onChange={(e) => setNewFee(e.target.value)}
                       placeholder="예: 15000"
                     />
                   </div>
                   <div className="flex items-end">
                     <Button onClick={addDeliveryFee} className="w-full">
                       추가
                     </Button>
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   {editingDeliveryFees.map((item, index) => (
                     <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                       <div className="flex-1">
                         <span className="font-medium">{item.district}</span>
                         <span className="ml-4 text-muted-foreground">₩{item.fee.toLocaleString()}</span>
                       </div>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => removeDeliveryFee(index)}
                       >
                         삭제
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>
             </div>

             {/* 추가 요금 설정 */}
             <div>
               <h4 className="text-lg font-semibold mb-4">추가 요금 설정</h4>
               <div className="grid grid-cols-3 gap-4">
                 <div>
                   <Label htmlFor="medium-item">중간품목 추가요금</Label>
                   <Input
                     id="medium-item"
                     type="number"
                     value={surcharges.mediumItem}
                     onChange={(e) => setSurcharges(prev => ({
                       ...prev,
                       mediumItem: parseInt(e.target.value) || 0
                     }))}
                     placeholder="0"
                   />
                 </div>
                 <div>
                   <Label htmlFor="large-item">대형품목 추가요금</Label>
                   <Input
                     id="large-item"
                     type="number"
                     value={surcharges.largeItem}
                     onChange={(e) => setSurcharges(prev => ({
                       ...prev,
                       largeItem: parseInt(e.target.value) || 0
                     }))}
                     placeholder="0"
                   />
                 </div>
                 <div>
                   <Label htmlFor="express">긴급배송 추가요금</Label>
                   <Input
                     id="express"
                     type="number"
                     value={surcharges.express}
                     onChange={(e) => setSurcharges(prev => ({
                       ...prev,
                       express: parseInt(e.target.value) || 0
                     }))}
                     placeholder="0"
                   />
                 </div>
               </div>
             </div>

             <div className="flex justify-end gap-2">
               <Button
                 variant="outline"
                 onClick={() => setIsDeliveryFeeSettingsOpen(false)}
               >
                 취소
               </Button>
               <Button onClick={handleSaveDeliveryFeeSettings}>
                 저장
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }