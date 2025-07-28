
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { CustomerFormValues } from '@/app/dashboard/customers/components/customer-form';

export interface Customer extends CustomerFormValues {
  id: string;
  createdAt: string;
  lastOrderDate?: string;
  totalSpent?: number;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const customersCollection = collection(db, 'customers');
      const q = query(customersCollection, where("isDeleted", "!=", true));
      
      const customersData = (await getDocs(q)).docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString(),
          lastOrderDate: data.lastOrderDate?.toDate().toISOString(),
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
            birthday: data.birthday ? data.birthday.toISOString().split('T')[0] : null,
            anniversary: data.anniversary ? data.anniversary.toISOString().split('T')[0] : null,
            createdAt: serverTimestamp(),
            totalSpent: 0,
            orderCount: 0,
            isDeleted: false,
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
      const customerWithTimestamp = {
          ...data,
          birthday: data.birthday ? data.birthday.toISOString().split('T')[0] : null,
          anniversary: data.anniversary ? data.anniversary.toISOString().split('T')[0] : null,
      };
      await setDoc(customerDocRef, customerWithTimestamp, { merge: true });
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
  
  const bulkAddCustomers = async (data: any[], currentBranch: string) => {
     setLoading(true);
    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;

    const dataToProcess = data.filter(row => {
        const branchMatch = currentBranch === 'all' || row.branch === currentBranch;
        const hasName = row.name && String(row.name).trim() !== '';
        return branchMatch && hasName;
    });

    await Promise.all(dataToProcess.map(async (row) => {
        try {
            const customerData = {
                name: String(row['고객명'] || row.name),
                type: (String(row['유형'] || row.type) === '기업' ? 'company' : 'personal'),
                company: String(row['회사명'] || row.company || ''),
                contact: String(row['연락처'] || row.contact),
                email: String(row['이메일'] || row.email || ''),
                branch: String(row['담당지점'] || row.branch),
                grade: String(row['등급'] || row.grade || '신규'),
                createdAt: serverTimestamp(),
                totalSpent: 0,
                orderCount: 0,
                isDeleted: false,
            };

            const q = query(collection(db, "customers"), where("contact", "==", customerData.contact), where("branch", "==", customerData.branch));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await setDoc(docRef, customerData, { merge: true });
                updateCount++;
            } else {
                await addDoc(collection(db, "customers"), customerData);
                newCount++;
            }
        } catch (error) {
            console.error("Error processing row:", row, error);
            errorCount++;
        }
    }));

    if (errorCount > 0) {
        toast({ variant: 'destructive', title: '일부 처리 오류', description: `${errorCount}개 항목 처리 중 오류가 발생했습니다.` });
    }
    toast({ title: '처리 완료', description: `성공: 신규 고객 ${newCount}명 추가, ${updateCount}명 업데이트 완료.`});
    await fetchCustomers();
  }

  const findCustomersByContact = useCallback(async (contact: string): Promise<Customer[]> => {
    if (!contact || contact.length < 4) return [];
    try {
        const customersCollection = collection(db, 'customers');
        const q = query(customersCollection, where("contact", "==", contact));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
    } catch (error) {
        console.error("Error finding customers by contact:", error);
        toast({ variant: 'destructive', title: '고객 검색 오류', description: '연락처로 고객을 찾는 중 오류가 발생했습니다.'});
        return [];
    }
  }, [toast]);

  return { customers, loading, addCustomer, updateCustomer, deleteCustomer, bulkAddCustomers, findCustomersByContact };
}
