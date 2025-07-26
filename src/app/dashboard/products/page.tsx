
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Printer, Search, Download, FileUp } from "lucide-react";
import { ProductTable, Product } from "./components/product-table.js";
import { ProductForm, ProductFormValues } from "./components/product-form.js";
import { useToast } from "@/hooks/use-toast.js";
import { useRouter } from "next/navigation";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches.js";
import { downloadXLSX } from "@/lib/utils.js";
import { useProducts } from "@/hooks/use-products.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth.js";
import { ImportButton } from "@/components/import-button.js";

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { branches } = useBranches();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct, bulkAddProducts } = useProducts();

  const isHeadOfficeAdmin = user?.role === '본사 관리자';

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => 
        (selectedBranch === "all" || product.branch === selectedBranch)
      )
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [products, searchTerm, selectedBranch]);


  const handleAdd = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  }

  const handleFormSubmit = async (data: ProductFormValues) => {
    if (selectedProduct?.docId) {
      await updateProduct(selectedProduct.docId, selectedProduct.id, data);
    } else {
      await addProduct(data);
    }
    setIsFormOpen(false);
    setSelectedProduct(null);
  }

  const handleDelete = async (docId: string) => {
    await deleteProduct(docId);
  }

  const handleDownloadCurrentList = () => {
     if (filteredProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "내보낼 데이터 없음",
        description: "현재 필터에 맞는 상품 데이터가 없습니다.",
      });
      return;
    }
    const dataToExport = filteredProducts.map(({ id, name, mainCategory, midCategory, price, supplier, stock, size, color, branch }) => 
      ({ id, name, mainCategory, midCategory, price, supplier, size, color, branch, current_stock: stock })
    );
    downloadXLSX(dataToExport, "products_list");
    toast({
      title: "목록 다운로드 성공",
      description: `현재 필터링된 ${dataToExport.length}개 상품 정보가 XLSX 파일로 다운로드되었습니다.`,
    });
  }

  const handleImport = async (data: any[]) => {
    await bulkAddProducts(data, selectedBranch);
  }

  const handleMultiPrintSubmit = (items: { id: string; quantity: number }[], startPosition: number) => {
    const itemsQuery = items.map(item => `${'item.id'}:${'item.quantity'}`).join(',');
    const params = new URLSearchParams({
      items: itemsQuery,
      type: 'product',
      start: String(startPosition),
    });
    router.push(`/dashboard/print-labels?${params.toString()}`);
    setIsMultiPrintDialogOpen(false);
  };
  
  return (
    <div>
      <PageHeader
        title="상품 관리"
        description="모든 상품을 등록하고 재고를 관리하세요."
      />
      <Card className="mb-4">
        <CardHeader>
            <CardTitle>상품 목록</CardTitle>
            <CardDescription>
                지점별 상품을 검색하고 관리하세요.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-auto flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="상품명 검색..."
                        className="w-full rounded-lg bg-background pl-8 sm:w-[200px] lg:w-[300px]"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="지점 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">모든 지점</SelectItem>
                        {branches.map(branch => (
                            <SelectItem key={branch.id} value={branch.name}>
                                {branch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedProducts.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setIsMultiPrintDialogOpen(true)}>
                          <Printer className="mr-2 h-4 w-4" />
                          라벨 인쇄 ({selectedProducts.length})
                        </Button>
                    )}
                </div>
                {isHeadOfficeAdmin && (
                  <div className="flex items-center gap-2">
                     <ImportButton resourceName="상품" onImport={handleImport}>
                        <FileUp className="mr-2 h-4 w-4" />
                         엑셀로 가져오기
                     </ImportButton>
                     <Button variant="outline" size="sm" onClick={handleDownloadCurrentList}>
                        <Download className="mr-2 h-4 w-4" />
                        현재 목록 다운로드
                      </Button>
                    <Button size="sm" onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        상품 추가
                    </Button>
                  </div>
                )}
            </div>
        </CardContent>
      </Card>
      {productsLoading ? (
        <Card>
          <CardContent className="pt-6">
             <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2">
                  <Skeleton className="h-5 w-5 rounded-sm" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-48" />
                   <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProductTable 
          products={filteredProducts} 
          onSelectionChange={setSelectedProducts} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
      {isHeadOfficeAdmin && (
        <ProductForm 
          isOpen={isFormOpen} 
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          product={selectedProduct} 
        />
      )}
       {isMultiPrintDialogOpen && (
        <MultiPrintOptionsDialog
            isOpen={isMultiPrintDialogOpen}
            onOpenChange={setIsMultiPrintDialogOpen}
            itemIds={selectedProducts}
            itemType="product"
            onSubmit={handleMultiPrintSubmit}
        />
       )}
    </div>
  );
}

    