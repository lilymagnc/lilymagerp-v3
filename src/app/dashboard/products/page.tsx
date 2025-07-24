
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Download, Printer, Search } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { ProductTable, Product } from "./components/product-table";
import { ProductForm } from "./components/product-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBranches } from "@/hooks/use-branches";

const mockProducts: Product[] = [
  { id: "P00001", name: "릴리 화이트 셔츠", mainCategory: "완제품", midCategory: "꽃다발", price: 45000, supplier: "꽃길 본사", stock: 120, status: "active", size: "M", color: "White", branch: "릴리맥광화문점" },
  { id: "P00002", name: "맥 데님 팬츠", mainCategory: "완제품", midCategory: "꽃바구니", price: 78000, supplier: "데님월드", stock: 80, status: "active", size: "28", color: "Blue", branch: "릴리맥여의도점" },
  { id: "P00003", name: "오렌지 포인트 스커트", mainCategory: "완제품", midCategory: "꽃바구니", price: 62000, supplier: "꽃길 본사", stock: 0, status: "out_of_stock", size: "S", color: "Orange", branch: "릴리맥NC이스트폴점" },
  { id: "P00004", name: "그린 스트라이프 티", mainCategory: "부자재", midCategory: "포장지", price: 32000, supplier: "티셔츠팩토리", stock: 250, status: "active", size: "L", color: "Green/White", branch: "릴리맥광화문점" },
  { id: "P00005", name: "베이직 블랙 슬랙스", mainCategory: "부자재", midCategory: "리본", price: 55000, supplier: "슬랙스하우스", stock: 15, status: "low_stock", size: "M", color: "Black", branch: "릴리맥여의도점" },
  { id: "P00006", name: "레드로즈 꽃다발", mainCategory: "완제품", midCategory: "꽃다발", price: 55000, supplier: "꽃길 본사", stock: 30, status: "active", size: "L", color: "Red", branch: "릴리맥NC이스트폴점" },
];


export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  const { toast } = useToast();
  const router = useRouter();
  const { branches } = useBranches();

  const filteredProducts = useMemo(() => {
    return mockProducts
      .filter(product => 
        (selectedBranch === "all" || product.branch === selectedBranch)
      )
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [searchTerm, selectedBranch]);


  const handleExport = () => {
    toast({
        title: "기능 구현 예정",
        description: "구글 시트로 내보내기 기능은 현재 개발 중입니다.",
    })
  }

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
                <div className="ml-auto flex items-center gap-2 mt-2 sm:mt-0">
                    {selectedProducts.length > 0 && (
                        <Button variant="outline" size="sm" onClick={() => setIsMultiPrintDialogOpen(true)}>
                          <Printer className="mr-2 h-4 w-4" />
                          라벨 인쇄 ({selectedProducts.length})
                        </Button>
                    )}
                    <ImportButton resourceName="상품" />
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        내보내기
                    </Button>
                    <Button size="sm" onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        상품 추가
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <ProductTable products={filteredProducts} onSelectionChange={setSelectedProducts} />
      <ProductForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
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
