
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from 'next/image';
import { useBranches } from '@/hooks/use-branches';
import { format } from 'date-fns';
import type { Order } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface OrderPrintDialogProps {
  order: Order;
  onClose: () => void;
}

const branchesContactInfo = [
    { name: "릴리맥여의도점", address: "서울시 영등포구 여의나루로50 The-K타워 B1", tel: "010-8241-9518 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag3@naver.com", kakao: "릴리맥" },
    { name: "릴리맥여의도2호점", address: "서울시 영등포구 국제금융로8길 31 SK증권빌딩 B1", tel: "010-7939-9518 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag4@naver.com", kakao: "릴리맥여의도2호점" },
    { name: "릴리맥NC이스트폴점", address: "서울시 광진구 아차산로 402, G1층", tel: "010-2908-5459 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag5@naver.com", kakao: "릴리맥NC이스트폴" },
    { name: "릴리맥광화문점", address: "서울시 중구 세종대로 136 서울파이낸스빌딩 B2", tel: "010-2385-9518 / Mob) 010-2285-9518", blog: "http://blog.naver.com/lilymag1", email: "lilymag6@naver.com", kakao: "릴리맥광화문점" },
    { name: "[온라인쇼핑몰]", address: "www.lilymagshop.co.kr", tel: "", blog: "", email: "", kakao: "" }
];

export function OrderPrintDialog({ order, onClose }: OrderPrintDialogProps) {
  const printableComponentRef = useRef<HTMLDivElement>(null);
  const { branches } = useBranches();

  const handlePrint = useReactToPrint({
    content: () => printableComponentRef.current,
    onAfterPrint: onClose,
  });
  
  const getPrintableData = useCallback(() => {
    if (!order) return null;
    
    const branchInfo = branches.find(b => b.id === order.branchId);

    return {
      orderDate: format(order.orderDate.toDate(), 'yyyy-MM-dd'),
      ordererName: order.orderer.name,
      ordererContact: order.orderer.contact,
      items: order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n'),
      totalAmount: order.summary.subtotal,
      deliveryFee: order.summary.deliveryFee,
      paymentMethod: "카드", // This should come from order data
      paymentStatus: "완결", // This should come from order data
      deliveryDate: order.receiptType === 'delivery' && order.deliveryInfo 
        ? `${order.deliveryInfo.date} ${order.deliveryInfo.time}` 
        : "매장 픽업",
      recipientName: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.recipientName : (order.pickupInfo?.pickerName ?? ''),
      recipientContact: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.recipientContact : (order.pickupInfo?.pickerContact ?? ''),
      deliveryAddress: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.address : '매장 픽업',
      message: `${order.message.type}: ${order.message.content}`,
      branchInfo: {
        name: order.branchName,
        address: branchInfo?.address || "정보 없음",
        contact: branchInfo?.phone || "정보 없음",
        account: branchInfo?.account || "정보 없음",
      }
    };
  }, [order, branches]);

  const data = getPrintableData();
  if (!data) return null;

  const renderSection = (title: string, isReceipt: boolean) => (
    <div className="mb-4" style={{ pageBreakInside: 'avoid' }}>
        <div className="text-center mb-4">
            { !isReceipt && (
                <>
                <Image src="https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg" alt="Logo" width={180} height={45} className="mx-auto" priority unoptimized />
                <h1 className="text-2xl font-bold mt-2">릴리맥 플라워앤가든 {title}</h1>
                </>
            )}
            { isReceipt && <h1 className="text-2xl font-bold mt-2">{title}</h1> }
        </div>
        <table className="w-full border-collapse border border-black text-sm">
            <tbody>
                <tr>
                    <td className="border border-black p-1 font-bold w-[100px]">주문일</td>
                    <td className="border border-black p-1">{data.orderDate}</td>
                    <td className="border border-black p-1 font-bold w-[100px]">주문자성명</td>
                    <td className="border border-black p-1 w-[120px]">{data.ordererName}</td>
                    <td className="border border-black p-1 font-bold w-[100px]">연락처</td>
                    <td className="border border-black p-1 w-[150px]">{data.ordererContact}</td>
                </tr>
                <tr>
                    <td className="border border-black p-1 font-bold align-top h-24">항목/수량</td>
                    <td className="border border-black p-1 align-top whitespace-pre-wrap" colSpan={!isReceipt ? 1 : 5}>{data.items}</td>
                    {!isReceipt && (
                        <td colSpan={4}>
                            <table className="w-full h-full border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-1 font-bold w-[100px]">금액</td>
                                        <td className="border border-black p-1">₩{data.totalAmount.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 font-bold">배송비</td>
                                        <td className="border border-black p-1">₩{data.deliveryFee.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    )}
                </tr>
                { !isReceipt && (
                     <tr>
                        <td className="border-t-0"></td>
                        <td className="border-t-0"></td>
                        <td colSpan={4}>
                            <table className="w-full h-full border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-1 font-bold w-[100px]">결제수단</td>
                                        <td className="border border-black p-1">{data.paymentMethod}</td>
                                        <td className="border border-black p-1 w-[100px]">{data.paymentStatus}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                )}
                <tr>
                    <td className="border border-black p-1 font-bold">배송일/시간</td>
                    <td className="border border-black p-1">{data.deliveryDate}</td>
                    <td className="border border-black p-1 font-bold">받으시는분</td>
                    <td className="border border-black p-1">{data.recipientName}</td>
                    <td className="border border-black p-1 font-bold">연락처</td>
                    <td className="border border-black p-1">{data.recipientContact}</td>
                </tr>
                <tr>
                    <td className="border border-black p-1 font-bold">배송지주소</td>
                    <td colSpan={5} className="border border-black p-1">{data.deliveryAddress}</td>
                </tr>
                <tr>
                    <td className="border border-black p-1 font-bold align-top h-16">전달메세지<br/>(카드/리본)</td>
                    <td colSpan={5} className="border border-black p-1 align-top">{data.message}</td>
                </tr>
                {isReceipt && (
                    <tr>
                        <td className="border border-black p-1 font-bold">인수자성명</td>
                        <td colSpan={5} className="border border-black p-1 h-10"></td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );
  
  const PrintableContent = () => (
    <div className="p-4 bg-white text-black font-sans">
      {renderSection('주문서', false)}
      <div className="border-t-2 border-dashed border-gray-400 my-8"></div>
      {renderSection('인수증', true)}
      <div className="mt-8">
          <table className="w-full border-collapse border border-black text-xs">
              <tbody>
                  {branchesContactInfo.map(branch => (
                      <tr key={branch.name}>
                          <td className="border border-black p-1 font-bold w-1/5">{branch.name}</td>
                          <td className="border border-black p-1 w-4/5">
                              {branch.address}
                              {branch.tel && <><br/>Tel) {branch.tel}</>}
                              {branch.blog && <><br/>{branch.blog}</>}
                              {branch.email && <> E-mail: {branch.email}</>}
                              {branch.kakao && <> Kakao: {branch.kakao}</>}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );

  return (
    <Dialog open={!!order} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>주문서 인쇄 미리보기</DialogTitle>
            </DialogHeader>
            <div className="hidden">
                <div ref={printableComponentRef}>
                    <PrintableContent />
                </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto border rounded-md p-4 bg-gray-100">
                <div className="scale-[0.8] origin-top bg-white shadow-lg mx-auto w-full" style={{width: '210mm', minHeight: '297mm'}}>
                    <PrintableContent />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>닫기</Button>
                <Button onClick={handlePrint}>인쇄</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
