
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, MoreHorizontal, Printer } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PrintableOrder, OrderPrintData } from "./new/components/printable-order";
import { useToast } from "@/hooks/use-toast";
import { useOrders, Order } from "@/hooks/use-orders";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useBranches } from "@/hooks/use-branches";

export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const { branches } = useBranches();
  const { toast } = useToast();
  const [printableOrderData, setPrintableOrderData] = useState<OrderPrintData | null>(null);
  const printableComponentRef = useRef(null);
  
  const handlePrint = (order: Order) => {
    const branchInfo = branches.find(b => b.id === order.branchId);

    const printData: OrderPrintData = {
      orderDate: format(order.orderDate.toDate(), 'yyyy-MM-dd'),
      ordererName: order.orderer.name,
      ordererContact: order.orderer.contact,
      items: order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n'),
      totalAmount: order.summary.subtotal,
      deliveryFee: order.summary.deliveryFee,
      paymentMethod: "카드", // This should come from order data
      paymentStatus: "완결", // This should come from order data
      deliveryDate: order.receiptType === 'delivery' && order.deliveryInfo 
        ? `${order.deliveryInfo.date} ${order.deliveryInfo.time}` 
        : "매장 픽업",
      recipientName: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.recipientName : (order.pickupInfo?.pickerName ?? ''),
      recipientContact: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.recipientContact : (order.pickupInfo?.pickerContact ?? ''),
      deliveryAddress: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.address : '매장 픽업',
      message: `${order.message.type}: ${order.message.content}`,
      branchInfo: {
        name: order.branchName,
        address: branchInfo?.address || "정보 없음",
        contact: branchInfo?.phone || "정보 없음",
        account: branchInfo?.account || "정보 없음",
      }
    };

    setPrintableOrderData(printData);
  }

  useEffect(() => {
    if (printableOrderData) {
      const print = () => {
        window.print();
      };
      
      // Delay printing slightly to ensure component has rendered with new data
      const timer = setTimeout(print, 100);

      const handleAfterPrint = () => {
        setPrintableOrderData(null);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }
  }, [printableOrderData]);


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


  return (
    <div className="printable-area">
      <div className="screen-only">
        <PageHeader
          title="주문 현황"
          description="모든 주문 내역을 확인하고 관리하세요."
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
              <CardDescription>최근 주문 목록입니다.</CardDescription>
          </CardHeader>
          <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주문 ID</TableHead>
                <TableHead>주문자</TableHead>
                <TableHead>주문일</TableHead>
                <TableHead>출고지점</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>
                  <span className="sr-only">작업</span>
                </TableHead>
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
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))
              ) : (
                orders.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>{order.orderer.name}</TableCell>
                    <TableCell>{format(order.orderDate.toDate(), 'yyyy-MM-dd')}</TableCell>
                    <TableCell>{order.branchName}</TableCell>
                    <TableCell>
                        {getStatusBadge(order.status)}
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
                            <DropdownMenuItem onSelect={() => handlePrint(order)}>
                            <Printer className="mr-2 h-4 w-4" />
                            주문서 출력
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
      </div>
      <div className="print-only">
        {printableOrderData && <PrintableOrder ref={printableComponentRef} data={printableOrderData} />}
      </div>
    </div>
  );
}
