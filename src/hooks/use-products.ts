
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, writeBatch, query, orderBy, limit, setDoc, where, deleteDoc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const productsCollection = collection(db, 'products');
      const q = query(productsCollection, orderBy('name'));
      
      const productsData = (await getDocs(q)).docs.map(doc => {
        const data = doc.data();
        return {
          docId: doc.id,
          ...data,
        } as Product;
      });
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

  const addProduct = async (data: ProductFormValues) => {
    setLoading(true);
    try {
      const productWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
      };
      const docRef = doc(collection(db, 'products'));
      await setDoc(docRef, productWithTimestamp);
      toast({ title: "성공", description: "새 상품이 추가되었습니다." });
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

    await Promise.all(data.map(async (row) => {
      try {
        if (!row.id || !row.name) return;

        const productData = {
          id: String(row.id),
          name: String(row.name),
          mainCategory: String(row.mainCategory || ''),
          midCategory: String(row.midCategory || ''),
          price: Number(row.price) || 0,
          supplier: String(row.supplier || ''),
          stock: Number(row.stock) || 0,
          size: String(row.size || ''),
          color: String(row.color || ''),
          branch: String(row.branch || ''),
          code: String(row.code || ''),
          category: String(row.category || ''),
        };

        const q = query(collection(db, "products"), where("id", "==", productData.id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await setDoc(docRef, productData, { merge: true });
          updateCount++;
        } else {
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
    
    toast({ 
      title: '처리 완료', 
      description: `성공: 신규 상품 ${newCount}개 추가, ${updateCount}개 업데이트 완료.`
    });
    
    await fetchProducts();
  };

  const manualUpdateStock = async (productId: string, productName: string, newStock: number, branch: string, userEmail: string) => {
    try {
      setLoading(true);
      const productDocRef = doc(db, 'products', productId);
      await setDoc(productDocRef, { 
        stock: newStock,
        lastUpdated: serverTimestamp(),
        updatedBy: userEmail
      }, { merge: true });
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
        description: '재고 업데이트 중 오류가 발생했습니다.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return { 
    products, 
    loading, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    bulkAddProducts,
    manualUpdateStock
  };
}
