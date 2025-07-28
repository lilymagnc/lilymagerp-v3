
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
import { Customer } from "@/hooks/use-customers";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import React from "react";

interface CustomerDetailsProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEdit: () => void;
  customer: Customer | null;
}

export function CustomerDetails({ isOpen, onOpenChange, onEdit, customer }: CustomerDetailsProps) {
  
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
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
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">주문 내역</h4>
              <div className="border rounded-md min-h-[200px] flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">주문 내역 조회 기능은 현재 비활성화되어 있습니다.</p>
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
