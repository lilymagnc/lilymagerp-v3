
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { BranchFormValues } from '@/app/dashboard/branches/components/branch-form';

export interface Branch extends BranchFormValues {
  id: string;
}

const initialBranches: BranchFormValues[] = [
    { name: "릴리맥광화문점", type: "직영점", address: "서울시 중구 세종대로 136 서울파이낸스빌딩 B2", phone: "010-2385-9518 / 010-2285-9518", account: "국민은행 407501-01-213500 이상원 (릴리맥 광화문점)", manager: "이상원", businessNumber: "123-45-67890", employeeCount: 5 },
    { name: "릴리맥NC이스트폴점", type: "직영점", address: "서울시 광진구 아차산로 402, G1층", phone: "010-2908-5459 / 010-2285-9518", account: "국민은행 400437-01-027411 이성원 (릴리맥NC이스트폴)", manager: "이성원", businessNumber: "123-45-67890", employeeCount: 4 },
    { name: "릴리맥플라워랩", type: "본사", address: "서울특별시 영등포구 국제금융로6길 33 1002호", phone: "010-3911-8206", account: "국민은행 810-21-0609-906", manager: "김대표", businessNumber: "111-22-33333", employeeCount: 10 },
    { name: "릴리맥여의도점", type: "직영점", address: "서울시 영등포구 여의나루로50 The-K타워 B1", phone: "010-8241-9518 / 010-2285-9518", account: "국민은행 92285951847 이진경 (릴리맥)", manager: "이진경", businessNumber: "123-45-67890", employeeCount: 6 },
    { name: "릴리맥여의도2호점", type: "직영점", address: "서울시 영등포구 국제금융로8길 31 SK증권빌딩 B1", phone: "010-7939-9518 / 010-2285-9518", account: "국민은행 400437-01-027255 이성원 (릴리맥여의도2호)", manager: "이성원", businessNumber: "123-45-67890", employeeCount: 3 },
];

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const branchesCollection = collection(db, 'branches');
      const querySnapshot = await getDocs(branchesCollection);
      
      if (querySnapshot.empty) {
        // Seed initial data if the collection is empty
        const batch = writeBatch(db);
        initialBranches.forEach(branchData => {
          const docRef = doc(collection(db, "branches"));
          batch.set(docRef, branchData);
        });
        await batch.commit();
        // Fetch again after seeding
        const seededSnapshot = await getDocs(branchesCollection);
        const branchesData = seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
        setBranches(branchesData);
      } else {
        const branchesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
        setBranches(branchesData);
      }
    } catch (error) {
      console.error("Error fetching branches: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '지점 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const addBranch = async (branch: BranchFormValues) => {
    try {
      setLoading(true);
      const branchesCollection = collection(db, 'branches');
      await addDoc(branchesCollection, branch);
      toast({
        title: '성공',
        description: '새 지점이 성공적으로 추가되었습니다.',
      });
      await fetchBranches();
    } catch (error) {
      console.error("Error adding branch: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '지점 추가 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBranch = async (branchId: string, branch: BranchFormValues) => {
    try {
      setLoading(true);
      const branchDoc = doc(db, 'branches', branchId);
      await setDoc(branchDoc, branch, { merge: true });
      toast({
        title: '성공',
        description: '지점 정보가 성공적으로 수정되었습니다.',
      });
      await fetchBranches();
    } catch (error) {
      console.error("Error updating branch: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '지점 정보 수정 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (branchId: string) => {
    try {
      setLoading(true);
      const branchDoc = doc(db, 'branches', branchId);
      await deleteDoc(branchDoc);
      toast({
        title: '성공',
        description: '지점이 성공적으로 삭제되었습니다.',
      });
      setBranches(prev => prev.filter(b => b.id !== branchId));
    } catch (error) {
      console.error("Error deleting branch: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '지점 삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  return { branches, loading, addBranch, updateBranch, deleteBranch, fetchBranches };
}
