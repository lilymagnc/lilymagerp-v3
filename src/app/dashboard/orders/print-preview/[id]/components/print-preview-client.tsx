
"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
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
        const printContent = printRef.current;
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Copy all link and style tags from the main document to the iframe
        const headEls = document.querySelectorAll('link[rel="stylesheet"], style');
        headEls.forEach(node => {
            iframeDoc.head.appendChild(node.cloneNode(true));
        });

        const printStyles = iframeDoc.createElement('style');
        printStyles.textContent = `
            @media print {
                @page {
                    size: A4;
                    margin: 10mm;
                }
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `;
        iframeDoc.head.appendChild(printStyles);
        
        iframeDoc.body.innerHTML = printContent.innerHTML;

        const images = iframeDoc.body.getElementsByTagName('img');
        let imagesLoaded = 0;
        const totalImages = images.length;

        const triggerPrint = () => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
        };
        
        if (totalImages === 0) {
            triggerPrint();
        } else {
            for (let i = 0; i < totalImages; i++) {
                images[i].onload = () => {
                    imagesLoaded++;
                    if (imagesLoaded === totalImages) {
                        triggerPrint();
                    }
                };
                images[i].onerror = () => {
                     imagesLoaded++;
                    if (imagesLoaded === totalImages) {
                        triggerPrint();
                    }
                }
            }
        }
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
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>주문서 인쇄 미리보기</CardTitle>
                            <CardDescription>주문 ID: {order.id}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="mr-2" />
                                목록으로 돌아가기
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2" />
                                인쇄하기
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="bg-gray-100 p-8 flex justify-center">
                    <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-4">
                       {printData && <PrintableOrder ref={printRef} data={printData} />}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
