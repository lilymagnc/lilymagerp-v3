import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { OrderData } from '@/hooks/use-orders';
import { PrintClientPage } from './components/print-client-page';

// The Order type from use-orders uses Timestamp, but when we get it from Firestore
// it's a plain object that needs to be converted.
// We also need to make sure the orderDate is serializable.
interface ServerOrder extends Omit<OrderData, 'orderDate'> {
    id: string;
    orderDate: string; // ISO string
}

async function getOrder(orderId: string): Promise<ServerOrder | null> {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const orderDate = data.orderDate as Timestamp;
            return { 
                id: docSnap.id, 
                ...data,
                orderDate: orderDate.toDate().toISOString(),
            } as ServerOrder;
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching document:", error);
        return null;
    }
}

export default async function PrintOrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);

  if (!order) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>주문 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // We need to convert the ISO string back to a Date object for the client component
  const orderForClient = {
    ...order,
    orderDate: new Date(order.orderDate),
  };

  return <PrintClientPage order={orderForClient as any} />;
}
