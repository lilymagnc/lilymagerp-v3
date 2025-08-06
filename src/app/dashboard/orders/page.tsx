
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Search, MoreHorizontal, MessageSquareText, Upload, Download } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { MessagePrintDialog } from "./components/message-print-dialog";
import { OrderDetailDialog } from "./components/order-detail-dialog";
import { ExcelUploadDialog } from "./components/excel-upload-dialog";
import { Trash2, XCircle } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { exportOrdersToExcel } from "@/lib/excel-export";
import { useToast } from "@/hooks/use-toast";

export default function OrdersPage() {
  const { orders, loading, updateOrderStatus, updatePaymentStatus, cancelOrder, deleteOrder } = useOrders();
  const { branches, loading: branchesLoading } = useBranches();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isMessagePrintDialogOpen, setIsMessagePrintDialogOpen] = useState(false);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [isOrderDetailDialogOpen, setIsOrderDetailDialogOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [isExcelUploadDialogOpen, setIsExcelUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);

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
      console.error('주문 취소 오류:', error);
    }
  };

  // 주문 삭제 처리
  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      setIsDeleteDialogOpen(false);
      setSelectedOrderForAction(null);
    } catch (error) {
      console.error('주문 삭제 오류:', error);
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

  const handleExcelDownload = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : orders;
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
      console.log('다운로드 시작:', ordersToExport.length, '건의 주문');
      exportOrdersToExcel(ordersToExport, filename);
      toast({
        title: "엑셀 다운로드 완료",
        description: `${ordersToExport.length}건의 주문 내역이 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast({
        title: "다운로드 실패",
        description: error.message || "엑셀 파일 다운로드 중 오류가 발생했습니다.",
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
              <div className="text-sm text-muted-foreground">
                총 {filteredOrders.length}건의 주문
              </div>
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
                  <TableRow 
                    key={order.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleOrderRowClick(order)}
                  >
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
      {selectedOrderForDetail && (
        <OrderDetailDialog
            isOpen={isOrderDetailDialogOpen}
            onOpenChange={setIsOrderDetailDialogOpen}
            order={selectedOrderForDetail}
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
     </>
   );
 }
