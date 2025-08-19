
"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Search, MoreHorizontal, MessageSquareText, Upload, Download, FileText, DollarSign, TrendingUp, ShoppingCart, CheckSquare, Square } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { MessagePrintDialog } from "./components/message-print-dialog";
import { OrderDetailDialog } from "./components/order-detail-dialog";
import { OrderEditDialog } from "./components/order-edit-dialog";
import { ExcelUploadDialog } from "./components/excel-upload-dialog";
import { Trash2, XCircle, Calendar as CalendarIcon } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { exportOrdersToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
export default function OrdersPage() {
  const { orders, loading, updateOrderStatus, updatePaymentStatus, cancelOrder, deleteOrder } = useOrders();
  const { branches, loading: branchesLoading } = useBranches();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMessagePrintDialogOpen, setIsMessagePrintDialogOpen] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [isOrderDetailDialogOpen, setIsOrderDetailDialogOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [isExcelUploadDialogOpen, setIsExcelUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isOrderEditDialogOpen, setIsOrderEditDialogOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
  
  // 일괄 삭제 관련 상태
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
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

  // URL 파라미터에서 메시지 인쇄 다이얼로그 자동 열기
  useEffect(() => {
    const openMessagePrint = searchParams.get('openMessagePrint');
    const orderId = searchParams.get('orderId');
    
    if (openMessagePrint === 'true' && orderId) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrderForPrint(order);
        setIsMessagePrintDialogOpen(true);
        
        // URL에서 파라미터 제거
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('openMessagePrint');
        newParams.delete('orderId');
        newParams.delete('labelType');
        newParams.delete('start');
        newParams.delete('messageFont');
        newParams.delete('messageFontSize');
        newParams.delete('senderFont');
        newParams.delete('senderFontSize');
        newParams.delete('messageContent');
        newParams.delete('senderName');
        newParams.delete('positions');
        
        const newUrl = newParams.toString() ? `?${newParams.toString()}` : '';
        router.replace(`/dashboard/orders${newUrl}`, { scroll: false });
      }
    }
  }, [searchParams, orders, router]);

  // 일괄 삭제 관련 함수들
  const handleSelectOrder = (orderId: string) => {
    const newSelectedIds = new Set(selectedOrderIds);
    if (newSelectedIds.has(orderId)) {
      newSelectedIds.delete(orderId);
    } else {
      newSelectedIds.add(orderId);
    }
    setSelectedOrderIds(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === paginatedOrders.length) {
      // 모든 항목이 선택된 경우 전체 해제
      setSelectedOrderIds(new Set());
    } else {
      // 모든 항목 선택
      const allIds = new Set(paginatedOrders.map(order => order.id));
      setSelectedOrderIds(allIds);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.size === 0) {
      toast({
        title: "선택된 주문 없음",
        description: "삭제할 주문을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkDeleting(true);
    try {
      let deletedCount = 0;
      for (const orderId of selectedOrderIds) {
        try {
          await deleteOrder(orderId);
          deletedCount++;
        } catch (error) {
          console.error(`주문 삭제 실패: ${orderId}`, error);
        }
      }
      
      toast({
        title: "일괄 삭제 완료",
        description: `${deletedCount}개의 주문이 삭제되었습니다.`,
      });
      
      // 선택 초기화
      setSelectedOrderIds(new Set());
      setIsBulkDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "일괄 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const handlePrint = (orderId: string) => {
    router.push(`/dashboard/orders/print-preview/${orderId}`);
  };
  const handleMessagePrintClick = (order: Order) => {
    setSelectedOrderForPrint(order);
    setIsMessagePrintDialogOpen(true);
  };
  const handleOrderRowClick = (order: Order) => {
    setSelectedOrderForDetail(order);
    setIsOrderDetailDialogOpen(true);
  };
  // 주문 취소 처리
  const handleCancelOrder = async (orderId: string, reason?: string) => {
    try {
      await cancelOrder(orderId, reason);
      setIsCancelDialogOpen(false);
      setSelectedOrderForAction(null);
    } catch (error) {
      // 주문 취소 오류는 조용히 처리
    }
  };
  // 주문 삭제 처리
  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      setIsDeleteDialogOpen(false);
      setSelectedOrderForAction(null);
    } catch (error) {
      // 주문 삭제 오류는 조용히 처리
    }
  };
  // 취소 다이얼로그 열기
  const openCancelDialog = (order: Order) => {
    setSelectedOrderForAction(order);
    setIsCancelDialogOpen(true);
  };
  // 삭제 다이얼로그 열기
  const openDeleteDialog = (order: Order) => {
    setSelectedOrderForAction(order);
    setIsDeleteDialogOpen(true);
  };
  const handleMessagePrintSubmit = ({ 
    orderId, 
    labelType, 
    startPosition, 
    messageFont, 
    messageFontSize,
    senderFont,
    senderFontSize,
    messageContent,
    senderName,
    selectedPositions
  }: { 
    orderId: string; 
    labelType: string; 
    startPosition: number; 
    messageFont: string; 
    messageFontSize: number;
    senderFont: string;
    senderFontSize: number;
    messageContent: string;
    senderName: string;
    selectedPositions: number[];
  }) => {
    const params = new URLSearchParams({
        orderId,
        labelType,
        start: String(startPosition),
        messageFont,
        messageFontSize: String(messageFontSize),
        senderFont,
        senderFontSize: String(senderFontSize),
        messageContent,
        senderName,
        positions: selectedPositions.join(','),
    });
    router.push(`/dashboard/orders/print-message?${params.toString()}`);
    setIsMessagePrintDialogOpen(false);
  };
  const handleExcelDownload = () => {
    const ordersToExport = filteredOrders;
    const filename = selectedBranch !== "all" ? `${selectedBranch}_주문내역` : "전체_주문내역";
    if (ordersToExport.length === 0) {
      toast({
        title: "다운로드할 데이터가 없습니다",
        description: "다운로드할 주문 내역이 없습니다.",
        variant: "destructive",
      });
      return;
    }
    try {
      exportOrdersToExcel(ordersToExport, filename);
      toast({
        title: "엑셀 다운로드 완료",
        description: `${ordersToExport.length}건의 주문 내역이 다운로드되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "엑셀 파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">완료</Badge>;
      case 'processing':
        return <Badge variant="secondary">처리중</Badge>;
      case 'canceled':
        return <Badge variant="destructive">취소</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-blue-500 text-white">완결</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">미결</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    // 권한에 따른 지점 필터링
    if (!isAdmin && userBranch) {
      filtered = filtered.filter(order => order.branchName === userBranch);
    } else if (selectedBranch !== "all") {
      filtered = filtered.filter(order => order.branchName === selectedBranch);
    }
    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(order =>
        String(order.orderer?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(order.id ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // 주문 상태 필터링
    if (selectedOrderStatus !== "all") {
      filtered = filtered.filter(order => order.status === selectedOrderStatus);
    }
    // 결제 상태 필터링
    if (selectedPaymentStatus !== "all") {
      filtered = filtered.filter(order => {
        if (selectedPaymentStatus === "completed") {
          return order.payment?.status === "completed";
        } else if (selectedPaymentStatus === "pending") {
          return order.payment?.status === "pending";
        }
        return true;
      });
    }
    // 날짜 범위 필터링
    if (startDate || endDate) {
      filtered = filtered.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = (order.orderDate as Timestamp).toDate();
        const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
        
        if (startDate && endDate) {
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return orderDateOnly >= startDateOnly && orderDateOnly <= endDateOnly;
        } else if (startDate) {
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          return orderDateOnly >= startDateOnly;
        } else if (endDate) {
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          return orderDateOnly <= endDateOnly;
        }
        return true;
      });
    }
    return filtered;
  }, [orders, searchTerm, selectedBranch, selectedOrderStatus, selectedPaymentStatus, startDate, endDate, isAdmin, userBranch]);

  // 통계 계산
  const orderStats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalAmount = filteredOrders.reduce((sum, order) => sum + (order.summary?.total || 0), 0);
    
    // 오늘 주문
    const today = new Date();
    const todayOrders = filteredOrders.filter(order => {
      if (!order.orderDate) return false;
      const orderDate = (order.orderDate as Timestamp).toDate();
      return orderDate.toDateString() === today.toDateString();
    });
    const todayAmount = todayOrders.reduce((sum, order) => sum + (order.summary?.total || 0), 0);

    // 이번 달 주문
    const thisMonthOrders = filteredOrders.filter(order => {
      if (!order.orderDate) return false;
      const orderDate = (order.orderDate as Timestamp).toDate();
      return orderDate.getMonth() === today.getMonth() && 
             orderDate.getFullYear() === today.getFullYear();
    });
    const thisMonthAmount = thisMonthOrders.reduce((sum, order) => sum + (order.summary?.total || 0), 0);

    // 주문 상태별 통계
    const statusStats = filteredOrders.reduce((acc, order) => {
      const status = order.status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalOrders,
      totalAmount,
      todayOrders: todayOrders.length,
      todayAmount,
      thisMonthOrders: thisMonthOrders.length,
      thisMonthAmount,
      statusStats
    };
  }, [filteredOrders]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranch, selectedOrderStatus, selectedPaymentStatus, startDate, endDate]);
  return (
    <>
      <PageHeader
        title="주문 현황"
        description={`모든 주문 내역을 확인하고 관리하세요.${!isAdmin ? ` (${userBranch})` : ''}`}
      >
        <div className="flex gap-2">
          <Button asChild>
              <Link href="/dashboard/orders/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  주문 접수
              </Link>
          </Button>
          <Button variant="outline" onClick={() => setIsExcelUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              엑셀 업로드
          </Button>
          <Button variant="outline" onClick={handleExcelDownload}>
              <Download className="mr-2 h-4 w-4" />
              엑셀 다운로드
          </Button>
        </div>
      </PageHeader>
      
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
        {loading ? (
          // 로딩 중일 때 스켈레톤 표시
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 주문</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">오늘 주문</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 달 주문</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 주문</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.totalOrders.toLocaleString()}건</div>
                <p className="text-xs text-muted-foreground">
                  필터링된 주문 수
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₩{orderStats.totalAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  필터링된 총 매출
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">오늘 주문</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.todayOrders}건</div>
                <p className="text-xs text-muted-foreground">
                  ₩{orderStats.todayAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 달 주문</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderStats.thisMonthOrders}건</div>
                <p className="text-xs text-muted-foreground">
                  ₩{orderStats.thisMonthAmount.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>주문 내역</CardTitle>
            <CardDescription>
              최근 주문 목록을 검색하고 관리합니다.
              {!isAdmin && ` 현재 ${userBranch} 지점의 주문만 표시됩니다.`}
              <br />
              <span className="text-blue-600">💡 엑셀 다운로드:</span> 업로드 템플릿과 동일한 형식으로 다운로드되어 수정 후 재업로드가 가능합니다.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                  <label htmlFor="order-search" className="sr-only">주문 검색</label>
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="order-search"
                      name="order-search"
                      type="search"
                      placeholder="주문자명, 주문ID 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      autoComplete="off"
                  />
              </div>
              {isAdmin && (
                <div>
                  <label htmlFor="branch-select" className="sr-only">지점 선택</label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger id="branch-select" name="branch-select" className="w-full sm:w-[180px]">
                          <SelectValue placeholder="지점 선택" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">전체 지점</SelectItem>
                          {availableBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.name}>
                                  {branch.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label htmlFor="order-status-select" className="sr-only">주문 상태 선택</label>
                <Select value={selectedOrderStatus} onValueChange={setSelectedOrderStatus}>
                    <SelectTrigger id="order-status-select" name="order-status-select" className="w-full sm:w-[140px]">
                        <SelectValue placeholder="주문 상태" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 상태</SelectItem>
                        <SelectItem value="processing">처리중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="canceled">취소</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="payment-status-select" className="sr-only">결제 상태 선택</label>
                <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                    <SelectTrigger id="payment-status-select" name="payment-status-select" className="w-full sm:w-[140px]">
                        <SelectValue placeholder="결제 상태" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체 결제</SelectItem>
                        <SelectItem value="completed">완결</SelectItem>
                        <SelectItem value="pending">미결</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
                        !startDate && !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && endDate ? (
                        <>
                          {format(startDate, "yyyy-MM-dd")} ~ {format(endDate, "yyyy-MM-dd")}
                        </>
                      ) : startDate ? (
                        format(startDate, "yyyy-MM-dd") + " 이후"
                      ) : endDate ? (
                        format(endDate, "yyyy-MM-dd") + " 이전"
                      ) : (
                        "날짜 범위 선택"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex gap-2 p-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">시작일</label>
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">종료일</label>
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 p-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStartDate(undefined);
                          setEndDate(undefined);
                        }}
                      >
                        초기화
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                 <div className="text-sm text-muted-foreground flex items-center gap-2">
                   <span>총 {filteredOrders.length}건</span>
                   <span>총 ₩{orderStats.totalAmount.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <label htmlFor="page-size" className="text-sm text-muted-foreground">페이지당:</label>
                   <Select value={String(pageSize)} onValueChange={(value) => {
                     setPageSize(Number(value));
                     setCurrentPage(1);
                   }}>
                     <SelectTrigger id="page-size" className="w-20">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="20">20</SelectItem>
                       <SelectItem value="50">50</SelectItem>
                       <SelectItem value="100">100</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
          </div>

          {/* 일괄 삭제 액션 바 */}
          {selectedOrderIds.size > 0 && (
            <Card className="border-orange-200 bg-orange-50 mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-orange-800">
                      {selectedOrderIds.size}개 주문 선택됨
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrderIds(new Set())}
                    >
                      선택 해제
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      선택된 주문 삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-6 w-6 p-0"
                >
                  {selectedOrderIds.size === paginatedOrders.length && paginatedOrders.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>주문 ID</TableHead>
              <TableHead>주문자</TableHead>
              <TableHead>상품명</TableHead>
              <TableHead>주문일</TableHead>
              <TableHead>출고지점</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
              ))
                         ) : (
               paginatedOrders.map((order) => {
                // 상품명 추출 로직
                const getProductNames = (order: Order) => {
                  if (order.items && order.items.length > 0) {
                    const names = order.items.map(item => item.name || '상품명 없음');
                    return names.join(', ');
                  }
                  return '상품 정보 없음';
                };

                return (
                  <TableRow 
                    key={order.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOrderRowClick(order)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOrder(order.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        {selectedOrderIds.has(order.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                  <TableCell>{order.orderer.name}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={getProductNames(order)}>
                      {getProductNames(order)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.orderDate && format((order.orderDate as Timestamp).toDate(), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell>{order.branchName}</TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(order.status)}
                        {order.payment && getPaymentStatusBadge(order.payment.status)}
                      </div>
                  </TableCell>
                  <TableCell className="text-right">₩{order.summary.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          aria-haspopup="true" 
                          size="icon" 
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">메뉴 토글</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                                                 <DropdownMenuItem onClick={(e) => {
                           e.stopPropagation();
                           handlePrint(order.id);
                         }}>
                           주문서 인쇄
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={(e) => {
                           e.stopPropagation();
                           handleMessagePrintClick(order);
                         }}>
                           <MessageSquareText className="mr-2 h-4 w-4" />
                           메시지 인쇄
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={(e) => {
                           e.stopPropagation();
                           setIsOrderEditDialogOpen(true);
                           setSelectedOrderForAction(order);
                         }}>
                           <FileText className="mr-2 h-4 w-4" />
                           주문 수정
                         </DropdownMenuItem>
                        <DropdownMenuSeparator />
                                                 <DropdownMenuSub>
                           <DropdownMenuSubTrigger>주문 상태 변경</DropdownMenuSubTrigger>
                           <DropdownMenuSubContent>
                             <DropdownMenuItem onClick={(e) => {
                               e.stopPropagation();
                               updateOrderStatus(order.id, 'processing');
                             }}>
                               처리중
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={(e) => {
                               e.stopPropagation();
                               updateOrderStatus(order.id, 'completed');
                             }}>
                               완료
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={(e) => {
                               e.stopPropagation();
                               updateOrderStatus(order.id, 'canceled');
                             }}>
                               취소
                             </DropdownMenuItem>
                           </DropdownMenuSubContent>
                         </DropdownMenuSub>
                         <DropdownMenuSub>
                           <DropdownMenuSubTrigger>결제 상태 변경</DropdownMenuSubTrigger>
                           <DropdownMenuSubContent>
                             <DropdownMenuItem onClick={(e) => {
                               e.stopPropagation();
                               updatePaymentStatus(order.id, 'completed');
                             }}>
                               완결
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={(e) => {
                               e.stopPropagation();
                               updatePaymentStatus(order.id, 'pending');
                             }}>
                               미결
                             </DropdownMenuItem>
                           </DropdownMenuSubContent>
                         </DropdownMenuSub>
                         <DropdownMenuSeparator />
                                                                             <DropdownMenuItem 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openCancelDialog(order);
                            }}
                            className="text-orange-600 focus:text-orange-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            주문 취소 (금액 0원)
                          </DropdownMenuItem>
                                                                             <DropdownMenuItem 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openDeleteDialog(order);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            주문 삭제
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  </TableRow>
                );
              })
            )}
                     </TableBody>
         </Table>
         
         {/* 페이지네이션 컨트롤 */}
         {totalPages > 1 && (
           <div className="flex items-center justify-between px-2 py-4 border-t">
             <div className="text-sm text-muted-foreground">
               {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} / {filteredOrders.length}건
             </div>
             <div className="flex items-center gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                 disabled={currentPage === 1}
               >
                 이전
               </Button>
               <div className="flex items-center gap-1">
                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                   let pageNum;
                   if (totalPages <= 5) {
                     pageNum = i + 1;
                   } else if (currentPage <= 3) {
                     pageNum = i + 1;
                   } else if (currentPage >= totalPages - 2) {
                     pageNum = totalPages - 4 + i;
                   } else {
                     pageNum = currentPage - 2 + i;
                   }
                   
                   return (
                     <Button
                       key={pageNum}
                       variant={currentPage === pageNum ? "default" : "outline"}
                       size="sm"
                       onClick={() => setCurrentPage(pageNum)}
                       className="w-8 h-8 p-0"
                     >
                       {pageNum}
                     </Button>
                   );
                 })}
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                 disabled={currentPage === totalPages}
               >
                 다음
               </Button>
             </div>
           </div>
         )}
         </CardContent>
       </Card>
      {selectedOrderForPrint && (
        <MessagePrintDialog
            isOpen={isMessagePrintDialogOpen}
            onOpenChange={setIsMessagePrintDialogOpen}
            order={selectedOrderForPrint}
            onSubmit={handleMessagePrintSubmit}
        />
      )}
      {selectedOrderForDetail && (
        <OrderDetailDialog
            isOpen={isOrderDetailDialogOpen}
            onOpenChange={setIsOrderDetailDialogOpen}
            order={selectedOrderForDetail}
        />
      )}
      {selectedOrderForAction && (
        <OrderEditDialog
            isOpen={isOrderEditDialogOpen}
            onOpenChange={setIsOrderEditDialogOpen}
            order={selectedOrderForAction}
        />
      )}
             <ExcelUploadDialog
         isOpen={isExcelUploadDialogOpen}
         onOpenChange={setIsExcelUploadDialogOpen}
       />
               {/* 주문 취소 다이얼로그 */}
        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>주문 취소</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 이 주문을 취소하시겠습니까?
                <br />
                <strong>주문 ID:</strong> {selectedOrderForAction?.id}
                <br />
                <strong>주문자:</strong> {selectedOrderForAction?.orderer.name}
                <br />
                <strong>현재 금액:</strong> ₩{selectedOrderForAction?.summary.total.toLocaleString()}
                <br />
                <strong>환급 포인트:</strong> {selectedOrderForAction?.summary.pointsUsed ? `${selectedOrderForAction.summary.pointsUsed}포인트` : '0포인트'}
                <br />
                <br />
                취소 시 금액이 0원으로 설정되고 주문 상태가 '취소'로 변경되며 고객의 포인트는 환급됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => selectedOrderForAction && handleCancelOrder(selectedOrderForAction.id)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                주문 취소
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
       {/* 주문 삭제 다이얼로그 */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>주문 삭제</AlertDialogTitle>
             <AlertDialogDescription>
               정말로 이 주문을 완전히 삭제하시겠습니까?
               <br />
               <strong>주문 ID:</strong> {selectedOrderForAction?.id}
               <br />
               <strong>주문자:</strong> {selectedOrderForAction?.orderer.name}
               <br />
               이 작업은 되돌릴 수 없습니다.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>취소</AlertDialogCancel>
             <AlertDialogAction 
               onClick={() => selectedOrderForAction && handleDeleteOrder(selectedOrderForAction.id)}
               className="bg-red-600 hover:bg-red-700"
             >
               삭제
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

       {/* 일괄 삭제 다이얼로그 */}
       <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>일괄 삭제</AlertDialogTitle>
             <AlertDialogDescription>
               선택된 {selectedOrderIds.size}개의 주문을 모두 삭제하시겠습니까? 
               <br />
               <br />
               이 작업은 되돌릴 수 없습니다.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={isBulkDeleting}>취소</AlertDialogCancel>
             <AlertDialogAction 
               onClick={handleBulkDelete}
               disabled={isBulkDeleting}
               className="bg-red-600 hover:bg-red-700"
             >
               {isBulkDeleting ? "삭제 중..." : "삭제"}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 }
