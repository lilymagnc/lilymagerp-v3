
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';

export interface Branch {
  id: string;
  name: string;
  type: string;
  manager?: string;
  employeeCount?: number;
  businessNumber?: string;
  address: string;
  phone: string;
  account?: string;
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const branchesCollection = collection(db, 'branches');
      const querySnapshot = await getDocs(branchesCollection);
      const branchesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(branchesData);
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

  const addBranch = async (branch: Omit<Branch, 'id'>) => {
    try {
      setLoading(true);
      const branchesCollection = collection(db, 'branches');
      const docRef = await addDoc(branchesCollection, branch);
      toast({
        title: '성공',
        description: '새 지점이 성공적으로 추가되었습니다.',
      });
      await fetchBranches(); // Re-fetch to get the new list with ID
      return docRef;
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

  const updateBranch = async (branchId: string, branch: Partial<Omit<Branch, 'id'>>) => {
    try {
      setLoading(true);
      const branchDoc = doc(db, 'branches', branchId);
      await setDoc(branchDoc, branch, { merge: true });
      toast({
        title: '성공',
        description: '지점 정보가 성공적으로 수정되었습니다.',
      });
      await fetchBranches(); // Re-fetch to update the list
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
      await fetchBranches(); // Re-fetch to update the list
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
