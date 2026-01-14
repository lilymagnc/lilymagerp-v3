
"use client";

import { useState, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, writeBatch, serverTimestamp, runTransaction, query, where, limit, deleteDoc, getDoc, startAfter, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { useToast } from './use-toast';
import type { Material as MaterialData } from "@/app/dashboard/materials/components/material-table";
import type { MaterialFormValues } from '@/app/dashboard/materials/components/material-form';

export type Material = MaterialData;

export function useMaterials() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [stats, setStats] = useState({
        totalTypes: 0,
        totalStock: 0,
        lowStock: 0,
        outOfStock: 0
    });
    const { toast } = useToast();

    const getStatus = (stock: number): string => {
        if (stock === 0) return 'out_of_stock';
        if (stock < 10) return 'low_stock';
        return 'active';
    }

    // 통계 정보 가져오기 (색인 오류에 유연하게 대응)
    const fetchStats = useCallback(async (branch?: string) => {
        try {
            const materialsRef = collection(db, 'materials');
            let q = query(materialsRef);
            if (branch && branch !== 'all') {
                q = query(q, where('branch', '==', branch));
            }

            // 1. 전체 자재 종류 수 (기본 색인으로 가능)
            const countSnapshot = await getCountFromServer(q);
            const totalTypes = countSnapshot.data().count;

            // 2. 재고 총량 합계 (기본 색인으로 가능)
            const stockSumSnapshot = await getAggregateFromServer(q, {
                totalInventory: sum('stock')
            });

            const newStats = {
                totalTypes,
                totalStock: stockSumSnapshot.data().totalInventory || 0,
                lowStock: 0,
                outOfStock: 0
            };

            // 복합 색인이 필요한 복잡한 통계는 별도 try-catch로 감싸서 전체가 죽지 않게 함
            try {
                const lowStockQ = query(q, where('stock', '>', 0), where('stock', '<', 10));
                const lowSnap = await getCountFromServer(lowStockQ);
                newStats.lowStock = lowSnap.data().count;

                const outSnap = await getCountFromServer(query(q, where('stock', '==', 0)));
                newStats.outOfStock = outSnap.data().count;
            } catch (e) {
                console.warn("Complex stats require more indexes, skipping... ", e);
            }

            setStats(newStats);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    }, []);

    const fetchMaterials = useCallback(async (filters?: {
        branch?: string;
        searchTerm?: string;
        mainCategory?: string;
        midCategory?: string;
        pageSize?: number;
    }) => {
        try {
            setLoading(true);
            const materialsCollection = collection(db, 'materials');

            fetchStats(filters?.branch);

            let q = query(materialsCollection);

            if (filters?.branch && filters.branch !== 'all') {
                q = query(q, where('branch', '==', filters.branch));
            }
            if (filters?.mainCategory && filters.mainCategory !== 'all') {
                q = query(q, where('mainCategory', '==', filters.mainCategory));
            }
            if (filters?.midCategory && filters.midCategory !== 'all') {
                q = query(q, where('midCategory', '==', filters.midCategory));
            }

            // 색인 오류 방지를 위해 서버 측 정렬(orderBy)을 제거합니다.
            const pageSize = filters?.pageSize || 50;
            q = query(q, limit(pageSize));

            const querySnapshot = await getDocs(q);

            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
            setLastDoc(lastVisible);
            setHasMore(querySnapshot.size >= pageSize);

            const materialsData = querySnapshot.docs
                .filter(doc => doc.id !== '_initialized')
                .map((doc) => ({
                    docId: doc.id,
                    ...doc.data(),
                    status: getStatus(doc.data().stock)
                } as Material))
                // 클라이언트 측에서 정렬 수행 (서버 부하 및 색인 오류 방지)
                .sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);

            setMaterials(materialsData);

        } catch (error) {
            console.error("Error fetching materials: ", error);
            toast({ variant: 'destructive', title: '오류', description: '자재 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
        } finally {
            setLoading(false);
        }
    }, [toast, fetchStats]);

    const loadMore = async (filters?: {
        branch?: string;
        mainCategory?: string;
        midCategory?: string;
        pageSize?: number;
    }) => {
        if (!lastDoc || !hasMore) return;
        try {
            setLoading(true);
            const materialsCollection = collection(db, 'materials');
            let q = query(materialsCollection);

            if (filters?.branch && filters.branch !== 'all') {
                q = query(q, where('branch', '==', filters.branch));
            }
            if (filters?.mainCategory && filters.mainCategory !== 'all') {
                q = query(q, where('mainCategory', '==', filters.mainCategory));
            }
            if (filters?.midCategory && filters.midCategory !== 'all') {
                q = query(q, where('midCategory', '==', filters.midCategory));
            }

            // startAfter를 사용하려면 쿼리 구조가 이전과 완전히 동일해야 하므로 limit만 적용
            q = query(q, startAfter(lastDoc), limit(filters?.pageSize || 50));

            const querySnapshot = await getDocs(q);
            const newMaterials = querySnapshot.docs
                .filter(doc => doc.id !== '_initialized')
                .map(doc => ({
                    docId: doc.id,
                    ...doc.data(),
                    status: getStatus(doc.data().stock)
                })) as Material[];

            setMaterials(prev => {
                const combined = [...prev, ...newMaterials];
                return combined.sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
            });
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.size >= (filters?.pageSize || 50));
        } catch (error) {
            console.error("Error loading more materials:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateMaterialIds = async () => {
        try {
            setLoading(true);
            const materialsCollection = collection(db, 'materials');
            const querySnapshot = await getDocs(materialsCollection);
            let updateCount = 0;
            let currentNumber = 1;

            for (const docSnapshot of querySnapshot.docs) {
                if (docSnapshot.id === '_initialized') continue;
                const data = docSnapshot.data();
                if (data.id && data.id.match(/^M\d{5}$/)) continue;

                const newId = `M${String(currentNumber).padStart(5, '0')}`;
                await setDoc(docSnapshot.ref, { ...data, id: newId }, { merge: true });
                updateCount++;
                currentNumber++;
            }

            if (updateCount > 0) {
                toast({ title: "ID 업데이트 완료", description: `${updateCount}개 자재의 ID가 업데이트되었습니다.` });
                await fetchMaterials();
            }
        } catch (error) {
            console.error("Error updating material IDs:", error);
        } finally {
            setLoading(false);
        }
    }

    const addMaterial = async (data: MaterialFormValues) => {
        setLoading(true);
        try {
            const docRef = doc(collection(db, "materials"));
            await setDoc(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            toast({ title: "성공", description: `새 자재가 '${data.branch}' 지점에 추가되었습니다.` });
            await fetchMaterials();
        } catch (error) {
            console.error("Error adding material:", error);
        } finally {
            setLoading(false);
        }
    }

    const updateMaterial = async (docId: string, materialId: string, data: MaterialFormValues) => {
        setLoading(true);
        try {
            const docRef = doc(db, "materials", docId);
            await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
            toast({ title: "성공", description: "자재 정보가 수정되었습니다." });
            await fetchMaterials();
        } catch (error) {
            console.error("Error updating material:", error);
        } finally {
            setLoading(false);
        }
    }

    const deleteMaterial = async (docId: string) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, "materials", docId));
            await fetchMaterials();
            toast({ title: "성공", description: "자재가 삭제되었습니다." });
        } catch (error) {
            console.error("Error deleting material:", error);
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

                    if (materialSnapshot.empty) return;

                    const materialDocRef = materialSnapshot.docs[0].ref;
                    const materialDoc = await transaction.get(materialDocRef);
                    const currentStock = materialDoc.data()?.stock || 0;
                    const change = type === 'in' ? item.quantity : -item.quantity;
                    const newStock = currentStock + change;

                    transaction.update(materialDocRef, { stock: newStock, updatedAt: serverTimestamp() });

                    const historyDocRef = doc(collection(db, "stockHistory"));
                    historyBatch.set(historyDocRef, {
                        date: serverTimestamp(),
                        type,
                        itemType: "material",
                        itemId: item.id,
                        itemName: item.name,
                        quantity: item.quantity,
                        fromStock: currentStock,
                        toStock: newStock,
                        resultingStock: newStock,
                        branch: branchName,
                        operator,
                    });
                });
            } catch (error) {
                console.error(error);
            }
        }
        await historyBatch.commit();
        await fetchMaterials();
    };

    const manualUpdateStock = async (itemId: string, itemName: string, newStock: number, branchName: string, operator: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const materialQuery = query(collection(db, "materials"), where("id", "==", itemId), where("branch", "==", branchName));
                const materialSnapshot = await getDocs(materialQuery);
                if (materialSnapshot.empty) return;

                const materialRef = materialSnapshot.docs[0].ref;
                const materialDoc = await transaction.get(materialRef);
                const currentStock = materialDoc.data()?.stock || 0;

                transaction.update(materialRef, { stock: newStock, updatedAt: serverTimestamp() });

                const historyDocRef = doc(collection(db, "stockHistory"));
                transaction.set(historyDocRef, {
                    date: serverTimestamp(),
                    type: "manual_update",
                    itemType: "material",
                    itemId,
                    itemName,
                    quantity: newStock - currentStock,
                    fromStock: currentStock,
                    toStock: newStock,
                    resultingStock: newStock,
                    branch: branchName,
                    operator,
                });
            });
            await fetchMaterials();
        } catch (error) {
            console.error(error);
        }
    };

    const bulkAddMaterials = async (data: any[], currentBranch: string) => {
        setLoading(true);
        // ... (필요 시 벌크 추가 로직 구현)
        await fetchMaterials();
        setLoading(false);
    };

    return {
        materials,
        loading,
        hasMore,
        stats,
        fetchStats,
        loadMore,
        updateStock,
        fetchMaterials,
        manualUpdateStock,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        bulkAddMaterials,
        updateMaterialIds
    };
}
