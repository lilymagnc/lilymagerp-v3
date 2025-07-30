"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/use-products";
import { useBranches } from "@/hooks/use-branches";
import { useAuth } from "@/hooks/use-auth";
import { Product } from "@/hooks/use-products";
import { Branch } from "@/hooks/use-branches";
import { PageHeader } from "@/components/page-header";
import { ImportButton } from "@/components/import-button";
import { ProductForm } from "./components/product-form";
import { ProductTable } from "./components/product-table";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";

export default function ProductsPage() {
  const { user } = useAuth();
  const { products, loading, addProduct, updateProduct, deleteProduct, bulkAddProducts } = useProducts();
  const { branches } = useBranches();
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise || "";
  const availableBranches = isAdmin ? branches : branches.filter(b => b.name === userBranch);
  
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);

  // 카테고리 목록 생성
  const categories = useMemo(() => {
    return [...new Set(products.map(product => product.mainCategory))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch = !selectedBranch || product.branch === selectedBranch;
      const matchesCategory = !selectedCategory || product.mainCategory === selectedCategory;
      return matchesSearch && matchesBranch && matchesCategory;
    });
  }, [products, searchTerm, selectedBranch, selectedCategory]);

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
      } else {
        await addProduct(data);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleMultiPrintSubmit = (items: { id: string; quantity: number }[], startPosition: number) => {
    console.log('Multi print:', items, 'Start position:', startPosition);
    setIsMultiPrintDialogOpen(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="상품 관리" 
        description="상품 정보를 관리합니다."
      />
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="상품명 또는 코드로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체 카테고리</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {isAdmin && (
          <>
            <Button onClick={() => setIsFormOpen(true)}>
              상품 추가
            </Button>
            <ImportButton
              onImport={bulkAddProducts}
              fileName="products_template.xlsx"
            />
            {selectedProducts.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setIsMultiPrintDialogOpen(true)}
              >
                선택 상품 라벨 출력 ({selectedProducts.length}개)
              </Button>
            )}
          </>
        )}
      </div>

      <ProductTable
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={deleteProduct}
        selectedProducts={selectedProducts}
        onSelectionChange={setSelectedProducts}
        isAdmin={isAdmin}
      />

      <ProductForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        product={editingProduct}
        branches={availableBranches}
        selectedBranch={!isAdmin ? userBranch : selectedBranch}
      />

      <MultiPrintOptionsDialog
        isOpen={isMultiPrintDialogOpen}
        onOpenChange={setIsMultiPrintDialogOpen}
        onSubmit={handleMultiPrintSubmit}
        itemIds={selectedProducts}
        itemType="product"
      />
    </div>
  );
}
