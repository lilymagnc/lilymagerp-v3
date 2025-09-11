import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useBranches } from '@/hooks/use-branches';
import { useSettings } from '@/hooks/use-settings';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';
import { useDisplayBoard } from '@/hooks/use-display-board';
import { 
  OrderTransfer, 
  OrderTransferForm, 
  TransferStatusUpdate, 
  TransferFilter,
  TransferStats,
  TransferPermissions
} from '@/types/order-transfer';

export function useOrderTransfers() {
  const [transfers, setTransfers] = useState<OrderTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  
  const { user } = useAuth();
  const { branches } = useBranches();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { createOrderTransferNotification, createOrderTransferCancelNotification } = useRealtimeNotifications();
  const { createOrderTransferDisplay } = useDisplayBoard();

  // 권한 확인 함수
  const getTransferPermissions = useCallback((): TransferPermissions => {
    if (!user) {
      return {
        canCreateTransfer: false,
        canAcceptTransfer: false,
        canRejectTransfer: false,
        canCompleteTransfer: false,
        canViewAllTransfers: false,
        canManageSettings: false
      };
    }

    const isAdmin = user.role === '본사 관리자';
    const isBranchManager = user.role === '가맹점 관리자';
    const isBranchUser = user.role === '직원';

    // 주문 이관 기능은 모든 지점 사용자가 사용 가능
    const canManageTransfers = isAdmin || isBranchManager || isBranchUser;

    return {
      canCreateTransfer: canManageTransfers,
      canAcceptTransfer: canManageTransfers,
      canRejectTransfer: canManageTransfers,
      canCompleteTransfer: canManageTransfers,
      canViewAllTransfers: isAdmin,
      canManageSettings: isAdmin
    };
  }, [user]);

  // 이관 목록 조회
  const fetchTransfers = useCallback(async (filter?: TransferFilter, pageSize: number = 20) => {
    try {
      setLoading(true);
      setError(null);

      const transfersRef = collection(db, 'order_transfers');
      let q = query(transfersRef);

      // 권한에 따른 필터링
      const permissions = getTransferPermissions();
      
      // 모든 이관을 가져온 후 클라이언트에서 필터링
      q = query(q, orderBy('transferDate', 'desc'));

      // 상태 필터
      if (filter?.status) {
        q = query(q, where('status', '==', filter.status));
      }

      // 날짜 필터
      if (filter?.startDate) {
        q = query(q, where('transferDate', '>=', Timestamp.fromDate(filter.startDate)));
      }

      if (filter?.endDate) {
        q = query(q, where('transferDate', '<=', Timestamp.fromDate(filter.endDate)));
      }

      // 페이지네이션
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(pageSize));

      const snapshot = await getDocs(q);
      
      const transfersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrderTransfer[];

      if (snapshot.docs.length < pageSize) {
        setHasMore(false);
      } else {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      // 클라이언트 사이드 필터링
      let filteredTransfersData = transfersData;
      
      // 권한에 따른 필터링
      if (!permissions.canViewAllTransfers && user?.franchise) {
        // 지점 사용자는 자신이 보낸 이관과 받은 이관 모두 볼 수 있음
        filteredTransfersData = transfersData.filter(transfer => 
          transfer.orderBranchName === user.franchise || transfer.processBranchName === user.franchise
        );
      }

      setTransfers(prev => 
        lastDoc ? [...prev, ...filteredTransfersData] : filteredTransfersData
      );

    } catch (err) {
      console.error('이관 목록 조회 오류:', err);
      setError('이관 목록을 불러오는 중 오류가 발생했습니다.');
      toast({
        variant: 'destructive',
        title: '오류',
        description: '이관 목록을 불러오는 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  }, [user, branches, lastDoc, getTransferPermissions, toast]);

  // 이관 요청 생성
  const createTransfer = useCallback(async (
    orderId: string,
    transferForm: OrderTransferForm
  ) => {
    try {
      setError(null);

      // 권한 확인
      const permissions = getTransferPermissions();
      
      if (!permissions.canCreateTransfer) {
        throw new Error('이관 요청을 생성할 권한이 없습니다.');
      }

      // 원본 주문 조회
      const orderDoc = await getDocs(query(
        collection(db, 'orders'),
        where('__name__', '==', orderId)
      ));

      if (orderDoc.empty) {
        throw new Error('원본 주문을 찾을 수 없습니다.');
      }

      const orderData = orderDoc.docs[0].data();
      
      const orderBranch = branches.find(b => b.id === orderData.branchId);
      const processBranch = branches.find(b => b.id === transferForm.processBranchId);

      if (!orderBranch || !processBranch) {
        throw new Error('지점 정보를 찾을 수 없습니다.');
      }

      // 이관 데이터 생성
      const transferData: Omit<OrderTransfer, 'id'> = {
        originalOrderId: orderId,
        orderBranchId: orderData.branchId,
        orderBranchName: orderBranch.name,
        processBranchId: transferForm.processBranchId,
        processBranchName: processBranch.name,
        transferDate: new Date(),
        transferReason: transferForm.transferReason,
        transferBy: user?.uid || '',
        transferByUser: user?.email || '',
        status: 'pending',
        amountSplit: transferForm.amountSplit,
        originalOrderAmount: orderData.summary?.total || 0,
        notes: transferForm.notes
      };

      // 이관 데이터 저장
      const transferRef = await addDoc(collection(db, 'order_transfers'), {
        ...transferData,
        transferDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 원본 주문에 이관 정보 추가
      await updateDoc(doc(db, 'orders', orderId), {
        transferInfo: {
          isTransferred: true,
          transferId: transferRef.id,
          originalBranchId: orderData.branchId,
          originalBranchName: orderBranch.name,
          processBranchId: transferForm.processBranchId,
          processBranchName: processBranch.name,
          transferDate: serverTimestamp(),
          transferReason: transferForm.transferReason,
          transferBy: user?.uid || '',
          transferByUser: user?.email || '',
          status: 'pending',
          amountSplit: transferForm.amountSplit,
          notes: transferForm.notes,
          transferredAt: serverTimestamp()
        }
      });

      // 알림 생성
      await createOrderTransferNotification(
        orderBranch.name,
        processBranch.name,
        orderData.orderNumber,
        transferRef.id
      );

      // 전광판 아이템 생성 - 주문 정보 포함
      const orderInfo = {
        orderNumber: orderData.orderNumber,
        deliveryDate: orderData.deliveryInfo?.date || '',
        deliveryTime: orderData.deliveryInfo?.time || '',
        recipientName: orderData.deliveryInfo?.recipientName || '',
        recipientContact: orderData.deliveryInfo?.recipientContact || ''
      };
      
      await createOrderTransferDisplay(
        transferRef.id,
        orderBranch.name,
        processBranch.name,
        orderData.summary.total,
        transferForm.transferReason,
        'pending',
        orderInfo
      );

      toast({
        title: '이관 요청 완료',
        description: `${processBranch.name}지점으로 이관 요청이 전송되었습니다.`
      });

      // 목록 새로고침
      await fetchTransfers();

      return transferRef.id;

    } catch (err) {
      console.error('이관 요청 생성 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '이관 요청 생성 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage
      });
      throw err;
    }
  }, [user, branches, getTransferPermissions, fetchTransfers, toast]);

  // 이관 상태 업데이트
  const updateTransferStatus = useCallback(async (
    transferId: string,
    statusUpdate: TransferStatusUpdate
  ) => {
    try {
      setError(null);

      // 권한 확인
      const permissions = getTransferPermissions();
      if (!permissions.canAcceptTransfer && !permissions.canRejectTransfer) {
        throw new Error('이관 상태를 변경할 권한이 없습니다.');
      }

      const transferRef = doc(db, 'order_transfers', transferId);
      const updateData: any = {
        status: statusUpdate.status,
        updatedAt: serverTimestamp()
      };

      // 상태별 추가 정보
      if (statusUpdate.status === 'accepted') {
        updateData.acceptedAt = serverTimestamp();
        updateData.acceptedBy = user?.uid;
      } else if (statusUpdate.status === 'rejected') {
        updateData.rejectedAt = serverTimestamp();
        updateData.rejectedBy = user?.uid;
        
        // 이관 거절 시 원본 주문의 transferInfo 상태 업데이트
        const transferDoc = await getDocs(query(
          collection(db, 'order_transfers'),
          where('__name__', '==', transferId)
        ));

        if (!transferDoc.empty) {
          const transferData = transferDoc.docs[0].data();
          await updateDoc(doc(db, 'orders', transferData.originalOrderId), {
            'transferInfo.status': 'rejected',
            'transferInfo.rejectedAt': serverTimestamp(),
            'transferInfo.rejectedBy': user?.uid
          });
        }
      } else if (statusUpdate.status === 'completed') {
        updateData.completedAt = serverTimestamp();
        updateData.completedBy = user?.uid;
      } else if (statusUpdate.status === 'cancelled') {
        updateData.cancelledAt = serverTimestamp();
        updateData.cancelledBy = user?.uid;
      }

      if (statusUpdate.notes) {
        updateData.notes = statusUpdate.notes;
      }

      await updateDoc(transferRef, updateData);

      // 이관이 수락되면 원본 주문의 출고지점을 수주지점으로 변경
      if (statusUpdate.status === 'accepted') {
        const transferDoc = await getDocs(query(
          collection(db, 'order_transfers'),
          where('__name__', '==', transferId)
        ));

        if (!transferDoc.empty) {
          const transferData = transferDoc.docs[0].data();
          
          const processBranch = branches.find(b => b.id === transferData.processBranchId);
          
          if (processBranch) {
            // 원본 주문 업데이트 - branchId는 유지하고 이관 정보만 업데이트
            await updateDoc(doc(db, 'orders', transferData.originalOrderId), {
              // branchId와 branchName은 발주지점 그대로 유지
              // 대신 이관 정보를 업데이트
              'transferInfo.isTransferred': true,
              'transferInfo.transferId': transferId,
              'transferInfo.originalBranchId': transferData.orderBranchId,
              'transferInfo.originalBranchName': transferData.orderBranchName,
              'transferInfo.processBranchId': transferData.processBranchId,
              'transferInfo.processBranchName': transferData.processBranchName,
              'transferInfo.transferDate': transferData.transferDate,
              'transferInfo.transferReason': transferData.transferReason,
              'transferInfo.transferBy': transferData.transferBy,
              'transferInfo.transferByUser': transferData.transferByUser,
              'transferInfo.status': 'accepted',
              'transferInfo.acceptedAt': serverTimestamp(),
              'transferInfo.amountSplit': transferData.amountSplit,
              'transferInfo.notes': transferData.notes
            });

            // 원본 주문 정보 조회하여 전광판에 표시
            try {
              const orderDoc = await getDoc(doc(db, 'orders', transferData.originalOrderId));
              if (orderDoc.exists()) {
                const orderData = orderDoc.data();
                const orderInfo = {
                  orderNumber: orderData.orderNumber,
                  deliveryDate: orderData.deliveryInfo?.date || '',
                  deliveryTime: orderData.deliveryInfo?.time || '',
                  recipientName: orderData.deliveryInfo?.recipientName || '',
                  recipientContact: orderData.deliveryInfo?.recipientContact || ''
                };
                
                // 전광판에 수락 상태 업데이트
                await createOrderTransferDisplay(
                  transferId,
                  transferData.orderBranchName,
                  transferData.processBranchName,
                  transferData.originalOrderAmount,
                  transferData.transferReason,
                  'accepted',
                  orderInfo
                );
              }
            } catch (error) {
              console.error('주문 정보 조회 실패:', error);
              // 주문 정보 없이도 전광판 생성
              await createOrderTransferDisplay(
                transferId,
                transferData.orderBranchName,
                transferData.processBranchName,
                transferData.originalOrderAmount,
                transferData.transferReason,
                'accepted'
              );
            }
          }
        }
      }

      const statusMessages = {
        accepted: '이관 요청이 수락되었습니다.',
        rejected: '이관 요청이 거절되었습니다.',
        completed: '이관이 완료되었습니다.',
        cancelled: '이관이 취소되었습니다.'
      };

      toast({
        title: '상태 업데이트 완료',
        description: statusMessages[statusUpdate.status]
      });

      // 목록 새로고침
      await fetchTransfers();

    } catch (err) {
      console.error('이관 상태 업데이트 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '이관 상태 업데이트 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage
      });
      throw err;
    }
  }, [user, getTransferPermissions, fetchTransfers, toast]);

  // 이관 취소 (발주지점에서만 가능)
  const cancelTransfer = useCallback(async (
    transferId: string,
    cancelReason?: string
  ) => {
    try {
      setError(null);

      // 권한 확인
      const permissions = getTransferPermissions();
      if (!permissions.canCreateTransfer) {
        throw new Error('이관을 취소할 권한이 없습니다.');
      }

      // 이관 정보 조회
      const transferDoc = await getDocs(query(
        collection(db, 'order_transfers'),
        where('__name__', '==', transferId)
      ));

      if (transferDoc.empty) {
        throw new Error('이관 정보를 찾을 수 없습니다.');
      }

      const transferData = transferDoc.docs[0].data();
      
             // 발주지점 사용자만 취소 가능
       if (transferData.orderBranchName !== user?.franchise && user?.role !== '본사 관리자') {
         throw new Error('발주지점 사용자만 이관을 취소할 수 있습니다.');
       }

      // pending 상태인 경우에만 취소 가능
      if (transferData.status !== 'pending') {
        throw new Error('대기중인 이관만 취소할 수 있습니다.');
      }

      const transferRef = doc(db, 'order_transfers', transferId);
      const updateData: any = {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: user?.uid,
        updatedAt: serverTimestamp()
      };

      if (cancelReason) {
        updateData.cancelReason = cancelReason;
      }

      await updateDoc(transferRef, updateData);

      // 원본 주문에서 이관 정보 제거
      await updateDoc(doc(db, 'orders', transferData.originalOrderId), {
        transferInfo: null
      });

      // 취소 알림 생성
      await createOrderTransferCancelNotification(
        transferData.orderBranchName,
        transferData.processBranchName,
        transferData.originalOrderId,
        transferId,
        cancelReason
      );

      // 취소 시에는 전광판에 표시하지 않음

      toast({
        title: '이관 취소 완료',
        description: '이관이 성공적으로 취소되었습니다.'
      });

      // 목록 새로고침
      await fetchTransfers();

    } catch (err) {
      console.error('이관 취소 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '이관 취소 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage
      });
      throw err;
    }
  }, [user, getTransferPermissions, fetchTransfers, toast]);

  // 이관 기록 삭제
  const deleteTransfer = useCallback(async (transferId: string) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const transferRef = doc(db, 'order_transfers', transferId);
      const transferDoc = await getDoc(transferRef);
      
      if (!transferDoc.exists()) {
        throw new Error('이관 기록을 찾을 수 없습니다.');
      }

      const transferData = transferDoc.data() as OrderTransfer;
      
      // 권한 확인 - 본사 관리자 또는 관련 지점 관리자만 삭제 가능
      const isAdmin = user.role === '본사 관리자';
      const isRelatedBranchManager = user.role === '가맹점 관리자' && 
        (transferData.orderBranchName === user.franchise || transferData.processBranchName === user.franchise);
      
      if (!isAdmin && !isRelatedBranchManager) {
        throw new Error('이관 기록 삭제 권한이 없습니다.');
      }

      // 원본 주문에서 이관 정보 제거 (주문은 유지)
      try {
        await updateDoc(doc(db, 'orders', transferData.originalOrderId), {
          transferInfo: null
        });
      } catch (orderError) {
        // 주문이 이미 삭제되었을 수 있음 - 무시
      }

      // 이관 기록 삭제
      await deleteDoc(transferRef);
      
      toast({
        title: "이관 기록 삭제 완료",
        description: "이관 기록이 삭제되었습니다. 원본 주문의 이관 정보도 제거되었습니다."
      });

      // 목록 새로고침
      await fetchTransfers();

    } catch (err) {
      console.error('이관 기록 삭제 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '이관 기록 삭제 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage
      });
      throw err;
    }
  }, [user, fetchTransfers, toast]);

  // 고아 이관 기록 정리 (원본 주문이 없는 이관 기록 삭제)
  const cleanupOrphanTransfers = useCallback(async () => {
    if (!user || user.role !== '본사 관리자') {
      throw new Error('고아 이관 기록 정리는 본사 관리자만 수행할 수 있습니다.');
    }

    try {
      const transfersRef = collection(db, 'order_transfers');
      const transfersSnapshot = await getDocs(transfersRef);
      
      let deletedCount = 0;
      const batch = writeBatch(db);

      for (const transferDoc of transfersSnapshot.docs) {
        const transferData = transferDoc.data();
        
        // 원본 주문 존재 여부 확인
        try {
          const orderDoc = await getDoc(doc(db, 'orders', transferData.originalOrderId));
          if (!orderDoc.exists()) {
            // 원본 주문이 없으면 이관 기록 삭제
            batch.delete(transferDoc.ref);
            deletedCount++;
          }
        } catch (error) {
          // 주문 조회 실패 시에도 이관 기록 삭제
          batch.delete(transferDoc.ref);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        toast({
          title: "고아 이관 기록 정리 완료",
          description: `${deletedCount}개의 고아 이관 기록이 삭제되었습니다.`
        });
      } else {
        toast({
          title: "고아 이관 기록 정리",
          description: "정리할 고아 이관 기록이 없습니다."
        });
      }

      // 목록 새로고침
      await fetchTransfers();

    } catch (err) {
      console.error('고아 이관 기록 정리 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '고아 이관 기록 정리 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: '오류',
        description: errorMessage
      });
      throw err;
    }
  }, [user, fetchTransfers, toast]);

    // 이관 통계 조회
  const getTransferStats = useCallback(async (): Promise<TransferStats> => {
    try {
      const transfersRef = collection(db, 'order_transfers');
      const snapshot = await getDocs(transfersRef);
      
             const transfersData = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       })) as OrderTransfer[];
      
      // 사용자 지점 정보
      const userBranch = user?.franchise;
      const permissions = getTransferPermissions();
      
      // 권한에 따른 필터링된 데이터
      let filteredTransfersData = transfersData;
      
      // 본사 관리자가 아닌 경우 지점별 필터링
      if (!permissions.canViewAllTransfers && userBranch) {
        filteredTransfersData = transfersData.filter(transfer => 
          transfer.orderBranchName === userBranch || transfer.processBranchName === userBranch
        );
      }
      
             const stats: TransferStats = {
         totalTransfers: filteredTransfersData.length,
         pendingTransfers: filteredTransfersData.filter(t => t.status === 'pending').length,
         acceptedTransfers: filteredTransfersData.filter(t => t.status === 'accepted').length,
         rejectedTransfers: filteredTransfersData.filter(t => t.status === 'rejected').length,
         completedTransfers: filteredTransfersData.filter(t => t.status === 'completed').length,
         cancelledTransfers: filteredTransfersData.filter(t => t.status === 'cancelled').length,
         totalAmount: filteredTransfersData.reduce((sum, t) => sum + t.originalOrderAmount, 0),
         // 발주액: 내가 다른 지점으로 보낸 주문들의 총 금액
         orderBranchAmount: userBranch 
           ? filteredTransfersData.filter(t => t.orderBranchName === userBranch).reduce((sum, t) => sum + t.originalOrderAmount, 0)
           : 0,
         // 수주액: 내가 다른 지점으로부터 받은 주문들의 총 금액  
         processBranchAmount: userBranch
           ? filteredTransfersData.filter(t => t.processBranchName === userBranch).reduce((sum, t) => sum + t.originalOrderAmount, 0)
           : 0
       };

      return stats;

    } catch (err) {
      console.error('이관 통계 조회 오류:', err);
      throw err;
    }
  }, [user?.franchise, branches, getTransferPermissions]);

  // 금액 분배 계산
  const calculateAmountSplit = useCallback((
    totalAmount: number,
    orderType?: string
  ) => {
    const transferSettings = settings.orderTransferSettings;
    
    // 주문 유형별 분배 규칙 적용
    if (orderType && transferSettings.transferRules[orderType]) {
      const rule = transferSettings.transferRules[orderType];
      return {
        orderBranch: Math.round(totalAmount * (rule.orderBranch / 100)),
        processBranch: Math.round(totalAmount * (rule.processBranch / 100))
      };
    }

    // 기본 분배 규칙 적용
    return {
      orderBranch: Math.round(totalAmount * (transferSettings.defaultTransferSplit.orderBranch / 100)),
      processBranch: Math.round(totalAmount * (transferSettings.defaultTransferSplit.processBranch / 100))
    };
  }, [settings]);

  // 초기 로드
  useEffect(() => {
    if (user && branches.length > 0) {
      fetchTransfers();
    }
  }, [user, branches, fetchTransfers]);

  return {
    transfers,
    loading,
    error,
    hasMore,
    getTransferPermissions,
    fetchTransfers,
    createTransfer,
    updateTransferStatus,
    cancelTransfer,
    deleteTransfer,
    cleanupOrphanTransfers,
    getTransferStats,
    calculateAmountSplit
  };
}
