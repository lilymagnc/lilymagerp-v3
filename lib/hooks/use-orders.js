"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOrders = useOrders;
const react_1 = require("react");
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("@/lib/firebase");
const use_toast_1 = require("./use-toast");
const use_auth_1 = require("./use-auth");
function useOrders() {
    const [orders, setOrders] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const { toast } = (0, use_toast_1.useToast)();
    const { user } = (0, use_auth_1.useAuth)();
    const fetchOrders = (0, react_1.useCallback)(async () => {
        try {
            setLoading(true);
            const ordersCollection = (0, firestore_1.collection)(firebase_1.db, 'orders');
            const q = (0, firestore_1.query)(ordersCollection, (0, firestore_1.orderBy)("orderDate", "desc"));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
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
    (0, react_1.useEffect)(() => {
        fetchOrders();
    }, [fetchOrders]);
    const addOrder = async (orderData) => {
        setLoading(true);
        try {
            // Ensure orderDate is a JS Date object before proceeding
            const orderDate = (orderData.orderDate instanceof firestore_1.Timestamp)
                ? orderData.orderDate.toDate()
                : new Date(orderData.orderDate);
            const orderPayload = {
                ...orderData,
                orderDate: firestore_1.Timestamp.fromDate(orderDate),
            };
            const orderRef = await (0, firestore_1.addDoc)((0, firestore_1.collection)(firebase_1.db, 'orders'), orderPayload);
            const historyBatch = (0, firestore_1.writeBatch)(firebase_1.db);
            for (const item of orderData.items) {
                if (!item.id || item.quantity <= 0)
                    continue;
                await (0, firestore_1.runTransaction)(firebase_1.db, async (transaction) => {
                    const productQuery = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, "products"), (0, firestore_1.where)("id", "==", item.id), (0, firestore_1.where)("branch", "==", orderData.branchName));
                    const productSnapshot = await (0, firestore_1.getDocs)(productQuery);
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
                    const historyDocRef = (0, firestore_1.doc)((0, firestore_1.collection)(firebase_1.db, "stockHistory"));
                    historyBatch.set(historyDocRef, {
                        date: firestore_1.Timestamp.fromDate(orderDate),
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
            const orderRef = (0, firestore_1.doc)(firebase_1.db, 'orders', orderId);
            await (0, firestore_1.updateDoc)(orderRef, { status: newStatus });
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
            const orderRef = (0, firestore_1.doc)(firebase_1.db, 'orders', orderId);
            await (0, firestore_1.updateDoc)(orderRef, { 'payment.status': newStatus });
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
