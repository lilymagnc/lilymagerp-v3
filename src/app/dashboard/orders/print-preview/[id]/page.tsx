
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/hooks/use-orders';
import { PrintPreviewClient } from './components/print-preview-client';

interface PageProps {
  params: { id: string };
}

async function getOrder(orderId: string): Promise<Order | null> {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Convert Timestamp to a serializable format (like Date object) before passing to a Client Component.
            const orderDate = (data.orderDate instanceof Timestamp) 
                ? data.orderDate.toDate() 
                : new Date();

            return {
                ...data,
                id: docSnap.id,
                orderDate: orderDate,
            } as Order;
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
  
  return <PrintPreviewClient order={orderData as any} />;
}
