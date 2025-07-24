
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PlusCircle } from "lucide-react";
import { ImportButton } from "@/components/import-button";
import { MaterialTable } from "./components/material-table";
import { MaterialForm } from "./components/material-form";

export default function MaterialsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="자재 관리"
        description="자재 정보를 등록하고 재고를 관리합니다."
      >
        <div className="flex items-center gap-2">
          <ImportButton resourceName="자재" />
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
