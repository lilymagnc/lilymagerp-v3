"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMaterials } from '@/hooks/use-materials';
import { useProducts } from '@/hooks/use-products';

import type { 
  SimpleExpense,
  CreateSimpleExpenseData,
  FixedCostTemplate,
  SupplierSuggestion,
  ExpenseStats,
  BranchExpenseSummary,
  SimpleExpenseCategory,
  DEFAULT_FIXED_COST_ITEMS
} from '@/types/simple-expense';
import { MaterialRequest } from '@/types/material-request';

export function useSimpleExpenses() {
  const [expenses, setExpenses] = useState<SimpleExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [supplierSuggestions, setSupplierSuggestions] = useState<SupplierSuggestion[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateStock: updateMaterialStock } = useMaterials();
  const { updateStock: updateProductStock } = useProducts();

  // 지출 목록 조회
  const fetchExpenses = useCallback(async (filters?: {
    branchId?: string;
    category?: SimpleExpenseCategory;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
  }) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let q = query(
        collection(db, 'simpleExpenses'),
        orderBy('date', 'desc')
      );
      
      if (filters?.branchId) {
        q = query(q, where('branchId', '==', filters.branchId));
      }
      
      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters?.dateFrom) {
        q = query(q, where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      
      if (filters?.dateTo) {
        q = query(q, where('date', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      
      if (filters?.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const snapshot = await getDocs(q);
      const expenseList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SimpleExpense[];
      
      setExpenses(expenseList);
    } catch (error) {
      console.error('지출 목록 조회 오류:', error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "지출 목록을 불러오는데 실패했습니다."
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 지출 추가
  const addExpense = useCallback(async (
    data: CreateSimpleExpenseData,
    branchId: string,
    branchName: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "로그인이 필요합니다."
      });
      return false;
    }

    setLoading(true);
    try {
      let receiptUrl = '';
      let receiptFileName = '';

      // 영수증 파일 업로드
      if (data.receiptFile) {
        const fileRef = ref(storage, `receipts/${branchId}/${Date.now()}_${data.receiptFile.name}`);
        const uploadResult = await uploadBytes(fileRef, data.receiptFile);
        receiptUrl = await getDownloadURL(uploadResult.ref);
        receiptFileName = data.receiptFile.name;
      }

      const expenseData: Omit<SimpleExpense, 'id'> = {
        date: data.date,
        amount: data.amount,
        category: data.category,
        subCategory: data.subCategory,
        description: data.description,
        supplier: data.supplier,
        quantity: data.quantity || 1, // 수량 필드 추가
        unitPrice: data.unitPrice || 0, // 단가 필드 추가
        branchId,
        branchName,
        inventoryUpdates: data.inventoryUpdates, // 재고 업데이트 정보 추가
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'simpleExpenses'), expenseData);

      // 재고 업데이트 처리
      if (data.inventoryUpdates && data.inventoryUpdates.length > 0) {
        for (const item of data.inventoryUpdates) {
          try {
            if (item.type === 'material') {
              await updateMaterialStock([{
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.unitPrice
              }], 'in');
            } else if (item.type === 'product') {
              await updateProductStock([{
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.unitPrice
              }], 'in');
            }
          } catch (stockError) {
            console.error(`재고 업데이트 오류 (${item.name}):`, stockError);
            // 재고 업데이트 실패해도 지출 등록은 성공으로 처리
          }
        }
      }

      // 관련 자재 요청 완료 처리
      if (data.relatedRequestId) {
        try {
          const actualItems = data.inventoryUpdates?.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })) || [];
          
          // 직접 Firestore 업데이트로 순환 참조 방지
          await updateDoc(doc(db, 'materialRequests', data.relatedRequestId), {
            status: 'completed',
            actualDelivery: {
              deliveredAt: serverTimestamp(),
              items: actualItems,
              completedBy: 'expense_system'
            },
            updatedAt: serverTimestamp()
          });

          toast({
            title: "자재 요청 완료",
            description: "간편지출 입력으로 자재 요청이 자동 완료되었습니다."
          });
        } catch (requestError) {
          console.error('자재 요청 완료 처리 오류:', requestError);
          // 자재 요청 완료 실패해도 지출 등록은 성공으로 처리
        }
      }

      // 구매처 자동완성 데이터 업데이트
      await updateSupplierSuggestion(data.supplier, data.category);

      toast({
        title: "지출 등록 완료",
        description: `${data.description} - ${data.amount.toLocaleString()}원이 등록되었습니다.`
      });

      return true;
    } catch (error) {
      console.error('지출 추가 오류:', error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "지출 등록 중 오류가 발생했습니다."
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 지출 수정
  const updateExpense = useCallback(async (
    expenseId: string,
    data: Partial<CreateSimpleExpenseData>
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp()
      };

      // 영수증 파일 업로드 (새 파일이 있는 경우)
      if (data.receiptFile) {
        const expense = expenses.find(e => e.id === expenseId);
        if (expense) {
          const fileRef = ref(storage, `receipts/${expense.branchId}/${Date.now()}_${data.receiptFile.name}`);
          const uploadResult = await uploadBytes(fileRef, data.receiptFile);
          updateData.receiptUrl = await getDownloadURL(uploadResult.ref);
          updateData.receiptFileName = data.receiptFile.name;
        }
      }

      await updateDoc(doc(db, 'simpleExpenses', expenseId), updateData);

      toast({
        title: "지출 수정 완료",
        description: "지출 정보가 수정되었습니다."
      });

      return true;
    } catch (error) {
      console.error('지출 수정 오류:', error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "지출 수정 중 오류가 발생했습니다."
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, expenses, toast]);

  // 지출 삭제
  const deleteExpense = useCallback(async (expenseId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'simpleExpenses', expenseId));

      toast({
        title: "지출 삭제 완료",
        description: "지출 기록이 삭제되었습니다."
      });

      return true;
    } catch (error) {
      console.error('지출 삭제 오류:', error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "지출 삭제 중 오류가 발생했습니다."
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 구매처 자동완성 데이터 업데이트
  const updateSupplierSuggestion = useCallback(async (
    supplierName: string,
    category: SimpleExpenseCategory
  ) => {
    try {
      const suggestionQuery = query(
        collection(db, 'supplierSuggestions'),
        where('name', '==', supplierName)
      );
      
      const snapshot = await getDocs(suggestionQuery);
      
      if (snapshot.empty) {
        // 새 구매처 추가
        await addDoc(collection(db, 'supplierSuggestions'), {
          name: supplierName,
          category,
          frequency: 1,
          lastUsed: Timestamp.now()
        });
      } else {
        // 기존 구매처 업데이트
        const doc = snapshot.docs[0];
        await updateDoc(doc.ref, {
          frequency: (doc.data().frequency || 0) + 1,
          lastUsed: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('구매처 자동완성 업데이트 오류:', error);
    }
  }, []);

  // 구매처 자동완성 조회
  const fetchSupplierSuggestions = useCallback(async (searchTerm: string = '') => {
    try {
      let q = query(
        collection(db, 'supplierSuggestions'),
        orderBy('frequency', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      let suggestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupplierSuggestion[];

      // 검색어가 있으면 필터링
      if (searchTerm) {
        suggestions = suggestions.filter(s => 
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setSupplierSuggestions(suggestions);
    } catch (error) {
      console.error('구매처 자동완성 조회 오류:', error);
    }
  }, []);

  // 고정비 템플릿 조회
  const fetchFixedCostTemplate = useCallback(async (branchId: string): Promise<FixedCostTemplate | null> => {
    try {
      const templateQuery = query(
        collection(db, 'fixedCostTemplates'),
        where('branchId', '==', branchId)
      );
      
      const snapshot = await getDocs(templateQuery);
      
      if (snapshot.empty) {
        return null;
      }
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as FixedCostTemplate;
    } catch (error) {
      console.error('고정비 템플릿 조회 오류:', error);
      return null;
    }
  }, []);

  // 고정비 템플릿 생성/업데이트
  const saveFixedCostTemplate = useCallback(async (
    branchId: string,
    branchName: string,
    items: any[]
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const existingTemplate = await fetchFixedCostTemplate(branchId);
      
      const templateData = {
        branchId,
        branchName,
        items,
        updatedAt: Timestamp.now()
      };

      if (existingTemplate) {
        await updateDoc(doc(db, 'fixedCostTemplates', existingTemplate.id), templateData);
      } else {
        await addDoc(collection(db, 'fixedCostTemplates'), {
          ...templateData,
          createdAt: Timestamp.now()
        });
      }

      toast({
        title: "고정비 템플릿 저장 완료",
        description: "고정비 템플릿이 저장되었습니다."
      });

      return true;
    } catch (error) {
      console.error('고정비 템플릿 저장 오류:', error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "고정비 템플릿 저장 중 오류가 발생했습니다."
      });
      return false;
    }
  }, [user, fetchFixedCostTemplate, toast]);

  // 고정비 일괄 입력
  const addFixedCosts = useCallback(async (
    branchId: string,
    branchName: string,
    items: any[],
    date: Date
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      const promises = items
        .filter(item => item.isActive && item.amount > 0)
        .map(item => {
          const expenseData: Omit<SimpleExpense, 'id'> = {
            date: Timestamp.fromDate(date),
            amount: item.amount,
            category: item.category,
            subCategory: item.subCategory,
            description: item.name,
            supplier: item.supplier,
            branchId,
            branchName,
            inputBy: user.uid,
            inputByName: user.displayName || user.email || '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          
          return addDoc(collection(db, 'simpleExpenses'), expenseData);
        });

      await Promise.all(promises);

      toast({
        title: "고정비 일괄 입력 완료",
        description: `${promises.length}개의 고정비가 등록되었습니다.`
      });

      return true;
    } catch (error) {
      console.error('고정비 일괄 입력 오류:', error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "고정비 일괄 입력 중 오류가 발생했습니다."
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // 지출 통계 계산
  const calculateStats = useCallback((expenseList: SimpleExpense[]): ExpenseStats => {
    const totalAmount = expenseList.reduce((sum, expense) => sum + expense.amount, 0);
    
    // 카테고리별 분석
    const categoryMap = new Map();
    expenseList.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1
      });
    });
    
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
    }));

    // 월별 트렌드 (최근 6개월)
    const monthlyMap = new Map();
    expenseList.forEach(expense => {
      if (!expense.date) return;
      const monthKey = expense.date.toDate().toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, existing + expense.amount);
    });
    
    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));

    // 주요 구매처
    const supplierMap = new Map();
    expenseList.forEach(expense => {
      const existing = supplierMap.get(expense.supplier) || { amount: 0, count: 0 };
      supplierMap.set(expense.supplier, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1
      });
    });
    
    const topSuppliers = Array.from(supplierMap.entries())
      .map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return {
      totalAmount,
      categoryBreakdown,
      monthlyTrend,
      topSuppliers
    };
  }, []);

  // 자재요청 구매비용을 간편지출에 추가
  const addMaterialRequestExpense = useCallback(async (
    materialRequest: MaterialRequest,
    actualPurchaseInfo: any
  ): Promise<boolean> => {
    if (!actualPurchaseInfo || !materialRequest.branchId) {
      return false;
    }

    try {
      const expenseData = {
        date: actualPurchaseInfo.purchaseDate,
        amount: actualPurchaseInfo.totalCost,
        category: SimpleExpenseCategory.MATERIAL,
        subCategory: 'material_request',
        description: `자재요청 구매 (${materialRequest.requestNumber}) - ${actualPurchaseInfo.items.map(item => item.actualMaterialName).join(', ')}`,
        supplier: actualPurchaseInfo.items[0]?.supplier || '자재구매',
        branchId: materialRequest.branchId,
        branchName: materialRequest.branchName,
        relatedRequestId: materialRequest.id,
        isAutoGenerated: true
      };

      const docRef = await addDoc(collection(db, 'simpleExpenses'), {
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: '성공',
        description: `자재요청 구매비용이 간편지출에 자동 등록되었습니다.`,
      });

      return true;
    } catch (error) {
      console.error('자재요청 지출 등록 오류:', error);
      return false;
    }
  }, [toast]);

  // 초기 로드
  useEffect(() => {
    if (user) {
      fetchExpenses();
      fetchSupplierSuggestions();
    }
  }, [user, fetchExpenses, fetchSupplierSuggestions]);

  return {
    expenses,
    loading,
    supplierSuggestions,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    fetchSupplierSuggestions,
    fetchFixedCostTemplate,
    saveFixedCostTemplate,
    addFixedCosts,
    calculateStats,
    addMaterialRequestExpense
  };
}