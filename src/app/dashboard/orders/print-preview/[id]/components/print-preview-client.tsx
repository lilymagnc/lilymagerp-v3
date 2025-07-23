
"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { Order } from '@/hooks/use-orders';
import { PrintableOrder, OrderPrintData } from '@/app/dashboard/orders/new/components/printable-order';
import { useBranches } from '@/hooks/use-branches';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';


export function PrintPreviewClient({ order }: { order: Order }) {
    const router = useRouter();
    const componentRef = useRef<PrintableOrder>(null);
    const { branches } = useBranches();
    const [isPrinting, setIsPrinting] = useState(false);

    const targetBranch = branches.find(b => b.id === order.branchId);

    const handlePrint = () => {
        setIsPrinting(true);
    };

    useEffect(() => {
        if (isPrinting) {
            const handleAfterPrint = () => {
                setIsPrinting(false);
            };

            window.addEventListener('afterprint', handleAfterPrint, { once: true });
            
            const printTimeout = setTimeout(() => {
                window.print();
            }, 100);

            return () => {
                clearTimeout(printTimeout);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
        }
    }, [isPrinting]);


    const itemsText = order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n');

    const printData: OrderPrintData | null = targetBranch ? {
        orderDate: format(new Date(order.orderDate), "yyyy-MM-dd HH:mm"),
        ordererName: order.orderer.name,
        ordererContact: order.orderer.contact,
        items: itemsText,
        totalAmount: order.summary.total,
        deliveryFee: order.summary.deliveryFee,
        paymentMethod: '카드결제', // Placeholder
        paymentStatus: '완결', // Placeholder
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
        <div className={cn(isPrinting && 'printing-active')}>
            <div id="non-printable-ui">
                <div className="max-w-4xl mx-auto">
                    <PageHeader
                        title="주문서 인쇄 미리보기"
                        description={`주문 ID: ${order.id}`}
                    >
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.back()} disabled={isPrinting}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                목록으로 돌아가기
                            </Button>
                            <Button onClick={handlePrint} disabled={!printData || isPrinting}>
                                {isPrinting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        인쇄중...
                                    </>
                                ) : (
                                    <>
                                        <Printer className="mr-2 h-4 w-4" />
                                        인쇄하기
                                    </>
                                )}
                            </Button>
                        </div>
                    </PageHeader>
                </div>
            </div>
            <div id="printable-area">
                <Card className="shadow-sm">
                    <CardContent className="p-0">
                         {printData && <PrintableOrder ref={componentRef} data={printData} />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
