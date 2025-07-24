
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, writeBatch, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { Product as ProductData } from "@/app/dashboard/products/components/product-table";

export type Product = ProductData;

const initialProducts: Omit<Product, 'id' | 'status'>[] = [
  { name: "릴리 화이트 셔츠", mainCategory: "완제품", midCategory: "꽃다발", price: 45000, supplier: "꽃길 본사", stock: 120, size: "M", color: "White", branch: "릴리맥광화문점" },
  { name: "맥 데님 팬츠", mainCategory: "완제품", midCategory: "꽃바구니", price: 78000, supplier: "데님월드", stock: 80, size: "28", color: "Blue", branch: "릴리맥여의도점" },
  { name: "오렌지 포인트 스커트", mainCategory: "완제품", midCategory: "꽃바구니", price: 62000, supplier: "꽃길 본사", stock: 0, size: "S", color: "Orange", branch: "릴리맥NC이스트폴점" },
  { name: "그린 스트라이프 티", mainCategory: "부자재", midCategory: "포장지", price: 32000, supplier: "티셔츠팩토리", stock: 250, size: "L", color: "Green/White", branch: "릴리맥광화문점" },
  { name: "베이직 블랙 슬랙스", mainCategory: "부자재", midCategory: "리본", price: 55000, supplier: "슬랙스하우스", stock: 15, size: "M", color: "Black", branch: "릴리맥여의도점" },
  { name: "레드로즈 꽃다발", mainCategory: "완제품", midCategory: "꽃다발", price: 55000, supplier: "꽃길 본사", stock: 30, size: "L", color: "Red", branch: "릴리맥NC이스트폴점" },
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
      let querySnapshot = await getDocs(productsCollection);
      
      if (querySnapshot.empty) {
        const batch = writeBatch(db);
        initialProducts.forEach((productData, index) => {
          const docId = `P${String(index + 1).padStart(5, '0')}`;
          const docRef = doc(db, "products", docId);
          batch.set(docRef, productData);
        });
        await batch.commit();
        querySnapshot = await getDocs(productsCollection);
      } 
      
      const productsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { 
              ...data,
              id: doc.id,
              status: getStatus(data.stock)
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

  const bulkAddProducts = async (importedData: any[]) => {
    const productsCollection = collection(db, "products");
    const snapshot = await getCountFromServer(productsCollection);
    let currentCount = snapshot.data().count;

    const batch = writeBatch(db);
    importedData.forEach((item: any) => {
        let docRef;
        if (item.id) {
          docRef = doc(db, 'products', String(item.id));
        } else {
          currentCount++;
          const newId = `P${String(currentCount).padStart(5, '0')}`;
          docRef = doc(db, 'products', newId);
        }
        
        const productData = {
            name: item.name || "",
            mainCategory: item.mainCategory || "",
            midCategory: item.midCategory || "",
            price: Number(item.price) || 0,
            supplier: item.supplier || "",
            stock: Number(item.stock) || 0,
            size: item.size || "",
            color: item.color || "",
            branch: item.branch || ""
        };

        batch.set(docRef, productData, { merge: true });
    });

    await batch.commit();
    await fetchProducts();
  };

  return { products, loading, fetchProducts, bulkAddProducts };
}
