"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCustomers } from "@/hooks/use-customers";
import { useOrders } from "@/hooks/use-orders";
import { useBranches } from "@/hooks/use-branches";
import { Customer } from "@/hooks/use-customers";
import { Order } from "@/hooks/use-orders";
import { Branch } from "@/hooks/use-branches";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
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
    totalAmount: number;
    totalDeliveryFee: number;
    grandTotal: number;
  };
}
export default function StatementPrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers } = useCustomers();
  const { orders } = useOrders();
  const { branches } = useBranches();
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const customerId = searchParams.get('customerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (!customerId || !startDate || !endDate) {
      alert('필수 파라미터가 누락되었습니다.');
      router.back();
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      alert('고객 정보를 찾을 수 없습니다.');
      router.back();
      return;
    }
    // 고객의 담당지점 정보 찾기
    const branch = branches.find(b => b.name === customer.branch);
    const start = new Date(startDate);
    const end = new Date(endDate);
    // 고객의 주문 내역 필터링 - 연락처로 매칭
    const customerOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate.seconds * 1000);
      return order.orderer.contact === customer.contact && 
             orderDate >= start && 
             orderDate <= end;
    });
    // 요약 정보 계산
    const summary = {
      totalOrders: customerOrders.length,
      totalAmount: customerOrders.reduce((sum, order) => sum + (order.summary.total || 0), 0),
      totalDeliveryFee: customerOrders.reduce((sum, order) => sum + (order.summary.deliveryFee || 0), 0),
      grandTotal: customerOrders.reduce((sum, order) => sum + (order.summary.total || 0), 0)
    };
    setStatementData({
      customer,
      branch,
      period: { startDate: start, endDate: end },
      orders: customerOrders,
      summary
    });
    setLoading(false);
  }, [searchParams, customers, orders, branches, router]);
  const handlePrint = () => {
    window.print();
  };
  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }
  if (!statementData) {
    return <div className="flex justify-center items-center h-64">데이터를 불러올 수 없습니다.</div>;
  }
  return (
    <div>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto no-print">
        <PageHeader
          title="거래명세서 출력"
          description={`${statementData.customer.name} 고객의 거래명세서`}
        >
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              인쇄하기
            </Button>
          </div>
        </PageHeader>
      </div>
      <div id="printable-area" className="max-w-4xl mx-auto p-8">
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
                <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '17%' }}>
                  거래일자
                </th>
                <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '50%' }}>
                  품목
                </th>
                <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '7%', textAlign: 'right' }}>
                  수량
                </th>
                <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '13%', textAlign: 'right' }}>
                  단가
                </th>
                <th style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', width: '13%', textAlign: 'right' }}>
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
                  return order.items.map((item, itemIndex) => (
                    <tr key={`${order.id}-${itemIndex}`}>
                      <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {format(new Date(order.orderDate.seconds * 1000), "yyyy-MM-dd", { locale: ko })}
                      </td>
                      <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </td>
                      <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', textAlign: 'right' }}>
                        {item.quantity}
                      </td>
                      <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', textAlign: 'right' }}>
                        {item.price.toLocaleString()}원
                      </td>
                      <td style={{ border: '1px solid black', padding: '8px', fontSize: '12px', textAlign: 'right' }}>
                        {(item.price * item.quantity).toLocaleString()}원
                      </td>
                    </tr>
                  ));
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>
                  합계
                </td>
                <td style={{ border: '1px solid black', padding: '8px', backgroundColor: '#f3f4f6', fontSize: '12px', fontWeight: 'bold', textAlign: 'right' }}>
                  {statementData.summary.grandTotal.toLocaleString()}원
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
      </div>
    </div>
  );
} 
