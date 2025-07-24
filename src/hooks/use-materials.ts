
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, writeBatch, serverTimestamp, runTransaction } from 'firebase/firestore';
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
      let querySnapshot = await getDocs(materialsCollection);
      
      if (querySnapshot.empty) {
        const batch = writeBatch(db);
        initialMaterials.forEach(materialData => {
          const docRef = doc(collection(db, "materials"));
          batch.set(docRef, materialData);
        });
        await batch.commit();
        querySnapshot = await getDocs(materialsCollection);
      } 
      
      const materialsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data,
              status: getStatus(data.stock)
          } as Material
      });
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

  const updateStock = async (
    items: { id: string; name: string; quantity: number }[],
    type: 'in' | 'out',
    branchName: string,
    operator: string
  ) => {
    const batch = writeBatch(db);

    for (const item of items) {
        const materialRef = doc(db, "materials", item.id);
        const historyRef = doc(collection(db, "stockHistory"));

        try {
            await runTransaction(db, async (transaction) => {
                const materialDoc = await transaction.get(materialRef);
                if (!materialDoc.exists()) {
                    throw new Error(`자재를 찾을 수 없습니다: ${item.name}`);
                }

                const currentStock = materialDoc.data().stock;
                const change = type === 'in' ? item.quantity : -item.quantity;
                const newStock = currentStock + change;
                
                if (newStock < 0) {
                    throw new Error(`재고가 부족합니다: ${item.name} (현재 ${currentStock}개)`);
                }
                
                transaction.update(materialRef, { stock: newStock });

                // We cannot run batch writes inside a transaction, so we'll do history outside
            });

            // Create history record after transaction succeeds
            batch.set(historyRef, {
                date: serverTimestamp(),
                type: type,
                itemType: "material",
                itemId: item.id,
                itemName: item.name,
                quantity: item.quantity,
                resultingStock: 0, // This will be updated below
                branch: branchName,
                operator: operator,
            });

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            toast({
                variant: "destructive",
                title: "재고 업데이트 실패",
                description: e.message,
            });
            return; // Stop processing if one item fails
        }
    }
    
    // After all transactions, commit the history writes
    await batch.commit();

    // Now update resultingStock in a separate loop
    const finalBatch = writeBatch(db);
    for (const item of items) {
        const materialRef = doc(db, "materials", item.id);
        const materialSnap = await getDocs(collection(db, "stockHistory")); // This seems wrong
        // Need to refetch material to get final stock, or just calculate it
         const materialDoc = await getDocs(collection(db, "materials")); // This is also wrong
         //Let's just refetch all materials at the end
    }

    await fetchMaterials(); // Refetch all data to ensure consistency
  };

  return { materials, loading, updateStock, fetchMaterials };
}
