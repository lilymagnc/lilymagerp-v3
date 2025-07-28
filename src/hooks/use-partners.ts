
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { PartnerFormValues } from '@/app/dashboard/partners/components/partner-form';

export interface Partner extends PartnerFormValues {
  id: string;
  createdAt: string;
}

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const partnersCollection = collection(db, 'partners');
      const partnersData = (await getDocs(partnersCollection)).docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toISOString(),
        } as Partner;
      });
      setPartners(partnersData);
    } catch (error) {
      console.error("Error fetching partners: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '거래처 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const addPartner = async (data: PartnerFormValues) => {
    setLoading(true);
    try {
      const partnerWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'partners'), partnerWithTimestamp);
      toast({ title: "성공", description: "새 거래처가 추가되었습니다." });
      await fetchPartners();
    } catch (error) {
      console.error("Error adding partner:", error);
      toast({ variant: 'destructive', title: '오류', description: '거래처 추가 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const updatePartner = async (id: string, data: PartnerFormValues) => {
    setLoading(true);
    try {
      const partnerDocRef = doc(db, 'partners', id);
      await setDoc(partnerDocRef, data, { merge: true });
      toast({ title: "성공", description: "거래처 정보가 수정되었습니다." });
      await fetchPartners();
    } catch (error) {
      console.error("Error updating partner:", error);
      toast({ variant: 'destructive', title: '오류', description: '거래처 정보 수정 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const deletePartner = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'partners', id));
      toast({ title: "성공", description: "거래처 정보가 삭제되었습니다." });
      await fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast({ variant: 'destructive', title: '오류', description: '거래처 삭제 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  
  return { partners, loading, addPartner, updatePartner, deletePartner };
}
