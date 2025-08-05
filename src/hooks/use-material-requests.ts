"use client";

import { useState, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { 
  MaterialRequest, 
  CreateMaterialRequestData,
  RequestStatus
} from '@/types/material-request';
import { useSimpleExpenses } from './use-simple-expenses';

export function useMaterialRequests() {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalCost: 0,
    averageProcessingTime: 0
  });
  const { toast } = useToast();
  const { addMaterialRequestExpense } = useSimpleExpenses();

  // ID로 특정 요청 조회
  const getRequestById = useCallback(async (requestId: string): Promise<MaterialRequest | null> => {
    try {
      const docRef = doc(db, 'materialRequests', requestId);
      const docSnap = await getDoc(docRef, { source: 'server' }); // source: 'server' 추가
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { 
          id: docSnap.id, 
          ...data,
          createdAt: data.createdAt?.toDate(), // Timestamp를 Date 객체로 변환
          updatedAt: data.updatedAt?.toDate(), // Timestamp를 Date 객체로 변환
        } as MaterialRequest;
      }
      return null;
    } catch (error) {
      console.error('ID로 요청 조회 오류:', error);
      throw error;
    }
  }, []);

  // 요청 번호 생성 함수
  const generateRequestNumber = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6); // 마지막 6자리
    
    return `REQ-${year}${month}${day}-${time}`;
  };

  // 요청 검증 함수
  const validateMaterialRequest = (request: CreateMaterialRequestData) => {
    if (!request.branchId || !request.branchName) {
      return {
        code: 'INVALID_BRANCH',
        message: '지점 정보가 필요합니다.'
      };
    }
    
    if (!request.requesterId || !request.requesterName) {
      return {
        code: 'INVALID_REQUESTER',
        message: '요청자 정보가 필요합니다.'
      };
    }
    
    if (!request.requestedItems || request.requestedItems.length === 0) {
      return {
        code: 'NO_ITEMS',
        message: '요청할 자재를 선택해주세요.'
      };
    }
    
    for (const item of request.requestedItems) {
      if (!item.materialId || !item.materialName) {
        return {
          code: 'INVALID_MATERIAL',
          message: '자재 정보가 올바르지 않습니다.'
        };
      }
      
      if (item.requestedQuantity <= 0) {
        return {
          code: 'INVALID_QUANTITY',
          message: '수량은 0보다 커야 합니다.'
        };
      }
      
      if (item.estimatedPrice < 0) {
        return {
          code: 'INVALID_PRICE',
          message: '가격은 0 이상이어야 합니다.'
        };
      }
    }
    
    return null;
  };

  // 새 요청 생성
  const createRequest = useCallback(async (requestData: CreateMaterialRequestData): Promise<string> => {
    console.log('createRequest 시작:', requestData);
    setLoading(true);
    
    try {
      // 요청 데이터 검증
      console.log('데이터 검증 시작');
      const validationError = validateMaterialRequest(requestData);
      if (validationError) {
        console.error('검증 오류:', validationError);
        throw new Error(validationError.message);
      }
      console.log('데이터 검증 완료');

      const requestNumber = generateRequestNumber();
      const now = serverTimestamp();
      console.log('요청 번호 생성:', requestNumber);

      const materialRequest: Omit<MaterialRequest, 'id'> = {
        requestNumber,
        branchId: requestData.branchId,
        branchName: requestData.branchName,
        requesterId: requestData.requesterId,
        requesterName: requestData.requesterName,
        requestedItems: requestData.requestedItems,
        status: 'submitted',
        createdAt: now as any,
        updatedAt: now as any
      };

      console.log('Firestore에 문서 추가 시작:', materialRequest);
      const docRef = await addDoc(collection(db, 'materialRequests'), materialRequest);
      console.log('Firestore 문서 추가 완료:', docRef.id);
      
      // 알림 생성 (본사 관리자에게)
      try {
        console.log('알림 생성 시작');
        await createNotification({
          type: 'material_request',
          subType: 'request_submitted',
          title: '새 자재 요청',
          message: `${requestData.branchName}에서 자재 요청이 접수되었습니다. (${requestNumber})`,
          role: '본사 관리자',
          relatedRequestId: docRef.id
        });

        // 긴급 요청인 경우 추가 알림
        const hasUrgentItems = requestData.requestedItems.some(item => item.urgency === 'urgent');
        if (hasUrgentItems) {
          await createNotification({
            type: 'material_request',
            subType: 'urgent_request',
            title: '긴급 자재 요청',
            message: `${requestData.branchName}에서 긴급 자재 요청이 접수되었습니다. (${requestNumber})`,
            role: '본사 관리자',
            relatedRequestId: docRef.id
          });
        }
        console.log('알림 생성 완료');
      } catch (notificationError) {
        console.warn('알림 생성 실패 (무시됨):', notificationError);
        // 알림 생성 실패는 전체 프로세스를 중단시키지 않음
      }

      console.log('요청 생성 성공:', requestNumber);
      return requestNumber;

    } catch (error) {
      console.error('요청 생성 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 지점별 요청 목록 조회
  const getRequestsByBranch = useCallback(async (branchId: string): Promise<MaterialRequest[]> => {
    try {
      const q = query(
        collection(db, 'materialRequests'),
        where('branchId', '==', branchId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q, { source: 'server' }); // source: 'server' 추가
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(), // Timestamp를 Date 객체로 변환
          updatedAt: data.updatedAt?.toDate(), // Timestamp를 Date 객체로 변환
        } as MaterialRequest;
      });

    } catch (error) {
      console.error('지점별 요청 조회 오류:', error);
      throw error;
    }
  }, []);

  // 모든 요청 목록 조회 (본사용)
  const getAllRequests = useCallback(async (): Promise<MaterialRequest[]> => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'materialRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(), // Timestamp를 Date 객체로 변환
          updatedAt: data.updatedAt?.toDate(), // Timestamp를 Date 객체로 변환
        } as MaterialRequest;
      });

      // 상태 업데이트
      setRequests(requestsData);
      
      // 통계 계산
      const totalRequests = requestsData.length;
      const pendingRequests = requestsData.filter(r => ['submitted', 'reviewing', 'purchasing'].includes(r.status)).length;
      const completedRequests = requestsData.filter(r => r.status === 'completed').length;
      const totalCost = requestsData.reduce((sum, request) => 
        sum + request.requestedItems.reduce((itemSum, item) => 
          itemSum + (item.requestedQuantity * item.estimatedPrice), 0
        ), 0
      );

      setStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        totalCost,
        averageProcessingTime: 0 // 계산 로직 필요
      });

      return requestsData;

    } catch (error) {
      console.error('전체 요청 조회 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 요청 상태 업데이트
  const updateRequestStatus = useCallback(async (
    requestId: string, 
    newStatus: RequestStatus,
    additionalData?: Partial<MaterialRequest>
  ): Promise<void> => {
    setLoading(true);
    
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...additionalData
      };

      await updateDoc(doc(db, 'materialRequests', requestId), updateData);

      // 상태 변경 알림 생성
      if (additionalData?.branchId) {
        await createStatusChangeNotification(requestId, newStatus, additionalData.branchId);
      }

    } catch (error) {
      console.error('요청 상태 업데이트 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 상태별 요청 조회
  const getRequestsByStatus = useCallback(async (status: RequestStatus): Promise<MaterialRequest[]> => {
    try {
      const q = query(
        collection(db, 'materialRequests'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q, { source: 'server' }); // source: 'server' 추가
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(), // Timestamp를 Date 객체로 변환
          updatedAt: data.updatedAt?.toDate(), // Timestamp를 Date 객체로 변환
        } as MaterialRequest;
      });

    } catch (error) {
      console.error('상태별 요청 조회 오류:', error);
      throw error;
    }
  }, []);

  // 알림 생성 헬퍼 함수
  const createNotification = async (notificationData: {
    type: string;
    subType: string;
    title: string;
    message: string;
    userId?: string;
    branchId?: string;
    role?: string;
    relatedRequestId?: string;
  }) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('알림 생성 오류:', error);
      // 알림 생성 실패는 전체 프로세스를 중단시키지 않음
    }
  };

  // 상태 변경 알림 생성
  const createStatusChangeNotification = async (
    requestId: string, 
    newStatus: RequestStatus, 
    branchId: string
  ) => {
    const statusMessages: Record<RequestStatus, string> = {
      submitted: '요청이 제출되었습니다',
      reviewing: '요청이 검토 중입니다',
      purchasing: '구매가 진행 중입니다',
      purchased: '구매가 완료되었습니다',
      shipping: '배송이 시작되었습니다',
      delivered: '배송이 완료되었습니다',
      completed: '요청이 완료되었습니다'
    };

    await createNotification({
      type: 'material_request',
      subType: 'status_updated',
      title: '요청 상태 업데이트',
      message: statusMessages[newStatus],
      branchId,
      relatedRequestId: requestId
    });
  };

  // 실제 구매 내역 저장
  const saveActualPurchase = useCallback(async (
    requestIds: string[],
    purchaseData: {
      purchaseDate: Timestamp;
      items: any[];
      totalCost: number;
      notes: string;
    }
  ): Promise<void> => {
    setLoading(true);
    
    try {
      // 각 요청에 실제 구매 정보 업데이트
      const updatePromises = requestIds.map(requestId => {
        const actualPurchaseInfo = {
          purchaseDate: purchaseData.purchaseDate,
          purchaserId: 'current-user-id', // 실제로는 현재 사용자 ID
          purchaserName: '구매담당자', // 실제로는 현재 사용자 이름
          items: purchaseData.items,
          totalCost: purchaseData.totalCost,
          notes: purchaseData.notes
        };

        return updateDoc(doc(db, 'materialRequests', requestId), {
          actualPurchase: actualPurchaseInfo,
          status: 'purchased',
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(updatePromises);

      // 구매 완료 알림 생성
      for (const requestId of requestIds) {
        await createNotification({
          type: 'material_request',
          subType: 'purchase_completed',
          title: '구매 완료',
          message: '요청하신 자재의 구매가 완료되었습니다.',
          relatedRequestId: requestId
        });
      }

    } catch (error) {
      console.error('실제 구매 내역 저장 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 구매 배치 생성
  const createPurchaseBatch = useCallback(async (
    requestIds: string[],
    batchData: {
      purchaserId: string;
      purchaserName: string;
      notes?: string;
    }
  ): Promise<string> => {
    setLoading(true);
    
    try {
      const batchNumber = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
      const now = serverTimestamp();

      const batch = {
        batchNumber,
        purchaseDate: now,
        purchaserId: batchData.purchaserId,
        purchaserName: batchData.purchaserName,
        includedRequests: requestIds,
        purchasedItems: [],
        totalCost: 0,
        deliveryPlan: [],
        status: 'planning',
        notes: batchData.notes || '',
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'purchaseBatches'), batch);
      
      // 포함된 요청들의 상태를 'purchasing'으로 업데이트
      await Promise.all(
        requestIds.map(requestId => 
          updateRequestStatus(requestId, 'purchasing')
        )
      );

      return docRef.id;

    } catch (error) {
      console.error('구매 배치 생성 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 구매 완료 처리 (기존 함수 수정)
  const completePurchase = useCallback(async (
    requestId: string,
    actualPurchaseInfo: any
  ): Promise<void> => {
    setLoading(true);
    
    try {
      // 요청 정보 조회
      const requestDoc = await getDoc(doc(db, 'materialRequests', requestId));
      if (!requestDoc.exists()) {
        throw new Error('요청을 찾을 수 없습니다.');
      }
      
      const requestData = requestDoc.data() as MaterialRequest;
      
      // 요청 상태 업데이트
      await updateDoc(doc(db, 'materialRequests', requestId), {
        status: 'purchased',
        actualPurchase: actualPurchaseInfo,
        updatedAt: serverTimestamp()
      });

      // 간편지출에 자동 등록
      await addMaterialRequestExpense({
        ...requestData,
        id: requestId
      }, actualPurchaseInfo);

    } catch (error) {
      console.error('구매 완료 처리 오류:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [addMaterialRequestExpense]);

  return {
    loading,
    requests,
    stats,
    createRequest,
    getRequestsByBranch,
    getAllRequests,
    updateRequestStatus,
    getRequestsByStatus,
    saveActualPurchase,
    createPurchaseBatch,
    getRequestById,
    completePurchase
  };
}