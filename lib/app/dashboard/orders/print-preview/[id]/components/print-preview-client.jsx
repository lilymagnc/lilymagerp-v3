"use client";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { PrintableOrder } from '@/app/dashboard/orders/new/components/printable-order';
import { useBranches } from '@/hooks/use-branches';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
export function PrintPreviewClient({ order }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const router = useRouter();
    const { branches, loading: branchesLoading } = useBranches();
    if (branchesLoading) {
        return (<div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin"/>
                <p className="ml-2">지점 정보를 불러오는 중입니다...</p>
            </div>);
    }
    const targetBranch = branches.find(b => b.id === order.branchId);
    const itemsText = order.items.map(item => `${item.name} / ${item.quantity}개`).join('\n');
    const orderDateObject = new Date(order.orderDate);
    const printData = targetBranch ? {
        orderDate: format(orderDateObject, "yyyy-MM-dd HH:mm"),
        ordererName: order.orderer.name,
        ordererContact: order.orderer.contact,
        items: itemsText,
        totalAmount: order.summary.total,
        deliveryFee: order.summary.deliveryFee,
        paymentMethod: order.payment.method,
        paymentStatus: order.payment.status === 'completed' ? '완결' : '미결',
        deliveryDate: ((_a = order.deliveryInfo) === null || _a === void 0 ? void 0 : _a.date) ? `${order.deliveryInfo.date} ${order.deliveryInfo.time}` : '정보 없음',
        recipientName: (_c = (_b = order.deliveryInfo) === null || _b === void 0 ? void 0 : _b.recipientName) !== null && _c !== void 0 ? _c : '',
        recipientContact: (_e = (_d = order.deliveryInfo) === null || _d === void 0 ? void 0 : _d.recipientContact) !== null && _e !== void 0 ? _e : '',
        deliveryAddress: (_g = (_f = order.deliveryInfo) === null || _f === void 0 ? void 0 : _f.address) !== null && _g !== void 0 ? _g : '',
        message: order.message.content,
        isAnonymous: order.isAnonymous || false,
        branchInfo: {
            name: targetBranch.name,
            address: targetBranch.address,
            contact: targetBranch.phone,
            account: targetBranch.account || '',
        },
    } : null;
    return (<div>
             <div className="max-w-4xl mx-auto no-print">
                <PageHeader title="주문서 인쇄 미리보기" description={`주문 ID: ${order.id}`}>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            목록으로 돌아가기
                        </Button>
                        <Button onClick={() => window.print()} disabled={!printData}>
                           <Printer className="mr-2 h-4 w-4"/>
                           인쇄하기
                        </Button>
                    </div>
                </PageHeader>
            </div>
            <div id="printable-area">
                <Card className="shadow-sm print:shadow-none print:border-none max-w-4xl mx-auto">
                    <CardContent className="p-0">
                         {printData ? <PrintableOrder data={printData}/> : <p>주문 데이터를 불러오는 중입니다...</p>}
                    </CardContent>
                </Card>
            </div>
        </div>);
}
