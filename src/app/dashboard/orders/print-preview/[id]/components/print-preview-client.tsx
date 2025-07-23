
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { Order } from '@/hooks/use-orders';
import { PrintableOrder, OrderPrintData } from '@/app/dashboard/orders/new/components/printable-order';
import { useBranches } from '@/hooks/use-branches';
import { PageHeader } from '@/components/page-header';

export function PrintPreviewClient({ order }: { order: Order }) {
    const router = useRouter();
    const componentRef = React.useRef<HTMLDivElement>(null);
    const { branches } = useBranches();
    
    const targetBranch = branches.find(b => b.id === order.branchId);

    const handlePrint = () => {
        const printableArea = document.getElementById('printable-area');
        if (!printableArea) return;

        const printStyles = `
          @page {
            size: A4;
            margin: 10mm;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-area, .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
                display: none !important;
            }
          }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.innerText = printStyles;
        document.head.appendChild(styleSheet);
        
        window.print();

        document.head.removeChild(styleSheet);
    };
    
    const itemsText = order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n');

    // order.orderDate is already a Date object from the page component
    const printData: OrderPrintData | null = targetBranch ? {
        orderDate: new Date(order.orderDate).toLocaleString(),
        ordererName: order.orderer.name,
        ordererContact: order.orderer.contact,
        items: itemsText,
        totalAmount: order.summary.total,
        deliveryFee: order.summary.deliveryFee,
        paymentMethod: '카드결제', 
        paymentStatus: '결제완료', 
        deliveryDate: order.deliveryInfo?.date ? `${order.deliveryInfo.date} ${order.deliveryInfo.time}` : '정보 없음',
        recipientName: order.deliveryInfo?.recipientName ?? '',
        recipientContact: order.deliveryInfo?.recipientContact ?? '',
        deliveryAddress: order.deliveryInfo?.address ?? '',
        message: order.message.content,
        branchInfo: {
            name: targetBranch.name,
            address: targetBranch.address,
            contact: targetBranch.phone,
            account: targetBranch.account || '',
        },
    } : null;

    return (
        <div className="max-w-4xl mx-auto">
             <PageHeader
                title="주문서 인쇄 미리보기"
                description={`주문 ID: ${order.id}`}
                className="no-print"
             >
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        목록으로 돌아가기
                    </Button>
                    <Button onClick={handlePrint} disabled={!printData}>
                        <Printer className="mr-2 h-4 w-4" />
                        인쇄하기
                    </Button>
                </div>
            </PageHeader>

            <Card className="printable-area" id="printable-area">
                <CardContent className="p-0">
                    {printData && <PrintableOrder ref={componentRef} data={printData} />}
                </CardContent>
            </Card>
        </div>
    );
}
