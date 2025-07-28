
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, addDoc, writeBatch, serverTimestamp, Timestamp, query, orderBy, runTransaction, where, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import type { Customer } from './use-customers';

// Simplified version for the form
interface OrderItemForm {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderData {
  branchId: string;
  branchName: string;
  orderDate: Date | Timestamp;
  status: 'processing' | 'completed' | 'canceled';
  
  items: OrderItemForm[];
  summary: {
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    pointsUsed: number;
    pointsEarned: number;
  };

  orderer: {
    id?: string;
    name: string;
    contact: string;
    company: string;
    email: string;
  };
  isAnonymous: boolean;
  registerCustomer: boolean;
  orderType: "store" | "phone" | "naver" | "kakao" | "etc";
  receiptType: "pickup" | "delivery";

  payment: {
    method: "card" | "cash" | "transfer" | "mainpay" | "shopping_mall" | "epay";
    status: "pending" | "paid";
  };

  pickupInfo: {
    date: string;
    time: string;
    pickerName: string;
    pickerContact: string;
  } | null;

  deliveryInfo: {
    date: string;
    time: string;
    recipientName: string;
    recipientContact: string;
    address: string;
    district: string;
  } | null;

  message: {
    type: "card" | "ribbon";
    content: string;
  };

  request: string;
}

export interface Order extends Omit<OrderData, 'orderDate'> {
  id: string;
  orderDate: Timestamp;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, orderBy("orderDate", "desc"));
      const querySnapshot = await getDocs(q);
      
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);

    } catch (error) {
      console.error("Error fetching orders: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '주문 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const updateCustomerOnOrder = async (
    transaction: any,
    customerId: string,
    orderData: OrderData
  ) => {
    const customerDocRef = doc(db, 'customers', customerId);
    const customerDoc = await transaction.get(customerDocRef);
    if (!customerDoc.exists()) {
      // This case should ideally not happen if customer ID is present
      return;
    }
    const existingCustomer = customerDoc.data() as Customer;
    
    const pointsChange = orderData.summary.pointsEarned - orderData.summary.pointsUsed;

    const updatedData = {
        lastOrderDate: serverTimestamp(),
        totalSpent: (existingCustomer.totalSpent || 0) + orderData.summary.total,
        orderCount: (existingCustomer.orderCount || 0) + 1,
        points: (existingCustomer.points || 0) + pointsChange,
    };
    transaction.update(customerDocRef, updatedData);
  }

  const addCustomerFromOrder = async (
    transaction: any,
    orderData: OrderData
  ): Promise<string> => {
    const { orderer } = orderData;
    const newCustomerData = {
        name: orderer.name,
        contact: orderer.contact,
        email: orderer.email || '',
        companyName: orderer.company || '',
        branch: orderData.branchName,
        type: orderer.company ? 'company' : 'personal',
        lastOrderDate: serverTimestamp(),
        totalSpent: orderData.summary.total,
        orderCount: 1,
        points: orderData.summary.pointsEarned - orderData.summary.pointsUsed,
        grade: '신규',
        createdAt: serverTimestamp(),
        isDeleted: false,
    };
    const newCustomerRef = doc(collection(db, 'customers'));
    transaction.set(newCustomerRef, newCustomerData);
    return newCustomerRef.id;
  }


  const addOrder = async (orderData: OrderData) => {
    setLoading(true);
    
    try {
      await runTransaction(db, async (transaction) => {
        // Ensure orderDate is a JS Date object before proceeding
        const getOrderDate = () => {
          const { orderDate } = orderData;
          if (orderDate instanceof Timestamp) return orderDate.toDate();
          if (orderDate instanceof Date) return orderDate;
          const parsedDate = new Date(orderDate);
          return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        };

        const orderDate = getOrderDate();
        const { registerCustomer, ...restOfOrderData } = orderData;
        
        const orderPayload = {
          ...restOfOrderData,
          orderDate: Timestamp.fromDate(orderDate),
        };

        if (orderPayload.orderer.id === undefined) {
          delete orderPayload.orderer.id;
        }

        const orderRef = doc(collection(db, 'orders'));
        transaction.set(orderRef, orderPayload);

        // Customer and Points Logic
        if (registerCustomer) {
            if (orderData.orderer.id) {
                await updateCustomerOnOrder(transaction, orderData.orderer.id, orderData);
            } else {
                await addCustomerFromOrder(transaction, orderData);
            }
        }
        
        // Stock History Logic
        for (const item of orderData.items) {
          if (!item.id || item.quantity <= 0) continue;
          
          const productQuery = query(
            collection(db, "products"),
            where("id", "==", item.id),
            where("branch", "==", orderData.branchName)
          );
          const productSnapshot = await getDocs(productQuery);

          if (productSnapshot.empty) {
            throw new Error(`주문 처리 오류: 상품 '${item.name}'을(를) '${orderData.branchName}' 지점에서 찾을 수 없습니다.`);
          }
          const productDocRef = productSnapshot.docs[0].ref;
          const productDoc = await transaction.get(productDocRef);

          if (!productDoc.exists()) throw new Error(`상품 문서를 찾을 수 없습니다: ${item.name}`);

          const currentStock = productDoc.data().stock || 0;
          const newStock = currentStock - item.quantity;
          if (newStock < 0) throw new Error(`재고 부족: '${item.name}'의 재고가 부족하여 주문을 완료할 수 없습니다. (현재 재고: ${currentStock})`);
          
          transaction.update(productDocRef, { stock: newStock });

          const historyDocRef = doc(collection(db, "stockHistory"));
          transaction.set(historyDocRef, {
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
        }
      });
      
      toast({
        title: '성공',
        description: '새 주문이 추가되고 재고 및 고객 정보가 업데이트되었습니다.',
      });
      await fetchOrders();
      
    } catch (error) {
      console.error("Error adding order transaction: ", error);
      toast({
        variant: 'destructive',
        title: '주문 처리 오류',
        description: error instanceof Error ? error.message : '주문 추가 중 오류가 발생했습니다.',
        duration: 5000,
      });
      throw error; // Re-throw to be caught in the component
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrder = async (orderId: string, orderData: OrderData) => {
     // For simplicity, we are not implementing the full logic to revert/recalculate stock and points on update.
     // In a real-world scenario, this would require careful handling of state changes.
     try {
       setLoading(true);
       const orderRef = doc(db, "orders", orderId);
       const orderPayload = { ...orderData };
       if (orderPayload.orderer.id === undefined) {
          delete orderPayload.orderer.id;
       }
       await setDoc(orderRef, orderPayload, { merge: true });
       toast({
         title: "성공",
         description: "주문 정보가 업데이트되었습니다."
       });
       await fetchOrders();
     } catch(error) {
        console.error("Error updating order:", error);
        toast({
            variant: "destructive",
            title: "오류",
            description: "주문 업데이트 중 오류가 발생했습니다."
        });
     } finally {
        setLoading(false);
     }
  }


  const updateOrderStatus = async (orderId: string, newStatus: 'processing' | 'completed' | 'canceled') => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });
        toast({
            title: '상태 변경 성공',
            description: `주문 상태가 '${newStatus}'(으)로 변경되었습니다.`,
        });
        await fetchOrders();
    } catch (error) {
        console.error("Error updating order status:", error);
        toast({
            variant: 'destructive',
            title: '오류',
            description: '주문 상태 변경 중 오류가 발생했습니다.',
        });
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: 'pending' | 'paid') => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { 'payment.status': newStatus });
        toast({
            title: '결제 상태 변경 성공',
            description: `결제 상태가 '${newStatus === 'paid' ? '결제완료' : '결제대기'}'(으)로 변경되었습니다.`,
        });
        await fetchOrders();
    } catch (error) {
        console.error("Error updating payment status:", error);
        toast({
            variant: 'destructive',
            title: '오류',
            description: '결제 상태 변경 중 오류가 발생했습니다.',
        });
    }
  };

  return { orders, loading, addOrder, updateOrder, fetchOrders, updateOrderStatus, updatePaymentStatus };
}
