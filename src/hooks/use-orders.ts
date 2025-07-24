
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, writeBatch, serverTimestamp, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';

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
    name: string;
    contact: string;
    company: string;
    email: string;
  };
  orderType: "store" | "phone" | "naver" | "kakao" | "etc";
  receiptType: "pickup" | "delivery";

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

  const addOrder = async (order: OrderData) => {
    try {
      setLoading(true);
      const ordersCollection = collection(db, 'orders');
      
      // Replace Date object with Firestore server timestamp
      const orderToSave = {
        ...order,
        orderDate: serverTimestamp()
      };
      
      await addDoc(ordersCollection, orderToSave);
      toast({
        title: '성공',
        description: '새 주문이 성공적으로 추가되었습니다.',
      });
      await fetchOrders(); // Refetch to update the list
    } catch (error) {
      console.error("Error adding order: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '주문 추가 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, addOrder, fetchOrders };
}
