
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order as OrderType } from '@/hooks/use-orders';
import { PrintPreviewClient } from './components/print-preview-client';
import { notFound } from 'next/navigation';

// Define the type for serializable order data that can be passed from Server to Client component
export interface SerializableOrder extends Omit<OrderType, 'orderDate' | 'id'> {
  id: string;
  orderDate: string; // ISO string format
}

// Correctly type the props for a Next.js Page component with dynamic routes
interface PageProps {
  params: { id: string };
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


export default async function PrintPreviewPage({ params }: PageProps) {
  const orderData = await getOrder(params.id);

  if (!orderData) {
    notFound();
  }
  
  return <PrintPreviewClient order={orderData} />;
}
