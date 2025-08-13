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
import { ScanLine, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportProductsToExcel } from "@/lib/excel-export";

export default function ProductsPage() {
  const router = useRouter(); 
  const { 
    products, 
    loading, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    bulkAddProducts,
    fetchProducts,
    // migrateProductIds 제거
  } = useProducts();
  const { branches } = useBranches();
  const { user } = useAuth();
  const isAdmin = user?.role === '본사 관리자';
  const userBranch = user?.franchise || "";

  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);

  // 사용자가 볼 수 있는 지점 목록
  const availableBranches = useMemo(() => {
    if (isAdmin) {
      return branches; // 본사 관리자는 모든 지점을 볼 수 있음
    } else {
      return branches.filter(branch => branch.name === userBranch); // 지점 직원은 자신의 지점만
    }
  }, [branches, isAdmin, userBranch]);

  // 자동 지점 필터링 (지점 직원은 자동으로 자신의 지점으로 설정)
  useEffect(() => {
    if (!isAdmin && userBranch && selectedBranch === "all") {
      setSelectedBranch(userBranch);
    }
  }, [isAdmin, userBranch, selectedBranch]);

  // 카테고리 목록 생성
  const categories = useMemo(() => {
    return [...new Set(products.map(product => product.mainCategory).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // 검색어 및 카테고리 필터링만 유지
    const finalFiltered = filtered.filter(product => {
      const matchesSearch = (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (product.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === "all" || product.mainCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return finalFiltered;
  }, [products, searchTerm, selectedBranch, selectedCategory, isAdmin, userBranch, user]);

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
    const itemsQuery = items.map(item => `${item.id}:${item.quantity}`).join(',');
    const params = new URLSearchParams({
      items: itemsQuery,
      type: 'product',
      start: String(startPosition),
    });
    router.push(`/dashboard/print-labels?${params.toString()}`);
    setIsMultiPrintDialogOpen(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleRefresh = async () => {
    await fetchProducts();
  };

  const handleExportToExcel = async () => {
    try {
      const branchText = !isAdmin ? userBranch : (selectedBranch === "all" ? "전체지점" : selectedBranch);
      const filename = `상품목록_${branchText}`;
      await exportProductsToExcel(filteredProducts, filename);
    } catch (error) {
      console.error('엑셀 내보내기 오류:', error);
      alert('엑셀 파일 생성에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="상품 관리" 
        description={!isAdmin ? `${userBranch} 지점의 상품 정보를 관리합니다.` : "상품 정보를 관리합니다."}
      >
        <Button 
          variant="outline"
          onClick={() => router.push('/dashboard/barcode-scanner')}
        >
          <ScanLine className="mr-2 h-4 w-4" />
          바코드 스캔
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="상품명 또는 코드로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {isAdmin && (
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-48 text-foreground bg-background border border-input">
              <SelectValue placeholder="지점 선택" className="text-foreground" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="all" className="text-popover-foreground">모든 지점</SelectItem>
              {availableBranches.map((branch) => (
                <SelectItem key={branch.id} value={branch.name} className="text-popover-foreground">
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PageHeader title="상품 관리" description="상품을 추가, 수정, 삭제할 수 있습니다.">
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                상품 추가
              </Button>
              {/* 마이그레이션 버튼 제거 */}
              <ImportButton
                onImport={bulkAddProducts}
                fileName="products_template.xlsx"
              />
              <Button 
                variant="outline"
                onClick={handleExportToExcel}
                disabled={filteredProducts.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                엑셀 내보내기
              </Button>
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
      </PageHeader>

      <ProductTable
        products={filteredProducts}
        onSelectionChange={setSelectedProducts}
        onEdit={handleEdit}
        onDelete={deleteProduct}
        selectedProducts={selectedProducts}
        isAdmin={isAdmin}
        onRefresh={handleRefresh} // 새로고침 함수 전달
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
