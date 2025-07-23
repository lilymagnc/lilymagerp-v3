
"use client";

import { useState, useRef } from "react";
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

const mockOrders: (OrderPrintData & { id: string; status: string })[] = [
    { 
      id: "ORD-001", 
      customer: "김민준", 
      date: "2023-10-26", 
      amount: 123000, 
      status: "completed",
      orderDate: "2023-10-26",
      ordererName: "김민준",
      ordererContact: "010-1111-1111",
      items: "릴리 화이트 셔츠 / 1개\n맥 데님 팬츠 / 1개",
      totalAmount: 113000,
      deliveryFee: 10000,
      paymentMethod: "카드",
      paymentStatus: "완결",
      deliveryDate: "2023-10-27 14:00",
      recipientName: "김민준",
      recipientContact: "010-1111-1111",
      deliveryAddress: "서울시 강남구 테헤란로 123, 45층",
      message: "카드: 생일 축하해!",
      branchInfo: { name: "릴리맥광화문점", address: "서울시 중구 세종대로 136", contact: "010-1234-5678", account: "국민 111-111-111" }
    },
    { id: "ORD-002", customer: "이서연", date: "2023-10-26", amount: 78000, status: "processing", orderDate: "2023-10-26", ordererName: "이서연", ordererContact: "010-2222-2222", items: "맥 데님 팬츠 / 1개", totalAmount: 78000, deliveryFee: 0, paymentMethod: "계좌이체", paymentStatus: "입금대기", deliveryDate: "픽업", recipientName: "이서연", recipientContact: "010-2222-2222", deliveryAddress: "매장 픽업", message: "리본: 축하드립니다", branchInfo: { name: "릴리맥여의도점", address: "서울시 영등포구 여의나루로50", contact: "010-9876-5432", account: "신한 222-222-222" } },
    { id: "ORD-003", customer: "박지훈", date: "2023-10-25", amount: 210000, status: "completed", orderDate: "2023-10-25", ordererName: "박지훈", ordererContact: "010-3333-3333", items: "오렌지 포인트 스커트 / 3개", totalAmount: 186000, deliveryFee: 24000, paymentMethod: "카드", paymentStatus: "완결", deliveryDate: "2023-10-26 18:00", recipientName: "박지은", recipientContact: "010-3333-3334", deliveryAddress: "서울시 서초구 서초대로 77길", message: "없음", branchInfo: { name: "릴리맥NC이스트폴점", address: "서울시 광진구 아차산로 402", contact: "010-1122-3344", account: "우리 333-333-333" } },
    { id: "ORD-004", customer: "최수아", date: "2023-10-25", amount: 45000, status: "canceled", orderDate: "2023-10-25", ordererName: "최수아", ordererContact: "010-4444-4444", items: "릴리 화이트 셔츠 / 1개", totalAmount: 45000, deliveryFee: 0, paymentMethod: "네이버페이", paymentStatus: "취소", deliveryDate: "N/A", recipientName: "최수아", recipientContact: "010-4444-4444", deliveryAddress: "N/A", message: "N/A", branchInfo: { name: "릴리맥광화문점", address: "서울시 중구 세종대로 136", contact: "010-1234-5678", account: "국민 111-111-111" } },
    { id: "ORD-005", customer: "정다은", date: "2023-10-24", amount: 92000, status: "completed", orderDate: "2023-10-24", ordererName: "정다은", ordererContact: "010-5555-5555", items: "베이직 블랙 슬랙스 / 1개", totalAmount: 82000, deliveryFee: 10000, paymentMethod: "카카오페이", paymentStatus: "완결", deliveryDate: "2023-10-25 12:00", recipientName: "김다은", recipientContact: "010-5555-5556", deliveryAddress: "서울시 마포구 양화로 12", message: "카드: 고맙습니다", branchInfo: { name: "릴리맥여의도2호점", address: "서울시 영등포구 국제금융로8길 31", contact: "010-5678-1234", account: "하나 444-444-444" } },
    { id: "ORD-006", customer: "강현우", date: "2023-10-24", amount: 150000, status: "processing", orderDate: "2023-10-24", ordererName: "강현우", ordererContact: "010-6666-6666", items: "그린 스트라이프 티 / 2개", totalAmount: 150000, deliveryFee: 0, paymentMethod: "현장결제", paymentStatus: "미결제", deliveryDate: "픽업", recipientName: "강현우", recipientContact: "010-6666-6666", deliveryAddress: "매장 픽업", message: "없음", branchInfo: { name: "릴리맥광화문점", address: "서울시 중구 세종대로 136", contact: "010-1234-5678", account: "국민 111-111-111" } },
];

export default function OrdersPage() {
  const { toast } = useToast();
  const [printableOrderData, setPrintableOrderData] = useState<OrderPrintData | null>(null);
  const printableComponentRef = useRef(null);
  
  const handlePrint = (order: OrderPrintData) => {
    // Destructure to exclude non-PrintableOrder fields
    const { id, status, customer, date, amount, ...printData } = order as any;
    setPrintableOrderData(printData);
    
    setTimeout(() => {
        window.print();
        setPrintableOrderData(null);
    }, 100);
  }

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
                <TableHead>고객명</TableHead>
                <TableHead>주문일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>
                  <span className="sr-only">작업</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                      <Badge variant={order.status === 'completed' ? 'default' : order.status === 'processing' ? 'secondary' : 'destructive'}>
                          {order.status === 'completed' ? '완료' : order.status === 'processing' ? '처리중' : '취소'}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">₩{order.amount.toLocaleString()}</TableCell>
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
              ))}
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
