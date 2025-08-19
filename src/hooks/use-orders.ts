
"use client";
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, addDoc, writeBatch, Timestamp, query, orderBy, runTransaction, where, updateDoc, serverTimestamp, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
// Simplified version for the form
interface OrderItemForm {
  id: string;
  name: string;
  quantity: number;
  price: number;
  source?: 'excel_upload' | 'manual'; // 출처 표시
  originalData?: string; // 원본 데이터 보존
}
export interface OrderData {
  branchId: string;
  branchName: string;
  orderDate: Date | Timestamp;
  status: 'processing' | 'completed' | 'canceled';
  items: OrderItemForm[];
  summary: {
    subtotal: number;
    discountAmount: number;
    discountRate: number;
    deliveryFee: number;
    pointsUsed?: number;
    pointsEarned?: number;
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
  receiptType: "store_pickup" | "pickup_reservation" | "delivery_reservation";
  payment: {
    method: "card" | "cash" | "transfer" | "mainpay" | "shopping_mall" | "epay";
    status: PaymentStatus;
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
    driverAffiliation?: string;
    driverName?: string;
    driverContact?: string;
    // 배송완료 사진
    completionPhotoUrl?: string;
    completedAt?: Date | Timestamp;
    completedBy?: string;
  } | null;
  // 배송비 관리 관련 필드
  actualDeliveryCost?: number;
  deliveryCostStatus?: 'pending' | 'completed';
  deliveryCostUpdatedAt?: Date | Timestamp;
  deliveryCostUpdatedBy?: string;
  deliveryCostReason?: string;
  deliveryProfit?: number;
  message: {
    type: "card" | "ribbon";
    content: string;
  };
  request: string;
  source?: 'excel_upload' | 'manual'; // 출처 표시
}
export interface Order extends Omit<OrderData, 'orderDate'> {
  id: string;
  orderDate: Timestamp;
}
export type PaymentStatus = "paid" | "pending" | "completed";
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Firebase 연결 상태 확인
      if (!db) {
        throw new Error('Firebase Firestore is not initialized');
      }
      
      const ordersCollection = collection(db, 'orders');
      const q = query(ordersCollection, orderBy("orderDate", "desc"));
      
      // 타임아웃 설정을 더 길게 설정
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
      
      const queryPromise = getDocs(q);
      const querySnapshot = await Promise.race([queryPromise, timeoutPromise]) as any;
      
      const ordersData = querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        // Legacy data migration: convert old receiptType values to new ones
        let receiptType = data.receiptType;
        if (receiptType === 'pickup') {
          receiptType = 'pickup_reservation';
        } else if (receiptType === 'delivery') {
          receiptType = 'delivery_reservation';
        }
        return { 
          id: doc.id, 
          ...data, 
          receiptType 
        } as Order;
      });
      setOrders(ordersData);
    } catch (error) {
      // 주문 정보 로딩 오류는 조용히 처리
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  const addOrder = async (orderData: OrderData): Promise<string | null> => {
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
      // 매장픽업(즉시) 주문인지 확인
      const isImmediatePickup = orderData.receiptType === 'store_pickup';
      
      // 매장픽업(즉시) 주문인 경우 자동으로 완료 상태로 설정
      const finalOrderPayload = isImmediatePickup 
        ? { ...orderPayload, status: 'completed' as const }
        : orderPayload;
      
      // 주문 추가
      const orderDocRef = await addDoc(collection(db, 'orders'), finalOrderPayload);
      
      // 엑셀 업로드 주문인지 확인
      const isExcelUpload = orderData.source === 'excel_upload' || 
                           orderData.items.some(item => item.source === 'excel_upload');
      
      // 고객 등록/업데이트 로직 (포인트 차감 포함)
      if (orderData.registerCustomer && !orderData.isAnonymous) {
        await registerCustomerFromOrder(orderData);
      } else if (orderData.orderer.id && orderData.summary.pointsUsed > 0) {
        // 고객 등록을 하지 않지만 기존 고객이 포인트를 사용한 경우에만 별도 차감
        await deductCustomerPoints(orderData.orderer.id, orderData.summary.pointsUsed);
      }
      
      // 수령자 정보 별도 저장 (배송 예약인 경우)
      if (orderData.receiptType === 'delivery_reservation' && orderData.deliveryInfo) {
        await saveRecipientInfo(orderData.deliveryInfo, orderData.branchName, orderDocRef.id);
      }
      
      const historyBatch = writeBatch(db);
      
      // 엑셀 업로드 주문인 경우 재고 차감 제외
      if (isExcelUpload) {
        // 엑셀 업로드 주문은 재고 차감 없이 히스토리만 기록
        for (const item of orderData.items) {
          if (!item.id || item.quantity <= 0) continue;
          
          const historyDocRef = doc(collection(db, "stockHistory"));
          historyBatch.set(historyDocRef, {
            date: Timestamp.fromDate(orderDate),
            type: "excel_upload",
            itemType: "excel_product",
            itemId: item.id,
            itemName: item.name,
            quantity: item.quantity,
            branch: orderData.branchName,
            operator: user?.email || "Excel Upload",
            price: item.price,
            totalAmount: item.price * item.quantity,
            note: "엑셀 업로드 주문 - 재고 차감 없음"
          });
        }
      } else {
        // 일반 주문은 기존 재고 차감 로직 사용
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
      }
      
      await historyBatch.commit();
      
      let successMessage = '';
      if (isExcelUpload) {
        successMessage = '엑셀 업로드 주문이 추가되었습니다. (재고 차감 없음)';
      } else if (isImmediatePickup) {
        successMessage = '매장픽업(즉시) 주문이 완료 상태로 추가되었습니다.';
      } else {
        successMessage = '새 주문이 추가되고 재고가 업데이트되었습니다.';
      }
        
      toast({
        title: '성공',
        description: successMessage,
      });
      
      await fetchOrders();
      return orderDocRef.id; // 주문 ID 반환
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '주문 처리 오류',
        description: '주문 추가 중 오류가 발생했습니다.',
        duration: 5000,
      });
      return null; // 오류 시 null 반환
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
        toast({
            variant: 'destructive',
            title: '오류',
            description: '결제 상태 변경 중 오류가 발생했습니다.',
        });
    }
  };
  const updateOrder = async (orderId: string, data: Partial<OrderData>) => {
    setLoading(true);
    try {
      const orderDocRef = doc(db, 'orders', orderId);
      await setDoc(orderDocRef, data, { merge: true });
      toast({ title: "성공", description: "주문 정보가 수정되었습니다." });
      await fetchOrders();
    } catch (error) {
      toast({ variant: 'destructive', title: '오류', description: '주문 수정 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  // 주문 취소 (금액을 0으로 설정하고 포인트 환불)
  const cancelOrder = async (orderId: string, reason?: string) => {
    setLoading(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error('주문을 찾을 수 없습니다.');
      }
      const orderData = orderDoc.data() as Order;
      const pointsUsed = orderData.summary.pointsUsed || 0;
      // 고객이 포인트를 사용했고, 고객 ID가 있는 경우 포인트 환불
      if (pointsUsed > 0 && orderData.orderer.id) {
        await refundCustomerPoints(orderData.orderer.id, pointsUsed);
        }
      // 주문 상태를 취소로 변경하고 금액을 0으로 설정
      await updateDoc(orderRef, {
        status: 'canceled',
        summary: {
          ...orderData.summary,
          subtotal: 0,
          discount: 0,
          deliveryFee: 0,
          pointsUsed: 0,
          pointsEarned: 0,
          total: 0
        },
        cancelReason: reason || '고객 요청으로 취소',
        canceledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 배송 예약 주문인 경우 수령자 정보도 처리 (주문 취소 시에는 수령자 정보는 유지하되 주문 횟수만 감소)
      if (orderData.receiptType === 'delivery_reservation' && orderData.deliveryInfo) {
        await updateRecipientInfoOnOrderDelete(orderData.deliveryInfo, orderData.branchName);
      }
      
      const successMessage = pointsUsed > 0 
        ? `주문이 취소되고 금액이 0원으로 설정되었습니다. 사용한 ${pointsUsed}포인트가 환불되었습니다.`
        : "주문이 취소되고 금액이 0원으로 설정되었습니다.";
      toast({
        title: "주문 취소 완료",
        description: successMessage
      });
      await fetchOrders(); // 목록 새로고침
    } catch (error) {
      toast({
        variant: "destructive",
        title: "주문 취소 실패",
        description: "주문 취소 중 오류가 발생했습니다."
      });
    } finally {
      setLoading(false);
    }
  };
  // 주문 삭제 (완전 삭제)
  const deleteOrder = async (orderId: string) => {
    setLoading(true);
    try {
      // 주문 정보 먼저 가져오기
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('주문을 찾을 수 없습니다.');
      }
      
      const orderData = orderDoc.data() as Order;
      
      // 주문 삭제
      await deleteDoc(orderRef);
      
      // 배송 예약 주문인 경우 수령자 정보 처리
      if (orderData.receiptType === 'delivery_reservation' && orderData.deliveryInfo) {
        await updateRecipientInfoOnOrderDelete(orderData.deliveryInfo, orderData.branchName);
      }
      
      toast({
        title: "주문 삭제 완료",
        description: "주문이 성공적으로 삭제되었습니다."
      });
      await fetchOrders(); // 목록 새로고침
    } catch (error) {
      toast({
        variant: "destructive",
        title: "주문 삭제 실패",
        description: "주문 삭제 중 오류가 발생했습니다."
      });
    } finally {
      setLoading(false);
    }
  };
  // 배송완료 처리 (사진 포함)
  const completeDelivery = async (
    orderId: string, 
    completionPhotoUrl?: string,
    completedBy?: string
  ) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      const orderData = orderDoc.data() as Order;
      
      // 배송 정보 업데이트
      const updatedDeliveryInfo = {
        ...orderData.deliveryInfo,
        completionPhotoUrl,
        completedAt: serverTimestamp(),
        completedBy: completedBy || user?.uid || 'system'
      };

      await updateDoc(orderRef, {
        status: 'completed',
        deliveryInfo: updatedDeliveryInfo,
        updatedAt: serverTimestamp()
      });

      // 고객에게 배송완료 이메일 발송 (사진 포함)
      if (orderData.orderer?.email) {
        // 시스템 설정 가져오기 (실제로는 useSettings에서 가져와야 함)
        const settings = {
          autoEmailDeliveryComplete: true,
          siteName: '릴리맥 플라워샵',
          emailTemplateDeliveryComplete: `안녕하세요 {고객명}님!

주문하신 상품이 성공적으로 배송 완료되었습니다.

주문번호: {주문번호}
배송일: {배송일}

감사합니다.
{회사명}`
        };

        // 동적 import를 통해 순환 참조 방지
        const { sendDeliveryCompleteEmail } = await import('@/lib/email-service');
        
        await sendDeliveryCompleteEmail(
          orderData.orderer.email,
          orderData.orderer.name,
          orderId,
          new Date().toLocaleDateString('ko-KR'),
          settings as any,
          completionPhotoUrl
        );
      }

      // 주문 목록 새로고침
      await fetchOrders();

      toast({
        title: "배송완료 처리됨",
        description: completionPhotoUrl ? 
          "배송완료 사진과 함께 고객에게 알림 이메일이 발송되었습니다." :
          "배송완료 처리가 완료되었습니다."
      });

    } catch (error) {
      toast({
        title: "오류",
        description: "배송완료 처리 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  return { orders, loading, addOrder, fetchOrders, updateOrderStatus, updatePaymentStatus, updateOrder, cancelOrder, deleteOrder, completeDelivery };
}
// 주문자 정보로 고객 등록/업데이트 함수
const registerCustomerFromOrder = async (orderData: OrderData) => {
  try {
    // 기존 고객 검색 (연락처 기준) - 전 지점 공유
    const customersQuery = query(
      collection(db, 'customers'),
      where('contact', '==', orderData.orderer.contact)
    );
    const existingCustomers = await getDocs(customersQuery);
    // 삭제된 고객 필터링 (클라이언트 사이드에서 처리)
    const validCustomers = existingCustomers.docs.filter(doc => {
      const data = doc.data();
      return !data.isDeleted;
    });
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
      points: Math.floor(orderData.summary.total * 0.02) - (orderData.summary.pointsUsed || 0), // 2% 적립 - 사용 포인트
      lastOrderDate: serverTimestamp(),
      isDeleted: false,
    };
    if (validCustomers.length > 0) {
      // 기존 고객 업데이트 (전 지점 공유)
      const customerDoc = validCustomers[0];
      const existingData = customerDoc.data();
      const currentBranch = orderData.branchName;
      // 지점별 정보 업데이트
      const branchInfo = {
        registeredAt: serverTimestamp(),
        grade: customerData.grade,
        notes: `주문으로 자동 등록 - ${new Date().toLocaleDateString()}`
      };
      await setDoc(customerDoc.ref, {
        ...customerData,
        totalSpent: (existingData.totalSpent || 0) + orderData.summary.total,
        orderCount: (existingData.orderCount || 0) + 1,
        points: (existingData.points || 0) - (orderData.summary.pointsUsed || 0) + Math.floor(orderData.summary.total * 0.02),
        grade: existingData.grade || '신규',
        createdAt: existingData.createdAt, // 기존 생성일 유지
        [`branches.${currentBranch}`]: branchInfo,
        // 주 거래 지점 업데이트 (가장 최근 주문 지점)
        primaryBranch: currentBranch
      }, { merge: true });
    } else {
      // 신규 고객 등록 (통합 관리)
      const currentBranch = orderData.branchName;
      const newCustomerData = {
        ...customerData,
        createdAt: serverTimestamp(),
        branches: {
          [currentBranch]: {
            registeredAt: serverTimestamp(),
            grade: customerData.grade,
            notes: `주문으로 자동 등록 - ${new Date().toLocaleDateString()}`
          }
        },
        primaryBranch: currentBranch
      };
      await addDoc(collection(db, 'customers'), newCustomerData);
    }
  } catch (error) {
    // 고객 등록 실패해도 주문은 계속 진행
  }
};
// 고객 포인트 차감 함수
const deductCustomerPoints = async (customerId: string, pointsToDeduct: number) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    if (customerDoc.exists()) {
      const currentPoints = customerDoc.data().points || 0;
      const newPoints = Math.max(0, currentPoints - pointsToDeduct);
      await setDoc(customerRef, {
        points: newPoints,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
    }
  } catch (error) {
    // 포인트 차감 실패해도 주문은 계속 진행
  }
};
// 고객 포인트 환불 함수
const refundCustomerPoints = async (customerId: string, pointsToRefund: number) => {
  try {
    const customerRef = doc(db, 'customers', customerId);
    const customerDoc = await getDoc(customerRef);
    if (customerDoc.exists()) {
      const currentPoints = customerDoc.data().points || 0;
      const newPoints = currentPoints + pointsToRefund;
      await setDoc(customerRef, {
        points: newPoints,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
    }
  } catch (error) {
    // 포인트 환불 실패해도 주문 취소는 계속 진행
  }
};
// 수령자 정보 별도 저장 함수
const saveRecipientInfo = async (deliveryInfo: any, branchName: string, orderId: string) => {
  try {
    // 기존 수령자 검색 (연락처와 지점명 기준)
    const recipientsQuery = query(
      collection(db, 'recipients'),
      where('contact', '==', deliveryInfo.recipientContact),
      where('branchName', '==', branchName)
    );
    const existingRecipients = await getDocs(recipientsQuery);
    if (!existingRecipients.empty) {
      // 기존 수령자 업데이트
      const recipientDoc = existingRecipients.docs[0];
      const existingData = recipientDoc.data();
      await setDoc(recipientDoc.ref, {
        name: deliveryInfo.recipientName, // 이름은 최신으로 업데이트
        address: deliveryInfo.address, // 주소도 최신으로 업데이트
        district: deliveryInfo.district,
        orderCount: (existingData.orderCount || 0) + 1,
        lastOrderDate: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      // 신규 수령자 등록
      const recipientData = {
        name: deliveryInfo.recipientName,
        contact: deliveryInfo.recipientContact,
        address: deliveryInfo.address,
        district: deliveryInfo.district,
        branchName: branchName,
        orderCount: 1,
        lastOrderDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        email: '', // 기본값 (나중에 UI에서 입력 가능하도록 수정)
        // 마케팅 활용을 위한 추가 필드
        marketingConsent: true, // 기본값 (나중에 UI에서 선택 가능하도록 수정)
        source: 'order', // 데이터 출처
      };
      await addDoc(collection(db, 'recipients'), recipientData);
    }
  } catch (error) {
    // 수령자 저장 실패해도 주문은 계속 진행
  }
};

// 주문 삭제 시 수령자 정보 업데이트 함수
const updateRecipientInfoOnOrderDelete = async (deliveryInfo: any, branchName: string) => {
  try {
    // 해당 수령자 검색
    const recipientsQuery = query(
      collection(db, 'recipients'),
      where('contact', '==', deliveryInfo.recipientContact),
      where('branchName', '==', branchName)
    );
    const existingRecipients = await getDocs(recipientsQuery);
    
    if (!existingRecipients.empty) {
      const recipientDoc = existingRecipients.docs[0];
      const existingData = recipientDoc.data();
      const newOrderCount = Math.max(0, (existingData.orderCount || 1) - 1);
      
      if (newOrderCount === 0) {
        // 주문 횟수가 0이 되면 수령자 정보 삭제
        await deleteDoc(recipientDoc.ref);
      } else {
        // 주문 횟수만 감소시키고 최근 주문일은 유지 (다른 주문이 있을 수 있으므로)
        await setDoc(recipientDoc.ref, {
          orderCount: newOrderCount,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }
  } catch (error) {
    // 수령자 업데이트 실패해도 주문 삭제는 계속 진행
  }
};
