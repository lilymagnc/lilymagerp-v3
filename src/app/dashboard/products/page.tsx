
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Download, Printer } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { ProductTable } from "./components/product-table";
import { ProductForm } from "./components/product-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleExport = () => {
    toast({
        title: "기능 구현 예정",
        description: "구글 시트로 내보내기 기능은 현재 개발 중입니다.",
    })
  }

  const handlePrintSelected = () => {
    if (selectedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "선택된 상품 없음",
        description: "라벨을 인쇄할 상품을 하나 이상 선택해주세요.",
      });
      return;
    }
    const params = new URLSearchParams({
      ids: selectedProducts.join(','),
      type: 'product',
      quantity: '1', // Each selected item prints once
      start: '1', // Default start position
    });
    router.push(`/dashboard/print-labels?${params.toString()}`);
  }

  return (
    <div>
      <PageHeader
        title="상품 관리"
        description="모든 상품을 등록하고 재고를 관리하세요."
      >
        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <Button variant="outline" onClick={handlePrintSelected}>
              <Printer className="mr-2 h-4 w-4" />
              선택 항목 라벨 인쇄 ({selectedProducts.length})
            </Button>
          )}
          <ImportButton resourceName="상품" />
           <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            시트로 내보내기
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            상품 추가
          </Button>
        </div>
      </PageHeader>
      <ProductTable onSelectionChange={setSelectedProducts} />
      <ProductForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
