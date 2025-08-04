"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Order } from "@/hooks/use-orders";
import { Timestamp } from "firebase/firestore";
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  MapPin, 
  Calendar, 
  Clock, 
  Package, 
  MessageSquare,
  FileText,
  CreditCard,
  Truck,
  Home
} from "lucide-react";

interface OrderDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export function OrderDetailDialog({ isOpen, onOpenChange, order }: OrderDetailDialogProps) {
  if (!order) return null;

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
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-blue-500 text-white">완결</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500 text-white">미결</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDeliveryMethodBadge = (method: string) => {
    switch (method) {
      case 'pickup':
        return <Badge variant="outline" className="bg-green-50 text-green-700">픽업</Badge>;
      case 'delivery':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">배송</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case 'card':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">카드</Badge>;
      case 'ribbon':
        return <Badge variant="outline" className="bg-pink-50 text-pink-700">리본</Badge>;
      case 'none':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">없음</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            주문 상세 정보
            <span className="text-sm font-normal text-muted-foreground">
              ({order.id})
            </span>
          </DialogTitle>
          <DialogDescription>
            주문의 상세 정보를 확인합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 주문 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                주문 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">출고지점</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.branchName}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">주문일시</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.orderDate && format((order.orderDate as Timestamp).toDate(), 'yyyy-MM-dd HH:mm')}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">주문 상태</span>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(order.status)}
                    {order.payment && getPaymentStatusBadge(order.payment.status)}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">결제 수단</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {order.payment?.method || '미정'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주문자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                주문자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">주문자명</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.orderer.name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">연락처</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.orderer.contact}</p>
                </div>
                {order.orderer.companyName && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">회사명</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.orderer.companyName}</p>
                  </div>
                )}
                {order.orderer.email && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">이메일</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.orderer.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 수령 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                수령 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">수령 방법</span>
                  </div>
                  {getDeliveryMethodBadge(order.delivery?.method || 'pickup')}
                </div>
                {order.delivery?.pickupDate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">픽업/배송일시</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format((order.delivery.pickupDate as Timestamp).toDate(), 'yyyy-MM-dd HH:mm')}
                    </p>
                  </div>
                )}
                {order.delivery?.recipient && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">수령인명</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.delivery.recipient.name}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">수령인 연락처</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.delivery.recipient.contact}</p>
                    </div>
                  </>
                )}
                {order.delivery?.address && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">배송 주소</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.delivery.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 주문 상품 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                주문 상품
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        수량: {item.quantity}개
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₩{item.price.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        총 ₩{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 메시지 정보 */}
          {order.message && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  메시지 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">메시지 타입</span>
                    </div>
                    {getMessageTypeBadge(order.message.type)}
                  </div>
                  {order.message.sender && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">보내는 분</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.message.sender}</p>
                    </div>
                  )}
                </div>
                {order.message.content && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">메시지 내용</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{order.message.content}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 특별 요청사항 */}
          {order.specialRequests && order.specialRequests.trim() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  특별 요청사항
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap text-amber-800">
                    {order.specialRequests}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 주문 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                주문 요약
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">상품 금액</span>
                  <span className="text-sm">₩{order.summary.subtotal.toLocaleString()}</span>
                </div>
                {order.summary.pointsUsed > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">포인트 사용</span>
                    <span className="text-sm">-₩{order.summary.pointsUsed.toLocaleString()}</span>
                  </div>
                )}
                {order.summary.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">배송비</span>
                    <span className="text-sm">₩{order.summary.deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>총 결제금액</span>
                  <span>₩{order.summary.total.toLocaleString()}</span>
                </div>
                {order.summary.pointsEarned > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span className="text-sm">적립 포인트</span>
                    <span className="text-sm">+{order.summary.pointsEarned.toLocaleString()} P</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
} 