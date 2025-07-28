
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Customer, useCustomers } from "@/hooks/use-customers";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import React, { useState, useEffect } from "react";
import type { Order } from "@/hooks/use-orders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Timestamp } from "firebase/firestore";
import { downloadXLSX } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface CustomerDetailsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEdit: () => void;
  customer: Customer | null;
}

export function CustomerDetails({ isOpen, onOpenChange, onEdit, customer }: CustomerDetailsProps) {
  const { getCustomerOrderHistory } = useCustomers();
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && customer) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        const history = await getCustomerOrderHistory(customer.contact);
        setOrderHistory(history);
        setLoadingHistory(false);
      };
      fetchHistory();
    } else {
        setOrderHistory([]);
    }
  }, [isOpen, customer, getCustomerOrderHistory]);

  const handleDownloadOrderHistory = () => {
    if (!customer || orderHistory.length === 0) {
      toast({
        variant: "destructive",
        title: "내보낼 데이터 없음",
        description: "해당 고객의 주문 내역이 없습니다.",
      });
      return;
    }

    const dataToExport = orderHistory.flatMap(order => 
      order.items.map(item => ({
        '주문일': format((order.orderDate as Timestamp).toDate(), "yyyy-MM-dd HH:mm"),
        '주문ID': order.id,
        '주문자': order.orderer.name,
        '항목명': item.name,
        '수량': item.quantity,
        '단가': item.price,
        '합계': item.price * item.quantity,
        '주문상태': order.status,
        '결제상태': order.payment.status,
      }))
    );

    downloadXLSX(dataToExport, `${customer.name}_주문내역`);
    toast({
      title: "다운로드 성공",
      description: `고객의 주문 내역 ${dataToExport.length}건이 다운로드되었습니다.`,
    });
  };
  
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{customer.name} {customer.companyName && `(${customer.companyName})`}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Badge variant={customer.type === 'company' ? 'secondary' : 'outline'}>
                {customer.type === 'company' ? '기업' : '개인'}
              </Badge>
              <span>|</span>
              <span>{customer.contact}</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="space-y-4">
                <h4 className="font-semibold text-lg">고객 정보</h4>
                 <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm text-muted-foreground">이메일</p>
                    <p className="col-span-2 text-sm">{customer.email || "-"}</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm text-muted-foreground">담당 지점</p>
                    <p className="col-span-2 text-sm">{customer.branch}</p>
                </div>
                 <Separator />
                <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm text-muted-foreground">고객 등급</p>
                    <p className="col-span-2 text-sm">{customer.grade || "신규"}</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm text-muted-foreground">보유 포인트</p>
                    <p className="col-span-2 text-sm font-bold text-primary">{(customer.points || 0).toLocaleString()} P</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm text-muted-foreground">태그</p>
                    <div className="col-span-2 text-sm flex flex-wrap gap-1">
                        {customer.tags?.split(',').map(tag => tag.trim() && <Badge key={tag} variant="outline" className="font-normal">{tag.trim()}</Badge>)}
                    </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm text-muted-foreground">생일</p>
                    <p className="col-span-2 text-sm">{customer.birthday ? format(new Date(customer.birthday), "MM월 dd일", { locale: ko }) : '-'}</p>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                    <p className="text-sm text-muted-foreground">결혼 기념일</p>
                    <p className="col-span-2 text-sm">{customer.anniversary ? format(new Date(customer.anniversary), "MM월 dd일", { locale: ko }) : '-'}</p>
                </div>
                
                {customer.type === 'company' && (
                    <>
                        <Separator />
                        <div className="grid grid-cols-3 items-center gap-4">
                            <p className="text-sm text-muted-foreground">대표자명</p>
                            <p className="col-span-2 text-sm">{customer.ceoName || "-"}</p>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <p className="text-sm text-muted-foreground">사업자번호</p>
                            <p className="col-span-2 text-sm">{customer.businessNumber || "-"}</p>
                        </div>
                        <div className="grid grid-cols-3 items-start gap-4">
                            <p className="text-sm text-muted-foreground">사업장 주소</p>
                            <p className="col-span-2 text-sm">{customer.businessAddress || "-"}</p>
                        </div>
                    </>
                )}
                 <Separator />
                <div className="grid grid-cols-3 items-start gap-4">
                    <p className="text-sm text-muted-foreground pt-1">메모</p>
                    <p className="col-span-2 text-sm whitespace-pre-wrap">{customer.memo || "-"}</p>
                </div>
            </div>

            <div className="space-y-4">
                 <h4 className="font-semibold text-lg">주문 내역</h4>
                 <div className="border rounded-md">
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>주문일</TableHead>
                                 <TableHead>항목</TableHead>
                                 <TableHead className="text-right">금액</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                             {loadingHistory ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-4 w-16"/></TableCell>
                                    </TableRow>
                                ))
                             ) : orderHistory.length > 0 ? (
                                orderHistory.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>{format( (order.orderDate as Timestamp).toDate(), "yy-MM-dd")}</TableCell>
                                        <TableCell>{order.items[0].name}{order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}</TableCell>
                                        <TableCell className="text-right">₩{order.summary.total.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        주문 내역이 없습니다.
                                    </TableCell>
                                </TableRow>
                             )}
                         </TableBody>
                     </Table>
                 </div>
            </div>
        </div>
        <DialogFooter className="sm:justify-between pt-4">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleDownloadOrderHistory} disabled={loadingHistory}>
                <Download className="mr-2 h-4 w-4" />
                주문 내역 다운로드
            </Button>
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
                <Button type="button" variant="secondary">닫기</Button>
            </DialogClose>
            <Button onClick={onEdit}>정보 수정</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
