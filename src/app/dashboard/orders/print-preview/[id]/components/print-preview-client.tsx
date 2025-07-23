
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
        const printStyleId = 'print-styles';
        // If the style tag already exists, don't add it again.
        if (document.getElementById(printStyleId)) {
            window.print();
            return;
        }

        const style = document.createElement('style');
        style.id = printStyleId;
        style.innerHTML = `
            @page {
                size: A4;
                margin: 10mm;
            }
            @media print {
                body > *:not(.printable-area-wrapper) {
                    display: none !important;
                }
                .printable-area-wrapper {
                    display: block !important;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Use a timeout to ensure styles are applied before printing
        setTimeout(() => {
            window.print();
        }, 100);

        // Clean up after printing
        window.onafterprint = () => {
            const styleElement = document.getElementById(printStyleId);
            if (styleElement) {
                styleElement.remove();
            }
        };
    };
    
    const itemsText = order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n');

    const printData: OrderPrintData | null = targetBranch ? {
        orderDate: new Date(order.orderDate).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }),
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
            <div className="printable-area-wrapper">
                <Card id="printable-area">
                    <CardContent className="p-0">
                        {printData && <PrintableOrder ref={componentRef} data={printData} />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
