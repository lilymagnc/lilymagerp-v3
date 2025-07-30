
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, addDoc, writeBatch, Timestamp, query, orderBy, runTransaction, where, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';

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
  };

  orderer: {
    id?: string; // 기존 고객 ID (선택사항)
    name: string;
    contact: string;
    company: string;
    email: string;
  };
  isAnonymous: boolean;
  registerCustomer: boolean; // 고객 등록 여부 필드 추가
  orderType: "store" | "phone" | "naver" | "kakao" | "etc";
  receiptType: "pickup" | "delivery";

  payment: {
    method: "card" | "cash" | "transfer" | "mainpay" | "shopping_mall" | "epay";
    status: "pending" | "completed";
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

  const addOrder = async (orderData: OrderData) => {
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

      // 주문 추가
      const orderDocRef = await addDoc(collection(db, 'orders'), orderPayload);
      
      // 고객 등록 로직 추가
      if (orderData.registerCustomer && !orderData.isAnonymous) {
        await registerCustomerFromOrder(orderData);
      }
      
      // 수령자 정보 별도 저장 (배송인 경우)
      if (orderData.receiptType === 'delivery' && orderData.deliveryInfo) {
        await saveRecipientInfo(orderData.deliveryInfo, orderData.branchName, orderDocRef.id);
      }
      
      const historyBatch = writeBatch(db);

      for (const item of orderData.items) {
        if (!item.id || item.quantity <= 0) continue;

        await runTransaction(db, async (transaction) => {
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
      
    } catch (error) {
      console.error("Error adding order and updating stock: ", error);
      toast({
        variant: 'destructive',
        title: '주문 처리 오류',
        description: error instanceof Error ? error.message : '주문 추가 중 오류가 발생했습니다.',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };
  
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

  const updatePaymentStatus = async (orderId: string, newStatus: 'pending' | 'completed') => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { 'payment.status': newStatus });
        toast({
            title: '결제 상태 변경 성공',
            description: `결제 상태가 '${newStatus === 'completed' ? '완결' : '미결'}'(으)로 변경되었습니다.`,
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

  return { orders, loading, addOrder, fetchOrders, updateOrderStatus, updatePaymentStatus };
}


// 주문자 정보로 고객 등록/업데이트 함수
const registerCustomerFromOrder = async (orderData: OrderData) => {
  try {
    console.log('고객 등록 시작:', orderData.orderer);
    console.log('registerCustomer:', orderData.registerCustomer);
    console.log('isAnonymous:', orderData.isAnonymous);
    
    // 기존 고객 검색 (연락처 기준)
    const customersQuery = query(
      collection(db, 'customers'),
      where('contact', '==', orderData.orderer.contact),
      where('isDeleted', '!=', true)
    );
    const existingCustomers = await getDocs(customersQuery);
    
    console.log('기존 고객 검색 결과:', existingCustomers.size);
    
    const customerData = {
      name: orderData.orderer.name,
      contact: orderData.orderer.contact,
      email: orderData.orderer.email || '',
      companyName: orderData.orderer.company || '',
      type: orderData.orderer.company ? 'company' : 'personal',
      branch: orderData.branchName,
      grade: '신규',
      totalSpent: orderData.summary.total,
      orderCount: 1,
      points: Math.floor(orderData.summary.total * 0.02), // 2% 적립
      lastOrderDate: serverTimestamp(),
      isDeleted: false,
    };
    
    if (!existingCustomers.empty) {
      // 기존 고객 업데이트
      const customerDoc = existingCustomers.docs[0];
      const existingData = customerDoc.data();
      
      await setDoc(customerDoc.ref, {
        ...customerData,
        totalSpent: (existingData.totalSpent || 0) + orderData.summary.total,
        orderCount: (existingData.orderCount || 0) + 1,
        points: (existingData.points || 0) + Math.floor(orderData.summary.total * 0.02),
        grade: existingData.grade || '신규',
        createdAt: existingData.createdAt, // 기존 생성일 유지
      }, { merge: true });
    } else {
      // 신규 고객 등록
      await addDoc(collection(db, 'customers'), {
        ...customerData,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('고객 등록 중 오류:', error);
    // 고객 등록 실패해도 주문은 계속 진행
  }
};

// 수령자 정보 별도 저장 함수
const saveRecipientInfo = async (deliveryInfo: any, branchName: string, orderId: string) => {
  try {
    const recipientData = {
      name: deliveryInfo.recipientName,
      contact: deliveryInfo.recipientContact,
      address: deliveryInfo.address,
      district: deliveryInfo.district,
      branchName: branchName,
      orderId: orderId,
      deliveryDate: deliveryInfo.date,
      createdAt: serverTimestamp(),
      // 마케팅 활용을 위한 추가 필드
      isMarketingConsent: true, // 기본값 (나중에 UI에서 선택 가능하도록 수정)
      source: 'order', // 데이터 출처
    };
    
    await addDoc(collection(db, 'recipients'), recipientData);
  } catch (error) {
    console.error('수령자 정보 저장 중 오류:', error);
  }
};
