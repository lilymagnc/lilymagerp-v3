
"use client";

import { useState, useRef, forwardRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Printer } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOrders, Order } from "@/hooks/use-orders";
import { useBranches } from "@/hooks/use-branches";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Printable Component
interface PrintableContentProps {
  order: Order | null;
  branches: ReturnType<useBranches>['branches'];
}

const PrintableContent = forwardRef<HTMLDivElement, PrintableContentProps>(({ order, branches }, ref) => {
    
    const getPrintableData = useCallback(() => {
        if (!order) return null;
        
        const branchInfo = branches.find(b => b.id === order.branchId);

        return {
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
      }, [order, branches]);

    const data = getPrintableData();
    if(!data) return null;

    const renderSection = (title: string, isReceipt: boolean) => (
        <div className="mb-4" style={{ pageBreakInside: 'avoid' }}>
            <div className="text-center mb-4">
                { !isReceipt && (
                    <>
                    <Image src="https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg" alt="Logo" width={180} height={45} className="mx-auto" priority unoptimized />
                    <h1 className="text-2xl font-bold mt-2">릴리맥 플라워앤가든 {title}</h1>
                    </>
                )}
                { isReceipt && <h1 className="text-2xl font-bold mt-2">{title}</h1> }
            </div>
            <table className="w-full border-collapse border border-black text-sm">
                <tbody>
                    <tr>
                        <td className="border border-black p-1 font-bold w-[100px]">주문일</td>
                        <td className="border border-black p-1">{data.orderDate}</td>
                        <td className="border border-black p-1 font-bold w-[100px]">주문자성명</td>
                        <td className="border border-black p-1 w-[120px]">{data.ordererName}</td>
                        <td className="border border-black p-1 font-bold w-[100px]">연락처</td>
                        <td className="border border-black p-1 w-[150px]">{data.ordererContact}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-bold align-top h-24">항목/수량</td>
                        <td className="border border-black p-1 align-top whitespace-pre-wrap" colSpan={5}>{data.items}</td>
                    </tr>
                     {!isReceipt && (
                        <tr>
                            <td className="border border-black p-1 font-bold">금액</td>
                            <td className="border border-black p-1">₩{data.totalAmount.toLocaleString()}</td>
                             <td className="border border-black p-1 font-bold">배송비</td>
                            <td className="border border-black p-1">₩{data.deliveryFee.toLocaleString()}</td>
                            <td className="border border-black p-1 font-bold">결제수단</td>
                            <td className="border border-black p-1">{data.paymentMethod} {data.paymentStatus}</td>
                        </tr>
                    )}
                    <tr>
                        <td className="border border-black p-1 font-bold">배송일/시간</td>
                        <td className="border border-black p-1">{data.deliveryDate}</td>
                        <td className="border border-black p-1 font-bold">받으시는분</td>
                        <td className="border border-black p-1">{data.recipientName}</td>
                        <td className="border border-black p-1 font-bold">연락처</td>
                        <td className="border border-black p-1">{data.recipientContact}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-bold">배송지주소</td>
                        <td colSpan={5} className="border border-black p-1">{data.deliveryAddress}</td>
                    </tr>
                    <tr>
                        <td className="border border-black p-1 font-bold align-top h-16">전달메세지<br/>(카드/리본)</td>
                        <td colSpan={5} className="border border-black p-1 align-top">{data.message}</td>
                    </tr>
                    {isReceipt && (
                        <tr>
                            <td className="border border-black p-1 font-bold">인수자성명</td>
                            <td colSpan={5} className="border border-black p-1 h-10"></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      );

      const branchesContactInfo = [
        { name: "릴리맥여의도점", tel: "010-8241-9518 / 010-2285-9518" },
        { name: "릴리맥여의도2호점", tel: "010-7939-9518 / 010-2285-9518" },
        { name: "릴리맥광화문점", tel: "010-2385-9518 / 010-2285-9518" },
        { name: "릴리맥NC이스트폴점", tel: "010-2908-5459 / 010-2285-9518" },
      ];
      const onlineShopUrl = "www.lilymagshop.co.kr";

    return (
        <div ref={ref} className="p-4 bg-white text-black font-sans text-xs">
            {renderSection('주문서', false)}
            <div className="border-t-2 border-dashed border-gray-400 my-8"></div>
            {renderSection('인수증', true)}
             <div className="mt-8 text-center border-t border-black pt-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 max-w-lg mx-auto">
                    {branchesContactInfo.map(branch => (
                        <div key={branch.name} className="text-left">
                            <span className="font-bold">{branch.name}:</span>
                            <span className="ml-2">{branch.tel}</span>
                        </div>
                    ))}
                </div>
                <div className="text-center">
                    <span className="font-bold">[온라인쇼핑몰]:</span>
                    <span className="ml-2">{onlineShopUrl}</span>
                </div>
            </div>
        </div>
    );
});
PrintableContent.displayName = 'PrintableContent';


export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const { branches } = useBranches();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const printableComponentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printableComponentRef.current,
    onAfterPrint: () => setSelectedOrder(null),
  });

  useEffect(() => {
    // When selectedOrder is set, and the component has re-rendered, trigger the print dialog.
    if (selectedOrder && handlePrint) {
      handlePrint();
    }
  }, [selectedOrder, handlePrint]);

  const triggerPrint = (order: Order) => {
    setSelectedOrder(order);
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
                    <Button variant="ghost" size="icon" onClick={() => triggerPrint(order)}>
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
      
      {/* Hidden component for printing */}
      <div className="hidden print:block">
        {selectedOrder && <PrintableContent ref={printableComponentRef} order={selectedOrder} branches={branches} />}
      </div>
    </>
  );
}
