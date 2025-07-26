import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PrintPreviewClient } from './components/print-preview-client';
import { notFound } from 'next/navigation';
async function getOrder(orderId) {
    try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            let orderDateIso = new Date().toISOString();
            if (data.orderDate && typeof data.orderDate.toDate === 'function') {
                orderDateIso = data.orderDate.toDate().toISOString();
            }
            const orderBase = data;
            return {
                ...orderBase,
                id: docSnap.id,
                orderDate: orderDateIso,
            };
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
        notFound();
    }
    return <PrintPreviewClient order={orderData}/>;
}
