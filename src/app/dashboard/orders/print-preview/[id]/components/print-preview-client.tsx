
"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import type { Order } from '@/hooks/use-orders';
import Image from 'next/image';

interface PrintPreviewClientProps {
  order: Order | null;
}

export function PrintPreviewClient({ order }: PrintPreviewClientProps) {
  const router = useRouter();

  const handlePrint = () => {
    const printableArea = document.getElementById('printable-area');
    if (!printableArea) return;

    // Create a new iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;
    
    // Get all link tags from the main document's head
    const linkElements = document.querySelectorAll('head link[rel="stylesheet"]');
    linkElements.forEach(link => {
      iframeDoc.head.appendChild(link.cloneNode(true));
    });
    
    // Create a new style element for @page rules
    const style = iframeDoc.createElement('style');
    style.textContent = `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        margin: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-card-content {
        box-shadow: none !important;
        border: none !important;
      }
    `;
    iframeDoc.head.appendChild(style);

    // Copy the printable content and our base classes
    iframeDoc.body.innerHTML = printableArea.innerHTML;
    iframeDoc.body.className = "bg-white text-black font-sans";

    // Wait for images to load before printing
    const images = iframeDoc.body.getElementsByTagName('img');
    const promises = [];
    for (let i = 0; i < images.length; i++) {
        promises.push(new Promise<void>(resolve => {
            if (images[i].complete) {
                resolve();
            } else {
                images[i].onload = () => resolve();
                images[i].onerror = () => resolve(); // Resolve even on error to not block printing
            }
        }));
    }

    Promise.all(promises).then(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remove the iframe after printing is done or cancelled
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500);
    });
  };

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
      paymentMethod: "카드", 
      paymentStatus: "완결", 
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
    <div className="mb-2" style={{ pageBreakInside: 'avoid' }}>
      <div className="text-center mb-1">
        { !isReceipt && (
          <>
          <Image src="https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg" alt="Logo" width={160} height={40} className="mx-auto" priority unoptimized />
          <h1 className="text-lg font-bold">릴리맥 플라워앤가든 {title}</h1>
          </>
        )}
        { isReceipt && <h1 className="text-lg font-bold mt-1">{title}</h1> }
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
          <tr style={{height: '145px'}}>
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
          <tr style={{height: '115px'}}>
            <td className="border border-black p-1 font-bold align-top">전달메세지<br/>(카드/리본)</td>
            <td colSpan={5} className="border border-black p-1 align-top">{data.message}</td>
          </tr>
          {isReceipt && (
            <tr style={{height: '60px'}}>
              <td className="border border-black p-1 font-bold align-top">인수자성명</td>
              <td colSpan={5} className="border border-black p-1"></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <PageHeader title="주문서 인쇄 미리보기" description={`주문번호: ${order.id}`}>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2" />
                목록으로 돌아가기
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="mr-2" />
                인쇄하기
            </Button>
        </div>
      </PageHeader>
      <Card>
        <CardContent id="printable-area" className="bg-white text-black font-sans print-card-content">
            <div className="max-w-[190mm] mx-auto p-4">
                {renderPrintSection('주문서', false, data)}
                <div className="border-t-2 border-dashed border-gray-400 my-2"></div>
                {renderPrintSection('인수증', true, data)}
                <div className="mt-2 text-center border-t border-black pt-1 text-[10px]">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0 mb-1 max-w-md mx-auto">
                    {branchesContactInfo.map(branch => (
                        <div key={branch.name} className="text-left">
                        <span className="font-bold">{branch.name}:</span>
                        <span className="ml-1">{branch.tel}</span>
                        </div>
                    ))}
                    </div>
                    <div className="text-center">
                    <span className="font-bold">[온라인쇼핑몰]:</span>
                    <span className="ml-1">{onlineShopUrl}</span>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
