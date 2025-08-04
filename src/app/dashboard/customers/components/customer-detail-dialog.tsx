"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Customer } from "@/hooks/use-customers"

// 안전한 날짜 포맷팅 함수
const formatSafeDate = (dateValue: any): string => {
  try {
    if (!dateValue) return '-';
    
    // 문자열인 경우
    if (typeof dateValue === 'string') {
      return format(new Date(dateValue), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    }
    
    // Firebase Timestamp인 경우
    if (dateValue && typeof dateValue.toDate === 'function') {
      return format(dateValue.toDate(), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    }
    
    // Date 객체인 경우
    if (dateValue instanceof Date) {
      return format(dateValue, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    }
    
    return '-';
  } catch (error) {
    console.error('Date formatting error:', error, dateValue);
    return '-';
  }
};

interface CustomerDetailDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  customer: Customer | null
}

export function CustomerDetailDialog({ isOpen, onOpenChange, customer }: CustomerDetailDialogProps) {
  if (!customer) return null
  
  // 디버깅을 위한 로그
  console.log('CustomerDetailDialog - customer data:', {
    id: customer.id,
    name: customer.name,
    createdAt: customer.createdAt,
    createdAtType: typeof customer.createdAt,
    lastOrderDate: customer.lastOrderDate,
    lastOrderDateType: typeof customer.lastOrderDate
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>거래처 상세 정보</span>
            <Badge variant="outline">{customer.companyName || customer.name}</Badge>
          </DialogTitle>
          <DialogDescription>
            고객의 상세 정보, 포인트 현황 및 등록 정보를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">고객명</label>
                <p className="text-sm mt-1">{customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">회사명</label>
                <p className="text-sm mt-1">{customer.companyName || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">연락처</label>
                <p className="text-sm mt-1">{customer.contact}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">이메일</label>
                <p className="text-sm mt-1">{customer.email || '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 주소 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">추가 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">담당 지점</label>
                <p className="text-sm mt-1">{customer.branch || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">고객 등급</label>
                <p className="text-sm mt-1">{customer.grade || '신규'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 포인트 정보 */}
          <div>
            <h3 className="text-lg font-semibold mb-3">포인트 정보</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">보유 포인트:</span>
              <Badge variant="secondary" className="text-lg font-bold">
                {(customer.points || 0).toLocaleString()} P
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
                  {formatSafeDate(customer.createdAt)}
                </p>
              </div>
              {customer.lastOrderDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">최근 주문일</label>
                  <p className="text-sm mt-1">
                    {formatSafeDate(customer.lastOrderDate)}
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