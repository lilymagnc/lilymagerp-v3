import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useBranches } from '@/hooks/use-branches';
import { useSettings } from '@/hooks/use-settings';
import { DisplayBoardItem } from '@/types/order-transfer';

export function useDisplayBoard() {
  const [displayItems, setDisplayItems] = useState<DisplayBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { branches } = useBranches();
  const { settings } = useSettings();

  // 전광판 목록 조회
  const fetchDisplayItems = useCallback(async () => {
    if (!user?.franchise) return;

    try {
      setLoading(true);
      setError(null);

      const userBranch = branches.find(b => b.name === user.franchise);
      if (!userBranch) return;

      const displayBoardRef = collection(db, 'display_board');
      const q = query(
        displayBoardRef,
        where('branchId', '==', userBranch.id),
        where('isActive', '==', true),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const displayData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DisplayBoardItem[];

      setDisplayItems(displayData);

    } catch (err) {
      console.error('전광판 목록 조회 오류:', err);
      setError('전광판 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user?.franchise, branches]);

  // 실시간 전광판 리스너
  useEffect(() => {
    if (!user?.franchise) return;

    const userBranch = branches.find(b => b.name === user.franchise);
    if (!userBranch) return;

    const displayBoardRef = collection(db, 'display_board');
    const q = query(
      displayBoardRef,
      where('branchId', '==', userBranch.id),
      where('isActive', '==', true),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const displayData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DisplayBoardItem[];

      setDisplayItems(displayData);
    }, (error) => {
      console.error('실시간 전광판 리스너 오류:', error);
      setError('실시간 전광판 연결 중 오류가 발생했습니다.');
    });

    return () => unsubscribe();
  }, [user?.franchise, branches]);

  // 전광판 아이템 생성
  const createDisplayItem = useCallback(async (
    type: 'order_transfer' | 'new_order' | 'delivery_complete' | 'pickup_ready',
    title: string,
    content: string,
    branchId: string,
    branchName: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    transferId?: string,
    orderId?: string
  ) => {
    try {
      const displayDuration = settings.orderTransferSettings?.displayBoardDuration || 30;
      const expiresAt = new Date(Date.now() + displayDuration * 60 * 1000);

      const displayData = {
        type,
        title,
        content,
        branchId,
        branchName,
        priority,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        isActive: true,
        transferId,
        orderId,
        displayDuration
      };

      await addDoc(collection(db, 'display_board'), displayData);

    } catch (err) {
      console.error('전광판 아이템 생성 오류:', err);
      throw err;
    }
  }, [settings.orderTransferSettings?.displayBoardDuration]);

  // 주문 이관 전광판 생성
  const createOrderTransferDisplay = useCallback(async (
    fromBranchId: string,
    fromBranchName: string,
    toBranchId: string,
    toBranchName: string,
    transferId: string,
    orderNumber?: string
  ) => {
    const title = '주문 이관 알림';
    const content = `${fromBranchName} → ${toBranchName} 지점 이관${orderNumber ? `\n주문번호: ${orderNumber}` : ''}`;
    
    await createDisplayItem(
      'order_transfer',
      title,
      content,
      toBranchId,
      toBranchName,
      'high',
      transferId
    );
  }, [createDisplayItem]);

  // 새 주문 전광판 생성
  const createNewOrderDisplay = useCallback(async (
    branchId: string,
    branchName: string,
    orderId: string,
    orderNumber: string,
    customerName: string
  ) => {
    const title = '새 주문 알림';
    const content = `주문번호: ${orderNumber}\n고객명: ${customerName}`;
    
    await createDisplayItem(
      'new_order',
      title,
      content,
      branchId,
      branchName,
      'medium',
      undefined,
      orderId
    );
  }, [createDisplayItem]);

  // 배송 완료 전광판 생성
  const createDeliveryCompleteDisplay = useCallback(async (
    branchId: string,
    branchName: string,
    orderId: string,
    orderNumber: string,
    customerName: string
  ) => {
    const title = '배송 완료 알림';
    const content = `주문번호: ${orderNumber}\n고객명: ${customerName}`;
    
    await createDisplayItem(
      'delivery_complete',
      title,
      content,
      branchId,
      branchName,
      'low',
      undefined,
      orderId
    );
  }, [createDisplayItem]);

  // 픽업 준비 전광판 생성
  const createPickupReadyDisplay = useCallback(async (
    branchId: string,
    branchName: string,
    orderId: string,
    orderNumber: string,
    customerName: string
  ) => {
    const title = '픽업 준비 완료';
    const content = `주문번호: ${orderNumber}\n고객명: ${customerName}`;
    
    await createDisplayItem(
      'pickup_ready',
      title,
      content,
      branchId,
      branchName,
      'medium',
      undefined,
      orderId
    );
  }, [createDisplayItem]);

  // 전광판 아이템 비활성화
  const deactivateDisplayItem = useCallback(async (itemId: string) => {
    try {
      const displayRef = doc(db, 'display_board', itemId);
      await updateDoc(displayRef, {
        isActive: false,
        deactivatedAt: serverTimestamp()
      });

    } catch (err) {
      console.error('전광판 아이템 비활성화 오류:', err);
      throw err;
    }
  }, []);

  // 만료된 전광판 정리
  const cleanupExpiredDisplayItems = useCallback(async () => {
    try {
      const displayBoardRef = collection(db, 'display_board');
      const q = query(
        displayBoardRef,
        where('isActive', '==', true),
        where('expiresAt', '<=', Timestamp.fromDate(new Date()))
      );

      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { 
          isActive: false,
          deactivatedAt: serverTimestamp()
        })
      );

      await Promise.all(batch);

    } catch (err) {
      console.error('만료된 전광판 정리 오류:', err);
    }
  }, []);

  // 전광판 아이템 수동 제거
  const removeDisplayItem = useCallback(async (itemId: string) => {
    try {
      await deactivateDisplayItem(itemId);
    } catch (err) {
      console.error('전광판 아이템 제거 오류:', err);
      throw err;
    }
  }, [deactivateDisplayItem]);

  // 모든 전광판 아이템 제거
  const removeAllDisplayItems = useCallback(async () => {
    if (!user?.franchise) return;

    try {
      const userBranch = branches.find(b => b.name === user.franchise);
      if (!userBranch) return;

      const displayBoardRef = collection(db, 'display_board');
      const q = query(
        displayBoardRef,
        where('branchId', '==', userBranch.id),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { 
          isActive: false,
          deactivatedAt: serverTimestamp()
        })
      );

      await Promise.all(batch);

    } catch (err) {
      console.error('모든 전광판 아이템 제거 오류:', err);
      throw err;
    }
  }, [user?.franchise, branches, deactivateDisplayItem]);

  // 초기 로드
  useEffect(() => {
    if (user && branches.length > 0) {
      fetchDisplayItems();
    }
  }, [user, branches, fetchDisplayItems]);

  // 주기적으로 만료된 전광판 정리 (5분마다)
  useEffect(() => {
    const interval = setInterval(cleanupExpiredDisplayItems, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanupExpiredDisplayItems]);

  return {
    displayItems,
    loading,
    error,
    createDisplayItem,
    createOrderTransferDisplay,
    createNewOrderDisplay,
    createDeliveryCompleteDisplay,
    createPickupReadyDisplay,
    deactivateDisplayItem,
    removeDisplayItem,
    removeAllDisplayItems,
    cleanupExpiredDisplayItems
  };
}
