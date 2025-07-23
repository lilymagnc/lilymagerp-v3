
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/hooks/use-orders';
import { PrintClientPage } from './components/print-client-page';

async function getOrder(orderId: string): Promise<Order | null> {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Firestore 타임스탬프를 직렬화 가능한 형태로 변환할 필요가 없습니다.
            // 서버 컴포넌트에서 직접 사용 가능합니다.
            const data = docSnap.data();
            return { 
                id: docSnap.id, 
                ...data,
                orderDate: data.orderDate.toDate().toISOString(), // 직렬화 가능한 형태로 변환
            } as unknown as Order;
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

  return <PrintClientPage order={order} />;
}
