
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, writeBatch, serverTimestamp, runTransaction, query, where, orderBy, limit, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { Material as MaterialData } from "@/app/dashboard/materials/components/material-table";
import type { MaterialFormValues } from '@/app/dashboard/materials/components/material-form';

export type Material = MaterialData;

const initialMaterials: Omit<Material, 'docId' | 'status'>[] = [
  { id: "M00001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 100, size: "1단", color: "Pink", branch: "릴리맥광화문점" },
  { id: "M00001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 80, size: "1단", color: "Pink", branch: "릴리맥여의도점" },
  { id: "M00002", name: "레드 카네이션", mainCategory: "생화", midCategory: "카네이션", price: 4500, supplier: "플라워팜", stock: 200, size: "1단", color: "Red", branch: "릴리맥여의도점" },
  { id: "M00003", name: "몬스테라", mainCategory: "화분", midCategory: "관엽식물", price: 25000, supplier: "플라워팜", stock: 0, size: "대", color: "Green", branch: "릴리맥광화문점" },
  { id: "M00004", name: "만천홍", mainCategory: "화분", midCategory: "난", price: 55000, supplier: "경부선꽃시장", stock: 30, size: "특", color: "Purple", branch: "릴리맥NC이스트폴점" },
  { id: "M00005", name: "포장용 크라프트지", mainCategory: "기타자재", midCategory: "기타", price: 1000, supplier: "자재월드", stock: 15, size: "1롤", color: "Brown", branch: "릴리맥여의도점" },
  { id: "M00006", name: "유칼립투스", mainCategory: "생화", midCategory: "기타", price: 3000, supplier: "플라워팜", stock: 50, size: "1단", color: "Green", branch: "릴리맥광화문점" },
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
      const initDocRef = doc(materialsCollection, '_initialized');
      const initDoc = await getDoc(initDocRef);

      if (!initDoc.exists()) {
        const batch = writeBatch(db);
        initialMaterials.forEach((materialData) => {
            const newDocRef = doc(materialsCollection);
            batch.set(newDocRef, materialData);
        });
        batch.set(initDocRef, { seeded: true });
        await batch.commit();
      } 
      
      const querySnapshot = await getDocs(materialsCollection);
      const materialsData = querySnapshot.docs
          .filter(doc => doc.id !== '_initialized')
          .map((doc) => {
              const data = doc.data();
              return { 
                  docId: doc.id,
                  ...data,
                  status: getStatus(data.stock)
              } as Material;
      }).sort((a,b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
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
  
  const generateNewId = async () => {
    const q = query(collection(db, "materials"), orderBy("id", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    let lastIdNumber = 0;
    if (!querySnapshot.empty) {
        const lastId = querySnapshot.docs[0].data().id;
        if(lastId && lastId.startsWith('M')) {
            lastIdNumber = parseInt(lastId.replace('M', ''), 10);
        }
    }
    return `M${String(lastIdNumber + 1).padStart(5, '0')}`;
  }

  const addMaterial = async (data: MaterialFormValues) => {
    setLoading(true);
    try {
        const existingMaterialQuery = query(
            collection(db, "materials"), 
            where("name", "==", data.name), 
            where("branch", "==", data.branch)
        );
        const existingMaterialSnapshot = await getDocs(existingMaterialQuery);

        if (!existingMaterialSnapshot.empty) {
            toast({ variant: 'destructive', title: '중복된 자재', description: `'${data.branch}' 지점에 동일한 이름의 자재가 이미 존재합니다.`});
            setLoading(false);
            return;
        }

        const newId = await generateNewId();
        const docRef = doc(collection(db, "materials"));
        await setDoc(docRef, { ...data, id: newId });

        toast({ title: "성공", description: "새 자재가 추가되었습니다."});
        await fetchMaterials();
    } catch (error) {
        console.error("Error adding material:", error);
        toast({ variant: 'destructive', title: '오류', description: '자재 추가 중 오류가 발생했습니다.'});
    } finally {
        setLoading(false);
    }
  }

  const updateMaterial = async (docId: string, materialId: string, data: MaterialFormValues) => {
      setLoading(true);
      try {
          const docRef = doc(db, "materials", docId);
          await setDoc(docRef, { ...data, id: materialId }, { merge: true });
          toast({ title: "성공", description: "자재 정보가 수정되었습니다."});
          await fetchMaterials();
      } catch (error) {
          console.error("Error updating material:", error);
          toast({ variant: 'destructive', title: '오류', description: '자재 수정 중 오류가 발생했습니다.'});
      } finally {
          setLoading(false);
      }
  }

  const deleteMaterial = async (docId: string) => {
    setLoading(true);
    try {
        const docRef = doc(db, "materials", docId);
        await deleteDoc(docRef);
        await fetchMaterials();
        toast({ title: "성공", description: "자재가 삭제되었습니다."});
    } catch (error) {
        console.error("Error deleting material:", error);
        toast({ variant: 'destructive', title: '오류', description: '자재 삭제 중 오류가 발생했습니다.'});
    } finally {
        setLoading(false);
    }
  }
  
  const updateStock = async (
    items: { id: string; name: string; quantity: number, price?: number, supplier?: string }[],
    type: 'in' | 'out',
    branchName: string,
    operator: string
  ) => {
    const historyBatch = writeBatch(db);

    for (const item of items) {
        try {
            await runTransaction(db, async (transaction) => {
                const materialQuery = query(collection(db, "materials"), where("id", "==", item.id), where("branch", "==", branchName));
                const materialSnapshot = await getDocs(materialQuery);

                if (materialSnapshot.empty) {
                    throw new Error(`자재를 찾을 수 없습니다: ${item.name} (${branchName})`);
                }
                
                const materialDocRef = materialSnapshot.docs[0].ref;
                const materialDoc = await transaction.get(materialDocRef);

                if(!materialDoc.exists()) {
                     throw new Error(`자재 문서를 찾을 수 없습니다: ${item.name} (${branchName})`);
                }

                const materialData = materialDoc.data();
                const currentStock = materialData?.stock || 0;
                const change = type === 'in' ? item.quantity : -item.quantity;
                const newStock = currentStock + change;

                const updatePayload: {stock: number, price?: number, supplier?: string} = { stock: newStock };
                if (type === 'in') {
                    if (item.price !== undefined) updatePayload.price = item.price;
                    if (item.supplier !== undefined) updatePayload.supplier = item.supplier;
                }

                transaction.update(materialDocRef, updatePayload);

                const historyDocRef = doc(collection(db, "stockHistory"));
                historyBatch.set(historyDocRef, {
                    date: serverTimestamp(),
                    type: type,
                    itemType: "material",
                    itemId: item.id,
                    itemName: item.name,
                    quantity: item.quantity,
                    fromStock: currentStock,
                    toStock: newStock,
                    resultingStock: newStock,
                    branch: branchName,
                    operator: operator,
                    supplier: type === 'in' ? (item.supplier || materialData?.supplier) : materialData?.supplier,
                    price: type === 'in' ? (item.price || materialData?.price) : materialData?.price,
                    totalAmount: type === 'in' ? ((item.price || materialData?.price || 0) * item.quantity) : 0,
                });
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "재고 업데이트 오류",
                description: `${item.name}의 재고를 업데이트하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
            });
            // Continue to next item
        }
    }
    
    await historyBatch.commit();
    await fetchMaterials();
  };
  
  const manualUpdateStock = async (
    itemId: string,
    itemName: string,
    newStock: number,
    branchName: string,
    operator: string
  ) => {
    try {
      await runTransaction(db, async (transaction) => {
        const materialQuery = query(collection(db, "materials"), where("id", "==", itemId), where("branch", "==", branchName));
        const materialSnapshot = await getDocs(materialQuery);

        if (materialSnapshot.empty) {
          throw new Error(`자재를 찾을 수 없습니다: ${itemName} (${branchName})`);
        }
        
        const materialRef = materialSnapshot.docs[0].ref;
        const materialDoc = await transaction.get(materialRef);

        if(!materialDoc.exists()) {
            throw new Error(`자재 문서를 찾을 수 없습니다: ${itemName} (${branchName})`);
        }
        
        const currentStock = materialDoc.data()?.stock || 0;

        transaction.update(materialRef, { stock: newStock });

        const historyDocRef = doc(collection(db, "stockHistory"));
        transaction.set(historyDocRef, {
            date: serverTimestamp(),
            type: "manual_update",
            itemType: "material",
            itemId: itemId,
            itemName: itemName,
            quantity: newStock - currentStock,
            fromStock: currentStock,
            toStock: newStock,
            resultingStock: newStock,
            branch: branchName,
            operator: operator,
        });
      });

      toast({
        title: "업데이트 성공",
        description: `${itemName}의 재고가 ${newStock}으로 업데이트되었습니다.`,
      });
      await fetchMaterials();

    } catch (error) {
      console.error("Manual stock update error:", error);
      toast({
        variant: "destructive",
        title: "재고 업데이트 오류",
        description: `재고 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const bulkAddMaterials = async (data: any[], currentBranch: string) => {
    setLoading(true);
    let newCount = 0;
    let updateCount = 0;
    
    const dataToProcess = data.filter(row => {
      const branchMatch = currentBranch === 'all' || row.branch === currentBranch;
      const hasName = row.name && String(row.name).trim() !== '';
      return branchMatch && hasName;
    });

    for (const row of dataToProcess) {
      const quantity = Number(row.quantity);
      if (isNaN(quantity) || quantity <= 0) continue;

      const materialData = {
        id: row.id || null,
        name: String(row.name),
        branch: String(row.branch),
        stock: quantity,
        price: Number(row.price) || 0,
        supplier: String(row.supplier) || '미지정',
        mainCategory: String(row.mainCategory) || '기타자재',
        midCategory: String(row.midCategory) || '기타',
        size: String(row.size) || '기타',
        color: String(row.color) || '기타',
      };
      
      try {
        let q;
        if (materialData.id) {
            q = query(collection(db, "materials"), where("id", "==", materialData.id), where("branch", "==", materialData.branch));
        } else {
            q = query(collection(db, "materials"), where("name", "==", materialData.name), where("branch", "==", materialData.branch));
        }
        
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Update existing material
          const docRef = querySnapshot.docs[0].ref;
          const existingData = querySnapshot.docs[0].data();
          const newStock = (existingData.stock || 0) + materialData.stock;
          await setDoc(docRef, { ...materialData, id: existingData.id, stock: newStock }, { merge: true });
          updateCount++;
        } else {
          // Add new material
          const newId = materialData.id || await generateNewId();
          const newDocRef = doc(collection(db, "materials"));
          await setDoc(newDocRef, { ...materialData, id: newId });
          newCount++;
        }
      } catch (error) {
         console.error("Error processing row:", row, error);
         toast({ variant: 'destructive', title: '처리 오류', description: `'${row.name}' 처리 중 오류가 발생했습니다.` });
      }
    }
    
    toast({ title: '처리 완료', description: `성공: 신규 자재 ${newCount}개 추가, ${updateCount}개 업데이트 완료.`});
    await fetchMaterials();
  };

  return { materials, loading, updateStock, fetchMaterials, manualUpdateStock, addMaterial, updateMaterial, deleteMaterial, bulkAddMaterials };
}
