
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Download, Printer } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { MaterialTable } from "./components/material-table";
import { MaterialForm } from "./components/material-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";

export default function MaterialsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

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
      type: 'material',
      start: String(startPosition),
    });
    router.push(`/dashboard/print-labels?${params.toString()}`);
    setIsMultiPrintDialogOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="자재 관리"
        description="자재 정보를 등록하고 재고를 관리합니다."
      >
        <div className="flex items-center gap-2">
           {selectedMaterials.length > 0 && (
            <Button variant="outline" onClick={() => setIsMultiPrintDialogOpen(true)}>
              <Printer className="mr-2 h-4 w-4" />
              선택 항목 라벨 인쇄 ({selectedMaterials.length})
            </Button>
          )}
          <ImportButton resourceName="자재" />
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            시트로 내보내기
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            자재 추가
          </Button>
        </div>
      </PageHeader>
      <MaterialTable onSelectionChange={setSelectedMaterials} />
      <MaterialForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
      {isMultiPrintDialogOpen && (
        <MultiPrintOptionsDialog
            isOpen={isMultiPrintDialogOpen}
            onOpenChange={setIsMultiPrintDialogOpen}
            itemIds={selectedMaterials}
            itemType="material"
            onSubmit={handleMultiPrintSubmit}
        />
       )}
    </div>
  );
}
