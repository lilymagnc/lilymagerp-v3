"use client";
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, addDoc, writeBatch, Timestamp, query, orderBy, runTransaction, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
export function useOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const ordersCollection = collection(db, 'orders');
            const q = query(ordersCollection, orderBy("orderDate", "desc"));
            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(ordersData);
        }
        catch (error) {
            console.error("Error fetching orders: ", error);
            toast({
                variant: 'destructive',
                title: '오류',
                description: '주문 정보를 불러오는 중 오류가 발생했습니다.',
            });
        }
        finally {
            setLoading(false);
        }
    }, [toast]);
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);
    const addOrder = async (orderData) => {
        setLoading(true);
        try {
            // Ensure orderDate is a JS Date object before proceeding
            const orderDate = (orderData.orderDate instanceof Timestamp)
                ? orderData.orderDate.toDate()
                : new Date(orderData.orderDate);
            const orderPayload = {
                ...orderData,
                orderDate: Timestamp.fromDate(orderDate),
            };
            const orderRef = await addDoc(collection(db, 'orders'), orderPayload);
            const historyBatch = writeBatch(db);
            for (const item of orderData.items) {
                if (!item.id || item.quantity <= 0)
                    continue;
                await runTransaction(db, async (transaction) => {
                    const productQuery = query(collection(db, "products"), where("id", "==", item.id), where("branch", "==", orderData.branchName));
                    const productSnapshot = await getDocs(productQuery);
                    if (productSnapshot.empty) {
                        throw new Error(`주문 처리 오류: 상품 '${item.name}'을(를) '${orderData.branchName}' 지점에서 찾을 수 없습니다.`);
                    }
                    const productDocRef = productSnapshot.docs[0].ref;
                    const productDoc = await transaction.get(productDocRef);
                    if (!productDoc.exists()) {
                        throw new Error(`상품 문서를 찾을 수 없습니다: ${item.name}`);
                    }
                    const currentStock = productDoc.data().stock || 0;
                    const newStock = currentStock - item.quantity;
                    if (newStock < 0) {
                        throw new Error(`재고 부족: '${item.name}'의 재고가 부족하여 주문을 완료할 수 없습니다. (현재 재고: ${currentStock})`);
                    }
                    transaction.update(productDocRef, { stock: newStock });
                    const historyDocRef = doc(collection(db, "stockHistory"));
                    historyBatch.set(historyDocRef, {
                        date: Timestamp.fromDate(orderDate),
                        type: "out",
                        itemType: "product",
                        itemId: item.id,
                        itemName: item.name,
                        quantity: item.quantity,
                        fromStock: currentStock,
                        toStock: newStock,
                        resultingStock: newStock,
                        branch: orderData.branchName,
                        operator: user?.email || "Unknown User",
                        price: item.price,
                        totalAmount: item.price * item.quantity,
                    });
                });
            }
            await historyBatch.commit();
            toast({
                title: '성공',
                description: '새 주문이 추가되고 재고가 업데이트되었습니다.',
            });
            await fetchOrders();
        }
        catch (error) {
            console.error("Error adding order and updating stock: ", error);
            toast({
                variant: 'destructive',
                title: '주문 처리 오류',
                description: error instanceof Error ? error.message : '주문 추가 중 오류가 발생했습니다.',
                duration: 5000,
            });
        }
        finally {
            setLoading(false);
        }
    };
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });
            toast({
                title: '상태 변경 성공',
                description: `주문 상태가 '${newStatus}'(으)로 변경되었습니다.`,
            });
            await fetchOrders();
        }
        catch (error) {
            console.error("Error updating order status:", error);
            toast({
                variant: 'destructive',
                title: '오류',
                description: '주문 상태 변경 중 오류가 발생했습니다.',
            });
        }
    };
    const updatePaymentStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, { 'payment.status': newStatus });
            toast({
                title: '결제 상태 변경 성공',
                description: `결제 상태가 '${newStatus === 'completed' ? '완결' : '미결'}'(으)로 변경되었습니다.`,
            });
            await fetchOrders();
        }
        catch (error) {
            console.error("Error updating payment status:", error);
            toast({
                variant: 'destructive',
                title: '오류',
                description: '결제 상태 변경 중 오류가 발생했습니다.',
            });
        }
    };
    return { orders, loading, addOrder, fetchOrders, updateOrderStatus, updatePaymentStatus };
}
