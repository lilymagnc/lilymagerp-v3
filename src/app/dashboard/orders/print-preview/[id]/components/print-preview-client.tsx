
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { PrintableOrder, OrderPrintData } from '@/app/dashboard/orders/new/components/printable-order';
import { useBranches } from '@/hooks/use-branches';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import type { SerializableOrder } from '../page';

export function PrintPreviewClient({ order }: { order: SerializableOrder }) {
    const router = useRouter();
    const { branches, loading: branchesLoading } = useBranches();
    
    if (branchesLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">지점 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    const targetBranch = branches.find(b => b.id === order.branchId);
    
    const itemsText = order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n');
    
    const orderDateObject = new Date(order.orderDate);

    const printData: OrderPrintData | null = targetBranch ? {
        orderDate: format(orderDateObject, "yyyy-MM-dd HH:mm"),
        ordererName: order.orderer.name,
        ordererContact: order.orderer.contact,
        items: itemsText,
        totalAmount: order.summary.total,
        deliveryFee: order.summary.deliveryFee,
        paymentMethod: order.payment.method,
        paymentStatus: order.payment.status === 'completed' ? '완결' : '미결',
        deliveryDate: order.deliveryInfo?.date ? `${order.deliveryInfo.date} ${order.deliveryInfo.time}` : '정보 없음',
        recipientName: order.deliveryInfo?.recipientName ?? '',
        recipientContact: order.deliveryInfo?.recipientContact ?? '',
        deliveryAddress: order.deliveryInfo?.address ?? '',
        message: order.message?.content ?? '',
        isAnonymous: order.isAnonymous || false,
        branchInfo: {
            name: targetBranch.name,
            address: targetBranch.address,
            contact: targetBranch.phone,
            account: targetBranch.account || '',
        },
    } : null;

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
                    title="주문서 인쇄 미리보기"
                    description={`주문 ID: ${order.id}`}
                >
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            목록으로 돌아가기
                        </Button>
                        <Button onClick={() => window.print()} disabled={!printData}>
                           <Printer className="mr-2 h-4 w-4" />
                           인쇄하기
                        </Button>
                    </div>
                </PageHeader>
            </div>
            <div id="printable-area">
                <Card className="shadow-sm print:shadow-none print:border-none max-w-4xl mx-auto">
                    <CardContent className="p-0">
                         {printData ? <PrintableOrder data={printData} /> : <p>주문 데이터를 불러오는 중입니다...</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
