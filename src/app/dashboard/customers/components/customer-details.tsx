
"use client";

import { useEffect, useState } from "react";
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
import { Order } from "@/hooks/use-orders";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerDetailsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEdit: () => void;
  customer: Customer | null;
}

export function CustomerDetails({ isOpen, onOpenChange, onEdit, customer }: CustomerDetailsProps) {
  const { getCustomerOrderHistory } = useCustomers();
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        const history = await getCustomerOrderHistory(customer.contact);
        setOrderHistory(history);
        setHistoryLoading(false);
      };
      fetchHistory();
    }
  }, [isOpen, customer, getCustomerOrderHistory]);

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
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
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-4">
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
             <Separator />
              <div>
                <h4 className="font-semibold text-lg mb-2">주문 내역</h4>
                <div className="border rounded-md">
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>주문일</TableHead>
                          <TableHead>주문 지점</TableHead>
                          <TableHead>총액</TableHead>
                          <TableHead>상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyLoading ? (
                          Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            </TableRow>
                          ))
                        ) : orderHistory.length > 0 ? (
                          orderHistory.map(order => (
                            <TableRow key={order.id}>
                              <TableCell>{format((order.orderDate as Timestamp).toDate(), "yyyy-MM-dd")}</TableCell>
                              <TableCell>{order.branchName}</TableCell>
                              <TableCell>₩{order.summary.total.toLocaleString()}</TableCell>
                              <TableCell><Badge>{order.status}</Badge></TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                              주문 내역이 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                </div>
              </div>

        </div>
        <DialogFooter className="sm:justify-end pt-4">
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
