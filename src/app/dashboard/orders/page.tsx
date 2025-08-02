
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Search, MoreHorizontal, MessageSquareText } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { MessagePrintDialog } from "./components/message-print-dialog";
import { Timestamp } from "firebase/firestore";

export default function OrdersPage() {
  const { orders, loading, updateOrderStatus, updatePaymentStatus } = useOrders();
  const { branches, loading: branchesLoading } = useBranches();
  const { user } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isMessagePrintDialogOpen, setIsMessagePrintDialogOpen] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);

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

  const handlePrint = (orderId: string) => {
    router.push(`/dashboard/orders/print-preview/${orderId}`);
  };

  const handleMessagePrintClick = (order: Order) => {
    setSelectedOrderForPrint(order);
    setIsMessagePrintDialogOpen(true);
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
    senderName
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
    });
    router.push(`/dashboard/orders/print-message?${params.toString()}`);
    setIsMessagePrintDialogOpen(false);
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
        order.orderer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [orders, searchTerm, selectedBranch, isAdmin, userBranch]);

  return (
    <>
      <PageHeader
        title="주문 현황"
        description={`모든 주문 내역을 확인하고 관리하세요.${!isAdmin ? ` (${userBranch})` : ''}`}
      >
        <Button asChild>
            <Link href="/dashboard/orders/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                주문 접수
            </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
            <CardTitle>주문 내역</CardTitle>
            <CardDescription>
              최근 주문 목록을 검색하고 관리합니다.
              {!isAdmin && ` 현재 ${userBranch} 지점의 주문만 표시됩니다.`}
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
              <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      type="search"
                      placeholder="주문자명, 주문ID 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                  />
              </div>
              {isAdmin && (
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-full sm:w-[180px]">
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
              )}
          </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>주문 ID</TableHead>
              <TableHead>주문자</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
              ))
            ) : (
              filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                  <TableCell>{order.orderer.name}</TableCell>
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
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">메뉴 토글</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>작업</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handlePrint(order.id)}>주문서 인쇄</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMessagePrintClick(order)}>
                          <MessageSquareText className="mr-2 h-4 w-4" />
                          메시지 인쇄
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>주문 상태 변경</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'processing')}>처리중</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'completed')}>완료</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'canceled')}>취소</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>결제 상태 변경</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => updatePaymentStatus(order.id, 'completed')}>완결</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updatePaymentStatus(order.id, 'pending')}>미결</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
    </>
  );
}
