import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PrintPreviewClient } from './components/print-preview-client';
async function getOrder(orderId) {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Defensive check for orderDate and convert to ISO string
            let orderDateIso = new Date().toISOString();
            if (data.orderDate && typeof data.orderDate.toDate === 'function') {
                orderDateIso = data.orderDate.toDate().toISOString();
            }
            // The rest of the data is cast, assuming the structure is mostly correct.
            const orderBase = data;
            return Object.assign(Object.assign({}, orderBase), { id: docSnap.id, orderDate: orderDateIso });
        }
        else {
            console.error("No such document!");
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching document:", error);
        return null;
    }
}
export default async function PrintPreviewPage({ params }) {
    const orderData = await getOrder(params.id);
    if (!orderData) {
        return (<div className="flex h-screen w-full items-center justify-center">
        <p>주문 정보를 찾을 수 없습니다.</p>
      </div>);
    }
    return <PrintPreviewClient order={orderData}/>;
}
