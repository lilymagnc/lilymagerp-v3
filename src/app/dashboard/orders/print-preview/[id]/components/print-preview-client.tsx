
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { Order } from '@/hooks/use-orders';
import { PrintableOrder, OrderPrintData } from '@/app/dashboard/orders/new/components/printable-order';
import { useBranches } from '@/hooks/use-branches';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';

export function PrintPreviewClient({ order }: { order: Order }) {
    const router = useRouter();
    const componentRef = useRef<HTMLDivElement>(null);
    const { branches } = useBranches();
    const [isPrinting, setIsPrinting] = useState(false);

    const targetBranch = branches.find(b => b.id === order.branchId);
    
    useEffect(() => {
        if (isPrinting) {
            window.print();
        }
    }, [isPrinting]);

    const handlePrint = () => {
        document.body.classList.add('printing-active');
        setIsPrinting(true);
    };
    
    // Detect when printing is done (either confirmed or cancelled)
    useEffect(() => {
        const afterPrint = () => {
            document.body.classList.remove('printing-active');
            setIsPrinting(false);
        };
        
        window.addEventListener('afterprint', afterPrint);
        
        return () => {
            window.removeEventListener('afterprint', afterPrint);
        }
    }, []);

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
        <>
            <div id="non-printable-ui" className={cn(isPrinting && 'hidden')}>
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
                            <Button onClick={handlePrint} disabled={!printData || isPrinting}>
                                <Printer className="mr-2 h-4 w-4" />
                                {isPrinting ? '인쇄 중...' : '인쇄하기'}
                            </Button>
                        </div>
                    </PageHeader>
                </div>
            </div>
            <div id="printable-area">
                <Card>
                    <CardContent className="p-0">
                        {printData && <PrintableOrder ref={componentRef} data={printData} />}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
