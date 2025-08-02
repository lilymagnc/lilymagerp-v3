"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Printer } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Customer } from "@/hooks/use-customers";
import { useOrders } from "@/hooks/use-orders";
import { useBranches } from "@/hooks/use-branches";
import { Order } from "@/hooks/use-orders";
import { Branch } from "@/hooks/use-branches";

interface StatementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

interface StatementData {
  customer: Customer;
  branch: Branch | null;
  period: {
    startDate: Date;
    endDate: Date;
  };
  orders: Order[];
  summary: {
    totalOrders: number;
    totalItems: number;
    totalAmount: number;
    totalDeliveryFee: number;
    grandTotal: number;
  };
}

export function StatementDialog({ isOpen, onOpenChange, customer }: StatementDialogProps) {
  const { orders } = useOrders();
  const { branches } = useBranches();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    if (!customer || !startDate || !endDate) {
      setStatementData(null);
      return;
    }

    // 고객의 담당지점 정보 찾기
    const branch = branches.find(b => b.name === customer.branch);

    // 고객의 주문 내역 필터링 - 연락처로 매칭
    const customerOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate.seconds * 1000);
      return order.orderer.contact === customer.contact && 
             orderDate >= startDate && 
             orderDate <= endDate;
    });

    // 요약 정보 계산
    const summary = {
      totalOrders: customerOrders.length,
      totalItems: customerOrders.reduce((sum, order) => sum + order.items.length, 0),
      totalAmount: customerOrders.reduce((sum, order) => sum + (order.summary.total || 0), 0),
      totalDeliveryFee: customerOrders.reduce((sum, order) => sum + (order.summary.deliveryFee || 0), 0),
      grandTotal: customerOrders.reduce((sum, order) => sum + (order.summary.total || 0), 0) + 
                   customerOrders.reduce((sum, order) => sum + (order.summary.deliveryFee || 0), 0)
    };

    setStatementData({
      customer,
      branch,
      period: { startDate, endDate },
      orders: customerOrders,
      summary
    });
  }, [customer, startDate, endDate, orders, branches]);

  const generateStatement = () => {
    if (!statementData) {
      console.log('statementData is null');
      return;
    }
    console.log('Generating statement with data:', statementData);
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    window.print();
  };

  // 디버깅을 위한 로그
  console.log('StatementDialog render:', {
    customer,
    startDate,
    endDate,
    statementData,
    showPrintPreview,
    ordersCount: orders.length,
    branchesCount: branches.length
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>거래명세서 생성</DialogTitle>
          <DialogDescription>
            고객의 거래 내역을 조회하여 거래명세서를 생성합니다.
          </DialogDescription>
        </DialogHeader>

        {!showPrintPreview ? (
          <>
            {/* 고객 정보 */}
            {customer && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">고객 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">고객명:</span> {customer.name}
                  </div>
                  <div>
                    <span className="font-medium">연락처:</span> {customer.contact}
                  </div>
                  <div>
                    <span className="font-medium">유형:</span> {customer.type === 'personal' ? '개인' : '기업'}
                  </div>
                  <div>
                    <span className="font-medium">담당지점:</span> {customer.branch}
                  </div>
                </div>
              </div>
            )}

            {/* 기간 선택 */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4">거래 기간 선택</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">시작일</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: ko }) : "날짜 선택"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">종료일</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: ko }) : "날짜 선택"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* 거래 내역 요약 */}
            {statementData && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4">거래 내역 요약</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{statementData.summary.totalOrders}</div>
                    <div className="text-sm text-muted-foreground">총 주문 수</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{statementData.summary.totalItems}</div>
                    <div className="text-sm text-muted-foreground">총 상품 개수</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{statementData.summary.totalAmount.toLocaleString()}원</div>
                    <div className="text-sm text-muted-foreground">총 상품 금액</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{statementData.summary.totalDeliveryFee.toLocaleString()}원</div>
                    <div className="text-sm text-muted-foreground">총 배송비</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{statementData.summary.grandTotal.toLocaleString()}원</div>
                    <div className="text-sm text-muted-foreground">총 합계 (배송비 포함)</div>
                  </div>
                </div>

                {/* 주문 미리보기 */}
                <div className="space-y-2">
                  <h4 className="font-medium">주문 내역 미리보기</h4>
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {statementData.orders.map((order, index) => (
                      <div key={order.id} className="text-xs p-2 bg-white rounded border">
                        <div className="flex justify-between mb-1">
                          <span>{format(new Date(order.orderDate.seconds * 1000), "MM/dd", { locale: ko })}</span>
                          <span>{order.summary.total?.toLocaleString()}원</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.map(item => item.name).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                취소
              </Button>
              <Button 
                onClick={generateStatement} 
                disabled={!statementData || statementData.orders.length === 0}
              >
                거래명세서 출력
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <style jsx global>{`
              @media print {
                @page {
                  size: A4;
                  margin: 10mm 15mm;
                }
                
                /* 인쇄 시 불필요한 요소들 숨기기 */
                .no-print,
                button,
                .button,
                [class*="dialog"],
                [class*="modal"],
                [class*="popup"],
                [class*="header"],
                [class*="footer"],
                [class*="sidebar"],
                [class*="nav"],
                [class*="menu"] {
                  display: none !important;
                }
                
                /* 인쇄 영역만 표시 */
                #printable-area {
                  background: white !important;
                  color: black !important;
                  width: 100% !important;
                  max-width: none !important;
                  margin: 0 !important;
                  padding: 10mm !important;
                  font-size: 12px !important;
                }
                
                /* 테이블 최적화 */
                #printable-area table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                }
                
                #printable-area td, #printable-area th {
                  padding: 4px 6px !important;
                  font-size: 11px !important;
                  white-space: nowrap !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                }
                
                /* 페이지 나누기 */
                #printable-area table {
                  page-break-inside: auto;
                }
                
                #printable-area tr {
                  page-break-inside: avoid;
                }
                
                /* 헤더 반복 */
                #printable-area thead {
                  display: table-header-group;
                }
                
                /* 푸터 반복 */
                #printable-area tfoot {
                  display: table-footer-group;
                }
              }
            `}</style>

            <div className="flex justify-between items-center mb-4 no-print">
              <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                뒤로가기
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                인쇄하기
              </Button>
            </div>

            <div id="printable-area" className="bg-white text-black p-8">
              {/* 제목 */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold m-0" style={{ 
                  letterSpacing: '12px', 
                  border: '3px solid black', 
                  padding: '15px',
                  display: 'inline-block'
                }}>
                  거 래 명 세 서
                </h1>
              </div>

              {!statementData ? (
                <div className="text-center py-8">
                  <p className="text-lg text-gray-600">데이터를 불러오는 중...</p>
                </div>
              ) : (
                <>
                  {/* 상단 정보 - 2열 구조 */}
                  <div className="flex mb-8" style={{ gap: '20px' }}>
                    {/* 왼쪽: 공급받는자 (고객정보) */}
                    <div className="flex-1">
                      <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                        <thead>
                          <tr>
                            <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '14px', fontWeight: 'bold' }}>
                              공급받는자
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>상호:</strong> {statementData.customer.name}
                              </div>
                              {statementData.customer.type === 'company' && (
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>회사명:</strong> {statementData.customer.companyName}
                                </div>
                              )}
                              <div style={{ marginBottom: '4px' }}>
                                <strong>연락처:</strong> {statementData.customer.contact}
                              </div>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>담당지점:</strong> {statementData.customer.branch}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* 오른쪽: 공급자 (지점정보) */}
                    <div className="flex-1">
                      <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                        <thead>
                          <tr>
                            <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '14px', fontWeight: 'bold' }}>
                              공급자
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>상호:</strong> {statementData.branch?.name || '릴리맥'}
                              </div>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>주소:</strong> {statementData.branch?.address || '서울특별시'}
                              </div>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>연락처:</strong> {statementData.branch?.phone || '02-1234-5678'}
                              </div>
                              <div style={{ marginBottom: '4px' }}>
                                <strong>사업자등록번호:</strong> {statementData.branch?.businessNumber || '123-45-67890'}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 거래 기간 */}
                  <div className="mb-6">
                    <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '14px', fontWeight: 'bold', width: '120px' }}>
                            거래기간
                          </td>
                          <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px' }}>
                            {format(statementData.period.startDate, "yyyy년 MM월 dd일", { locale: ko })} ~ 
                            {format(statementData.period.endDate, "yyyy년 MM월 dd일", { locale: ko })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 거래 내역 테이블 */}
                  <div className="mb-6">
                    <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '15%' }}>
                            거래일자
                          </th>
                          <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '45%' }}>
                            품목
                          </th>
                          <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '10%', textAlign: 'right' }}>
                            수량
                          </th>
                          <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '15%', textAlign: 'right' }}>
                            단가
                          </th>
                          <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '15%', textAlign: 'right' }}>
                            금액
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {statementData.orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ border: '1px solid black', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                              해당 기간에 거래 내역이 없습니다.
                            </td>
                          </tr>
                        ) : (
                          statementData.orders.map((order, orderIndex) => {
                            // 주문의 각 상품을 개별 행으로 표시
                            return order.items.map((item, itemIndex) => {
                              // 배송비를 포함한 단가 계산 (배송비를 상품 개수로 나누어 각 상품에 분배)
                              const deliveryFeePerItem = order.summary.deliveryFee ? 
                                Math.round(order.summary.deliveryFee / order.items.length) : 0;
                              const priceWithDelivery = item.price + deliveryFeePerItem;
                              const totalWithDelivery = priceWithDelivery * item.quantity;
                              
                              return (
                                <tr key={`${order.id}-${itemIndex}`}>
                                  <td style={{ border: '1px solid black', padding: '6px', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {format(new Date(order.orderDate.seconds * 1000), "yyyy-MM-dd", { locale: ko })}
                                  </td>
                                  <td style={{ border: '1px solid black', padding: '6px', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.name}
                                  </td>
                                  <td style={{ border: '1px solid black', padding: '6px', fontSize: '11px', textAlign: 'right' }}>
                                    {item.quantity}
                                  </td>
                                  <td style={{ border: '1px solid black', padding: '6px', fontSize: '11px', textAlign: 'right' }}>
                                    {priceWithDelivery.toLocaleString()}원
                                  </td>
                                  <td style={{ border: '1px solid black', padding: '6px', fontSize: '11px', textAlign: 'right' }}>
                                    {totalWithDelivery.toLocaleString()}원
                                  </td>
                                </tr>
                              );
                            });
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>
                            합계
                          </td>
                          <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>
                            {statementData.orders.reduce((sum, order) => {
                              return sum + order.items.reduce((itemSum, item) => {
                                const deliveryFeePerItem = order.summary.deliveryFee ? 
                                  Math.round(order.summary.deliveryFee / order.items.length) : 0;
                                const priceWithDelivery = item.price + deliveryFeePerItem;
                                return itemSum + (priceWithDelivery * item.quantity);
                              }, 0);
                            }, 0).toLocaleString()}원
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* 하단 정보 */}
                  <div className="flex justify-between items-end">
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>비고:</strong> 위와 같이 거래명세서를 발행합니다.
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>발행일:</strong> {format(new Date(), "yyyy년 MM월 dd일", { locale: ko })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', marginBottom: '20px' }}>
                        공급자
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {statementData.branch?.name || '릴리맥'}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        대표자: {statementData.branch?.manager || '홍길동'}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 