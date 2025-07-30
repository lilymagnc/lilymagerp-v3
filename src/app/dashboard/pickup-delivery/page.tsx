"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Package, Truck, CheckCircle, Clock, MapPin, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { OrderDetailDialog } from "./components/order-detail-dialog";

export default function PickupDeliveryPage() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { branches, loading: branchesLoading } = useBranches();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [activeTab, setActiveTab] = useState("pickup");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  // 픽업 주문 필터링
  const pickupOrders = useMemo(() => {
    let filteredOrders = orders.filter(order => 
      order.receiptType === 'pickup' && 
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

  // 배송 주문 필터링
  const deliveryOrders = useMemo(() => {
    let filteredOrders = orders.filter(order => 
      order.receiptType === 'delivery' && 
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
        title="픽업/배송 관리" 
        description={`픽업 및 배송 현황을 관리하고 처리 상태를 업데이트합니다.${!isAdmin ? ` (${userBranch})` : ''}`}
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
          </div>
        </CardContent>
      </Card>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
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
                              <Calendar className="w-3 h-3" />
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
                          픽업 주문이 없습니다.
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
                              <Calendar className="w-3 h-3" />
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
                        <TableCell colSpan={10} className="text-center h-24 text-muted-foreground">
                          배송 주문이 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
    </div>
  );
}