
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, writeBatch, serverTimestamp, runTransaction, query, getCountFromServer, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { Material as MaterialData } from "@/app/dashboard/materials/components/material-table";

export type Material = MaterialData;

const initialMaterials: Omit<Material, 'id' | 'status'>[] = [
  { name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 100, size: "1단", color: "Pink", branch: "릴리맥광화문점" },
  { name: "레드 카네이션", mainCategory: "생화", midCategory: "카네이션", price: 4500, supplier: "플라워팜", stock: 200, size: "1단", color: "Red", branch: "릴리맥여의도점" },
  { name: "몬스테라", mainCategory: "화분", midCategory: "관엽식물", price: 25000, supplier: "플라워팜", stock: 0, size: "대", color: "Green", branch: "릴리맥광화문점" },
  { name: "만천홍", mainCategory: "화분", midCategory: "난", price: 55000, supplier: "경부선꽃시장", stock: 30, size: "특", color: "Purple", branch: "릴리맥NC이스트폴점" },
  { name: "포장용 크라프트지", mainCategory: "기타자재", midCategory: "포장지", price: 1000, supplier: "자재월드", stock: 15, size: "1롤", color: "Brown", branch: "릴리맥여의도점" },
  { name: "유칼립투스", mainCategory: "생화", midCategory: "기타", price: 3000, supplier: "플라워팜", stock: 50, size: "1단", color: "Green", branch: "릴리맥광화문점" },
];

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getStatus = (stock: number): string => {
      if (stock === 0) return 'out_of_stock';
      if (stock < 20) return 'low_stock';
      return 'active';
  }

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const materialsCollection = collection(db, 'materials');
      let querySnapshot = await getDocs(query(materialsCollection));
      
      if (querySnapshot.empty) {
        const batch = writeBatch(db);
        const materialIds: Record<string, string> = {};
        let materialCounter = 1;

        initialMaterials.forEach((materialData) => {
            if (!materialIds[materialData.name]) {
                materialIds[materialData.name] = `M${String(materialCounter++).padStart(5, '0')}`;
            }
            const newDocRef = doc(materialsCollection);
            batch.set(newDocRef, {
                ...materialData,
                id: materialIds[materialData.name],
            });
        });
        await batch.commit();
        querySnapshot = await getDocs(query(materialsCollection));
      } 
      
      const materialsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { 
              ...data,
              // The document ID from firestore is now just for reference, we use our own id field
              // id: doc.id,
              status: getStatus(data.stock)
          } as Material;
      }).sort((a,b) => a.id.localeCompare(b.id));
      setMaterials(materialsData);

    } catch (error) {
      console.error("Error fetching materials: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '자재 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const bulkAddMaterials = async (importedData: any[]) => {
    // This function needs to be rewritten to handle the new data model
    // For now, it will show a toast message.
    toast({
        title: "기능 구현 필요",
        description: "새로운 데이터 모델에 맞게 자재 가져오기 기능을 업데이트해야 합니다.",
    });
  };


  const updateStock = async (
    items: { id: string; name: string; quantity: number }[],
    type: 'in' | 'out',
    branchName: string,
    operator: string
  ) => {
    // This function needs to be rewritten to handle the new data model
    // It should query for the document based on the `id` field and branch.
    toast({
        title: "기능 구현 필요",
        description: "새로운 데이터 모델에 맞게 재고 업데이트 기능을 업데이트해야 합니다.",
    });
  };
  
  const manualUpdateStock = async (
    itemId: string,
    itemName: string,
    newStock: number,
    branchName: string,
    operator: string
  ) => {
     // This function needs to be rewritten to handle the new data model
    // It should query for the document based on the `id` field and branch.
    toast({
        title: "기능 구현 필요",
        description: "새로운 데이터 모델에 맞게 수동 재고 업데이트 기능을 업데이트해야 합니다.",
    });
  };

  return { materials, loading, updateStock, fetchMaterials, manualUpdateStock, bulkAddMaterials };
}
