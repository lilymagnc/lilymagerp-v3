
"use client";

import React, { useRef, useLayoutEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from 'next/navigation';
import type { Order } from '@/hooks/use-orders';
import { PrintableOrder, OrderPrintData } from '@/app/dashboard/orders/new/components/printable-order';
import { useBranches } from '@/hooks/use-branches';

interface PrintPreviewClientProps {
    order: Order;
}

export function PrintPreviewClient({ order }: PrintPreviewClientProps) {
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const { branches } = useBranches();
    
    const targetBranch = branches.find(b => b.id === order.branchId);

    const handlePrint = () => {
        const printStyleSheet = document.createElement('style');
        printStyleSheet.id = 'print-stylesheet';
        printStyleSheet.innerHTML = `
            @media print {
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
                }
                @page {
                    size: A4;
                    margin: 10mm;
                }
            }
        `;
        document.head.appendChild(printStyleSheet);
        window.print();
        document.head.removeChild(printStyleSheet);
    };
    
    const itemsText = order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n');

    const printData: OrderPrintData | null = targetBranch ? {
        orderDate: new Date(order.orderDate).toLocaleString(),
        ordererName: order.orderer.name,
        ordererContact: order.orderer.contact,
        items: itemsText,
        totalAmount: order.summary.total,
        deliveryFee: order.summary.deliveryFee,
        paymentMethod: '카드결제', // This is a placeholder
        paymentStatus: '결제완료', // This is a placeholder
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
             <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-bold">주문서 인쇄 미리보기</h1>
                    <p className="text-muted-foreground">주문 ID: {order.id}</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        목록으로 돌아가기
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        인쇄하기
                    </Button>
                </div>
            </div>
            <Card>
                <CardContent id="printable-area" className="p-0">
                   <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg mx-auto my-8">
                       {printData && <PrintableOrder ref={printRef} data={printData} />}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
