
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp, query, where, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { CustomerFormValues } from '@/app/dashboard/customers/components/customer-form';

export interface Customer extends CustomerFormValues {
  id: string;
  createdAt: string | any;
  lastOrderDate?: string | any;
  totalSpent?: number;
  orderCount?: number;
  points?: number;
  address?: string;
  companyName?: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const customersCollection = collection(db, 'customers');
      const querySnapshot = await getDocs(customersCollection);
      
      // 삭제되지 않은 고객만 필터링 (클라이언트 사이드에서 처리)
      const customersData = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return !data.isDeleted;
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate().toISOString() : data.lastOrderDate,
          } as Customer;
        });
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '고객 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (data: CustomerFormValues) => {
    setLoading(true);
    try {
      const customerWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
        totalSpent: 0,
        orderCount: 0,
        points: 0,
      };
      await addDoc(collection(db, 'customers'), customerWithTimestamp);
      toast({ title: "성공", description: "새 고객이 추가되었습니다." });
      await fetchCustomers();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({ variant: 'destructive', title: '오류', description: '고객 추가 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, data: CustomerFormValues) => {
    setLoading(true);
    try {
      const customerDocRef = doc(db, 'customers', id);
      await setDoc(customerDocRef, data, { merge: true });
      toast({ title: "성공", description: "고객 정보가 수정되었습니다." });
      await fetchCustomers();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({ variant: 'destructive', title: '오류', description: '고객 정보 수정 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    setLoading(true);
    try {
      const customerDocRef = doc(db, 'customers', id);
      await setDoc(customerDocRef, { isDeleted: true }, { merge: true });
      toast({ title: "성공", description: "고객 정보가 삭제되었습니다." });
      await fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({ variant: 'destructive', title: '오류', description: '고객 삭제 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const bulkAddCustomers = async (data: any[], selectedBranch?: string) => {
    setLoading(true);
    let newCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
  
    await Promise.all(data.map(async (row) => {
      try {
        if (!row.contact || !row.name) return;
  
        const customerData = {
          name: String(row.name),
          contact: String(row.contact),
          companyName: String(row.companyName || ''),
          address: String(row.address || ''),
          email: String(row.email || ''),
          branch: selectedBranch || '',
          totalSpent: 0,
          orderCount: 0,
          points: 0,
        };
  
        // 중복 체크: 고객명, 회사명, 연락처 중 하나라도 일치하면 중복으로 처리
        const nameQuery = query(collection(db, "customers"), where("name", "==", customerData.name));
        const companyQuery = query(collection(db, "customers"), where("companyName", "==", customerData.companyName));
        const contactQuery = query(collection(db, "customers"), where("contact", "==", customerData.contact));

        const [nameSnapshot, companySnapshot, contactSnapshot] = await Promise.all([
          getDocs(nameQuery),
          getDocs(companyQuery),
          getDocs(contactQuery)
        ]);

        // 중복 조건: 고객명이 같거나, 회사명이 같거나, 연락처가 같으면 중복
        const isDuplicate = !nameSnapshot.empty || 
                           (!customerData.companyName && !companySnapshot.empty) || 
                           !contactSnapshot.empty;

        if (isDuplicate) {
          duplicateCount++;
          return; // 중복 데이터는 저장하지 않음
        }

        // 중복이 아닌 경우에만 새로 추가
        await addDoc(collection(db, "customers"), { ...customerData, createdAt: serverTimestamp() });
        newCount++;

      } catch (error) {
        console.error("Error processing row:", row, error);
        errorCount++;
      }
    }));
  
    setLoading(false);
    
    if (errorCount > 0) {
      toast({ 
        variant: 'destructive', 
        title: '일부 처리 오류', 
        description: `${errorCount}개 항목 처리 중 오류가 발생했습니다.` 
      });
    }
    
    toast({ 
      title: '처리 완료', 
      description: `성공: 신규 고객 ${newCount}명 추가, 중복 데이터 ${duplicateCount}개 제외.`
    });
    
    await fetchCustomers();
  };
  
  // findCustomersByContact 함수 추가
  const findCustomersByContact = useCallback(async (contact: string) => {
    try {
      const q = query(collection(db, 'customers'), where('contact', '==', contact));
      const querySnapshot = await getDocs(q);
      // 삭제되지 않은 고객만 반환
      return querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return !data.isDeleted;
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate().toISOString() : data.lastOrderDate,
          } as Customer;
        });
    } catch (error) {
      console.error('Error finding customers by contact:', error);
      return [];
    }
  }, []);
  
  return { 
    customers, 
    loading, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    bulkAddCustomers,
    findCustomersByContact
  };
}
