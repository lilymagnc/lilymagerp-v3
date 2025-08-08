
"use client";
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, writeBatch, query, orderBy, limit, setDoc, where, deleteDoc, getDoc, serverTimestamp, runTransaction, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { ProductFormValues } from '@/app/dashboard/products/components/product-form';
export interface Product {
  id: string;
  docId: string;
  name: string;
  mainCategory: string;
  midCategory: string;
  price: number;
  supplier: string;
  stock: number;
  size: string;
  color: string;
  branch: string;
  code?: string;
  category?: string;
  status: string; // required로 변경
}
// 초기 샘플 데이터 추가
const initialProducts: Omit<Product, 'docId' | 'status'>[] = [
  { id: "P00001", name: "샘플상품지우지마세요", mainCategory: "의류", midCategory: "상의", price: 45000, supplier: "공급업체1", stock: 10, size: "M", color: "White", branch: "릴리맥광화문점" },
];
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const getStatus = (stock: number): string => {
    if (stock === 0) return 'out_of_stock';
    if (stock < 10) return 'low_stock';
    return 'active';
  }
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');
      const querySnapshot = await getDocs(productsCollection);
      // 자재관리와 동일한 초기화 로직 추가
      if (querySnapshot.size <= 1) {
        const initDocRef = doc(productsCollection, '_initialized');
        const initDoc = await getDoc(initDocRef);
        if (!initDoc.exists()) {
          const batch = writeBatch(db);
          initialProducts.forEach((productData) => {
            const newDocRef = doc(productsCollection);
            batch.set(newDocRef, productData);
          });
          batch.set(initDocRef, { seeded: true });
          await batch.commit();
          const seededSnapshot = await getDocs(productsCollection);
          const productsData = seededSnapshot.docs
            .filter(doc => doc.id !== '_initialized')
            .map((doc) => {
              const data = doc.data();
              return {
                docId: doc.id,
                name: data.name || '',
                code: data.code || '',
                price: data.price || 0,
                ...data,
                status: getStatus(data.stock)
              } as Product;
            }).sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
          setProducts(productsData);
          return;
        }
      }
      const productsData = querySnapshot.docs
        .filter(doc => doc.id !== '_initialized')
        .map((doc) => {
          const data = doc.data();
          return {
            docId: doc.id,
            name: data.name || '',
            code: data.code || '',
            price: data.price || 0,
            ...data,
            status: getStatus(data.stock)
          } as Product;
        }).sort((a, b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '상품 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  // 새로운 ID 생성 함수 추가
  const generateNewId = async () => {
    const q = query(collection(db, "products"), orderBy("id", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    let lastIdNumber = 0;
    if (!querySnapshot.empty) {
        const lastId = querySnapshot.docs[0].data().id;
        if(lastId && lastId.startsWith('P')) {
            lastIdNumber = parseInt(lastId.replace('P', ''), 10);
        }
    }
    return `P${String(lastIdNumber + 1).padStart(5, '0')}`;
  }
  const addProduct = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      // 같은 이름의 상품이 있는지 확인 (지점 무관)
      const existingProductQuery = query(
        collection(db, "products"), 
        where("name", "==", data.name)
      );
      const existingProductSnapshot = await getDocs(existingProductQuery);
      let productId: string;
      if (!existingProductSnapshot.empty) {
        // 같은 이름의 상품이 있으면 기존 ID 사용
        productId = existingProductSnapshot.docs[0].data().id;
      } else {
        // 같은 이름의 상품이 없으면 새 ID 생성
        productId = await generateNewId();
      }
      const productWithTimestamp = {
        ...data,
        id: productId, // 기존 ID 또는 새 ID 사용
        createdAt: serverTimestamp(),
      };
      const docRef = doc(collection(db, 'products'));
      await setDoc(docRef, productWithTimestamp);
      toast({ title: "성공", description: `새 상품이 '${data.branch}' 지점에 추가되었습니다.` });
      await fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast({ variant: 'destructive', title: '오류', description: '상품 추가 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  const updateProduct = async (docId: string, data: ProductFormValues) => {
    setLoading(true);
    try {
      const docRef = doc(db, "products", docId);
      await setDoc(docRef, data, { merge: true });
      toast({ title: "성공", description: "상품 정보가 수정되었습니다." });
      await fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({ variant: 'destructive', title: '오류', description: '상품 수정 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  const deleteProduct = async (docId: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', docId));
      toast({ title: "성공", description: "상품이 삭제되었습니다." });
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: 'destructive', title: '오류', description: '상품 삭제 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  const bulkAddProducts = async (data: any[]) => {
    setLoading(true);
    let newCount = 0;
    let updateCount = 0;
    let errorCount = 0;
    let supplierAddedCount = 0;
    let categoryAddedCount = 0;
    // 새로운 공급업체들을 수집
    const suppliersToAdd = new Set<string>();
    data.forEach(row => {
        const supplier = String(row.supplier || '').trim();
        if (supplier && supplier !== '미지정' && supplier !== '') {
            suppliersToAdd.add(supplier);
        }
    });
    // 새로운 카테고리들을 수집
    const mainCategoriesToAdd = new Set<string>();
    const midCategoriesToAdd = new Set<string>();
    data.forEach(row => {
        const mainCategory = String(row.mainCategory || '').trim();
        const midCategory = String(row.midCategory || '').trim();
        if (mainCategory && mainCategory !== '기타자재') {
            mainCategoriesToAdd.add(mainCategory);
        }
        if (midCategory && midCategory !== '기타') {
            midCategoriesToAdd.add(midCategory);
        }
    });
    // 공급업체들을 거래처 관리에 추가
    if (suppliersToAdd.size > 0) {
        try {
            for (const supplierName of suppliersToAdd) {
                const nameQuery = query(collection(db, "partners"), where("name", "==", supplierName));
                const nameSnapshot = await getDocs(nameQuery);
                if (nameSnapshot.empty) {
                    const partnerData = {
                        name: supplierName,
                        type: '상품공급업체',
                        contact: '',
                        address: '',
                        items: '상품',
                        memo: `상품 업로드 시 자동 추가된 공급업체: ${supplierName}`,
                        createdAt: serverTimestamp()
                    };
                    await addDoc(collection(db, 'partners'), partnerData);
                    supplierAddedCount++;
                }
            }
        } catch (error) {
            console.error("Error adding suppliers to partners:", error);
        }
    }
    // 새로운 카테고리들을 카테고리 관리에 추가
    if (mainCategoriesToAdd.size > 0 || midCategoriesToAdd.size > 0) {
        try {
            // 대분류 카테고리 추가
            for (const mainCategory of mainCategoriesToAdd) {
                const mainQuery = query(collection(db, "categories"), where("name", "==", mainCategory), where("type", "==", "main"));
                const mainSnapshot = await getDocs(mainQuery);
                if (mainSnapshot.empty) {
                    const categoryData = {
                        name: mainCategory,
                        type: 'main',
                        createdAt: serverTimestamp()
                    };
                    await addDoc(collection(db, 'categories'), categoryData);
                    categoryAddedCount++;
                }
            }
            // 중분류 카테고리 추가
            for (const midCategory of midCategoriesToAdd) {
                const midQuery = query(collection(db, "categories"), where("name", "==", midCategory), where("type", "==", "mid"));
                const midSnapshot = await getDocs(midQuery);
                if (midSnapshot.empty) {
                    const categoryData = {
                        name: midCategory,
                        type: 'mid',
                        createdAt: serverTimestamp()
                    };
                    await addDoc(collection(db, 'categories'), categoryData);
                    categoryAddedCount++;
                }
            }
        } catch (error) {
            console.error("Error adding categories:", error);
        }
    }
    await Promise.all(data.map(async (row) => {
      try {
        if (!row.name) return;
        const productName = String(row.name);
        const productBranch = String(row.branch || '');
        // 같은 이름의 상품이 있는지 확인 (지점 무관)
        const existingProductQuery = query(
          collection(db, "products"), 
          where("name", "==", productName)
        );
        const existingProductSnapshot = await getDocs(existingProductQuery);
        let productId: string;
        if (!existingProductSnapshot.empty) {
          // 같은 이름의 상품이 있으면 기존 ID 사용
          productId = existingProductSnapshot.docs[0].data().id;
        } else {
          // 같은 이름의 상품이 없으면 새 ID 생성
          productId = await generateNewId();
        }
        const productData = {
          id: productId, // 기존 ID 또는 새 ID 사용
          name: productName,
          mainCategory: String(row.mainCategory || ''),
          midCategory: String(row.midCategory || ''),
          price: Number(row.price) || 0,
          supplier: String(row.supplier || ''),
          stock: Number(row.stock) || 0,
          size: String(row.size || ''),
          color: String(row.color || ''),
          branch: productBranch,
          code: String(row.code || ''),
          category: String(row.category || ''),
        };
        // 해당 지점에 같은 ID의 상품이 있는지 확인
        const branchProductQuery = query(
          collection(db, "products"), 
          where("id", "==", productId), 
          where("branch", "==", productBranch)
        );
        const branchProductSnapshot = await getDocs(branchProductQuery);
        if (!branchProductSnapshot.empty) {
          // 해당 지점에 같은 ID의 상품이 있으면 업데이트
          const docRef = branchProductSnapshot.docs[0].ref;
          await setDoc(docRef, productData, { merge: true });
          updateCount++;
        } else {
          // 해당 지점에 같은 ID의 상품이 없으면 새로 등록
          const docRef = doc(collection(db, "products"));
          await setDoc(docRef, { ...productData, createdAt: serverTimestamp() });
          newCount++;
        }
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
    let description = `성공: 신규 상품 ${newCount}개 추가, ${updateCount}개 업데이트 완료.`;
    if (supplierAddedCount > 0) {
        description += ` 새로운 공급업체 ${supplierAddedCount}개가 거래처 관리에 추가되었습니다.`;
    }
    if (categoryAddedCount > 0) {
        description += ` 새로운 카테고리 ${categoryAddedCount}개가 카테고리 관리에 추가되었습니다.`;
    }
    toast({ 
      title: '처리 완료', 
      description
    });
    await fetchProducts();
  };
  const manualUpdateStock = async (productId: string, productName: string, newStock: number, branch: string, userEmail: string) => {
    try {
      setLoading(true);
      // 자재와 동일한 방식으로 쿼리를 사용하여 문서 찾기
      const productQuery = query(
        collection(db, 'products'), 
        where("id", "==", productId), 
        where("branch", "==", branch)
      );
      const productSnapshot = await getDocs(productQuery);
      if (productSnapshot.empty) {
        throw new Error(`상품을 찾을 수 없습니다: ${productName} (${branch})`);
      }
      const productDocRef = productSnapshot.docs[0].ref;
      await setDoc(productDocRef, { 
        stock: newStock,
        lastUpdated: serverTimestamp(),
        updatedBy: userEmail
      }, { merge: true });
      // 재고 히스토리 추가
      const productData = productSnapshot.docs[0].data();
      const currentStock = productData?.stock || 0;
      const historyDocRef = doc(collection(db, "stockHistory"));
      await setDoc(historyDocRef, {
        date: serverTimestamp(),
        type: "manual_update",
        itemType: "product",
        itemId: productId,
        itemName: productName,
        quantity: newStock - currentStock,
        fromStock: currentStock,
        toStock: newStock,
        resultingStock: newStock,
        branch: branch,
        operator: userEmail,
        supplier: productData.supplier || '',
        price: productData.price || 0,
        totalAmount: (productData.price || 0) * Math.abs(newStock - currentStock),
      });
      toast({ 
        title: "성공", 
        description: `${productName}의 재고가 ${newStock}개로 업데이트되었습니다.` 
      });
      await fetchProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast({ 
        variant: 'destructive', 
        title: '오류', 
        description: `재고 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}` 
      });
    } finally {
      setLoading(false);
    }
  };
  // 기존 상품들에 ID 필드를 추가하는 마이그레이션 함수
  // migrateProductIds 함수 제거
  // 재고 업데이트 함수 (자재와 동일한 방식)
  const updateStock = async (
    items: { id: string; name: string; quantity: number, price?: number, supplier?: string }[],
    type: 'in' | 'out',
    branchName: string,
    operator: string
  ) => {
    for (const item of items) {
      try {
        await runTransaction(db, async (transaction) => {
          const productQuery = query(collection(db, "products"), where("id", "==", item.id), where("branch", "==", branchName));
          const productSnapshot = await getDocs(productQuery);
          if (productSnapshot.empty) {
            throw new Error(`상품을 찾을 수 없습니다: ${item.name} (${branchName})`);
          }
          const productDocRef = productSnapshot.docs[0].ref;
          const productDoc = await transaction.get(productDocRef);
          if(!productDoc.exists()) {
            throw new Error(`상품 문서를 찾을 수 없습니다: ${item.name} (${branchName})`);
          }
          const productData = productDoc.data();
          const currentStock = productData?.stock || 0;
          const change = type === 'in' ? item.quantity : -item.quantity;
          const newStock = currentStock + change;
          const updatePayload: {stock: number, price?: number, supplier?: string} = { stock: newStock };
          if (type === 'in') {
            if (item.price !== undefined) updatePayload.price = item.price;
            if (item.supplier !== undefined) updatePayload.supplier = item.supplier;
          }
          transaction.update(productDocRef, updatePayload);
        });
      } catch (error) {
        console.error(`상품 재고 업데이트 오류 (${item.name}):`, error);
        throw error;
      }
    }
  };
  return { 
    products, 
    loading, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    bulkAddProducts,
    manualUpdateStock,
    updateStock,
    fetchProducts,
  };
}
