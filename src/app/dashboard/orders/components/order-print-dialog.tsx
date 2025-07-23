
"use client";

import React, { useRef, useCallback, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from 'next/image';
import { useBranches } from '@/hooks/use-branches';
import { format } from 'date-fns';
import type { Order } from '@/hooks/use-orders';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface OrderPrintDialogProps {
  order: Order;
  onClose: () => void;
}

const branchesContactInfo = [
    { name: "릴리맥여의도점", address: "서울시 영등포구 여의나루로50 The-K타워 B1", tel: "010-8241-9518 / 010-2285-9518" },
    { name: "릴리맥여의도2호점", address: "서울시 영등포구 국제금융로8길 31 SK증권빌딩 B1", tel: "010-7939-9518 / 010-2285-9518" },
    { name: "릴리맥광화문점", address: "서울시 중구 세종대로 136 서울파이낸스빌딩 B2", tel: "010-2385-9518 / 010-2285-9518" },
    { name: "릴리맥NC이스트폴점", address: "서울시 광진구 아차산로 402, G1층", tel: "010-2908-5459 / 010-2285-9518" },
    { name: "[온라인쇼핑몰]", address: "www.lilymagshop.co.kr", tel: "010-2285-9518" }
];

export function OrderPrintDialog({ order, onClose }: OrderPrintDialogProps) {
  const printableComponentRef = useRef<HTMLDivElement>(null);
  const { branches } = useBranches();
  
  const handlePrint = useReactToPrint({
    content: () => printableComponentRef.current,
    onAfterPrint: onClose,
  });

  useEffect(() => {
    // Component mounts, and all data is ready, trigger print
    if (order && branches.length > 0 && handlePrint) {
        handlePrint();
    }
  }, [order, branches, handlePrint]);
  
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

  const renderSection = (title: string, isReceipt: boolean) => {
    if(!data) return null;
    return (
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
                        <td className="border border-black p-1 align-top whitespace-pre-wrap" colSpan={5}>{data.items}</td>
                    </tr>
                     {!isReceipt && (
                        <tr>
                            <td className="border border-black p-1 font-bold">금액</td>
                            <td className="border border-black p-1">₩{data.totalAmount.toLocaleString()}</td>
                             <td className="border border-black p-1 font-bold">배송비</td>
                            <td className="border border-black p-1">₩{data.deliveryFee.toLocaleString()}</td>
                            <td className="border border-black p-1 font-bold">결제수단</td>
                            <td className="border border-black p-1">{data.paymentMethod} {data.paymentStatus}</td>
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
    }
  
  const PrintableContent = React.forwardRef<HTMLDivElement>((props, ref) => (
    <div ref={ref} className="p-4 bg-white text-black font-sans">
      {renderSection('주문서', false)}
      <div className="border-t-2 border-dashed border-gray-400 my-8"></div>
      {renderSection('인수증', true)}
       <div className="mt-8 text-xs text-center border-t border-black pt-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
            {branchesContactInfo.slice(0,4).map(branch => (
                <div key={branch.name} className="text-left">
                    <span className="font-bold">{branch.name}:</span>
                    <span className="ml-2">{branch.tel}</span>
                </div>
            ))}
        </div>
        <div className="text-center">
            <span className="font-bold">{branchesContactInfo[4].name}:</span>
            <span className="ml-2">{branchesContactInfo[4].address}</span>
        </div>
      </div>
    </div>
  ));
  PrintableContent.displayName = 'PrintableContent';

  if (!data) return null;

  return (
    <Dialog open={!!order} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-3xl opacity-0">
            <DialogHeader className="sr-only">
              <DialogTitle>주문서 인쇄</DialogTitle>
            </DialogHeader>
             {/* This content is not visible to the user, it is only for printing */}
             <div className="hidden">
                <PrintableContent ref={printableComponentRef} />
             </div>
        </DialogContent>
    </Dialog>
  );
}
