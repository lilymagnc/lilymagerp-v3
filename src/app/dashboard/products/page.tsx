
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { ProductTable } from "./components/product-table";
import { ProductForm } from "./components/product-form";

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="상품 관리"
        description="모든 상품을 등록하고 재고를 관리하세요."
      >
        <div className="flex items-center gap-2">
          <ImportButton resourceName="상품" />
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            상품 추가
          </Button>
        </div>
      </PageHeader>
      <ProductTable />
      <ProductForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
