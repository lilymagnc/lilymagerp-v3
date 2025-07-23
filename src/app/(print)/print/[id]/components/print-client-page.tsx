
"use client";

import { useEffect, useRef } from 'react';
import type { Order } from '@/hooks/use-orders';
import { format } from 'date-fns';
import Image from 'next/image';

interface PrintClientPageProps {
  order: Order | null;
}

export function PrintClientPage({ order }: PrintClientPageProps) {
  const printInitiated = useRef(false);

  useEffect(() => {
    if (order && !printInitiated.current) {
      printInitiated.current = true;
      
      const images = Array.from(document.images);
      const imageLoadPromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve; // Resolve on error too, to not block printing
        });
      });

      const triggerPrint = () => {
        // Delay slightly after image load to ensure rendering
        setTimeout(() => {
          window.print();
        }, 100); 
      };
      
      // Failsafe timeout in case images take too long
      const printTimeout = setTimeout(triggerPrint, 2000); 

      Promise.all(imageLoadPromises).then(() => {
        clearTimeout(printTimeout);
        triggerPrint();
      });
    }
  }, [order]);
  
  useEffect(() => {
    const handleAfterPrint = () => {
      window.close();
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  if (!order) {
    return <div>주문 정보를 불러오는 중...</div>;
  }
  
  const getPrintableData = (order: Order) => {
    const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
    return {
      orderDate: format(orderDate, 'yyyy-MM-dd'),
      ordererName: order.orderer.name,
      ordererContact: order.orderer.contact,
      items: order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n'),
      totalAmount: order.summary.subtotal,
      deliveryFee: order.summary.deliveryFee,
      paymentMethod: "카드", // Mock data
      paymentStatus: "완결", // Mock data
      deliveryDate: order.receiptType === 'delivery' && order.deliveryInfo 
        ? `${order.deliveryInfo.date} ${order.deliveryInfo.time}` 
        : "매장 픽업",
      recipientName: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.recipientName : (order.pickupInfo?.pickerName ?? ''),
      recipientContact: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.recipientContact : (order.pickupInfo?.pickerContact ?? ''),
      deliveryAddress: order.receiptType === 'delivery' && order.deliveryInfo ? order.deliveryInfo.address : '매장 픽업',
      message: `${order.message.type}: ${order.message.content}`,
    };
  };

  const data = getPrintableData(order);

  const branchesContactInfo = [
    { name: "릴리맥여의도점", tel: "010-8241-9518 / 010-2285-9518" },
    { name: "릴리맥여의도2호점", tel: "010-7939-9518 / 010-2285-9518" },
    { name: "릴리맥광화문점", tel: "010-2385-9518 / 010-2285-9518" },
    { name: "릴리맥NC이스트폴점", tel: "010-2908-5459 / 010-2285-9518" },
  ];
  const onlineShopUrl = "www.lilymagshop.co.kr";
  
  const renderPrintSection = (title: string, isReceipt: boolean, data: NonNullable<ReturnType<typeof getPrintableData>>) => (
    <div className="mb-4" style={{ pageBreakInside: 'avoid' }}>
      <div className="text-center mb-2">
        { !isReceipt && (
          <>
          <Image src="https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg" alt="Logo" width={180} height={45} className="mx-auto" priority unoptimized />
          <h1 className="text-xl font-bold mt-1">릴리맥 플라워앤가든 {title}</h1>
          </>
        )}
        { isReceipt && <h1 className="text-xl font-bold mt-2">{title}</h1> }
      </div>
      <table className="w-full border-collapse border border-black text-[13px]">
        <tbody>
          <tr>
            <td className="border border-black p-1 font-bold w-[12%]">주문일</td>
            <td className="border border-black p-1 w-[21%]">{data.orderDate}</td>
            <td className="border border-black p-1 font-bold w-[12%]">주문자성명</td>
            <td className="border border-black p-1 w-[22%]">{data.ordererName}</td>
            <td className="border border-black p-1 font-bold w-[12%]">연락처</td>
            <td className="border border-black p-1 w-[21%]">{data.ordererContact}</td>
          </tr>
          <tr style={{height: '110px'}}>
            <td className="border border-black p-1 font-bold align-top">항목/수량</td>
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
          <tr style={{height: '95px'}}>
            <td className="border border-black p-1 font-bold align-top">전달메세지<br/>(카드/리본)</td>
            <td colSpan={5} className="border border-black p-1 align-top">{data.message}</td>
          </tr>
          {isReceipt && (
            <tr style={{height: '55px'}}>
              <td className="border border-black p-1 font-bold">인수자성명</td>
              <td colSpan={5} className="border border-black p-1"></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="bg-white text-black font-sans p-2 max-w-[210mm] mx-auto printable-area">
        {renderPrintSection('주문서', false, data)}
        <div className="border-t-2 border-dashed border-gray-400 my-4"></div>
        {renderPrintSection('인수증', true, data)}
        <div className="mt-4 text-center border-t border-black pt-2 text-[11px]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-2 max-w-md mx-auto">
            {branchesContactInfo.map(branch => (
              <div key={branch.name} className="text-left">
                <span className="font-bold">{branch.name}:</span>
                <span className="ml-2">{branch.tel}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="font-bold">[온라인쇼핑몰]:</span>
            <span className="ml-2">{onlineShopUrl}</span>
          </div>
        </div>
      </div>
    </>
  );
}
