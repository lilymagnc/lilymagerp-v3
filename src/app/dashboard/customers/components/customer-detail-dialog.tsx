"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface Customer {
  id: string
  companyName: string
  ordererName: string
  ordererContact: string
  email: string
  address: string
  points: number
  createdAt: any
  updatedAt?: any
}

interface CustomerDetailDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  customer: Customer | null
}

export function CustomerDetailDialog({ isOpen, onOpenChange, customer }: CustomerDetailDialogProps) {
  if (!customer) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>거래처 상세 정보</span>
            <Badge variant="outline">{customer.companyName}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">회사명</label>
                <p className="text-sm mt-1">{customer.companyName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">주문자명</label>
                <p className="text-sm mt-1">{customer.ordererName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">연락처</label>
                <p className="text-sm mt-1">{customer.ordererContact}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">이메일</label>
                <p className="text-sm mt-1">{customer.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 주소 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">주소 정보</h3>
            <div>
              <label className="text-sm font-medium text-muted-foreground">배송 주소</label>
              <p className="text-sm mt-1 break-words">{customer.address}</p>
            </div>
          </div>

          <Separator />

          {/* 포인트 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">포인트 정보</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">보유 포인트:</span>
              <Badge variant="secondary" className="text-lg font-bold">
                {customer.points.toLocaleString()} P
              </Badge>
            </div>
          </div>

          <Separator />

          {/* 등록 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">등록 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">등록일</label>
                <p className="text-sm mt-1">
                  {customer.createdAt ? format(customer.createdAt.toDate(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko }) : '-'}
                </p>
              </div>
              {customer.updatedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">수정일</label>
                  <p className="text-sm mt-1">
                    {format(customer.updatedAt.toDate(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 