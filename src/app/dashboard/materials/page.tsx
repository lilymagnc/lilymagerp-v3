
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle, Upload, Download } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { MaterialTable } from "./components/material-table";
import { MaterialForm } from "./components/material-form";
import { useToast } from "@/hooks/use-toast";

export default function MaterialsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    toast({
        title: "기능 구현 예정",
        description: "구글 시트로 내보내기 기능은 현재 개발 중입니다.",
    })
  }

  return (
    <div>
      <PageHeader
        title="자재 관리"
        description="자재 정보를 등록하고 재고를 관리합니다."
      >
        <div className="flex items-center gap-2">
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
      <MaterialTable />
      <MaterialForm isOpen={isFormOpen} onOpenChange={setIsFormOpen} />
    </div>
  );
}
