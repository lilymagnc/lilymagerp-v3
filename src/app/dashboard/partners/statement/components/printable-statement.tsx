"use client";

import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface StatementData {
  customer: {
    name: string;
    companyName: string;
    contact: string;
    email: string;
    branch: string;
  };
  period: {
    from: string;
    to: string;
  };
  orders: {
    id: string;
    orderDate: string;
    items: string;
    subtotal: number;
    deliveryFee: number;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
  }[];
  summary: {
    totalOrders: number;
    totalAmount: number;
    totalDeliveryFee: number;
    grandTotal: number;
  };
  branchInfo: {
    name: string;
    address: string;
    contact: string;
    account: string;
  };
}

interface PrintableStatementProps {
  data: StatementData;
  type: 'statement' | 'receipt';
}

export function PrintableStatement({ data, type }: PrintableStatementProps) {
  const title = type === 'statement' ? '거래명세서' : '영수증';
  
  return (
    <div className="bg-white p-8 text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
      {/* 제목 */}
      <div className="text-center mb-6">
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
      <div className="flex mb-6" style={{ gap: '20px' }}>
        {/* 왼쪽: 공급받는자 (고객정보) */}
        <div className="flex-1">
          <table className="w-full" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
            <thead>
              <tr>
                <th className="border border-black p-3 text-center font-bold text-base" 
                    style={{ backgroundColor: '#e8e8e8' }} 
                    colSpan={2}>
                  공급받는자
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5', width: '25%' }}>발행일</td>
                <td className="border border-black p-2">
                  {format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5' }}>거래처명</td>
                <td className="border border-black p-2 font-semibold">{data.customer.companyName}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5' }}>담당자/연락처</td>
                <td className="border border-black p-2" style={{ fontSize: '11px' }}>{data.customer.name} / {data.customer.contact}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5' }}>총합계</td>
                <td className="border border-black p-2 text-right font-bold" style={{ color: 'black' }}>
                  ₩{data.summary.grandTotal.toLocaleString()}
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
                <th className="border border-black p-3 text-center font-bold text-base" 
                    style={{ backgroundColor: '#e8e8e8' }} 
                    colSpan={2}>
                  공급자
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5', width: '30%' }}>사업자번호</td>
                <td className="border border-black p-2">123-45-67890</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5' }}>업체명</td>
                <td className="border border-black p-2 font-semibold">{data.branchInfo.name}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5' }}>주소</td>
                <td className="border border-black p-2">{data.branchInfo.address}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold" style={{ backgroundColor: '#f5f5f5' }}>종목</td>
                <td className="border border-black p-2">꽃 도매업</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 품목 테이블 - 배송비 컬럼 추가 */}
      <table className="w-full mb-5" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
        <thead>
          <tr>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '6%' }}>No</th>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '25%' }}>품 명</th>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '12%' }}>규격</th>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '8%' }}>수량</th>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '12%' }}>단가</th>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '12%' }}>공급가액</th>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '10%' }}>배송비</th>
            <th className="border border-black p-3 text-center font-bold" style={{ backgroundColor: '#f0f0f0', width: '15%' }}>합계</th>
          </tr>
        </thead>
        <tbody>
          {data.orders.map((order, index) => (
            <tr key={order.id}>
              <td className="border border-black p-2 text-center">{index + 1}</td>
              <td className="border border-black p-2">
                <div className="truncate" title={order.items}>
                  {order.items}
                </div>
              </td>
              <td className="border border-black p-2 text-center">혼합</td>
              <td className="border border-black p-2 text-center">1</td>
              <td className="border border-black p-2 text-right">{order.subtotal.toLocaleString()}</td>
              <td className="border border-black p-2 text-right">₩ {order.subtotal.toLocaleString()}</td>
              <td className="border border-black p-2 text-right">₩ {order.deliveryFee.toLocaleString()}</td>
              <td className="border border-black p-2 text-right font-semibold">₩ {order.total.toLocaleString()}</td>
            </tr>
          ))}
          {/* 빈 행들 추가 (최소 8행 보장) */}
          {Array.from({ length: Math.max(0, 8 - data.orders.length) }, (_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black p-2" style={{ height: '35px' }}></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
              <td className="border border-black p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 합계 행 - 폰트 크기 조정 */}
      <table className="w-full mb-6" style={{ borderCollapse: 'collapse', border: '2px solid black' }}>
        <tbody>
          <tr>
            <td className="border border-black p-3 text-center font-bold" 
                style={{ backgroundColor: '#e8e8e8', width: '18%' }}>
              합 계
            </td>
            <td className="border border-black p-3" style={{ width: '20%' }}></td>
            <td className="border border-black p-3" style={{ width: '12%' }}></td>
            <td className="border border-black p-3" style={{ width: '8%' }}></td>
            <td className="border border-black p-3" style={{ width: '12%' }}></td>
            <td className="border border-black p-3 text-right font-bold" style={{ width: '12%' }}>
              ₩ {data.summary.totalAmount.toLocaleString()}
            </td>
            <td className="border border-black p-3 text-right font-bold" style={{ width: '10%' }}>
              ₩ {data.summary.totalDeliveryFee.toLocaleString()}
            </td>
            <td className="border border-black p-3 text-right font-bold" style={{ width: '8%' }}>
              ₩ {data.summary.grandTotal.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 입금계좌 정보 - 간소화 */}
      <div className="border-2 border-black p-3 text-center" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="text-xs">
          <span className="font-medium">계좌번호:</span> {data.branchInfo.account} | 
          <span className="font-medium">연락처:</span> {data.branchInfo.contact}
        </div>
      </div>
    </div>
  );
}