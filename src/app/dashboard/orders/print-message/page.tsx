
import { Suspense } from 'react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { MessagePrintLayout } from './components/message-print-layout';
import type { Order as OrderType } from '@/hooks/use-orders';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export interface SerializableOrder extends Omit<OrderType, 'orderDate' | 'id'> {
  id: string;
  orderDate: string; // ISO string format
}

async function getOrder(orderId: string): Promise<SerializableOrder | null> {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            let orderDateIso = new Date().toISOString();
            if (data.orderDate && typeof (data.orderDate as Timestamp).toDate === 'function') {
                orderDateIso = (data.orderDate as Timestamp).toDate().toISOString();
            }

            const orderBase = data as Omit<OrderType, 'id' | 'orderDate'>;

            return {
                ...orderBase,
                id: docSnap.id,
                orderDate: orderDateIso,
            };
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching document:", error);
        return null;
    }
}


export default async function PrintMessagePage({ searchParams }: PageProps) {
    const params = await searchParams;
    const orderId = params.orderId as string;
    const labelType = params.labelType as string || 'formtec-3108';
    const startPosition = parseInt(params.start as string) || 1;
    const messageFont = params.messageFont as string || 'Noto Sans KR';
    const messageFontSize = parseInt(params.messageFontSize as string) || 14;
    const senderFont = params.senderFont as string || 'Noto Sans KR';
    const senderFontSize = parseInt(params.senderFontSize as string) || 12;
    const messageContent = params.messageContent as string || '';
    const senderName = params.senderName as string || '';

    if (!orderId) {
        notFound();
    }
    
    const orderData = await getOrder(orderId);
    
    if (!orderData) {
        notFound();
    }

    return (
        <Suspense fallback={<div className="max-w-4xl mx-auto p-6"><Skeleton className="h-96 w-full"/></div>}>
            <MessagePrintLayout
                order={orderData}
                labelType={labelType}
                startPosition={startPosition}
                messageFont={messageFont}
                messageFontSize={messageFontSize}
                senderFont={senderFont}
                senderFontSize={senderFontSize}
                messageContent={messageContent}
                senderName={senderName}
            />
        </Suspense>
    );
}
