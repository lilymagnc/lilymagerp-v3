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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Customer } from "@/hooks/use-customers"
import { useOrders } from "@/hooks/use-orders"
import { useState, useEffect } from "react"
import { Eye, Package, Calendar, DollarSign } from "lucide-react"

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
  const { orders } = useOrders();
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  useEffect(() => {
    if (customer && orders.length > 0) {
      // 고객의 연락처로 주문을 필터링
      const filteredOrders = orders.filter(order => 
        order.customerContact === customer.contact || 
        order.customerName === customer.name
      );
      setCustomerOrders(filteredOrders);
    }
  }, [customer, orders]);

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
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>고객 상세 정보</span>
              <Badge variant="outline">{customer.companyName || customer.name}</Badge>
            </DialogTitle>
            <DialogDescription>
              고객의 상세 정보, 포인트 현황, 구매 내역을 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">기본 정보</TabsTrigger>
              <TabsTrigger value="orders">구매 내역 ({customerOrders.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-6">
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

              {/* 추가 정보 */}
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
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">구매 내역</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>총 {customerOrders.length}건의 주문</span>
                </div>
              </div>
              
              {customerOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>구매 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>주문일</TableHead>
                        <TableHead>주문번호</TableHead>
                        <TableHead>상품 수</TableHead>
                        <TableHead>총 금액</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>상세보기</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatSafeDate(order.orderDate)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.items?.length || 0}개</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {order.totalAmount?.toLocaleString() || 0}원
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status === 'completed' ? '완료' : '진행중'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetail(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 주문 상세 정보 다이얼로그 */}
      {selectedOrder && (
        <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>주문 상세 정보</span>
                <Badge variant="outline">{selectedOrder.orderNumber}</Badge>
              </DialogTitle>
              <DialogDescription>
                주문의 상세 정보와 상품 목록을 확인할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* 주문 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">주문 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">주문번호</label>
                    <p className="text-sm mt-1">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">주문일</label>
                    <p className="text-sm mt-1">{formatSafeDate(selectedOrder.orderDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">총 금액</label>
                    <p className="text-sm mt-1 font-bold">{selectedOrder.totalAmount?.toLocaleString() || 0}원</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">상태</label>
                    <p className="text-sm mt-1">
                      <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedOrder.status === 'completed' ? '완료' : '진행중'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 상품 목록 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">상품 목록</h3>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              수량: {item.quantity}개 | 단가: {item.price?.toLocaleString() || 0}원
                            </p>
                          </div>
                          <p className="font-bold">
                            {(item.price * item.quantity)?.toLocaleString() || 0}원
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">상품 정보가 없습니다.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
} 