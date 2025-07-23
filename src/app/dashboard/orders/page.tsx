
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Printer } from "lucide-react";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { useBranches, Branch } from "@/hooks/use-branches";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { OrderPrintDialog } from "./components/order-print-dialog";
import { useReactToPrint } from 'react-to-print';

export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const { branches } = useBranches();
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const printableComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printableComponentRef.current,
  });

  const handleOpenPrintDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsPrintDialogOpen(true);
  }
  
  const handleClosePrintDialog = () => {
    setIsPrintDialogOpen(false);
    setSelectedOrder(null);
  }

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

  const onPrintClick = () => {
    if (handlePrint) {
      handlePrint();
    }
  }

  return (
    <>
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
                    <Button variant="ghost" size="icon" onClick={() => handleOpenPrintDialog(order)}>
                      <Printer className="h-4 w-4" />
                      <span className="sr-only">주문서 출력</span>
                    </Button>
                  </TableCell>
                  </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
      
      {isPrintDialogOpen && (
        <OrderPrintDialog
            isOpen={isPrintDialogOpen}
            onOpenChange={handleClosePrintDialog}
            onPrint={() => {
                const augmentedPrint = handlePrint as any;
                augmentedPrint._printRef = printableComponentRef;
                onPrintClick();
            }}
            order={selectedOrder}
            branches={branches}
        />
      )}
    </>
  );
}
