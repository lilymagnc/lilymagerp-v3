
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, writeBatch, query, orderBy, limit, setDoc, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { Product as ProductData } from "@/app/dashboard/products/components/product-table";
import type { ProductFormValues } from '@/app/dashboard/products/components/product-form';

export type Product = ProductData;

const initialProducts: Omit<Product, 'docId' | 'status'>[] = [
  { id: "P00001", name: "릴리 화이트 셔츠", mainCategory: "완제품", midCategory: "꽃다발", price: 45000, supplier: "꽃길 본사", stock: 120, size: "M", color: "White", branch: "릴리맥광화문점" },
  { id: "P00002", name: "맥 데님 팬츠", mainCategory: "완제품", midCategory: "꽃바구니", price: 78000, supplier: "데님월드", stock: 80, size: "28", color: "Blue", branch: "릴리맥여의도점" },
  { id: "P00003", name: "오렌지 포인트 스커트", mainCategory: "완제품", midCategory: "꽃바구니", price: 62000, supplier: "꽃길 본사", stock: 0, size: "S", color: "Orange", branch: "릴리맥NC이스트폴점" },
  { id: "P00004", name: "그린 스트라이프 티", mainCategory: "부자재", midCategory: "포장지", price: 32000, supplier: "티셔츠팩토리", stock: 250, size: "L", color: "Green/White", branch: "릴리맥광화문점" },
  { id: "P00005", name: "베이직 블랙 슬랙스", mainCategory: "부자재", midCategory: "리본", price: 55000, supplier: "슬랙스하우스", stock: 15, size: "M", color: "Black", branch: "릴리맥여의도점" },
  { id: "P00005", name: "베이직 블랙 슬랙스", mainCategory: "부자재", midCategory: "리본", price: 55000, supplier: "슬랙스하우스", stock: 15, size: "M", color: "Black", branch: "릴리맥광화문점" },
  { id: "P00006", name: "레드로즈 꽃다발", mainCategory: "완제품", midCategory: "꽃다발", price: 55000, supplier: "꽃길 본사", stock: 30, size: "L", color: "Red", branch: "릴리맥NC이스트폴점" },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getStatus = (stock: number): string => {
      if (stock === 0) return 'out_of_stock';
      if (stock < 20) return 'low_stock';
      return 'active';
  }

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');
      let querySnapshot = await getDocs(query(productsCollection));
      
      if (querySnapshot.empty) {
        const batch = writeBatch(db);
        initialProducts.forEach((productData) => {
          const newDocRef = doc(productsCollection);
          batch.set(newDocRef, productData);
        });
        await batch.commit();
        querySnapshot = await getDocs(query(productsCollection));
      } 
      
      const productsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { 
              docId: doc.id,
              ...data,
              status: getStatus(data.stock)
          } as Product;
      }).sort((a,b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);

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
        const existingProductQuery = query(
            collection(db, "products"), 
            where("name", "==", data.name), 
            where("branch", "==", data.branch)
        );
        const existingProductSnapshot = await getDocs(existingProductQuery);

        if (!existingProductSnapshot.empty) {
            toast({ variant: 'destructive', title: '중복된 상품', description: `'${data.branch}' 지점에 동일한 이름의 상품이 이미 존재합니다.`});
            setLoading(false);
            return;
        }

        const newId = await generateNewId();
        const docRef = doc(collection(db, "products"));
        await setDoc(docRef, { ...data, id: newId });

        toast({ title: "성공", description: "새 상품이 추가되었습니다."});
        await fetchProducts();
    } catch (error) {
        console.error("Error adding product:", error);
        toast({ variant: 'destructive', title: '오류', description: '상품 추가 중 오류가 발생했습니다.'});
    } finally {
        setLoading(false);
    }
  }

  const updateProduct = async (docId: string, productId: string, data: ProductFormValues) => {
      setLoading(true);
      try {
          const docRef = doc(db, "products", docId);
          await setDoc(docRef, { ...data, id: productId }, { merge: true });
          toast({ title: "성공", description: "상품 정보가 수정되었습니다."});
          await fetchProducts();
      } catch (error) {
          console.error("Error updating product:", error);
          toast({ variant: 'destructive', title: '오류', description: '상품 수정 중 오류가 발생했습니다.'});
      } finally {
          setLoading(false);
      }
  }

  const deleteProduct = async (docId: string) => {
    setLoading(true);
    try {
        const docRef = doc(db, "products", docId);
        await deleteDoc(docRef);
        toast({ title: "성공", description: "상품이 삭제되었습니다."});
        await fetchProducts();
    } catch (error) {
        console.error("Error deleting product:", error);
        toast({ variant: 'destructive', title: '오류', description: '상품 삭제 중 오류가 발생했습니다.'});
    } finally {
        setLoading(false);
    }
  }

  const bulkAddProducts = async (excelData: any[], currentBranch: string) => {
    setLoading(true);
    const batch = writeBatch(db);
    let newProductsCount = 0;
    let updatedProductsCount = 0;

    for (const row of excelData) {
        // Skip rows without a name, or if a specific branch is selected and the row's branch doesn't match
        if (!row.name || (currentBranch !== "all" && row.branch !== currentBranch)) {
            continue;
        }

        const productsRef = collection(db, "products");
        let q;
        
        // If an ID is provided in the Excel, use it for lookup. Otherwise, use name and branch.
        if (row.id) {
            q = query(productsRef, where("id", "==", row.id));
        } else if (row.name && row.branch) {
            q = query(productsRef, where("name", "==", row.name), where("branch", "==", row.branch));
        } else {
            // Not enough info to lookup, skip.
            continue; 
        }
        
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) { // New product
            // Skip if the quantity is empty or zero for new products
            if (!row.quantity || Number(row.quantity) === 0) {
                continue;
            }
            const newId = row.id || await generateNewId(); // Use provided ID or generate new
            const newDocRef = doc(productsRef);
            const newProductData = {
                id: newId,
                name: row.name,
                branch: row.branch || "미지정",
                mainCategory: row.mainCategory || "미분류",
                midCategory: row.midCategory || "미분류",
                price: Number(row.price) || 0,
                supplier: row.supplier || "미지정",
                size: row.size || "-",
                color: row.color || "-",
                stock: Number(row.quantity) || 0,
            };
            batch.set(newDocRef, newProductData);
            newProductsCount++;
        } else { // Existing product
             // Skip if the quantity is empty or zero
            if (!row.quantity || Number(row.quantity) === 0) {
                continue;
            }
            const docRef = querySnapshot.docs[0].ref;
            const existingData = querySnapshot.docs[0].data();
            const updateData: any = {
                stock: Number(existingData.stock) + Number(row.quantity)
            };
            
            // Optionally update other fields if they are present in the Excel file
            if(row.price !== undefined) updateData.price = Number(row.price);
            if(row.supplier) updateData.supplier = row.supplier;
            if(row.mainCategory) updateData.mainCategory = row.mainCategory;
            if(row.midCategory) updateData.midCategory = row.midCategory;
            if(row.size) updateData.size = row.size;
            if(row.color) updateData.color = row.color;

            batch.update(docRef, updateData);
            updatedProductsCount++;
        }
    }

    try {
        await batch.commit();
        if (newProductsCount > 0 || updatedProductsCount > 0) {
            toast({
                title: "가져오기 완료",
                description: `새 상품 ${newProductsCount}개 추가, 기존 상품 ${updatedProductsCount}개 재고 업데이트 완료.`
            });
            await fetchProducts();
        } else {
            toast({
                title: "변경 사항 없음",
                description: "업데이트할 내용이 없습니다. 수량을 확인해주세요."
            });
        }
    } catch (error) {
        console.error("Error in bulk add/update:", error);
        toast({ variant: "destructive", title: "오류", description: "일괄 처리 중 오류가 발생했습니다." });
    } finally {
        setLoading(false);
    }
  };


  return { products, loading, fetchProducts, addProduct, updateProduct, deleteProduct, bulkAddProducts };
}
