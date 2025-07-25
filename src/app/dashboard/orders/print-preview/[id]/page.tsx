
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order as OrderType } from '@/hooks/use-orders';
import { PrintPreviewClient } from './components/print-preview-client';

// Define the type for serializable order data that can be passed from Server to Client component
export interface SerializableOrder extends Omit<OrderType, 'orderDate' | 'id'> {
  id: string;
  orderDate: string; // ISO string format
}

interface PageProps {
  params: { id: string };
}

async function getOrder(orderId: string): Promise<SerializableOrder | null> {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as Omit<OrderType, 'id'>;
            
            // Ensure orderDate is handled correctly, converting Timestamp to ISO string
            const orderDate = data.orderDate && typeof (data.orderDate as any).toDate === 'function'
                ? (data.orderDate as Timestamp).toDate().toISOString()
                : new Date().toISOString();

            return {
                ...data,
                id: docSnap.id,
                orderDate: orderDate,
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
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>주문 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }
  
  return <PrintPreviewClient order={orderData} />;
}
